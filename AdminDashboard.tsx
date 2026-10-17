import React, { useState, useEffect } from 'react';
import { Tournament, TournamentDetail, AdminRegistration, PaymentOrder, WithdrawalRequest, AuditLog } from '../types';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  PlusCircle, 
  Edit3,
  Calendar,
  Key, 
  CheckCircle, 
  Users, 
  Trophy, 
  Coins, 
  Clock, 
  AlertCircle,
  Save,
  Send,
  Radio,
  Trash2,
  RefreshCw,
  Shuffle,
  CreditCard,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Copy,
  Check,
  Search,
  ExternalLink,
  Info,
  Zap,
  ArrowUpRight,
  IndianRupee,
  RotateCcw,
  ArrowDownLeft,
  History,
  FileText,
  XCircle,
  AlertTriangle,
  X
} from 'lucide-react';

interface AdminDashboardProps {
  tournaments: Tournament[];
  onRefreshTournaments: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  tournaments,
  onRefreshTournaments,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'roster' | 'publish' | 'verify' | 'payments'>('create');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Payment Verification State
  const [adminPayments, setAdminPayments] = useState<PaymentOrder[]>([]);
  const [paymentMetrics, setPaymentMetrics] = useState<any>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'verified' | 'failed'>('all');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [showConfigGuide, setShowConfigGuide] = useState(false);
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [simulatingOrderId, setSimulatingOrderId] = useState<string | null>(null);

  // Financial Sub-tabs
  const [paymentSubTab, setPaymentSubTab] = useState<'orders' | 'withdrawals' | 'audit_trail' | 'gateway_setup'>('orders');

  // Admin Withdrawals State
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [withdrawalMetrics, setWithdrawalMetrics] = useState<any>(null);
  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending_review' | 'completed' | 'rejected'>('all');
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);

  // Rejection Dialog State
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    withdrawalId: string;
    requestNumber: string;
    playerName: string;
    amount: number;
    reason: string;
  }>({
    open: false,
    withdrawalId: '',
    requestNumber: '',
    playerName: '',
    amount: 0,
    reason: 'Bank account / UPI VPA verification failed or rejected by provider'
  });

  // Refund Dialog State
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    orderId: string;
    orderNumber: string;
    playerName: string;
    amount: number;
    reason: string;
    loading: boolean;
  }>({
    open: false,
    orderId: '',
    orderNumber: '',
    playerName: '',
    amount: 0,
    reason: 'Player requested refund / tournament entry cancellation',
    loading: false
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Tournament Create Form
  const [title, setTitle] = useState('');
  const [gameMode, setGameMode] = useState<'Solo' | 'Duo' | 'Squad'>('Solo');
  const [mapName, setMapName] = useState<'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine'>('Bermuda');
  const [entryFee, setEntryFee] = useState(0);
  const [prizePool, setPrizePool] = useState(1500);
  const [firstPrize, setFirstPrize] = useState(800);
  const [perKillPts, setPerKillPts] = useState(1);
  const [totalSlots, setTotalSlots] = useState(48);
  const [scheduledAt, setScheduledAt] = useState('');
  const [rules, setRules] = useState(
    '1. Mobile devices only (no PC emulators).\n2. Enter Custom Room at least 10 minutes prior.\n3. Hacking/cheating results in immediate ban.\n4. Take screenshot of match result.'
  );

  // Tournament Edit & Reschedule Form
  const [selectedEditTourneyId, setSelectedEditTourneyId] = useState(tournaments[0]?.id || '');
  const [editTitle, setEditTitle] = useState('');
  const [editGameMode, setEditGameMode] = useState<'Solo' | 'Duo' | 'Squad'>('Solo');
  const [editMapName, setEditMapName] = useState<'Bermuda' | 'Purgatory' | 'Kalahari' | 'Alpine'>('Bermuda');
  const [editEntryFee, setEditEntryFee] = useState(0);
  const [editPrizePool, setEditPrizePool] = useState(1500);
  const [editFirstPrize, setEditFirstPrize] = useState(800);
  const [editPerKillPts, setEditPerKillPts] = useState(1);
  const [editTotalSlots, setEditTotalSlots] = useState(48);
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editStatus, setEditStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');
  const [editRules, setEditRules] = useState('');

  // Roster & Slot Management Form
  const [selectedRosterTourneyId, setSelectedRosterTourneyId] = useState(tournaments[0]?.id || '');
  const [adminRegistrations, setAdminRegistrations] = useState<AdminRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [newSlotNumber, setNewSlotNumber] = useState<number>(1);

  // Room Publish Form
  const [selectedPublishTourneyId, setSelectedPublishTourneyId] = useState(tournaments[0]?.id || '');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');

  // Results Verification Form
  const [selectedVerifyTourneyId, setSelectedVerifyTourneyId] = useState(tournaments[0]?.id || '');
  const [verifyTourneyDetail, setVerifyTourneyDetail] = useState<TournamentDetail | null>(null);
  const [participantResults, setParticipantResults] = useState<Array<{
    user_id: string;
    ign: string;
    ff_uid: string;
    team_name?: string;
    placement: number;
    kills: number;
    prize_won: number;
  }>>([]);

  const loadMetrics = () => {
    api.getAdminOverview()
      .then((res) => {
        setMetrics(res.metrics);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadMetrics();
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setScheduledAt(localIso);
  }, []);

  // When edit tournament selection changes, populate form
  useEffect(() => {
    if (selectedEditTourneyId) {
      const t = tournaments.find((item) => item.id === selectedEditTourneyId);
      if (t) {
        setEditTitle(t.title);
        setEditGameMode(t.game_mode);
        setEditMapName(t.map_name);
        setEditEntryFee(t.entry_fee);
        setEditPrizePool(t.prize_pool);
        setEditFirstPrize(t.first_prize);
        setEditPerKillPts(t.per_kill_pts);
        setEditTotalSlots(t.total_slots);
        setEditStatus(t.status);
        setEditRules(t.rules || '');

        const d = new Date(t.scheduled_at);
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setEditScheduledAt(localIso);
      }
    }
  }, [selectedEditTourneyId, tournaments]);

  // Load roster registrations
  const loadRoster = (tournamentId: string) => {
    if (!tournamentId) return;
    setLoadingRegistrations(true);
    api.getAdminRegistrations(tournamentId)
      .then(setAdminRegistrations)
      .catch(console.error)
      .finally(() => setLoadingRegistrations(false));
  };

  useEffect(() => {
    if (activeTab === 'roster' && selectedRosterTourneyId) {
      loadRoster(selectedRosterTourneyId);
    }
  }, [activeTab, selectedRosterTourneyId]);

  // Load tournament participants for verification
  useEffect(() => {
    if (activeTab === 'verify' && selectedVerifyTourneyId) {
      api.getTournament(selectedVerifyTourneyId)
        .then((detail) => {
          setVerifyTourneyDetail(detail);
          const rows = detail.participants.map((p, idx) => ({
            user_id: p.user_id,
            ign: p.ign,
            ff_uid: p.ff_uid,
            team_name: p.team_name,
            placement: idx + 1,
            kills: 0,
            prize_won: idx === 0 ? detail.first_prize : 0,
          }));
          setParticipantResults(rows);
        })
        .catch(console.error);
    }
  }, [activeTab, selectedVerifyTourneyId]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const bannerUrl = mapName === 'Bermuda' 
        ? '/src/assets/images/bermuda_map_card_1791955690832.jpg'
        : mapName === 'Purgatory'
        ? '/src/assets/images/purgatory_map_card_1791955691708.jpg'
        : '/src/assets/images/battleclash_banner_1791955690388.jpg';

      await api.createTournament({
        title,
        game_mode: gameMode,
        map_name: mapName,
        banner_url: bannerUrl,
        entry_fee: Number(entryFee),
        prize_pool: Number(prizePool),
        first_prize: Number(firstPrize),
        per_kill_pts: Number(perKillPts),
        total_slots: Number(totalSlots),
        scheduled_at: new Date(scheduledAt).toISOString(),
        rules,
      });

      setMessage({ text: 'Tournament created successfully! Roster is open.', type: 'success' });
      setTitle('');
      onRefreshTournaments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create tournament', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditTourneyId) return;

    setLoading(true);
    setMessage(null);

    try {
      await api.updateTournament(selectedEditTourneyId, {
        title: editTitle,
        game_mode: editGameMode,
        map_name: editMapName,
        entry_fee: Number(editEntryFee),
        prize_pool: Number(editPrizePool),
        first_prize: Number(editFirstPrize),
        per_kill_pts: Number(editPerKillPts),
        total_slots: Number(editTotalSlots),
        scheduled_at: new Date(editScheduledAt).toISOString(),
        status: editStatus,
        rules: editRules,
      });

      setMessage({ text: 'Tournament details and match schedule updated successfully!', type: 'success' });
      onRefreshTournaments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update tournament', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSlot = async (registrationId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.updateSlotAssignment(registrationId, newSlotNumber);
      setMessage({ text: res.message, type: 'success' });
      setEditingSlotId(null);
      loadRoster(selectedRosterTourneyId);
      onRefreshTournaments();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to assign slot', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRegistration = async (registrationId: string, playerName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${playerName} from this tournament? Any entry fee paid will be automatically refunded to their wallet.`)) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.removeRegistration(registrationId);
      setMessage({ text: res.message, type: 'success' });
      loadRoster(selectedRosterTourneyId);
      onRefreshTournaments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to remove registration', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublishTourneyId || !roomId || !roomPassword) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await api.publishRoom(selectedPublishTourneyId, {
        room_id: roomId.trim(),
        room_password: roomPassword.trim(),
      });

      setMessage({
        text: `Room published! Dispatched alerts to ${res.notifiedPlayersCount} registered participants.`,
        type: 'success',
      });
      setRoomId('');
      setRoomPassword('');
      onRefreshTournaments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to publish room', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerifyTourneyId || participantResults.length === 0) return;

    setLoading(true);
    setMessage(null);

    try {
      await api.verifyResults(selectedVerifyTourneyId, {
        results: participantResults,
        finishTournament: true,
      });

      setMessage({
        text: 'Match scores verified! Leaderboard updated, winners crowned, and prize payouts credited to player wallets.',
        type: 'success',
      });
      onRefreshTournaments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to verify match results', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateResultRow = (index: number, field: string, value: any) => {
    const updated = [...participantResults];
    updated[index] = { ...updated[index], [field]: value };
    setParticipantResults(updated);
  };

  // Payment Verification API methods
  const loadAdminPayments = (status = paymentFilter, search = paymentSearch) => {
    setLoadingPayments(true);
    api.getAdminPayments({ status: status === 'all' ? undefined : status, q: search || undefined })
      .then((res) => {
        setAdminPayments(res.payments);
        setPaymentMetrics(res.metrics);
      })
      .catch(console.error)
      .finally(() => setLoadingPayments(false));
  };

  const loadGatewayConfig = () => {
    api.getGatewayConfig()
      .then(setGatewayConfig)
      .catch(console.error);
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      loadAdminPayments();
      loadGatewayConfig();
    }
  }, [activeTab, paymentFilter]);

  // Load metrics initially to populate badge
  useEffect(() => {
    api.getAdminPayments({ status: 'all' })
      .then((res) => {
        setPaymentMetrics(res.metrics);
      })
      .catch(console.error);
  }, []);

  const handleVerifyPaymentWithGateway = async (orderId: string, orderNumber: string) => {
    setVerifyingOrderId(orderId);
    setMessage(null);
    try {
      const res = await api.verifyPaymentWithGateway(orderId);
      setMessage({ text: res.message, type: 'success' });
      loadAdminPayments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || `Failed to verify payment ${orderNumber}`, type: 'error' });
    } finally {
      setVerifyingOrderId(null);
    }
  };

  const handleSimulatePaymentWebhook = async (orderId: string, orderNumber: string) => {
    setSimulatingOrderId(orderId);
    setMessage(null);
    try {
      const res = await api.simulateProviderWebhook(orderId);
      setMessage({ 
        text: `Provider Webhook Authenticated! HMAC-SHA256 signature verified and coins deposited for ${orderNumber}.`, 
        type: 'success' 
      });
      loadAdminPayments();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || `Simulation failed for ${orderNumber}`, type: 'error' });
    } finally {
      setSimulatingOrderId(null);
    }
  };

  const handleMarkPaymentFailed = async (orderId: string, orderNumber: string) => {
    if (!window.confirm(`Mark order ${orderNumber} as Failed/Expired? This indicates the transaction timed out or was rejected by the provider.`)) {
      return;
    }
    try {
      const res = await api.markPaymentFailed(orderId, 'Marked as Failed/Expired by Tournament Marshal.');
      setMessage({ text: `Order ${orderNumber} marked as Failed.`, type: 'success' });
      loadAdminPayments();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update order', type: 'error' });
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedTxId(id);
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  // Load Admin Withdrawals
  const loadAdminWithdrawals = (status = withdrawalFilter) => {
    setLoadingWithdrawals(true);
    api.getAdminWithdrawals(status === 'all' ? undefined : status)
      .then((res) => {
        setAdminWithdrawals(res.withdrawals || []);
        setWithdrawalMetrics(res.metrics);
      })
      .catch(console.error)
      .finally(() => setLoadingWithdrawals(false));
  };

  // Load Audit Logs
  const loadAuditLogs = () => {
    setLoadingAuditLogs(true);
    api.getAuditLogs()
      .then(setAuditLogs)
      .catch(console.error)
      .finally(() => setLoadingAuditLogs(false));
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      if (paymentSubTab === 'orders') {
        loadAdminPayments();
      } else if (paymentSubTab === 'withdrawals') {
        loadAdminWithdrawals();
      } else if (paymentSubTab === 'audit_trail') {
        loadAuditLogs();
      } else if (paymentSubTab === 'gateway_setup') {
        loadGatewayConfig();
      }
    }
  }, [activeTab, paymentSubTab, withdrawalFilter]);

  const handleApproveWithdrawal = async (id: string, requestNumber: string) => {
    setProcessingWithdrawalId(id);
    setMessage(null);
    try {
      const res = await api.processAdminWithdrawal(id, {
        action: 'approve',
        notes: `Payout verified and disbursed by Tournament Marshal`
      });
      setMessage({ text: res.message, type: 'success' });
      loadAdminWithdrawals();
      loadAuditLogs();
    } catch (err: any) {
      setMessage({ text: err.message || `Failed to approve withdrawal ${requestNumber}`, type: 'error' });
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleConfirmRejection = async () => {
    if (!rejectDialog.withdrawalId) return;
    setProcessingWithdrawalId(rejectDialog.withdrawalId);
    setMessage(null);
    try {
      const res = await api.processAdminWithdrawal(rejectDialog.withdrawalId, {
        action: 'reject',
        rejectionReason: rejectDialog.reason || 'Verification rejected by Tournament Marshal'
      });
      setMessage({ text: res.message, type: 'success' });
      setRejectDialog((prev) => ({ ...prev, open: false }));
      loadAdminWithdrawals();
      loadAuditLogs();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to reject withdrawal', type: 'error' });
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundDialog.orderId) return;
    setRefundDialog((prev) => ({ ...prev, loading: true }));
    setMessage(null);
    try {
      const res = await api.refundPaymentOrder(refundDialog.orderId, refundDialog.reason || 'Refund authorized by Marshal');
      setMessage({ text: res.message, type: 'success' });
      setRefundDialog((prev) => ({ ...prev, open: false, loading: false }));
      loadAdminPayments();
      loadAuditLogs();
      loadMetrics();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to issue refund', type: 'error' });
      setRefundDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E2536] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#FFC837]" />
            <span>Tournament Marshal Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin tool to create, edit, reschedule matches, manage roster slots, publish custom room IDs, verify scores, and authenticate payment orders.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#141A26] rounded-xl border border-[#272E3F] shrink-0 self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => { setActiveTab('create'); setMessage(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'create' ? 'bg-[#FFC837] text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Match
          </button>
          <button
            onClick={() => { setActiveTab('edit'); setMessage(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'edit' ? 'bg-[#FFC837] text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Edit & Reschedule
          </button>
          <button
            onClick={() => { setActiveTab('roster'); setMessage(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'roster' ? 'bg-[#FFC837] text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Assign Slots
          </button>
          <button
            onClick={() => { setActiveTab('publish'); setMessage(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'publish' ? 'bg-[#FFC837] text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Publish Room ID
          </button>
          <button
            onClick={() => { setActiveTab('verify'); setMessage(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'verify' ? 'bg-[#FFC837] text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Verify Scoring
          </button>
          <button
            onClick={() => { setActiveTab('payments'); setMessage(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'payments' ? 'bg-[#FFC837] text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Verification</span>
            {paymentMetrics?.pending > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[9px] font-black rounded-full animate-pulse">
                {paymentMetrics.pending}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#111622] rounded-xl border border-[#1E2536]">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Total Tournaments</span>
          <span className="text-xl font-display font-bold text-white tabular-nums">
            {metrics?.totalTournaments || tournaments.length}
          </span>
        </div>
        <div className="p-3 bg-[#111622] rounded-xl border border-[#1E2536]">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Registered Players</span>
          <span className="text-xl font-display font-bold text-amber-300 tabular-nums">
            {metrics?.totalPlayers || 6}
          </span>
        </div>
        <div className="p-3 bg-[#111622] rounded-xl border border-[#1E2536]">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Active Custom Rooms</span>
          <span className="text-xl font-display font-bold text-emerald-400 tabular-nums">
            {metrics?.activeRooms || 1}
          </span>
        </div>
        <div className="p-3 bg-[#111622] rounded-xl border border-[#1E2536]">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Prizes Paid Out</span>
          <span className="text-xl font-display font-bold text-[#FFC837] tabular-nums">
            {metrics?.totalPrizeDistributed || 2000} Coins
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Create Tournament */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateTournament} className="p-6 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <PlusCircle className="w-4 h-4 text-[#FFC837]" />
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Host New Free Fire Tournament
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Tournament Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Bermuda Friday Night Clash #43"
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Schedule Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Game Mode
              </label>
              <select
                value={gameMode}
                onChange={(e: any) => setGameMode(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
              >
                <option value="Solo">Solo (48 slots)</option>
                <option value="Duo">Duo (24 teams)</option>
                <option value="Squad">Squad (12 squads)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Battlefield Map
              </label>
              <select
                value={mapName}
                onChange={(e: any) => setMapName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
              >
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Total Slots
              </label>
              <input
                type="number"
                min={2}
                max={48}
                value={totalSlots}
                onChange={(e) => setTotalSlots(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Entry Fee (Coins)
              </label>
              <input
                type="number"
                min={0}
                value={entryFee}
                onChange={(e) => setEntryFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Total Prize Pool (Coins) *
              </label>
              <input
                type="number"
                required
                min={100}
                value={prizePool}
                onChange={(e) => setPrizePool(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono text-[#FFC837] font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                1st Prize (Booyah) *
              </label>
              <input
                type="number"
                required
                min={50}
                value={firstPrize}
                onChange={(e) => setFirstPrize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono text-amber-300 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Points per Confirmed Kill
              </label>
              <input
                type="number"
                min={1}
                value={perKillPts}
                onChange={(e) => setPerKillPts(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Custom Rules & Guidelines
            </label>
            <textarea
              rows={3}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating...' : 'Publish Tournament Listing'}</span>
          </button>
        </form>
      )}

      {/* Tab 2: Edit & Reschedule Tournament */}
      {activeTab === 'edit' && (
        <form onSubmit={handleUpdateTournament} className="p-6 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="w-4 h-4 text-[#FFC837]" />
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Edit & Reschedule Tournament
            </h3>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Select Tournament to Edit
            </label>
            <select
              value={selectedEditTourneyId}
              onChange={(e) => setSelectedEditTourneyId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Tournament Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Reschedule Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={editScheduledAt}
                onChange={(e) => setEditScheduledAt(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e: any) => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-bold"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Game Mode
              </label>
              <select
                value={editGameMode}
                onChange={(e: any) => setEditGameMode(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
              >
                <option value="Solo">Solo</option>
                <option value="Duo">Duo</option>
                <option value="Squad">Squad</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Map
              </label>
              <select
                value={editMapName}
                onChange={(e: any) => setEditMapName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
              >
                <option value="Bermuda">Bermuda</option>
                <option value="Purgatory">Purgatory</option>
                <option value="Kalahari">Kalahari</option>
                <option value="Alpine">Alpine</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Total Slots
              </label>
              <input
                type="number"
                min={2}
                max={48}
                value={editTotalSlots}
                onChange={(e) => setEditTotalSlots(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Prize Pool (Coins)
              </label>
              <input
                type="number"
                min={0}
                value={editPrizePool}
                onChange={(e) => setEditPrizePool(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono text-[#FFC837] font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                1st Prize (Booyah)
              </label>
              <input
                type="number"
                min={0}
                value={editFirstPrize}
                onChange={(e) => setEditFirstPrize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono text-amber-300 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Entry Fee (Coins)
              </label>
              <input
                type="number"
                min={0}
                value={editEntryFee}
                onChange={(e) => setEditEntryFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Custom Rules
            </label>
            <textarea
              rows={3}
              value={editRules}
              onChange={(e) => setEditRules(e.target.value)}
              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Update Tournament Settings & Schedule'}</span>
          </button>
        </form>
      )}

      {/* Tab 3: Slot & Roster Management */}
      {activeTab === 'roster' && (
        <div className="p-6 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#FFC837]" />
              <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                Manage Registrations & Assign Slots
              </h3>
            </div>
            <button
              onClick={() => loadRoster(selectedRosterTourneyId)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2536] transition-colors"
              title="Refresh Roster"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            View registered players, assign custom room slot numbers, swap slots between players, or remove entries (with automatic entry fee refund).
          </p>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Select Tournament Roster
            </label>
            <select
              value={selectedRosterTourneyId}
              onChange={(e) => setSelectedRosterTourneyId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status.toUpperCase()} · {t.registered_count || 0}/{t.total_slots} Slots)
                </option>
              ))}
            </select>
          </div>

          {loadingRegistrations ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#FFC837] border-t-transparent rounded-full animate-spin" />
              <span>Loading roster data...</span>
            </div>
          ) : adminRegistrations.length === 0 ? (
            <div className="p-8 text-center bg-[#0C101A] rounded-xl border border-[#1E2536] text-slate-400 text-xs">
              No registered players found in this tournament roster yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Slot #</th>
                    <th className="py-2.5 px-3">Player IGN</th>
                    <th className="py-2.5 px-3">Free Fire UID</th>
                    <th className="py-2.5 px-3">Rank / Level</th>
                    <th className="py-2.5 px-3">Team Name</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2233]">
                  {adminRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-[#141A26] transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {editingSlotId === reg.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={1}
                              max={48}
                              value={newSlotNumber}
                              onChange={(e) => setNewSlotNumber(Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-[#0C101A] border border-[#FFC837] rounded text-xs text-white font-mono font-bold"
                            />
                            <button
                              onClick={() => handleSaveSlot(reg.id)}
                              className="px-2 py-1 bg-[#FFC837] text-black font-bold rounded text-[10px] hover:brightness-110"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingSlotId(null)}
                              className="px-2 py-1 bg-[#1E2536] text-slate-300 rounded text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-[#1F2739] text-[#FFC837] font-mono font-bold flex items-center justify-center text-xs">
                              #{reg.slot_number}
                            </span>
                            <button
                              onClick={() => {
                                setEditingSlotId(reg.id);
                                setNewSlotNumber(reg.slot_number);
                              }}
                              className="text-[10px] text-slate-400 hover:text-[#FFC837] underline"
                            >
                              Reassign
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                        {reg.ign}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-amber-300 whitespace-nowrap">
                        {reg.ff_uid}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-slate-300">{reg.rank_tier}</span>
                        <span className="text-slate-500 text-[10px] ml-1">(Lvl {reg.level})</span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {reg.team_name || 'Solo'}
                      </td>

                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveRegistration(reg.id, reg.ign)}
                          disabled={loading}
                          className="px-2.5 py-1 text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/30 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Publish Room ID & Password */}
      {activeTab === 'publish' && (
        <form onSubmit={handlePublishRoom} className="p-6 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Release Custom Room Credentials
            </h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Publishing updates the tournament's Room ID & Password in the database and automatically sends an alert to all confirmed participants' in-app notification centers.
          </p>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Select Tournament
            </label>
            <select
              value={selectedPublishTourneyId}
              onChange={(e) => setSelectedPublishTourneyId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status.toUpperCase()} · Room: {t.room_status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Free Fire Custom Room ID *
              </label>
              <input
                type="text"
                required
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. FF-ROOM-99482"
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                Room Password *
              </label>
              <input
                type="text"
                required
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="e.g. CLASH88"
                className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono font-bold text-[#FFC837]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Broadcasting...' : 'Publish Room Credentials & Alert Players'}</span>
          </button>
        </form>
      )}

      {/* Tab 5: Verify Results & Scoring */}
      {activeTab === 'verify' && (
        <form onSubmit={handleVerifyResults} className="p-6 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-[#FFC837]" />
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Verify Match Scores & Award Prizes
            </h3>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
              Select Tournament to Score
            </label>
            <select
              value={selectedVerifyTourneyId}
              onChange={(e) => setSelectedVerifyTourneyId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {participantResults.length === 0 ? (
            <div className="p-8 text-center bg-[#0C101A] rounded-xl border border-[#1E2536] text-slate-400 text-xs">
              No registered participants found in this tournament to score.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-2 px-3">Player IGN</th>
                      <th className="py-2 px-3">Free Fire UID</th>
                      <th className="py-2 px-3 w-28">Placement (#)</th>
                      <th className="py-2 px-3 w-24">Kills</th>
                      <th className="py-2 px-3 w-32">Prize Payout (Coins)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2233]">
                    {participantResults.map((row, index) => (
                      <tr key={row.user_id} className="hover:bg-[#141A26]">
                        <td className="py-2 px-3 font-semibold text-white whitespace-nowrap">
                          {row.ign}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-400 whitespace-nowrap">
                          {row.ff_uid}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={1}
                            max={48}
                            value={row.placement}
                            onChange={(e) => updateResultRow(index, 'placement', Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-[#0C101A] border border-[#272E3F] rounded text-xs text-white font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={0}
                            value={row.kills}
                            onChange={(e) => updateResultRow(index, 'kills', Number(e.target.value))}
                            className="w-20 px-2 py-1 bg-[#0C101A] border border-[#272E3F] rounded text-xs text-red-400 font-bold font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={0}
                            value={row.prize_won}
                            onChange={(e) => updateResultRow(index, 'prize_won', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-[#0C101A] border border-[#272E3F] rounded text-xs text-amber-300 font-bold font-mono"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 mt-3"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{loading ? 'Saving Scores...' : 'Verify Scoring & Award Wallet Prizes'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 6: Payment Verification & Provider Gateway */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {/* Subtabs for Financial Management */}
          <div className="flex items-center gap-2 border-b border-[#1E2536] pb-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => setPaymentSubTab('orders')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                paymentSubTab === 'orders'
                  ? 'bg-[#FFC837] text-black shadow-md'
                  : 'bg-[#141A26] text-slate-400 hover:text-white border border-[#232B3C]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Deposits & Orders</span>
              {paymentMetrics?.pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black">
                  {paymentMetrics.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentSubTab('withdrawals');
                loadAdminWithdrawals();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                paymentSubTab === 'withdrawals'
                  ? 'bg-[#FFC837] text-black shadow-md'
                  : 'bg-[#141A26] text-slate-400 hover:text-white border border-[#232B3C]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Withdrawals & Payouts</span>
              {withdrawalMetrics?.pending > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black animate-pulse">
                  {withdrawalMetrics.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentSubTab('audit_trail');
                loadAuditLogs();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                paymentSubTab === 'audit_trail'
                  ? 'bg-[#FFC837] text-black shadow-md'
                  : 'bg-[#141A26] text-slate-400 hover:text-white border border-[#232B3C]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Financial Audit Trail</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentSubTab('gateway_setup');
                loadGatewayConfig();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                paymentSubTab === 'gateway_setup'
                  ? 'bg-[#FFC837] text-black shadow-md'
                  : 'bg-[#141A26] text-slate-400 hover:text-white border border-[#232B3C]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Gateway Secrets & Setup</span>
            </button>
          </div>

          {/* SUBTAB 1: DEPOSITS & PAYMENT ORDERS */}
          {paymentSubTab === 'orders' && (
            <div className="space-y-4">
              <div className="p-5 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-[#FFC837]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                        <span>Payment Verification & Reconciliation</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-normal">
                          Server-Side Verified Only
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Zero-trust automated gateway settlement. Permitted refunds deduct wallet balance and issue official provider reversals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadAdminPayments()}
                      disabled={loadingPayments}
                      className="px-3 py-1.5 rounded-xl bg-[#171F2E] hover:bg-[#1E283A] text-slate-300 hover:text-white border border-[#273248] text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingPayments ? 'animate-spin text-[#FFC837]' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-[#1E2536]">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Total Orders</span>
                    <span className="text-lg font-display font-bold text-white tabular-nums">
                      {paymentMetrics?.total || adminPayments.length}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <span className="text-[10px] uppercase font-semibold text-amber-300 block mb-0.5">Pending Settlement</span>
                    <span className="text-lg font-display font-bold text-amber-400 tabular-nums">
                      {paymentMetrics?.pending || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-0.5">Verified Volume</span>
                    <span className="text-lg font-display font-bold text-emerald-300 tabular-nums">
                      ₹{paymentMetrics?.totalVolumeInr || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-rose-500/20 bg-rose-500/5">
                    <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-0.5">Failed / Expired</span>
                    <span className="text-lg font-display font-bold text-rose-300 tabular-nums">
                      {paymentMetrics?.failed || 0}
                    </span>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(['all', 'pending', 'verified', 'failed'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setPaymentFilter(st);
                          loadAdminPayments(st, paymentSearch);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                          paymentFilter === st
                            ? 'bg-[#FFC837] text-black shadow-sm'
                            : 'bg-[#151B28] text-slate-400 hover:text-white border border-[#272E3F]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={paymentSearch}
                      onChange={(e) => {
                        setPaymentSearch(e.target.value);
                        loadAdminPayments(paymentFilter, e.target.value);
                      }}
                      placeholder="Search Tx ID, player IGN, UID..."
                      className="w-full pl-9 pr-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFC837]/60"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Transactions Table */}
              <div className="bg-[#111622] rounded-2xl border border-[#1E2536] overflow-hidden">
                {loadingPayments ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#FFC837] animate-spin" />
                    <span>Loading transaction logs from database...</span>
                  </div>
                ) : adminPayments.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No payment orders match this criteria</p>
                    <p className="text-[11px] text-slate-500">Orders created by players using the Wallet dynamic QR screen will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-3.5">Transaction ID</th>
                          <th className="py-3 px-3.5">Player Details</th>
                          <th className="py-3 px-3.5">Amount & Coins</th>
                          <th className="py-3 px-3.5">Timestamp</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5">Verification Source</th>
                          <th className="py-3 px-3.5 text-right">Marshal Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A2233]">
                        {adminPayments.map((p) => {
                          const isPending = p.status === 'pending';
                          const isVerified = p.status === 'verified';
                          const isFailed = p.status === 'failed' || p.status === 'cancelled';
                          const isRefunded = p.refund_status === 'refunded';

                          return (
                            <tr key={p.id} className="hover:bg-[#141A26] transition-colors">
                              {/* Transaction ID */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-white text-xs">{p.order_number}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyOrderId(p.order_number)}
                                    className="text-slate-500 hover:text-white p-0.5 rounded transition-colors"
                                    title="Copy Order ID"
                                  >
                                    {copiedTxId === p.order_number ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]" title={p.id}>
                                  ID: {p.id.slice(0, 14)}...
                                </div>
                                {p.provider_payment_id && (
                                  <div className="text-[10px] font-mono text-emerald-400/80 truncate max-w-[140px]" title={p.provider_payment_id}>
                                    Gateway: {p.provider_payment_id}
                                  </div>
                                )}
                              </td>

                              {/* Player */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-semibold text-white text-xs">
                                  {(p as any).ign || 'Unknown Player'}
                                </div>
                                <div className="text-[11px] font-mono text-amber-300">
                                  UID: {(p as any).ff_uid || 'N/A'}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {(p as any).email}
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-bold text-white text-sm">
                                  ₹{p.amount_inr}
                                </div>
                                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-mono font-semibold">
                                  <Coins className="w-2.5 h-2.5" />
                                  <span>+{p.coins_awarded} Coins</span>
                                </div>
                              </td>

                              {/* Timestamp */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="text-slate-300 text-xs">
                                  {new Date(p.created_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  {new Date(p.created_at).toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </div>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    <span>Pending</span>
                                  </span>
                                )}
                                {isVerified && !isRefunded && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                  </span>
                                )}
                                {isRefunded && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Refunded</span>
                                  </span>
                                )}
                                {isFailed && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    <span>Failed</span>
                                  </span>
                                )}
                              </td>

                              {/* Verification Source */}
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                {p.verified_at ? (
                                  <div>
                                    <span className="text-[11px] text-emerald-300 font-medium block">
                                      {p.verification_source || 'Server Webhook (HMAC)'}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {new Date(p.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-amber-400/90 font-medium block">
                                      Awaiting Gateway Ping
                                    </span>
                                    <span className="text-[9px] text-slate-500 block">
                                      Screenshots not accepted
                                    </span>
                                  </div>
                                )}
                              </td>

                              {/* Marshal Actions */}
                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Direct Server-to-Gateway Check */}
                                    <button
                                      type="button"
                                      onClick={() => handleVerifyPaymentWithGateway(p.id, p.order_number)}
                                      disabled={verifyingOrderId === p.id}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                                      title="Perform server-side status check with payment gateway"
                                    >
                                      {verifyingOrderId === p.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <ShieldCheck className="w-3 h-3" />
                                      )}
                                      <span>Query Gateway</span>
                                    </button>

                                    {/* HMAC Webhook Simulator */}
                                    <button
                                      type="button"
                                      onClick={() => handleSimulatePaymentWebhook(p.id, p.order_number)}
                                      disabled={simulatingOrderId === p.id}
                                      className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                                      title="Simulate authenticated provider webhook (HMAC signed) for this order"
                                    >
                                      {simulatingOrderId === p.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Zap className="w-3 h-3" />
                                      )}
                                      <span>Simulate Webhook</span>
                                    </button>

                                    {/* Mark as Failed */}
                                    <button
                                      type="button"
                                      onClick={() => handleMarkPaymentFailed(p.id, p.order_number)}
                                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                      title="Mark order as expired/failed"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : isVerified && !isRefunded ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRefundDialog({
                                          open: true,
                                          orderId: p.id,
                                          orderNumber: p.order_number,
                                          playerName: (p as any).ign || 'Player',
                                          amount: p.amount_inr,
                                          reason: 'Tournament cancelled / Marshal authorized refund',
                                          loading: false,
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                                      title="Initiate permitted refund to gateway"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Issue Refund</span>
                                    </button>
                                    <span className="text-[11px] text-emerald-400 font-mono">Settled</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {isRefunded ? 'Refund Complete' : 'Closed'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 2: WITHDRAWAL REQUESTS */}
          {paymentSubTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="p-5 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/10 border border-emerald-500/30 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                        <span>Player Withdrawal Payout Queue</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-normal ${
                          withdrawalMetrics?.isLivePayoutConfigured 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {withdrawalMetrics?.isLivePayoutConfigured ? 'RazorpayX Live Payouts' : 'Sandbox Simulated Payouts'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Review cash-out requests. TDS 30% is deducted as per Indian IT Act 194BA on net esports winnings.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadAdminWithdrawals()}
                      disabled={loadingWithdrawals}
                      className="px-3 py-1.5 rounded-xl bg-[#171F2E] hover:bg-[#1E283A] text-slate-300 hover:text-white border border-[#273248] text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingWithdrawals ? 'animate-spin text-[#FFC837]' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Metrics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <span className="text-[10px] uppercase font-semibold text-amber-300 block mb-0.5">Pending Review</span>
                    <span className="text-lg font-display font-bold text-amber-400 tabular-nums">
                      {withdrawalMetrics?.pending || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] uppercase font-semibold text-emerald-400 block mb-0.5">Total Disbursed</span>
                    <span className="text-lg font-display font-bold text-emerald-300 tabular-nums">
                      ₹{withdrawalMetrics?.totalDisbursedInr || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-[#1E2536]">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Completed Payouts</span>
                    <span className="text-lg font-display font-bold text-white tabular-nums">
                      {withdrawalMetrics?.completed || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-[#0B0F17] rounded-xl border border-rose-500/20 bg-rose-500/5">
                    <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-0.5">Rejected Requests</span>
                    <span className="text-lg font-display font-bold text-rose-300 tabular-nums">
                      {withdrawalMetrics?.rejected || 0}
                    </span>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {(['all', 'pending_review', 'completed', 'rejected'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setWithdrawalFilter(st);
                        loadAdminWithdrawals(st);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                        withdrawalFilter === st
                          ? 'bg-[#FFC837] text-black shadow-sm'
                          : 'bg-[#151B28] text-slate-400 hover:text-white border border-[#272E3F]'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Withdrawals Table */}
              <div className="bg-[#111622] rounded-2xl border border-[#1E2536] overflow-hidden">
                {loadingWithdrawals ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#FFC837] animate-spin" />
                    <span>Loading withdrawal requests from database...</span>
                  </div>
                ) : adminWithdrawals.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <ArrowUpRight className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="font-semibold text-slate-300">No withdrawal requests found</p>
                    <p className="text-[11px] text-slate-500">When players cash out tournament winnings, their payout requests will appear here for review.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-3.5">Request #</th>
                          <th className="py-3 px-3.5">Player Details</th>
                          <th className="py-3 px-3.5">Amounts (₹)</th>
                          <th className="py-3 px-3.5">Payout Destination</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5">Date</th>
                          <th className="py-3 px-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A2233]">
                        {adminWithdrawals.map((w) => {
                          const isPending = w.status === 'pending_review';
                          const isCompleted = w.status === 'completed';
                          const isRejected = w.status === 'rejected';

                          return (
                            <tr key={w.id} className="hover:bg-[#141A26] transition-colors">
                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <span className="font-mono font-bold text-white text-xs">{w.request_number}</span>
                                <div className="text-[10px] font-mono text-slate-500">ID: {w.id.slice(0, 14)}...</div>
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-semibold text-white">{w.ign || 'Player'}</div>
                                <div className="text-[11px] font-mono text-amber-300">UID: {w.ff_uid || 'N/A'}</div>
                                <div className="text-[10px] text-slate-500">{w.email}</div>
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="font-bold text-white">Gross: ₹{w.amount_inr}</div>
                                <div className="text-[10px] text-rose-400">TDS 30%: -₹{w.tds_amount_inr}</div>
                                <div className="text-xs font-bold text-emerald-400">Net: ₹{w.net_payout_inr}</div>
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                <div className="flex items-center gap-1 text-slate-200 font-medium">
                                  <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-[#171F2E] border border-[#273248] text-amber-300 font-mono">
                                    {w.payout_mode === 'upi' ? 'UPI' : 'Bank'}
                                  </span>
                                  <span className="font-mono text-xs">{w.payout_address}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">A/c Holder: {w.account_holder_name}</div>
                                {w.bank_ifsc && (
                                  <div className="text-[10px] font-mono text-slate-500">IFSC: {w.bank_ifsc}</div>
                                )}
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    <span>Pending Review</span>
                                  </span>
                                )}
                                {isCompleted && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Completed</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                      <XCircle className="w-3.5 h-3.5" />
                                      <span>Rejected</span>
                                    </span>
                                    {w.rejection_reason && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 max-w-[160px] truncate" title={w.rejection_reason}>
                                        {w.rejection_reason}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 text-xs">
                                {new Date(w.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>

                              <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                {isPending ? (
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      disabled={processingWithdrawalId === w.id}
                                      onClick={() => handleApproveWithdrawal(w.id, w.request_number)}
                                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      {processingWithdrawalId === w.id ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      <span>Approve Payout</span>
                                    </button>

                                    <button
                                      type="button"
                                      disabled={processingWithdrawalId === w.id}
                                      onClick={() => {
                                        setRejectDialog({
                                          open: true,
                                          withdrawalId: w.id,
                                          requestNumber: w.request_number,
                                          playerName: w.ign || 'Player',
                                          amount: w.amount_inr,
                                          reason: 'Invalid UPI VPA / Bank account details rejected by payment system.'
                                        });
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Reject & Refund</span>
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {isCompleted ? 'Disbursed' : 'Refunded'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 3: FINANCIAL AUDIT TRAIL */}
          {paymentSubTab === 'audit_trail' && (
            <div className="space-y-4">
              <div className="p-5 bg-[#111622] rounded-2xl border border-[#1E2536] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-[#FFC837]" />
                    <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                      Immutable Financial Audit Ledger
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadAuditLogs()}
                    disabled={loadingAuditLogs}
                    className="px-3 py-1.5 rounded-xl bg-[#171F2E] hover:bg-[#1E283A] text-slate-300 hover:text-white border border-[#273248] text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin text-[#FFC837]' : ''}`} />
                    <span>Refresh Ledger</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Every deposit, entry fee deduction, tournament prize credit, withdrawal disbursal, and permitted refund is cryptographically signed and stored here. Direct manual editing of wallet balances without a transaction ledger entry is strictly prohibited by server architecture.
                </p>
              </div>

              <div className="bg-[#111622] rounded-2xl border border-[#1E2536] overflow-hidden">
                {loadingAuditLogs ? (
                  <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-[#FFC837] animate-spin" />
                    <span>Loading audit records from database...</span>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No financial audit records recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-3 px-3.5">Timestamp</th>
                          <th className="py-3 px-3.5">Action</th>
                          <th className="py-3 px-3.5">Actor</th>
                          <th className="py-3 px-3.5">Target Entity</th>
                          <th className="py-3 px-3.5">Audit Details &amp; Payload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A2233]">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#141A26] transition-colors">
                            <td className="py-3 px-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                              {new Date(log.created_at).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1B2233] text-amber-300 border border-[#273248]">
                                {log.action}
                              </span>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span className="font-semibold text-white">{(log as any).actor_ign || log.actor_role}</span>
                              <div className="text-[10px] text-slate-500 font-mono">{log.actor_role}</div>
                            </td>

                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <div className="text-slate-300 capitalize">{log.target_type}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{log.target_id.slice(0, 16)}...</div>
                            </td>

                            <td className="py-3 px-3.5">
                              <pre className="text-[10px] font-mono text-slate-300 bg-[#0B0F17] p-2 rounded-lg border border-[#1E2536] max-w-md overflow-x-auto whitespace-pre-wrap">
                                {log.details}
                              </pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUBTAB 4: GATEWAY SECRETS & SETUP */}
          {paymentSubTab === 'gateway_setup' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 bg-[#111622] rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#FFC837]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                      Indian Payment Gateway &amp; Razorpay Production Setup Guide
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step-by-step checklist to migrate from Test Sandbox to Live Indian Rupee (INR) transactions.
                    </p>
                  </div>
                </div>

                {/* Configuration Health Matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-[#0C101A] rounded-xl border border-[#1E2536] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gateway Key (Public)</span>
                    <span className={`text-xs font-mono font-bold ${gatewayConfig?.hasGatewayKey ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {gatewayConfig?.hasGatewayKey ? 'Configured (Live)' : 'Using Sandbox Fallback'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0C101A] rounded-xl border border-[#1E2536] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gateway Secret (Private)</span>
                    <span className={`text-xs font-mono font-bold ${gatewayConfig?.hasGatewaySecret ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {gatewayConfig?.hasGatewaySecret ? 'Secured in Server Env' : 'Sandbox Simulated'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0C101A] rounded-xl border border-[#1E2536] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Webhook HMAC Secret</span>
                    <span className={`text-xs font-mono font-bold ${gatewayConfig?.hasWebhookSecret ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {gatewayConfig?.hasWebhookSecret ? 'Signature Checking Active' : 'Sandbox Secret Active'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#0C101A] rounded-xl border border-[#1E2536] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">RazorpayX Payouts</span>
                    <span className={`text-xs font-mono font-bold ${gatewayConfig?.hasPayoutAccount ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {gatewayConfig?.hasPayoutAccount ? 'Merchant Account Linked' : 'Sandbox Ledger Mode'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Production Environment Variables (.env)
                  </h4>
                  <div className="p-4 bg-[#080B10] rounded-xl border border-[#1E2536] font-mono text-xs text-slate-300 space-y-1">
                    <div className="text-slate-500"># 1. Official Razorpay Merchant API Keys (Subject to Razorpay Approval)</div>
                    <div><span className="text-amber-300">RAZORPAY_KEY_ID</span>=rzp_live_xxxxxxxxxxxxxxxx</div>
                    <div><span className="text-amber-300">RAZORPAY_KEY_SECRET</span>=xxxxxxxxxxxxxxxxxxxxxxxx</div>
                    <div className="text-slate-500 pt-1"># 2. Webhook Signature Verification Secret</div>
                    <div><span className="text-amber-300">PAYMENT_WEBHOOK_SECRET</span>=whsec_xxxxxxxxxxxxxxxxxxxxxxxx</div>
                    <div className="text-slate-500 pt-1"># 3. RazorpayX Instant Payouts Account (Bank / UPI disbursal)</div>
                    <div><span className="text-amber-300">RAZORPAYX_ACCOUNT_NUMBER</span>=23232300xxxxxxxx</div>
                    <div className="text-slate-500 pt-1"># 4. Registered Indian Business UPI VPA</div>
                    <div><span className="text-amber-300">BUSINESS_UPI_VPA</span>=battleclash.esports@icici</div>
                  </div>
                </div>

                <div className="p-4 bg-[#0B0F17] rounded-xl border border-[#1E2536] space-y-2 text-xs text-slate-300">
                  <h4 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    Indian Legal &amp; Regulatory Compliance Requirements
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                    <li><strong>Skill-Based Gaming:</strong> Free Fire tournament participation constitutes a game of predominantly skill under Indian law.</li>
                    <li><strong>Restricted States:</strong> Paid real-money tournaments are geo-blocked in Assam, Odisha, Telangana, Andhra Pradesh, Nagaland, and Sikkim.</li>
                    <li><strong>TDS Deduction (Section 194BA):</strong> 30% tax is deducted on net winnings at the time of withdrawal and credited to the government.</li>
                    <li><strong>KYC &amp; Bank Account Matching:</strong> Bank/UPI payouts must match the verified user name to prevent fraud.</li>
                    <li><strong>No Screenshot Policy:</strong> Wallet funds are released exclusively upon cryptographically validated provider signatures and webhooks.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Refund Confirmation Modal */}
          {refundDialog.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md bg-[#0F141F] rounded-2xl border border-indigo-500/40 p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Issue Permitted Refund
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRefundDialog(prev => ({ ...prev, open: false }))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-[#131926] rounded-xl border border-[#202738] space-y-1 text-xs text-slate-300">
                  <div>Order Number: <strong className="font-mono text-white">{refundDialog.orderNumber}</strong></div>
                  <div>Player: <strong className="text-amber-300">{refundDialog.playerName}</strong></div>
                  <div>Refund Amount: <strong className="text-emerald-400 font-bold">₹{refundDialog.amount}</strong></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-semibold text-slate-400 block">
                    Reason for Refund (Audited)
                  </label>
                  <textarea
                    rows={3}
                    value={refundDialog.reason}
                    onChange={(e) => setRefundDialog(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-2.5 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Provide justification for reversing this verified deposit..."
                  />
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    This will initiate a gateway refund, deduct ₹{refundDialog.amount} from the player's Deposited Cash balance, and record an immutable event in the audit trail.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRefundDialog(prev => ({ ...prev, open: false }))}
                    className="flex-1 py-2 rounded-xl bg-[#161D2C] hover:bg-[#1E283A] text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={refundDialog.loading || !refundDialog.reason.trim()}
                    onClick={handleConfirmRefund}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                  >
                    {refundDialog.loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Confirm Refund</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Reason Modal */}
          {rejectDialog.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="w-full max-w-md bg-[#0F141F] rounded-2xl border border-rose-500/40 p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Reject Withdrawal Request
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRejectDialog(prev => ({ ...prev, open: false }))}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-[#131926] rounded-xl border border-[#202738] space-y-1 text-xs text-slate-300">
                  <div>Request: <strong className="font-mono text-white">{rejectDialog.requestNumber}</strong></div>
                  <div>Player: <strong className="text-amber-300">{rejectDialog.playerName}</strong></div>
                  <div>Amount to Return: <strong className="text-emerald-400 font-bold">₹{rejectDialog.amount}</strong></div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-semibold text-slate-400 block">
                    Reason for Rejection
                  </label>
                  <textarea
                    rows={3}
                    value={rejectDialog.reason}
                    onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full p-2.5 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="Explain why this withdrawal cannot be processed..."
                  />
                </div>

                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>
                    Rejecting this request will automatically refund the full ₹{rejectDialog.amount} back to the player's withdrawable winnings balance and record an audited log.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setRejectDialog(prev => ({ ...prev, open: false }))}
                    className="flex-1 py-2 rounded-xl bg-[#161D2C] hover:bg-[#1E283A] text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rejectDialog.reason.trim()}
                    onClick={handleConfirmRejection}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Reject &amp; Refund Winnings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

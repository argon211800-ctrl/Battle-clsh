import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { User, WalletTransaction, PaymentOrder, CoinPackage, WithdrawalRequest } from '../types';
import { api } from '../services/api';
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  Clock, 
  Sparkles, 
  CheckCircle2,
  QrCode,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Zap,
  Info,
  IndianRupee,
  Lock,
  Building,
  Smartphone,
  CheckSquare,
  Square
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onBalanceUpdated?: (newBalance: number) => void;
  initialTab?: 'deposit' | 'withdraw' | 'transactions' | 'compliance';
}

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBalanceUpdated,
  initialTab = 'deposit',
}) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transactions' | 'compliance'>(initialTab);
  
  // Real INR Wallet Balances
  const [depositInr, setDepositInr] = useState<number>(currentUser?.wallet_inr_deposit || 0);
  const [winningsInr, setWinningsInr] = useState<number>(currentUser?.wallet_inr_winnings || 0);
  const [bonusInr, setBonusInr] = useState<number>(currentUser?.wallet_inr_bonus || 0);
  const [totalPlayable, setTotalPlayable] = useState<number>(
    (currentUser?.wallet_inr_deposit || 0) + (currentUser?.wallet_inr_winnings || 0) + (currentUser?.wallet_inr_bonus || 0)
  );

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'deposits' | 'entry_fees' | 'winnings' | 'withdrawals' | 'refunds'>('all');
  const [loadingLedger, setLoadingLedger] = useState(true);

  // Add Cash (Deposit) State
  const [cashPackages, setCashPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pack_inr_100');
  const [customDepositAmount, setCustomDepositAmount] = useState<number>(100);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<PaymentOrder | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [orderPollStatus, setOrderPollStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [gatewayProvider, setGatewayProvider] = useState<string>('Razorpay');

  // Withdrawals State
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [payoutMode, setPayoutMode] = useState<'upi' | 'bank_transfer'>('upi');
  const [accountHolderName, setAccountHolderName] = useState<string>(currentUser?.ign || '');
  const [payoutAddress, setPayoutAddress] = useState<string>('');
  const [bankIfsc, setBankIfsc] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(true);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState<boolean>(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [withdrawalsList, setWithdrawalsList] = useState<WithdrawalRequest[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState<boolean>(false);
  const [isPayoutLiveConfigured, setIsPayoutLiveConfigured] = useState<boolean>(false);

  // Compliance Info State
  const [complianceInfo, setComplianceInfo] = useState<any>(null);

  // Polling ref
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch full wallet data
  const loadWalletData = async () => {
    try {
      setLoadingLedger(true);
      const res = await api.getWalletHistory();
      setDepositInr(res.deposit_inr || 0);
      setWinningsInr(res.winnings_inr || 0);
      setBonusInr(res.bonus_inr || 0);
      setTotalPlayable(res.total_playable_inr || 0);
      setTransactions(res.transactions || []);
      setComplianceInfo(res.compliance);

      if (onBalanceUpdated) {
        onBalanceUpdated(res.total_playable_inr);
      }
    } catch (err) {
      console.error('Failed to load wallet data:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  // Fetch packages
  const loadPackages = async () => {
    try {
      const res = await api.getPaymentPackages();
      if (res.cashPackages && res.cashPackages.length > 0) {
        setCashPackages(res.cashPackages);
      }
      setGatewayProvider(res.isLiveConfigured ? 'Razorpay (Live Mode)' : 'Sandbox Gateway (Test Mode)');
      setIsPayoutLiveConfigured(res.payoutsLive);
    } catch (err) {
      console.error('Failed to load packages:', err);
    }
  };

  // Fetch withdrawal history
  const loadWithdrawalHistory = async () => {
    try {
      setLoadingWithdrawals(true);
      const res = await api.getMyWithdrawals();
      setWithdrawalsList(res.requests || []);
      setIsPayoutLiveConfigured(res.payoutModeConfigured);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadWalletData();
      loadPackages();
      loadWithdrawalHistory();
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      setActiveOrder(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'withdraw') {
      loadWithdrawalHistory();
    } else if (activeTab === 'transactions') {
      loadWalletData();
    }
  }, [activeTab]);

  // Generate QR code when active order changes
  useEffect(() => {
    if (activeOrder?.qr_payload) {
      QRCode.toDataURL(activeOrder.qr_payload, {
        width: 256,
        margin: 1.5,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then(setQrCodeDataUrl)
        .catch(console.error);

      // Begin polling order status every 3 seconds
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await api.getPaymentOrderStatus(activeOrder.id);
          if (res.order.status === 'verified') {
            setOrderPollStatus('verified');
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
            loadWalletData();
          } else if (res.order.status === 'failed') {
            setOrderPollStatus('failed');
            if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          }
        } catch (e) {
          // ignore transient poll errors
        }
      }, 3000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeOrder]);

  const [depositError, setDepositError] = useState<string | null>(null);

  const handleCreateOrder = async () => {
    setCreatingOrder(true);
    setDepositError(null);
    setOrderPollStatus('pending');
    try {
      const payload: any = {};
      if (isCustomAmount) {
        payload.customAmountInr = customDepositAmount;
      } else {
        payload.packageId = selectedPackageId;
      }

      const res = await api.createPaymentOrder(payload);
      setActiveOrder(res.order);
    } catch (err: any) {
      setDepositError(err.message || 'Failed to initiate payment order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      setWithdrawalMessage({ text: 'Please accept the 18+ legal terms and bank account ownership declaration.', type: 'error' });
      return;
    }

    if (withdrawAmount > winningsInr) {
      setWithdrawalMessage({ text: `Withdrawal exceeds available winnings balance of ₹${winningsInr.toFixed(2)}.`, type: 'error' });
      return;
    }

    setSubmittingWithdrawal(true);
    setWithdrawalMessage(null);

    try {
      const res = await api.requestWithdrawal({
        amountInr: Number(withdrawAmount),
        payoutMode,
        accountHolderName,
        payoutAddress,
        bankIfsc: payoutMode === 'bank_transfer' ? bankIfsc : undefined,
      });

      setWithdrawalMessage({ text: res.message, type: 'success' });
      loadWalletData();
      loadWithdrawalHistory();
      setPayoutAddress('');
    } catch (err: any) {
      setWithdrawalMessage({ text: err.message || 'Failed to submit withdrawal request', type: 'error' });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (txFilter === 'all') return true;
    if (txFilter === 'deposits') return tx.type === 'deposit' || tx.type === 'wallet_topup';
    if (txFilter === 'entry_fees') return tx.type === 'entry_fee';
    if (txFilter === 'winnings') return tx.type === 'tournament_prize' || tx.type === 'kill_bounty';
    if (txFilter === 'withdrawals') return tx.type === 'withdrawal';
    if (txFilter === 'refunds') return tx.type === 'refund' || tx.type === 'withdrawal_refund';
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#0E131F] rounded-2xl sm:rounded-3xl border border-[#273248] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-[#1E2536] flex items-center justify-between bg-[#141A26]/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFC837] to-[#E5A93C] flex items-center justify-center shadow-md shadow-[#FFC837]/20">
              <IndianRupee className="w-5 h-5 text-black font-black" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display uppercase tracking-wider flex items-center gap-2">
                <span>Real Money Wallet</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  INR (₹) Real Currency
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official Free Fire Esports Cash Wallet &amp; Automated Payout System
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Money Balance Ribbon */}
        <div className="px-4 py-3 bg-[#0A0E17] border-b border-[#1B2232]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Playable Total */}
            <div className="p-2.5 rounded-xl bg-[#121826] border border-[#232D42]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Playable</span>
              <span className="text-base sm:text-lg font-bold font-display text-white tabular-nums">
                ₹{totalPlayable.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 block">Matches &amp; Scrims</span>
            </div>

            {/* Withdrawable Winnings */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <span className="text-[10px] uppercase font-bold text-emerald-300 block mb-0.5 flex items-center gap-1">
                <span>Winnings</span>
                <span className="text-[8px] bg-emerald-500 text-black px-1 rounded font-bold">Payouts</span>
              </span>
              <span className="text-base sm:text-lg font-bold font-display text-emerald-400 tabular-nums">
                ₹{winningsInr.toFixed(2)}
              </span>
              <span className="text-[9px] text-emerald-300/70 block">Ready to Withdraw</span>
            </div>

            {/* Deposited Cash */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
              <span className="text-[10px] uppercase font-bold text-amber-300 block mb-0.5">Deposited Cash</span>
              <span className="text-base sm:text-lg font-bold font-display text-amber-400 tabular-nums">
                ₹{depositInr.toFixed(2)}
              </span>
              <span className="text-[9px] text-amber-200/60 block">Added via Gateway</span>
            </div>

            {/* Promo Bonus */}
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/25">
              <span className="text-[10px] uppercase font-bold text-purple-300 block mb-0.5 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                <span>Promo Credits</span>
              </span>
              <span className="text-base sm:text-lg font-bold font-display text-purple-300 tabular-nums">
                ₹{bonusInr.toFixed(2)}
              </span>
              <span className="text-[9px] text-purple-300/60 block">Tournament Bonus</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-[#101624] border-b border-[#1E2536] overflow-x-auto text-xs">
          <button
            onClick={() => { setActiveTab('deposit'); setActiveOrder(null); }}
            className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'deposit'
                ? 'bg-[#FFC837] text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#161E2E]'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Add Cash (₹)</span>
          </button>

          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'withdraw'
                ? 'bg-[#FFC837] text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#161E2E]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Withdraw Winnings</span>
            {winningsInr >= 50 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'bg-[#FFC837] text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#161E2E]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3.5 py-1.5 rounded-xl font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'compliance'
                ? 'bg-[#FFC837] text-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#161E2E]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal &amp; TDS</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* TAB 1: ADD CASH */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              {!activeOrder ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Recharge Tournament Wallet
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Add cash via official Indian Payment Gateway (UPI, Cards, NetBanking).
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#161E2E] text-slate-300 border border-[#273248]">
                      {gatewayProvider}
                    </span>
                  </div>

                  {/* Preset Packages */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cashPackages.map((pkg) => {
                      const isSelected = !isCustomAmount && selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => {
                            setSelectedPackageId(pkg.id);
                            setIsCustomAmount(false);
                          }}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative ${
                            isSelected
                              ? 'bg-gradient-to-br from-amber-500/15 to-transparent border-[#FFC837] shadow-md shadow-[#FFC837]/10'
                              : 'bg-[#121724] border-[#202738] hover:border-[#2E3952]'
                          }`}
                        >
                          {pkg.badge && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#FFC837] text-black">
                              {pkg.badge}
                            </span>
                          )}

                          <span className="text-xs font-semibold text-slate-300 block mb-1">
                            {pkg.title}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-bold font-display text-white">
                              ₹{pkg.amount_inr}
                            </span>
                            {pkg.bonus_promo_inr > 0 && (
                              <span className="text-xs font-semibold text-emerald-400">
                                +₹{pkg.bonus_promo_inr} Free Bonus
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            Valid for Free Fire Tournaments &amp; Scrims
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Amount Option */}
                  <div className="p-3.5 rounded-2xl bg-[#121724] border border-[#202738] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Or enter custom amount in ₹ INR
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Min: ₹10 · Max: ₹10,000
                      </span>
                    </div>

                    <div className="relative">
                      <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="number"
                        min={10}
                        max={10000}
                        value={customDepositAmount}
                        onChange={(e) => {
                          setCustomDepositAmount(Number(e.target.value));
                          setIsCustomAmount(true);
                        }}
                        onFocus={() => setIsCustomAmount(true)}
                        className={`w-full pl-9 pr-4 py-2 bg-[#090D15] rounded-xl text-sm font-bold text-white border transition-colors ${
                          isCustomAmount ? 'border-[#FFC837]' : 'border-[#202738]'
                        }`}
                        placeholder="Enter amount in ₹ (e.g. 150)"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3 bg-[#0B0F18] rounded-xl border border-amber-500/20 text-xs text-slate-300 flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      <strong>Zero-Trust Real Money Guarantee:</strong> Payments are verified directly through encrypted server callbacks. Screenshots, claims, or manual receipts are never accepted as proof of payment.
                    </p>
                  </div>

                  {depositError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{depositError}</span>
                    </div>
                  )}

                  {/* Create Order Button */}
                  <button
                    onClick={handleCreateOrder}
                    disabled={creatingOrder}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#FFC837]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    {creatingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Secure Order...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Proceed to Pay ₹{isCustomAmount ? customDepositAmount : cashPackages.find(p => p.id === selectedPackageId)?.amount_inr || 100}</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* Dynamic QR & Payment Screen */
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-[#121724] rounded-2xl border border-[#273248] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1E2536] pb-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Order</span>
                        <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-white">
                          <span>{activeOrder.order_number}</span>
                          <button
                            onClick={() => handleCopyOrderId(activeOrder.order_number)}
                            className="text-slate-400 hover:text-white p-0.5"
                            title="Copy Order Number"
                          >
                            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Amount Due</span>
                        <span className="text-xl font-bold font-display text-white">₹{activeOrder.amount_inr}</span>
                      </div>
                    </div>

                    {/* QR Code and Instructions */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
                      <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0">
                        {qrCodeDataUrl ? (
                          <img src={qrCodeDataUrl} alt="Payment QR Code" className="w-40 h-40" />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                            Generating QR...
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-xs text-slate-300">
                        <span className="font-bold text-white text-xs block">
                          Scan to pay with any UPI App:
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="px-2 py-0.5 rounded bg-[#1C2436] font-semibold text-slate-200">GPay</span>
                          <span className="px-2 py-0.5 rounded bg-[#1C2436] font-semibold text-slate-200">PhonePe</span>
                          <span className="px-2 py-0.5 rounded bg-[#1C2436] font-semibold text-slate-200">Paytm</span>
                          <span className="px-2 py-0.5 rounded bg-[#1C2436] font-semibold text-slate-200">BHIM UPI</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Scan the dynamic QR code on your mobile device. Your transaction will be authenticated server-side and credited immediately.
                        </p>

                        {/* Mobile Direct UPI Intent */}
                        <a
                          href={activeOrder.qr_payload}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E273A] hover:bg-[#28344D] text-amber-300 text-xs font-semibold transition-colors mt-1"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Tap to open in UPI App</span>
                        </a>
                      </div>
                    </div>

                    {/* Live Verification Status Bar */}
                    <div className="p-3 bg-[#0A0D15] rounded-xl border border-[#1E2536] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {orderPollStatus === 'pending' && (
                          <>
                            <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                            <span className="text-xs text-amber-300 font-semibold">
                              Awaiting Gateway Confirmation...
                            </span>
                          </>
                        )}
                        {orderPollStatus === 'verified' && (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-emerald-300 font-bold">
                              Payment Verified! Deposited ₹{activeOrder.amount_inr} to Wallet.
                            </span>
                          </>
                        )}
                        {orderPollStatus === 'failed' && (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-400" />
                            <span className="text-xs text-rose-300 font-bold">
                              Transaction timed out or cancelled.
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => setActiveOrder(null)}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Start New Deposit
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WITHDRAW WINNINGS */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Withdraw Tournament Winnings
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transfer your earned tournament prize money to your bank or UPI.
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Available Winnings</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    ₹{winningsInr.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Status Alert */}
              {withdrawalMessage && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  withdrawalMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {withdrawalMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{withdrawalMessage.text}</span>
                </div>
              )}

              {/* Withdrawal Form */}
              <form onSubmit={handleSubmitWithdrawal} className="p-4 bg-[#121724] rounded-2xl border border-[#202738] space-y-3.5">
                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] uppercase font-bold text-slate-300">
                      Amount to Withdraw (₹ INR) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(Math.floor(winningsInr))}
                      className="text-[10px] text-amber-300 hover:underline"
                    >
                      Withdraw Max (₹{winningsInr.toFixed(2)})
                    </button>
                  </div>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min={50}
                      max={winningsInr > 50 ? Math.floor(winningsInr) : 50}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-[#0A0E17] border border-[#273248] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-[#FFC837]"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Minimum withdrawal is ₹50. Winnings must be earned from tournaments.
                  </span>
                </div>

                {/* TDS & Net Calculation Preview */}
                <div className="p-2.5 rounded-xl bg-[#0B0F18] border border-[#1E2536] text-xs space-y-1">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Gross Requested:</span>
                    <span className="font-mono text-white">₹{withdrawAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>TDS (Section 194BA - 30% on &gt; ₹10k):</span>
                    <span className="font-mono text-amber-300">
                      {withdrawAmount > 10000 ? `₹${(withdrawAmount * 0.3).toFixed(2)}` : '₹0.00 (Exempt)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-xs pt-1 border-t border-[#1C2436]">
                    <span>Net Disbursal to Bank/UPI:</span>
                    <span className="font-mono text-emerald-400">
                      ₹{(withdrawAmount > 10000 ? withdrawAmount * 0.7 : withdrawAmount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payout Mode Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-slate-300">
                    Payout Destination *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMode('upi')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        payoutMode === 'upi'
                          ? 'bg-[#FFC837] text-black border-[#FFC837]'
                          : 'bg-[#0A0E17] text-slate-300 border-[#273248] hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Instant UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMode('bank_transfer')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        payoutMode === 'bank_transfer'
                          ? 'bg-[#FFC837] text-black border-[#FFC837]'
                          : 'bg-[#0A0E17] text-slate-300 border-[#273248] hover:text-white'
                      }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Bank Transfer (NEFT/IMPS)</span>
                    </button>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                      Account Holder Legal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="Name as per PAN / Bank records"
                      className="w-full px-3 py-2 bg-[#0A0E17] border border-[#273248] rounded-xl text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                      {payoutMode === 'upi' ? 'UPI ID (VPA) *' : 'Bank Account Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutAddress}
                      onChange={(e) => setPayoutAddress(e.target.value)}
                      placeholder={payoutMode === 'upi' ? 'e.g. yourname@okhdfcbank' : 'e.g. 501002938102'}
                      className="w-full px-3 py-2 bg-[#0A0E17] border border-[#273248] rounded-xl text-xs text-white font-mono"
                    />
                  </div>

                  {payoutMode === 'bank_transfer' && (
                    <div>
                      <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                        Bank IFSC Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={11}
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-3 py-2 bg-[#0A0E17] border border-[#273248] rounded-xl text-xs text-white font-mono uppercase"
                      />
                    </div>
                  )}
                </div>

                {/* Legal & Age Declaration */}
                <div 
                  onClick={() => setAcceptedTerms(!acceptedTerms)}
                  className="flex items-start gap-2 cursor-pointer pt-1"
                >
                  {acceptedTerms ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    I confirm that I am 18 years of age or older, a resident of an eligible Indian state, and the account details provided belong to me.
                  </p>
                </div>

                {/* Submit Withdrawal Button */}
                <button
                  type="submit"
                  disabled={submittingWithdrawal || winningsInr < 50}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-black font-bold uppercase tracking-wider text-xs shadow-md hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {submittingWithdrawal ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Request Payout of ₹{withdrawAmount}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Past Withdrawal Requests Table */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Withdrawal History &amp; Status
                </h4>

                {loadingWithdrawals ? (
                  <div className="p-6 text-center text-slate-500 text-xs">Loading requests...</div>
                ) : withdrawalsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs bg-[#121724] rounded-xl border border-[#202738]">
                    No withdrawal requests yet. Win tournaments to accumulate withdrawable cash!
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-[#202738]">
                    <table className="w-full text-left text-xs bg-[#121724]">
                      <thead className="bg-[#0C101A] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Req ID</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Destination</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1A2233]">
                        {withdrawalsList.map((w) => (
                          <tr key={w.id} className="hover:bg-[#161E2E]">
                            <td className="py-2.5 px-3 font-mono font-bold text-white text-[11px]">
                              {w.request_number}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="font-bold text-emerald-400">₹{w.net_payout_inr}</span>
                              {w.tds_amount_inr > 0 && (
                                <span className="text-[10px] text-slate-500 ml-1">(TDS: ₹{w.tds_amount_inr})</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px] truncate max-w-[140px]">
                              {w.payout_address}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              {w.status === 'pending_review' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                                  Pending Review
                                </span>
                              )}
                              {w.status === 'processing' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20">
                                  Processing
                                </span>
                              )}
                              {w.status === 'completed' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                                  Disbursed
                                </span>
                              )}
                              {w.status === 'rejected' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/10 text-rose-300 font-bold border border-rose-500/20" title={w.rejection_reason}>
                                  Rejected (Refunded)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 text-[10px] whitespace-nowrap">
                              {new Date(w.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
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

          {/* TAB 3: TRANSACTIONS HISTORY */}
          {activeTab === 'transactions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Wallet Activity &amp; Audit Log
                </h3>
                <span className="text-xs text-slate-400">
                  {filteredTransactions.length} records
                </span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(['all', 'deposits', 'entry_fees', 'winnings', 'withdrawals', 'refunds'] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setTxFilter(ft)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                      txFilter === ft
                        ? 'bg-[#FFC837] text-black font-bold'
                        : 'bg-[#121724] text-slate-400 hover:text-white border border-[#202738]'
                    }`}
                  >
                    {ft.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Table / List */}
              {loadingLedger ? (
                <div className="p-8 text-center text-slate-500 text-xs">Loading ledger...</div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs bg-[#121724] rounded-xl border border-[#202738]">
                  No transaction history in this category.
                </div>
              ) : (
                <div className="divide-y divide-[#1A2233] bg-[#121724] rounded-xl border border-[#202738] overflow-hidden">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <div key={tx.id} className="p-3 hover:bg-[#161E2E] flex items-center justify-between gap-3 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-white block">
                              {tx.description}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="capitalize">{tx.balance_type || 'cash'} balance</span>
                              <span>·</span>
                              <span>{new Date(tx.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-sm font-bold font-mono ${
                            isCredit ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">
                            {tx.status || 'Settled'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMPLIANCE & LEGAL TERMS */}
          {activeTab === 'compliance' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-4 bg-[#121724] rounded-2xl border border-[#202738] space-y-2.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Indian Esports &amp; Skill Gaming Compliance</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  BattleClash operates structured competitive esports tournaments exclusively for Garena Free Fire. Under Indian law (precedents established by the Hon'ble Supreme Court of India), competitive esports are recognized as <strong>Games of Skill</strong>, where outcome is predominantly determined by player training, mechanical aim, strategy, and hand-eye coordination.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#121724] rounded-xl border border-[#202738] space-y-1.5">
                  <span className="font-bold text-white text-xs block">1. Age Requirement (18+)</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Participation in real-money entry tournaments is strictly restricted to players aged 18 and above. Minors are encouraged to play in Free Practice scrims.
                  </p>
                </div>

                <div className="p-3.5 bg-[#121724] rounded-xl border border-[#202738] space-y-1.5">
                  <span className="font-bold text-white text-xs block">2. State Restrictions</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Under state statutes, real-money pay-to-play tournaments are not available to residents of Assam, Andhra Pradesh, Odisha, Telangana, Nagaland, and Sikkim. Free-to-enter tournaments remain unrestricted.
                  </p>
                </div>

                <div className="p-3.5 bg-[#121724] rounded-xl border border-[#202738] space-y-1.5">
                  <span className="font-bold text-white text-xs block">3. Tax Deducted at Source (TDS)</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    In compliance with Section 194BA of the Indian Income Tax Act (1961), a flat 30% TDS is deducted on net tournament winnings exceeding ₹10,000 at the time of payout.
                  </p>
                </div>

                <div className="p-3.5 bg-[#121724] rounded-xl border border-[#202738] space-y-1.5">
                  <span className="font-bold text-white text-xs block">4. Zero-Trust Security</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Payment proof screenshots, fake slips, or edited QR scans are automatically blocked. Balances are released solely upon cryptographic gateway confirmation.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

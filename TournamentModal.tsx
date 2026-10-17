import React, { useState, useEffect } from 'react';
import { Tournament, TournamentDetail, User } from '../types';
import { api } from '../services/api';
import { 
  Trophy, 
  MapPin, 
  Users, 
  Calendar, 
  Coins, 
  Crosshair, 
  Key, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  UserCheck,
  IndianRupee,
  Wallet
} from 'lucide-react';

interface TournamentModalProps {
  tournament: Tournament | null;
  currentUser: User | null;
  onClose: () => void;
  onOpenRoom: (t: Tournament) => void;
  onOpenAuth: () => void;
  onRegistrationSuccess: () => void;
  onOpenWallet?: () => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  tournament,
  currentUser,
  onClose,
  onOpenRoom,
  onOpenAuth,
  onRegistrationSuccess,
  onOpenWallet,
}) => {
  const [detail, setDetail] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for squad/duo
  const [teamName, setTeamName] = useState('');
  const [teammateUids, setTeammateUids] = useState('');

  const loadDetails = () => {
    if (!tournament) return;
    setLoading(true);
    api.getTournament(tournament.id)
      .then((data) => {
        setDetail(data);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load tournament');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDetails();
  }, [tournament]);

  if (!tournament) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api.registerTournament(tournament.id, {
        team_name: teamName.trim() || undefined,
        teammate_uids: teammateUids.trim() || undefined,
      });
      setSuccessMsg(`Registered successfully! You are assigned Slot #${res.slotNumber}.`);
      loadDetails();
      onRegistrationSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel your tournament registration? Any entry fee will be refunded.')) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.cancelRegistration(tournament.id);
      setSuccessMsg('Registration cancelled.');
      loadDetails();
      onRegistrationSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel registration');
    } finally {
      setSubmitting(false);
    }
  };

  const isMultiplayer = tournament.game_mode === 'Duo' || tournament.game_mode === 'Squad';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0F141F] border border-[#272E3F] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Banner Header */}
        <div className="relative h-48 sm:h-56 w-full shrink-0 bg-[#0B0E14]">
          {tournament.banner_url ? (
            <img
              src={tournament.banner_url}
              alt={tournament.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1C2230] to-[#0B0E14]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0F141F] via-[#0F141F]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Info */}
          <div className="absolute bottom-4 left-5 right-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded bg-[#FFC837] text-black text-xs font-bold uppercase tracking-wider font-display">
                {tournament.game_mode}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-black/60 text-slate-300 text-xs font-medium border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#FFC837]" />
                {tournament.map_name}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300">
                {new Date(tournament.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white font-display uppercase tracking-wide line-clamp-1">
              {tournament.title}
            </h1>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-[#141A26] rounded-xl border border-[#202738]">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Cash Prize Pool</span>
              <span className="font-display text-lg font-bold text-[#FFC837] tabular-nums">
                ₹{tournament.prize_pool.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-[#141A26] rounded-xl border border-[#202738]">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">1st Prize (Booyah)</span>
              <span className="font-display text-lg font-bold text-amber-300 tabular-nums">
                ₹{tournament.first_prize.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-3 bg-[#141A26] rounded-xl border border-[#202738]">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Entry Fee</span>
              <span className="font-display text-lg font-bold text-emerald-400 tabular-nums">
                {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
              </span>
            </div>

            <div className="p-3 bg-[#141A26] rounded-xl border border-[#202738]">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Kill Reward</span>
              <span className="font-display text-lg font-bold text-red-400 tabular-nums flex items-center gap-1">
                <Crosshair className="w-4 h-4" />
                +{tournament.per_kill_pts} pt
              </span>
            </div>
          </div>

          {/* Registration Status or Form */}
          {detail?.isUserRegistered ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">
                    You Are Registered!
                  </h4>
                  <p className="text-xs text-slate-300">
                    Assigned: <span className="text-[#FFC837] font-semibold">Slot #{detail.userRegistration?.slot_number}</span> · Confirmed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onClose();
                    onOpenRoom(tournament);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Room Details</span>
                </button>
                {tournament.status === 'upcoming' && (
                  <button
                    onClick={handleCancelRegistration}
                    disabled={submitting}
                    className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 bg-[#161D2C] hover:bg-[#1E2536] rounded-xl border border-[#272E3F] transition-colors"
                  >
                    Unregister
                  </button>
                )}
              </div>
            </div>
          ) : tournament.status === 'upcoming' && !detail?.isFull ? (
            <div className="p-4 bg-[#141A26] rounded-2xl border border-[#202738]">
              <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider mb-2">
                Join Tournament Roster
              </h4>

              {!currentUser ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400 mb-3">
                    Sign in to join with your Free Fire UID and IGN.
                  </p>
                  <button
                    onClick={onOpenAuth}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#FFC837] rounded-xl hover:brightness-110"
                  >
                    Sign In to Register
                  </button>
                </div>
              ) : (
                (() => {
                  const playableInr = (currentUser.wallet_inr_deposit || 0) + (currentUser.wallet_inr_winnings || 0) + (currentUser.wallet_inr_bonus || 0);
                  const isAffordable = tournament.entry_fee === 0 || playableInr >= tournament.entry_fee;
                  const deficit = Math.max(0, tournament.entry_fee - playableInr);

                  return (
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="p-3 bg-[#0C101A] rounded-xl border border-[#1E2536] text-xs text-slate-300 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="text-slate-400">Player: </span>
                            <span className="font-semibold text-white">{currentUser.ign}</span>
                            <span className="text-slate-400 ml-2">UID: </span>
                            <span className="font-mono text-[#FFC837]">{currentUser.ff_uid}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Playable Cash: </span>
                            <span className={`font-mono font-bold ${isAffordable ? 'text-emerald-400' : 'text-rose-400'}`}>
                              ₹{playableInr.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {tournament.entry_fee > 0 && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-[#182030] flex flex-wrap items-center justify-between gap-1">
                            <span>
                              Breakdown: ₹{currentUser.wallet_inr_deposit || 0} Deposit · ₹{currentUser.wallet_inr_winnings || 0} Winnings · ₹{currentUser.wallet_inr_bonus || 0} Bonus
                            </span>
                            <span className="text-slate-500">
                              Deduction Order: Bonus → Deposit → Winnings
                            </span>
                          </div>
                        )}
                      </div>

                      {!isAffordable && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="text-amber-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>Insufficient wallet balance. You need ₹{deficit.toFixed(2)} more to enter.</span>
                          </div>
                          {onOpenWallet && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenWallet();
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-bold uppercase tracking-wider text-[11px] rounded-lg shadow hover:brightness-110 flex items-center justify-center gap-1 shrink-0"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>Add Cash (₹{deficit})</span>
                            </button>
                          )}
                        </div>
                      )}

                      {isMultiplayer && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div>
                            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                              Team / Squad Name
                            </label>
                            <input
                              type="text"
                              required
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              placeholder="e.g. Redline Esports"
                              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                              Teammates Free Fire UIDs (comma separated)
                            </label>
                            <input
                              type="text"
                              value={teammateUids}
                              onChange={(e) => setTeammateUids(e.target.value)}
                              placeholder="e.g. 918237461, 736291048"
                              className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting || !isAffordable}
                        className={`w-full py-2.5 px-4 font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 ${
                          !isAffordable
                            ? 'bg-[#181F2C] text-slate-500 cursor-not-allowed border border-[#232B3C]'
                            : 'bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black hover:brightness-110 active:scale-[0.98]'
                        }`}
                      >
                        {submitting
                          ? 'Deducting Fee & Registering...'
                          : !isAffordable
                          ? `Add ₹${deficit.toFixed(2)} to Register (Entry Fee: ₹${tournament.entry_fee})`
                          : tournament.entry_fee === 0
                          ? 'Confirm Free Registration'
                          : `Pay ₹${tournament.entry_fee} & Confirm Registration`}
                      </button>
                    </form>
                  );
                })()
              )}
            </div>
          ) : null}

          {/* Tournament Rules */}
          {tournament.rules && (
            <div className="p-4 bg-[#111724] rounded-2xl border border-[#1E2536]">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-display">
                Rules & Guidelines
              </h4>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans-body leading-relaxed">
                {tournament.rules}
              </pre>
            </div>
          )}

          {/* Registered Participants Roster */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#FFC837]" />
                <span>Confirmed Participants ({detail?.participants?.length || 0} / {tournament.total_slots})</span>
              </h4>
              <span className="text-xs text-slate-400">
                {tournament.slotsRemaining} slots remaining
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading roster...</div>
            ) : !detail?.participants || detail.participants.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-[#121824] rounded-xl border border-[#1E2536]">
                No players registered yet. Be the first to grab Slot #1!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {detail.participants.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 bg-[#141A26] rounded-xl border border-[#202738] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#1F2739] text-[#FFC837] text-[10px] font-mono font-bold flex items-center justify-center">
                        {p.slot_number}
                      </span>
                      <div>
                        <span className="font-semibold text-white block">{p.ign}</span>
                        <span className="text-[10px] font-mono text-slate-400">UID: {p.ff_uid}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-300/80 font-medium px-1.5 py-0.5 rounded bg-black/40 border border-white/5">
                      {p.rank_tier}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2536] bg-[#0C101A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1B2232] rounded-xl border border-[#272E3F]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

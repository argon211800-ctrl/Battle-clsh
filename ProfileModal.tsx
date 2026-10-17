import React, { useState, useEffect } from 'react';
import { User, PlayerStats } from '../types';
import { api } from '../services/api';
import { 
  X, 
  Trophy, 
  Copy, 
  Check, 
  Crosshair, 
  Coins, 
  Flame, 
  Shield, 
  Edit3, 
  Save, 
  User as UserIcon,
  Crown,
  AlertCircle
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onProfileUpdated: (user: User) => void;
  onOpenWallet?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
  onOpenWallet,
}) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Edit fields
  const [ign, setIgn] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [guild, setGuild] = useState('');
  const [bio, setBio] = useState('');
  const [rankTier, setRankTier] = useState('');

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    setIgn(currentUser.ign);
    setFfUid(currentUser.ff_uid);
    setGuild(currentUser.guild || '');
    setBio(currentUser.bio || '');
    setRankTier(currentUser.rank_tier || 'Heroic');

    setLoadingStats(true);
    api.getMe()
      .then((res) => {
        setStats(res.stats);
      })
      .catch((err) => {
        console.error('Error fetching stats:', err);
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const copyUid = () => {
    navigator.clipboard.writeText(currentUser.ff_uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const res = await api.updateProfile({
        ign,
        ff_uid: ffUid,
        guild,
        bio,
        rank_tier: rankTier,
      });
      onProfileUpdated(res.user);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F141F] border border-[#272E3F] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1E2536] flex items-center justify-between bg-gradient-to-r from-[#141A26] to-[#0F141F]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FFC837]" />
            <h2 className="text-base font-bold text-white font-display tracking-wide uppercase">
              Player Esports Dossier
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          
          {/* Identity Card */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-[#161D2C] to-[#0F141F] border border-[#272E3F] overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC837]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFC837] to-[#B8860B] p-0.5 shadow-lg shadow-[#FFC837]/20 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0F141F] rounded-[14px] flex items-center justify-center text-xl font-bold font-display text-[#FFC837]">
                    {currentUser.ign.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-display tracking-wide uppercase">
                      {currentUser.ign}
                    </h3>
                    <span className="px-2 py-0.5 rounded bg-black/60 border border-[#FFC837]/30 text-[10px] font-bold text-[#FFC837] uppercase">
                      Lvl {currentUser.level}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-400">
                      UID: {currentUser.ff_uid}
                    </span>
                    <button
                      onClick={copyUid}
                      title="Copy UID"
                      className="text-slate-400 hover:text-[#FFC837] transition-colors p-0.5"
                    >
                      {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                    <span>Rank: <strong className="text-amber-300">{currentUser.rank_tier}</strong></span>
                    <span>·</span>
                    <span>Guild: <strong className="text-slate-200">{currentUser.guild || 'None'}</strong></span>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-slate-400 hover:text-white bg-[#1B2232] rounded-xl border border-[#272E3F] hover:border-[#FFC837]/50 transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {currentUser.bio && (
              <p className="mt-3.5 pt-3 border-t border-[#202738] text-xs text-slate-300 italic">
                "{currentUser.bio}"
              </p>
            )}
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleSaveProfile} className="p-4 bg-[#131926] rounded-2xl border border-[#272E3F] space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-display">
                  Edit Player Identity
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">In-Game Name</label>
                  <input
                    type="text"
                    required
                    value={ign}
                    onChange={(e) => setIgn(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Free Fire UID</label>
                  <input
                    type="text"
                    required
                    value={ffUid}
                    onChange={(e) => setFfUid(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Rank Tier</label>
                  <select
                    value={rankTier}
                    onChange={(e) => setRankTier(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-lg text-xs text-white"
                  >
                    <option value="Grandmaster">Grandmaster</option>
                    <option value="Master">Master</option>
                    <option value="Heroic">Heroic</option>
                    <option value="Diamond IV">Diamond IV</option>
                    <option value="Diamond I">Diamond I</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Guild</label>
                  <input
                    type="text"
                    value={guild}
                    onChange={(e) => setGuild(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Player Bio</label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-lg text-xs text-white"
                />
              </div>

              {saveError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 flex items-center justify-center gap-1.5 mt-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          )}

          {/* Wallet Real Cash Balance */}
          <div className="p-4 bg-[#141A26] rounded-2xl border border-[#202738] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Real Cash Balance (INR ₹)
                </span>
                <span className="text-xl font-display font-bold text-white tabular-nums">
                  ₹{currentUser.wallet_coins.toLocaleString('en-IN')} <span className="text-xs text-emerald-400 font-sans font-semibold">Real Cash</span>
                </span>
              </div>
            </div>

            {onOpenWallet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWallet();
                }}
                className="px-3.5 py-1.5 bg-[#1C2436] hover:bg-[#252F46] border border-[#272E3F] hover:border-emerald-500/50 text-emerald-300 font-semibold rounded-xl text-xs transition-colors self-start sm:self-auto"
              >
                Deposit / Withdraw Cash
              </button>
            )}
          </div>

          {/* Lifetime Tournament Statistics */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display mb-3 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#FFC837]" />
              <span>Career Esports Records</span>
            </h4>

            {loadingStats ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading career records...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-[#131926] rounded-xl border border-[#202738] text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Tournaments</span>
                  <span className="text-lg font-display font-bold text-white tabular-nums">
                    {stats?.tournamentsJoined || 0}
                  </span>
                </div>

                <div className="p-3 bg-[#131926] rounded-xl border border-[#202738] text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Total Kills</span>
                  <span className="text-lg font-display font-bold text-red-400 tabular-nums">
                    {stats?.totalKills || 0}
                  </span>
                </div>

                <div className="p-3 bg-[#131926] rounded-xl border border-[#202738] text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Booyahs Won</span>
                  <span className="text-lg font-display font-bold text-[#FFC837] tabular-nums flex items-center justify-center gap-1">
                    <Crown className="w-4 h-4" />
                    {stats?.booyahsWon || 0}
                  </span>
                </div>

                <div className="p-3 bg-[#131926] rounded-xl border border-[#202738] text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">Cash Won</span>
                  <span className="text-lg font-display font-bold text-amber-300 tabular-nums">
                    ₹{(stats?.totalEarnings || 0).toLocaleString('en-IN')}
                  </span>
                </div>
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

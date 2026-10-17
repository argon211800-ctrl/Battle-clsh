import React, { useState } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { 
  X, 
  Trophy, 
  ShieldAlert, 
  User as UserIcon, 
  Lock, 
  Mail, 
  Crosshair, 
  Sparkles, 
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  initialMode?: 'login' | 'register' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'admin'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ign, setIgn] = useState('');
  const [ffUid, setFfUid] = useState('');
  const [guild, setGuild] = useState('');
  const [rankTier, setRankTier] = useState('Heroic');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.adminLogin({ email, password });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admin authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        email,
        password,
        ign,
        ff_uid: ffUid,
        guild: guild || undefined,
        rank_tier: rankTier,
      });
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0F141F] border border-[#272E3F] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1E2536] flex items-center justify-between bg-gradient-to-r from-[#141A26] to-[#0F141F]">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-md ${
              mode === 'admin' 
                ? 'bg-gradient-to-br from-amber-400 to-amber-600' 
                : 'bg-gradient-to-br from-[#FFC837] to-[#B8860B]'
            }`}>
              {mode === 'admin' ? (
                <ShieldAlert className="w-4 h-4 text-black font-black" />
              ) : (
                <Trophy className="w-4 h-4 text-black font-black" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display tracking-wide uppercase">
                {mode === 'admin' ? 'Marshal Admin Portal' : 'BattleClash Access'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'admin' ? 'Server-Verified Role Authorization' : 'Free Fire Esports Community Hub'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-[#1E2536] bg-[#0B0E14]">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'login'
                ? 'text-[#FFC837] border-b-2 border-[#FFC837] bg-[#141A26]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Player Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
              mode === 'register'
                ? 'text-[#FFC837] border-b-2 border-[#FFC837] bg-[#141A26]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('admin'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
              mode === 'admin'
                ? 'text-amber-400 border-b-2 border-amber-400 bg-[#141A26]'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}


          {mode === 'admin' ? (
            /* Dedicated Admin Login */
            <form onSubmit={handleAdminLogin} className="space-y-3.5">
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-200/90 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Admin login requires server-side role verification. Only accounts with official Tournament Marshal privileges can access tournament scheduling, slot assignment, and score verification.
                </span>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Marshal Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@battleclash.gg"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Admin Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1 mt-2"
              >
                {loading ? 'Verifying Admin Privileges...' : 'Authorize Marshal Access'}
              </button>
            </form>
          ) : mode === 'login' ? (
            /* Player Login */
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@battleclash.gg"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In as Player'}
              </button>
            </form>
          ) : (
            /* Player Register */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Free Fire In-Game Name (IGN) *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={ign}
                    onChange={(e) => setIgn(e.target.value)}
                    placeholder="e.g. ⚡ViperX"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Free Fire Numerical UID *
                </label>
                <div className="relative">
                  <Crosshair className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={ffUid}
                    onChange={(e) => setFfUid(e.target.value)}
                    placeholder="e.g. 849201948 (from FF Profile)"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white font-mono focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                    Rank Tier
                  </label>
                  <select
                    value={rankTier}
                    onChange={(e) => setRankTier(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
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
                  <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                    Guild Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={guild}
                    onChange={(e) => setGuild(e.target.value)}
                    placeholder="e.g. DarkOps"
                    className="w-full px-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@battleclash.gg"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">
                  Password (6+ chars) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                  />
                </div>
              </div>

              <div className="text-[11px] text-slate-400 leading-snug pt-1">
                New accounts receive <span className="text-[#FFC837] font-semibold">200 BattleClash Coins</span> welcome bonus points for tournament buy-ins.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1 mt-2"
              >
                {loading ? 'Registering Account...' : 'Create Esports Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { User, NotificationItem } from '../types';
import { 
  Trophy, 
  Bell, 
  Smartphone, 
  Monitor, 
  ShieldAlert, 
  Coins, 
  User as UserIcon, 
  LogOut,
  Wallet,
  IndianRupee
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  notifications: NotificationItem[];
  activeTab: 'tournaments' | 'leaderboard' | 'matches' | 'admin' | 'apk';
  onSelectTab: (tab: 'tournaments' | 'leaderboard' | 'matches' | 'admin' | 'apk') => void;
  onOpenAuth: (mode?: 'login' | 'register' | 'admin') => void;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenApkModal: () => void;
  onLogout: () => void;
  isAndroidFrame: boolean;
  onToggleFrame: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  notifications,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenProfile,
  onOpenWallet,
  onOpenNotifications,
  onOpenApkModal,
  onLogout,
  isAndroidFrame,
  onToggleFrame,
}) => {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-[#1E2536]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onSelectTab('tournaments')}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FFC837] to-[#B8860B] flex items-center justify-center shadow-lg shadow-[#FFC837]/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4 text-black font-black" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider text-white group-hover:text-[#FFC837] transition-colors uppercase">
              Battle<span className="text-[#FFC837]">Clash</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('tournaments')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'tournaments'
                ? 'text-[#FFC837] font-semibold border-b-2 border-[#FFC837]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tournaments
          </button>
          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'leaderboard'
                ? 'text-[#FFC837] font-semibold border-b-2 border-[#FFC837]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Leaderboards
          </button>
          {user && (
            <button
              onClick={() => onSelectTab('matches')}
              className={`whitespace-nowrap transition-colors py-1 ${
                activeTab === 'matches'
                  ? 'text-[#FFC837] font-semibold border-b-2 border-[#FFC837]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              My Matches
            </button>
          )}
          {user && (
            <button
              onClick={onOpenWallet}
              className="whitespace-nowrap text-slate-400 hover:text-emerald-400 transition-colors py-1 flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Cash Wallet</span>
            </button>
          )}
          {user?.role === 'admin' ? (
            <button
              onClick={() => onSelectTab('admin')}
              className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'text-[#FFC837] font-semibold border-b-2 border-[#FFC837]'
                  : 'text-amber-400/90 hover:text-amber-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('admin')}
              className="whitespace-nowrap text-slate-400 hover:text-amber-300 transition-colors py-1 flex items-center gap-1 text-xs"
              title="Marshal Admin Sign In"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500 hover:text-amber-400" />
              <span>Admin Login</span>
            </button>
          )}
          <button
            onClick={onOpenApkModal}
            className="whitespace-nowrap text-slate-400 hover:text-white transition-colors py-1 flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#FFC837]" />
            <span>Android APK</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Frame Toggle */}
          <button
            onClick={onToggleFrame}
            title={isAndroidFrame ? 'Switch to Full Screen View' : 'Preview in Android Phone Frame'}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#151B28] rounded-lg transition-colors border border-transparent hover:border-[#272E3F]"
          >
            {isAndroidFrame ? <Monitor className="w-4 h-4 text-emerald-400" /> : <Smartphone className="w-4 h-4" />}
          </button>

          {/* Notifications */}
          {user && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-[#151B28] rounded-lg transition-colors border border-transparent hover:border-[#272E3F]"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FFC837] rounded-full animate-pulse shadow-sm shadow-[#FFC837]" />
              )}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              {/* Real Money Wallet indicator - strictly INR */}
              <button 
                onClick={onOpenWallet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141A26] border border-[#272E3F] text-xs font-semibold text-emerald-400 hover:border-emerald-500/60 hover:bg-[#1A2233] transition-all cursor-pointer shadow-sm group"
                title="Real Cash Balance (INR ₹) - Deposit & Withdraw Real Money"
              >
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="font-mono font-bold tabular-nums text-white">
                  ₹{((user.wallet_inr_deposit || 0) + (user.wallet_inr_winnings || 0) + (user.wallet_inr_bonus || 0)).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-emerald-400/90 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded font-sans font-semibold hidden sm:inline">+ Add Cash</span>
              </button>

              {/* Free Fire Points/Coins indicator */}
              <div 
                className="hidden xl:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F1420] border border-[#1E2536] text-[11px] font-mono text-amber-300"
                title="Tournament Coins (Virtual Score Points)"
              >
                <Coins className="w-3 h-3 text-[#FFC837]" />
                <span>{user.wallet_coins.toLocaleString('en-IN')} Coins</span>
              </div>

              {/* Profile button */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg bg-[#151B28] hover:bg-[#1E2536] border border-[#272E3F] text-xs font-semibold text-white transition-colors"
              >
                <div className="w-6 h-6 rounded bg-[#272E3F] flex items-center justify-center text-[#FFC837] font-bold">
                  {user.ign.slice(0, 1)}
                </div>
                <span className="truncate max-w-[90px]">{user.ign}</span>
              </button>

              <button
                onClick={onLogout}
                title="Log Out"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-[#151B28] rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black bg-gradient-to-r from-[#FFC837] to-[#E5A93C] hover:from-[#FFE082] hover:to-[#FFC837] rounded-lg shadow-md shadow-[#FFC837]/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                Sign In / Join
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

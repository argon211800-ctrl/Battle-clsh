/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Tournament, 
  NotificationItem 
} from './types';
import { api, getStoredToken } from './services/api';
import { Navbar } from './components/Navbar';
import { AndroidFrame } from './components/AndroidFrame';
import { TournamentCard } from './components/TournamentCard';
import { TournamentModal } from './components/TournamentModal';
import { RoomDetailsModal } from './components/RoomDetailsModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { LeaderboardView } from './components/LeaderboardView';
import { MatchHistoryView } from './components/MatchHistoryView';
import { AdminDashboard } from './components/AdminDashboard';
import { AndroidApkModal } from './components/AndroidApkModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { WalletModal } from './components/WalletModal';
import { 
  Trophy, 
  Flame, 
  Crosshair, 
  ShieldCheck, 
  Search, 
  Smartphone, 
  Users, 
  Sparkles,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  History,
  Crown,
  Coins
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loadingTournaments, setLoadingTournaments] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState<'tournaments' | 'leaderboard' | 'matches' | 'admin' | 'apk'>('tournaments');
  const [isAndroidFrame, setIsAndroidFrame] = useState(false);

  // Filters for tournaments
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedTournamentForDetail, setSelectedTournamentForDetail] = useState<Tournament | null>(null);
  const [selectedTournamentForRoom, setSelectedTournamentForRoom] = useState<Tournament | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'admin'>('login');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  // Initialize Auth & Data
  const loadUser = () => {
    if (getStoredToken()) {
      api.getMe()
        .then((res) => {
          setCurrentUser(res.user);
        })
        .catch(() => {
          setCurrentUser(null);
        });

      api.getNotifications()
        .then(setNotifications)
        .catch(console.error);
    } else {
      setCurrentUser(null);
    }
  };

  const loadTournaments = () => {
    setLoadingTournaments(true);
    api.getTournaments()
      .then(setTournaments)
      .catch(console.error)
      .finally(() => setLoadingTournaments(false));
  };

  useEffect(() => {
    loadUser();
    loadTournaments();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    loadTournaments();
    if (activeTab === 'matches' || activeTab === 'admin') {
      setActiveTab('tournaments');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
  };

  const handleOpenRoomById = (tournamentId: string) => {
    const t = tournaments.find((item) => item.id === tournamentId);
    if (t) {
      setSelectedTournamentForRoom(t);
    } else {
      api.getTournament(tournamentId).then((res) => {
        setSelectedTournamentForRoom(res);
      }).catch(console.error);
    }
  };

  // Filter tournaments
  const filteredTournaments = tournaments.filter((t) => {
    const matchesMode = selectedMode === 'all' || t.game_mode.toLowerCase() === selectedMode.toLowerCase();
    const matchesStatus = selectedStatus === 'all' || t.status.toLowerCase() === selectedStatus.toLowerCase();
    const matchesSearch = !searchQuery || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.map_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMode && matchesStatus && matchesSearch;
  });

  return (
    <AndroidFrame isActive={isAndroidFrame}>
      <div className="min-h-screen flex flex-col bg-[#0B0E14] text-slate-100">
        
        {/* Navigation Bar */}
        <Navbar
          user={currentUser}
          notifications={notifications}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenAuth={(mode) => {
            setAuthInitialMode(mode || 'login');
            setIsAuthOpen(true);
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenApkModal={() => setIsApkModalOpen(true)}
          onLogout={handleLogout}
          isAndroidFrame={isAndroidFrame}
          onToggleFrame={() => setIsAndroidFrame((prev) => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
          
          {/* TAB 1: TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div className="space-y-8">
              
              {/* Esports Hero Showcase Banner */}
              <div className="relative rounded-3xl overflow-hidden border border-[#272E3F] shadow-2xl bg-[#0E131F]">
                <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                  <img
                    src="/src/assets/images/battleclash_banner_1791955690388.jpg"
                    alt="Free Fire BattleClash Tournament Arena"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Scrim Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0B0E14] via-[#0B0E14]/70 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent" />

                  {/* Hero Text */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 max-w-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded bg-[#FFC837] text-black text-xs font-black uppercase tracking-wider font-display">
                        Official Community Hub
                      </span>
                      <span className="text-xs text-amber-200/90 font-semibold tracking-wide">
                        Free Fire Tournament Circuit
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-display uppercase tracking-wide leading-tight mb-2">
                      Compete. Dominate. <span className="text-gold-gradient">Claim Booyah!</span>
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                      Compete in verified community custom rooms. High-stakes Solo, Duo, and Squad battles with automated Free Fire kill points, secure room credential disclosure, and instant prize payouts.
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          const upcoming = tournaments.find((t) => t.status === 'upcoming');
                          if (upcoming) setSelectedTournamentForDetail(upcoming);
                        }}
                        className="py-2.5 px-5 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#FFC837]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center gap-2"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Join Featured Match</span>
                      </button>

                      <button
                        onClick={() => setIsApkModalOpen(true)}
                        className="py-2.5 px-4 bg-[#141A26]/80 backdrop-blur-md hover:bg-[#1E2536] text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-[#272E3F] hover:border-[#FFC837]/50 transition-all flex items-center gap-1.5"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-[#FFC837]" />
                        <span>Android APK Guide</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Metrics Strip Below Hero */}
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1E2536] bg-[#0E131F] border-t border-[#1E2536]">
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#FFC837] shrink-0">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Prize Pool</span>
                      <span className="font-display text-base font-bold text-white tabular-nums">7,000+ Coins</span>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Crosshair className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Kill Scoring</span>
                      <span className="font-display text-base font-bold text-white tabular-nums">Official FF Standard</span>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Room ID Security</span>
                      <span className="font-display text-base font-bold text-white">Participants Only</span>
                    </div>
                  </div>

                  <div className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Platform</span>
                      <span className="font-display text-base font-bold text-white">Android APK Ready</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tournament Filter Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Game Mode Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#141A26] rounded-xl border border-[#272E3F] overflow-x-auto">
                  <button
                    onClick={() => setSelectedMode('all')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      selectedMode === 'all'
                        ? 'bg-[#FFC837] text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Modes
                  </button>
                  <button
                    onClick={() => setSelectedMode('solo')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      selectedMode === 'solo'
                        ? 'bg-[#FFC837] text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Solo
                  </button>
                  <button
                    onClick={() => setSelectedMode('duo')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      selectedMode === 'duo'
                        ? 'bg-[#FFC837] text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Duo
                  </button>
                  <button
                    onClick={() => setSelectedMode('squad')}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap shrink-0 ${
                      selectedMode === 'squad'
                        ? 'bg-[#FFC837] text-black shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Squad
                  </button>
                </div>

                {/* Status & Search */}
                <div className="flex items-center gap-2.5 flex-1 md:max-w-md">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 bg-[#141A26] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837] shrink-0"
                  >
                    <option value="all">All Status</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Live Battle</option>
                    <option value="completed">Completed</option>
                  </select>

                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tournament or map..."
                      className="w-full pl-9 pr-3 py-2 bg-[#141A26] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
                    />
                  </div>
                </div>
              </div>

              {/* Tournament Grid */}
              {loadingTournaments ? (
                <div className="py-24 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#FFC837] border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold uppercase tracking-wider">Loading Live Tournament Brackets...</span>
                </div>
              ) : filteredTournaments.length === 0 ? (
                <div className="p-12 text-center bg-[#111622] rounded-3xl border border-[#1E2536]">
                  <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-white mb-1">No Tournaments Match Your Filters</h3>
                  <p className="text-xs text-slate-400 mb-4">Try clearing the search query or switching game modes.</p>
                  <button
                    onClick={() => { setSelectedMode('all'); setSelectedStatus('all'); setSearchQuery(''); }}
                    className="px-4 py-2 text-xs font-semibold text-black bg-[#FFC837] rounded-xl hover:brightness-110"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTournaments.map((t) => (
                    <TournamentCard
                      key={t.id}
                      tournament={t}
                      onViewDetails={(selected) => setSelectedTournamentForDetail(selected)}
                      onOpenRoom={(selected) => setSelectedTournamentForRoom(selected)}
                      onRegister={(selected) => {
                        if (!currentUser) {
                          setIsAuthOpen(true);
                        } else {
                          setSelectedTournamentForDetail(selected);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <LeaderboardView
              tournaments={tournaments}
              onSelectTournament={(t) => setSelectedTournamentForDetail(t)}
            />
          )}

          {/* TAB 3: MATCH HISTORY */}
          {activeTab === 'matches' && (
            <MatchHistoryView
              onOpenRoomById={handleOpenRoomById}
              onExploreTournaments={() => setActiveTab('tournaments')}
            />
          )}

          {/* TAB 4: ADMIN CONSOLE */}
          {activeTab === 'admin' && (
            <AdminDashboard
              tournaments={tournaments}
              onRefreshTournaments={loadTournaments}
            />
          )}
        </main>

        {/* Mobile Fixed Bottom Navigation Bar (Touch ergonomics) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-t border-[#1E2536] px-2 py-1">
          <div className="grid grid-cols-5 items-center h-14">
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === 'tournaments' ? 'text-[#FFC837]' : 'text-slate-400'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-tight">Tourneys</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === 'leaderboard' ? 'text-[#FFC837]' : 'text-slate-400'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-tight">Rankings</span>
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  setActiveTab('matches');
                } else {
                  setAuthInitialMode('login');
                  setIsAuthOpen(true);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 ${
                activeTab === 'matches' ? 'text-[#FFC837]' : 'text-slate-400'
              }`}
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-tight">Matches</span>
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  setIsWalletOpen(true);
                } else {
                  setAuthInitialMode('login');
                  setIsAuthOpen(true);
                }
              }}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-amber-300"
            >
              <Coins className="w-4 h-4 text-[#FFC837]" />
              <span className="text-[10px] font-semibold tracking-tight">Wallet</span>
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  setIsProfileOpen(true);
                } else {
                  setAuthInitialMode('login');
                  setIsAuthOpen(true);
                }
              }}
              className="flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white"
            >
              <Users className="w-4 h-4" />
              <span className="text-[10px] font-semibold tracking-tight">
                {currentUser ? 'Profile' : 'Sign In'}
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#1E2536] bg-[#080B10] py-6 px-4 sm:px-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white uppercase tracking-wider">
                Battle<span className="text-[#FFC837]">Clash</span>
              </span>
              <span>· Free Fire Community Esports</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>Node 22 SQLite3 Storage</span>
              <span>·</span>
              <button onClick={() => setIsApkModalOpen(true)} className="hover:text-[#FFC837] transition-colors">
                Capacitor Android APK Packaging
              </button>
            </div>
          </div>
        </footer>

        {/* Modals */}
        <TournamentModal
          tournament={selectedTournamentForDetail}
          currentUser={currentUser}
          onClose={() => setSelectedTournamentForDetail(null)}
          onOpenRoom={(t) => setSelectedTournamentForRoom(t)}
          onOpenAuth={() => {
            setAuthInitialMode('login');
            setIsAuthOpen(true);
          }}
          onRegistrationSuccess={() => {
            loadTournaments();
            loadUser();
          }}
          onOpenWallet={() => setIsWalletOpen(true)}
        />

        <RoomDetailsModal
          tournament={selectedTournamentForRoom}
          onClose={() => setSelectedTournamentForRoom(null)}
          onOpenAuth={() => {
            setAuthInitialMode('login');
            setIsAuthOpen(true);
          }}
        />

        <AuthModal
          isOpen={isAuthOpen}
          initialMode={authInitialMode}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user);
            loadTournaments();
            loadUser();
          }}
        />

        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onOpenWallet={() => setIsWalletOpen(true)}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            loadTournaments();
          }}
        />

        <WalletModal
          isOpen={isWalletOpen}
          onClose={() => setIsWalletOpen(false)}
          currentUser={currentUser}
          onBalanceUpdated={() => {
            loadUser();
          }}
        />

        <AndroidApkModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
        />

        <NotificationDrawer
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onOpenRoomById={handleOpenRoomById}
        />
      </div>
    </AndroidFrame>
  );
}

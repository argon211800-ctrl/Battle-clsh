import React, { useState, useEffect } from 'react';
import { PlayerMatchRecord, Tournament } from '../types';
import { api } from '../services/api';
import { 
  History, 
  Trophy, 
  Crosshair, 
  Calendar, 
  Key, 
  MapPin, 
  Coins, 
  Crown,
  ChevronRight
} from 'lucide-react';

interface MatchHistoryViewProps {
  onOpenRoomById: (tournamentId: string) => void;
  onExploreTournaments: () => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({
  onOpenRoomById,
  onExploreTournaments,
}) => {
  const [matches, setMatches] = useState<PlayerMatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPlayerMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1E2536] pb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
          <History className="w-6 h-6 text-[#FFC837]" />
          <span>My Tournament Battle Log</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Historical record of all Free Fire tournaments joined, verified kills, placements, and prize payouts.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#FFC837] border-t-transparent rounded-full animate-spin" />
          <span>Loading battle history...</span>
        </div>
      ) : matches.length === 0 ? (
        <div className="p-12 text-center bg-[#111622] rounded-3xl border border-[#1E2536]">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Tournament Matches Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            You haven't participated in any tournaments yet. Join an open custom room tournament to start building your career stats!
          </p>
          <button
            onClick={onExploreTournaments}
            className="px-5 py-2.5 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md hover:brightness-110 transition-all inline-flex items-center gap-1.5"
          >
            <span>Browse Active Tournaments</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {matches.map((m) => {
            const isCompleted = m.tournament_status === 'completed';
            const isBooyah = m.placement === 1;

            return (
              <div
                key={m.tournament_id}
                className="p-4 bg-[#111622] rounded-2xl border border-[#1E2536] hover:border-[#FFC837]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left details */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-[#FFC837]/20 border border-[#FFC837]/40 text-xs font-bold text-[#FFC837] uppercase font-display">
                      {m.game_mode}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/40 text-[11px] font-medium text-slate-300 border border-white/5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#FFC837]" />
                      {m.map_name}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-400">
                      {new Date(m.scheduled_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#1C2436] text-[10px] text-slate-300 font-mono">
                      Slot #{m.slot_number}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                    {m.title}
                  </h3>
                </div>

                {/* Performance or Status */}
                <div className="flex items-center gap-4 flex-wrap">
                  {isCompleted && m.placement ? (
                    <div className="flex items-center gap-3 bg-[#0C101A] px-3.5 py-2 rounded-xl border border-[#1E2536] text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-500 block">Placement</span>
                        <div className="font-bold flex items-center gap-1 text-white">
                          {isBooyah ? (
                            <span className="text-[#FFC837] flex items-center gap-0.5">
                              <Crown className="w-3.5 h-3.5" /> Booyah (#1)
                            </span>
                          ) : (
                            `#${m.placement}`
                          )}
                        </div>
                      </div>

                      <div className="border-l border-[#1E2536] pl-3">
                        <span className="text-[10px] uppercase text-slate-500 block">Kills</span>
                        <div className="font-bold text-red-400 flex items-center gap-0.5">
                          <Crosshair className="w-3 h-3" />
                          <span>{m.kills || 0}</span>
                        </div>
                      </div>

                      <div className="border-l border-[#1E2536] pl-3">
                        <span className="text-[10px] uppercase text-slate-500 block">Total Pts</span>
                        <div className="font-display font-bold text-[#FFC837] text-sm">
                          {m.total_points || 0}
                        </div>
                      </div>

                      {m.prize_won && m.prize_won > 0 ? (
                        <div className="border-l border-[#1E2536] pl-3">
                          <span className="text-[10px] uppercase text-slate-500 block">Cash Won</span>
                          <div className="font-bold text-amber-300">
                            +₹{m.prize_won}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                        Upcoming Match
                      </span>
                      <button
                        onClick={() => onOpenRoomById(m.tournament_id)}
                        className="py-1.5 px-3 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow hover:brightness-110 transition-all flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Room Details</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Tournament, MatchResult, GlobalLeaderboardPlayer } from '../types';
import { api } from '../services/api';
import { 
  Trophy, 
  Crown, 
  Crosshair, 
  Medal, 
  Flame, 
  Coins, 
  ChevronDown, 
  Filter,
  CheckCircle2
} from 'lucide-react';

interface LeaderboardViewProps {
  tournaments: Tournament[];
  onSelectTournament: (t: Tournament) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  tournaments,
  onSelectTournament,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tournament' | 'global'>('tournament');
  
  // Completed or selected tournament
  const completedOrFirst = tournaments.find((t) => t.status === 'completed') || tournaments[0];
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(completedOrFirst?.id || '');

  const [tourneyResults, setTourneyResults] = useState<MatchResult[]>([]);
  const [scoringRules, setScoringRules] = useState<any>(null);
  const [globalPlayers, setGlobalPlayers] = useState<GlobalLeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'tournament' && selectedTourneyId) {
      setLoading(true);
      api.getTournamentLeaderboard(selectedTourneyId)
        .then((res) => {
          setTourneyResults(res.results);
          setScoringRules(res.scoringRules);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (activeSubTab === 'global') {
      setLoading(true);
      api.getGlobalLeaderboard()
        .then((res) => {
          setGlobalPlayers(res);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeSubTab, selectedTourneyId]);

  const activeTourney = tournaments.find((t) => t.id === selectedTourneyId);

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2536] pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display uppercase tracking-wide flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#FFC837]" />
            <span>Tournament Leaderboards</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified Free Fire scoring: Placement Points (Booyah = 12 pts) + Kill Points (1 pt/kill)
          </p>
        </div>

        {/* Segmented Sub Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#141A26] rounded-xl border border-[#272E3F] shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('tournament')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'tournament'
                ? 'bg-[#FFC837] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Match Standings
          </button>
          <button
            onClick={() => setActiveSubTab('global')}
            className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeSubTab === 'global'
                ? 'bg-[#FFC837] text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hall of Fame
          </button>
        </div>
      </div>

      {activeSubTab === 'tournament' ? (
        <div className="space-y-4">
          {/* Tournament Selector Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#131926] rounded-2xl border border-[#222A3B]">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#FFC837]" />
              <span className="text-xs font-semibold text-slate-300">Select Tournament:</span>
            </div>

            <select
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
              className="px-3 py-1.5 bg-[#0C101A] border border-[#272E3F] rounded-xl text-xs text-white focus:outline-none focus:border-[#FFC837]"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Scoring System Reference Banner */}
          <div className="p-3 bg-[#111724] rounded-xl border border-[#1E2536] text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FFC837] font-display uppercase">Free Fire Scoring:</span>
              <span>1st (Booyah) = 12 pts</span>
              <span>·</span>
              <span>2nd = 9 pts</span>
              <span>·</span>
              <span>3rd = 8 pts</span>
              <span>·</span>
              <span>4th = 7 pts</span>
            </div>
            <div className="flex items-center gap-2 text-red-400 font-medium">
              <Crosshair className="w-3.5 h-3.5" />
              <span>+{activeTourney?.per_kill_pts || 1} pt per kill</span>
            </div>
          </div>

          {/* Standings Table */}
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-[#FFC837] border-t-transparent rounded-full animate-spin" />
              <span>Loading match standings...</span>
            </div>
          ) : tourneyResults.length === 0 ? (
            <div className="p-8 text-center bg-[#111622] rounded-2xl border border-[#1E2536] text-slate-400 text-xs">
              <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-white mb-1">Results Pending Verification</p>
              <p>Match is either currently in progress or the Tournament Marshal has not finalized points yet.</p>
            </div>
          ) : (
            <div className="bg-[#111622] rounded-2xl border border-[#1E2536] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Player / Squad</th>
                      <th className="py-3 px-4 text-center">Free Fire UID</th>
                      <th className="py-3 px-4 text-center">Placement</th>
                      <th className="py-3 px-4 text-center">Kills</th>
                      <th className="py-3 px-4 text-center">Placement Pts</th>
                      <th className="py-3 px-4 text-center">Kill Pts</th>
                      <th className="py-3 px-4 text-center font-bold text-[#FFC837]">Total Points</th>
                      <th className="py-3 px-4 text-right">Prize Won</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2233]">
                    {tourneyResults.map((r, index) => {
                      const isBooyah = r.placement === 1;
                      const isTop3 = r.placement <= 3;

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-[#151D2D] transition-colors ${
                            isBooyah ? 'bg-[#FFC837]/5' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isBooyah ? (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FFC837] to-[#B8860B] flex items-center justify-center text-black font-black text-xs shadow-md shadow-[#FFC837]/30">
                                  <Crown className="w-3.5 h-3.5" />
                                </div>
                              ) : r.placement === 2 ? (
                                <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-black font-black text-xs">
                                  2
                                </div>
                              ) : r.placement === 3 ? (
                                <div className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center text-white font-black text-xs">
                                  3
                                </div>
                              ) : (
                                <span className="w-6 text-center font-mono text-slate-400 tabular-nums">
                                  #{index + 1}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Player */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white tracking-wide">
                                {r.ign}
                              </span>
                              {isBooyah && (
                                <span className="px-1.5 py-0.5 rounded bg-[#FFC837]/20 border border-[#FFC837]/40 text-[9px] font-bold text-[#FFC837] uppercase">
                                  Booyah!
                                </span>
                              )}
                              {r.team_name && (
                                <span className="text-slate-400 text-[11px]">
                                  [{r.team_name}]
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Free Fire UID */}
                          <td className="py-3 px-4 text-center font-mono text-slate-400 tabular-nums whitespace-nowrap">
                            {r.ff_uid}
                          </td>

                          {/* Placement */}
                          <td className="py-3 px-4 text-center font-semibold text-slate-200 tabular-nums whitespace-nowrap">
                            #{r.placement}
                          </td>

                          {/* Kills */}
                          <td className="py-3 px-4 text-center font-bold text-red-400 tabular-nums whitespace-nowrap">
                            {r.kills}
                          </td>

                          {/* Placement Points */}
                          <td className="py-3 px-4 text-center font-mono text-slate-300 tabular-nums whitespace-nowrap">
                            {r.placement_points}
                          </td>

                          {/* Kill Points */}
                          <td className="py-3 px-4 text-center font-mono text-slate-300 tabular-nums whitespace-nowrap">
                            {r.kill_points}
                          </td>

                          {/* Total Points */}
                          <td className="py-3 px-4 text-center font-display text-base font-bold text-[#FFC837] tabular-nums whitespace-nowrap">
                            {r.total_points}
                          </td>

                          {/* Prize */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {r.prize_won > 0 ? (
                              <span className="font-bold text-amber-300 tabular-nums">
                                +₹{r.prize_won}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Global Hall of Fame */
        <div className="space-y-4">
          <div className="bg-[#111622] rounded-2xl border border-[#1E2536] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C101A] border-b border-[#1E2536] text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Standing</th>
                    <th className="py-3 px-4">Player IGN</th>
                    <th className="py-3 px-4 text-center">Free Fire UID</th>
                    <th className="py-3 px-4 text-center">Rank Tier</th>
                    <th className="py-3 px-4 text-center">Guild</th>
                    <th className="py-3 px-4 text-center">Matches</th>
                    <th className="py-3 px-4 text-center">Kills</th>
                    <th className="py-3 px-4 text-center">Booyahs</th>
                    <th className="py-3 px-4 text-center font-bold text-[#FFC837]">Total Points</th>
                    <th className="py-3 px-4 text-right">Prize Earnings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A2233]">
                  {globalPlayers.map((player, idx) => (
                    <tr key={player.id} className="hover:bg-[#151D2D] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300 tabular-nums whitespace-nowrap">
                        {idx === 0 ? (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FFC837] to-[#B8860B] flex items-center justify-center text-black font-black text-xs">
                            <Crown className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          `#${idx + 1}`
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {player.ign}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400 tabular-nums whitespace-nowrap">
                        {player.ff_uid}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-amber-300 text-[10px] font-semibold">
                          {player.rank_tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400 whitespace-nowrap">
                        {player.guild || 'None'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300 tabular-nums whitespace-nowrap">
                        {player.tournaments_played}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-400 tabular-nums whitespace-nowrap">
                        {player.total_kills}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#FFC837] tabular-nums whitespace-nowrap">
                        {player.booyahs}
                      </td>
                      <td className="py-3 px-4 text-center font-display text-base font-bold text-[#FFC837] tabular-nums whitespace-nowrap">
                        {player.total_points}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-300 tabular-nums whitespace-nowrap">
                        ₹{player.total_earnings.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Tournament } from '../types';
import { 
  Trophy, 
  Users, 
  MapPin, 
  Clock, 
  Key, 
  Coins, 
  Crosshair, 
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface TournamentCardProps {
  tournament: Tournament;
  onViewDetails: (t: Tournament) => void;
  onOpenRoom: (t: Tournament) => void;
  onRegister: (t: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onViewDetails,
  onOpenRoom,
  onRegister,
}) => {
  const isUpcoming = tournament.status === 'upcoming';
  const isCompleted = tournament.status === 'completed';
  const isOngoing = tournament.status === 'ongoing';

  const scheduledDate = new Date(tournament.scheduled_at);
  const formattedDate = scheduledDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  const slotsPercent = Math.min(100, Math.round((tournament.registered_count / tournament.total_slots) * 100));

  return (
    <div className="group relative bg-[#111622] rounded-2xl border border-[#1E2536] hover:border-[#FFC837]/40 transition-all duration-300 overflow-hidden flex flex-col shadow-lg shadow-black/40">
      
      {/* Banner / Map artwork container */}
      <div className="relative h-44 w-full overflow-hidden bg-[#0B0E14]">
        {tournament.banner_url ? (
          <img
            src={tournament.banner_url}
            alt={tournament.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1C2230] to-[#0B0E14] flex items-center justify-center">
            <Trophy className="w-12 h-12 text-[#FFC837]/40" />
          </div>
        )}

        {/* Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111622] via-[#111622]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Game Mode & Map */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-black/75 backdrop-blur-md border border-[#FFC837]/30 text-xs font-bold text-[#FFC837] tracking-wider uppercase font-display">
              {tournament.game_mode}
            </span>
            <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[11px] font-medium text-slate-300 flex items-center gap-1 border border-white/10">
              <MapPin className="w-3 h-3 text-[#FFC837]" />
              {tournament.map_name}
            </span>
          </div>

          {/* Status */}
          {isOngoing && (
            <span className="px-2.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              Live Battle
            </span>
          )}
          {isCompleted && (
            <span className="px-2.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium uppercase tracking-wider">
              Completed
            </span>
          )}
          {isUpcoming && tournament.isUserRegistered && (
            <span className="px-2.5 py-0.5 rounded bg-[#FFC837]/20 border border-[#FFC837]/60 text-[#FFC837] text-xs font-semibold tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Registered
            </span>
          )}
        </div>

        {/* Bottom banner info overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/5">
            <Clock className="w-3.5 h-3.5 text-[#FFC837]" />
            <span>{formattedDate} · {formattedTime}</span>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cash Prize Pool</div>
            <div className="font-display text-lg font-bold text-[#FFC837] tracking-tight">
              ₹{tournament.prize_pool.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 
            onClick={() => onViewDetails(tournament)}
            className="text-base font-bold text-white hover:text-[#FFC837] transition-colors cursor-pointer line-clamp-1 mb-2 font-display tracking-wide uppercase"
          >
            {tournament.title}
          </h3>

          {/* Quick specs grid */}
          <div className="grid grid-cols-3 gap-2 py-2 mb-3 border-y border-[#1E2536] text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Entry Fee</span>
              <span className="font-semibold text-emerald-400">
                {tournament.entry_fee === 0 ? 'FREE' : `₹${tournament.entry_fee}`}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">1st Prize</span>
              <span className="font-semibold text-[#FFC837]">
                ₹{tournament.first_prize.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block">Kill Points</span>
              <span className="font-semibold text-slate-200 flex items-center gap-0.5">
                <Crosshair className="w-3 h-3 text-red-400" />
                +{tournament.per_kill_pts} pt
              </span>
            </div>
          </div>

          {/* Slots Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Slots Filled</span>
              </span>
              <span className="font-semibold text-slate-200 tabular-nums">
                {tournament.registered_count} / {tournament.total_slots}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#1B2232] rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  slotsPercent >= 100 
                    ? 'bg-rose-500' 
                    : slotsPercent >= 75 
                    ? 'bg-amber-400' 
                    : 'bg-[#FFC837]'
                }`}
                style={{ width: `${slotsPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2 pt-1">
          {tournament.isUserRegistered ? (
            <button
              onClick={() => onOpenRoom(tournament)}
              className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#FFC837]/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Room Details</span>
            </button>
          ) : isCompleted ? (
            <button
              onClick={() => onViewDetails(tournament)}
              className="flex-1 py-2.5 px-3 bg-[#1B2232] hover:bg-[#252E42] text-slate-200 font-semibold text-xs uppercase tracking-wider rounded-xl border border-[#272E3F] transition-all flex items-center justify-center gap-1"
            >
              <Trophy className="w-3.5 h-3.5 text-[#FFC837]" />
              <span>Match Standings</span>
            </button>
          ) : tournament.isFull ? (
            <button
              disabled
              className="flex-1 py-2.5 px-3 bg-[#181F2C] text-slate-500 font-semibold text-xs uppercase tracking-wider rounded-xl cursor-not-allowed border border-[#232B3C]"
            >
              Slots Full
            </button>
          ) : (
            <button
              onClick={() => onRegister(tournament)}
              className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#FFC837] to-[#E5A93C] hover:from-[#FFE082] hover:to-[#FFC837] text-black font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-[#FFC837]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1"
            >
              <span>Register Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onViewDetails(tournament)}
            title="View Details"
            className="p-2.5 bg-[#171D2B] hover:bg-[#20283A] text-slate-400 hover:text-white rounded-xl border border-[#242D3F] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

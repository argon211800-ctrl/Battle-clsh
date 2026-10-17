import React, { useState, useEffect } from 'react';
import { Tournament, RoomDetailsResponse } from '../types';
import { api } from '../services/api';
import { 
  Key, 
  Lock, 
  Copy, 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';

interface RoomDetailsModalProps {
  tournament: Tournament | null;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  tournament,
  onClose,
  onOpenAuth,
}) => {
  const [data, setData] = useState<RoomDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  useEffect(() => {
    if (!tournament) return;
    setLoading(true);
    setError(null);

    api.getRoomDetails(tournament.id)
      .then((res) => {
        setData(res);
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to retrieve room credentials');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [tournament]);

  if (!tournament) return null;

  const copyToClipboard = (text: string, type: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F141F] border border-[#272E3F] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#1E2536] flex items-center justify-between bg-gradient-to-r from-[#141A26] to-[#0F141F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC837]/10 border border-[#FFC837]/30 flex items-center justify-center text-[#FFC837]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display tracking-wide uppercase">
                Custom Room Credentials
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">
                {tournament.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-[#FFC837] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs uppercase tracking-wider font-semibold">Verifying Participant Clearance...</span>
            </div>
          ) : error || !data?.authorized ? (
            /* Restricted state: Player not registered */
            <div className="py-6 px-4 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Participant Clearance Required</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                {error || data?.error || 'Custom Room ID & Password are strictly encrypted and disclosed only to confirmed registered players.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1B2232] rounded-xl border border-[#272E3F]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-5 py-2 text-xs font-bold text-black bg-[#FFC837] rounded-xl hover:brightness-110 uppercase tracking-wider"
                >
                  Sign In / Register
                </button>
              </div>
            </div>
          ) : data.roomStatus === 'pending' ? (
            /* Pending publication state */
            <div className="py-6 px-4 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 font-display uppercase tracking-wide">
                Room Opening Soon
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                {data.message}
              </p>
              <div className="p-3 bg-[#141A26] rounded-xl border border-[#202738] text-xs text-slate-300 w-full mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Match Schedule:</span>
                  <span className="font-semibold text-white">
                    {new Date(tournament.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Your Assigned Slot:</span>
                  <span className="font-semibold text-[#FFC837]">Slot #{data.slotNumber || 1}</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>You will receive an in-app alert the moment credentials drop.</span>
              </div>
            </div>
          ) : (
            /* Published Room Credentials */
            <div className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold">Participant Verified · Credentials Active</span>
                </div>
                <span className="font-bold text-[#FFC837]">Slot #{data.slotNumber}</span>
              </div>

              {/* Room ID and Password Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Room ID */}
                <div className="p-4 bg-[#141A26] rounded-2xl border border-[#272E3F] flex flex-col justify-between">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                    Free Fire Room ID
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-white tracking-wider">
                      {data.roomId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(data.roomId || '', 'id')}
                      className="p-2 bg-[#1F2739] hover:bg-[#2B354C] rounded-lg text-slate-200 hover:text-[#FFC837] transition-colors"
                      title="Copy Room ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password */}
                <div className="p-4 bg-[#141A26] rounded-2xl border border-[#272E3F] flex flex-col justify-between">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                    Room Password
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-[#FFC837] tracking-wider">
                      {data.roomPassword}
                    </span>
                    <button
                      onClick={() => copyToClipboard(data.roomPassword || '', 'pass')}
                      className="p-2 bg-[#1F2739] hover:bg-[#2B354C] rounded-lg text-slate-200 hover:text-[#FFC837] transition-colors"
                      title="Copy Password"
                    >
                      {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-[#111724] rounded-2xl border border-[#1E2536]">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 font-display">
                  How to Join Free Fire Custom Match
                </h4>
                <ol className="space-y-2 text-xs text-slate-300">
                  {data.instructions?.map((inst, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#1F2739] text-[#FFC837] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Fair Play Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200/90">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Do NOT share room details outside BattleClash. Sharing credentials leads to immediate disqualification and account ban.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2536] bg-[#0C101A] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#1B2232] hover:bg-[#252E42] rounded-xl border border-[#272E3F] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

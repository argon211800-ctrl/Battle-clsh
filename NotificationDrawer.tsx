import React from 'react';
import { NotificationItem } from '../types';
import { Bell, Key, Trophy, Coins, X, Check, ArrowRight } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onOpenRoomById: (tournamentId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onOpenRoomById,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm h-full bg-[#0F141F] border-l border-[#272E3F] shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-[#1E2536] flex items-center justify-between bg-[#141A26]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FFC837]" />
            <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">
              Alerts & Notifications
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => {
              const isRoom = n.type === 'room_credentials';
              const isWallet = n.type === 'wallet';

              return (
                <div
                  key={n.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    n.is_read
                      ? 'bg-[#121724] border-[#1C2333] opacity-80'
                      : 'bg-[#151D2C] border-[#FFC837]/30 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      {isRoom ? (
                        <Key className="w-3.5 h-3.5 text-[#FFC837]" />
                      ) : isWallet ? (
                        <Coins className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <Trophy className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <h4 className="text-xs font-bold text-white font-display uppercase">
                        {n.title}
                      </h4>
                    </div>

                    {!n.is_read && (
                      <button
                        onClick={() => onMarkRead(n.id)}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1F2739]">
                    <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                    {isRoom && n.tournament_id && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenRoomById(n.tournament_id!);
                        }}
                        className="text-[#FFC837] font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>Open Room</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

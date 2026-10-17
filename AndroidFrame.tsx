import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface AndroidFrameProps {
  children: React.ReactNode;
  isActive: boolean;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({ children, isActive }) => {
  if (!isActive) {
    return <div className="min-h-screen flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#07090D] py-4 sm:py-8 px-2 flex flex-col items-center justify-start overflow-y-auto">
      {/* Device wrapper */}
      <div className="w-full max-w-[430px] bg-[#0B0E14] border-[10px] border-[#1C2230] rounded-[48px] shadow-2xl shadow-black/80 overflow-hidden flex flex-col relative my-auto ring-1 ring-white/10 min-h-[860px]">
        
        {/* Android Status Bar */}
        <div className="h-9 bg-[#0B0E14] px-6 flex items-center justify-between text-[11px] text-slate-300 select-none z-50 shrink-0 border-b border-[#1A202C]/60">
          <div className="font-semibold tracking-wide">12:45</div>

          {/* Front camera hole punch */}
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-[#272E3F]/80 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#111622]" />
          </div>

          <div className="flex items-center gap-1.5">
            <Signal className="w-3 h-3 text-slate-400" />
            <Wifi className="w-3 h-3 text-slate-400" />
            <BatteryMedium className="w-3.5 h-3.5 text-[#FFC837]" />
          </div>
        </div>

        {/* Device screen content */}
        <div className="flex-1 flex flex-col overflow-y-auto relative bg-[#0B0E14]">
          {children}
        </div>

        {/* Android Gesture Bar */}
        <div className="h-6 bg-[#0B0E14] flex items-center justify-center shrink-0 border-t border-[#1A202C]/40">
          <div className="w-32 h-1 bg-slate-600 rounded-full" />
        </div>
      </div>

      <div className="mt-3 text-center text-xs text-slate-400">
        Android Frame Simulation Mode · Ready for Capacitor APK Packaging
      </div>
    </div>
  );
};

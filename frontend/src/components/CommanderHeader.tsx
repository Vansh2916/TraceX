import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Activity,
  Sparkles,
  Volume2,
  VolumeX,
  Smartphone,
  Shield,
  Zap,
} from 'lucide-react';

interface CommanderHeaderProps {
  onSearchPlate: (plate: string) => void;
  onOpenNotifications: () => void;
  alertCount: number;
  isLive: boolean;
  isJudgeBarOpen?: boolean;
  onToggleJudgeBar?: () => void;
  isAudioEnabled?: boolean;
  onToggleAudio?: () => void;
  onOpenCitizenPWA?: () => void;
}

export const CommanderHeader: React.FC<CommanderHeaderProps> = ({
  onSearchPlate,
  onOpenNotifications,
  alertCount,
  isLive,
  isJudgeBarOpen = true,
  onToggleJudgeBar,
  isAudioEnabled = true,
  onToggleAudio,
  onOpenCitizenPWA,
}) => {
  const [searchInput, setSearchInput] = useState('');

  // Keyboard shortcut ⌘ K or Ctrl K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('commander-plate-search');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchPlate(searchInput.trim().toUpperCase());
    }
  };

  return (
    <header className="h-[62px] px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between select-none z-20">
      {/* Left Title & Status */}
      <div className="flex items-center space-x-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
              Command Center
            </h2>
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              DELHI POLICE INTELLIGENCE
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">
            Real-time trajectory tracking & optical ANPR surveillance
          </p>
        </div>
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex items-center w-[360px] bg-slate-50 border border-slate-200 rounded-full px-3.5 py-1.5 shadow-xs hover:border-slate-300 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            id="commander-plate-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search license plate (e.g. DL8CAF2381)..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center space-x-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white rounded border border-slate-200 shrink-0">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </form>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center space-x-2.5">
        {/* Toggle Judge Demo Bar */}
        {onToggleJudgeBar && (
          <button
            onClick={onToggleJudgeBar}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
              isJudgeBarOpen
                ? 'bg-amber-500 text-slate-950 border border-amber-400 font-black'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
            }`}
            title="Toggle Hackathon Judge Quick-Demo Bar"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Judge Demo Bar</span>
          </button>
        )}

        {/* Citizen PWA Button */}
        {onOpenCitizenPWA && (
          <button
            onClick={onOpenCitizenPWA}
            className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            title="Citizen Incident Portal PWA"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Report Incident</span>
          </button>
        )}

        {/* Audio Toggle */}
        {onToggleAudio && (
          <button
            onClick={onToggleAudio}
            className={`p-2 rounded-full border transition cursor-pointer ${
              isAudioEnabled
                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={isAudioEnabled ? 'Tactical Audio Alert Active' : 'Audio Muted'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        )}

        {/* Live WebSocket Status Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono tracking-wider font-bold">
            {isLive ? 'NETWORK LIVE' : 'CONNECTING...'}
          </span>
        </div>

        {/* Priority Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white border border-slate-200/60 hover:border-slate-300 transition-all shadow-xs cursor-pointer"
          title="Recent Intelligence Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs animate-bounce">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Commander Profile */}
        <div
          className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer hover:opacity-90 transition"
          title="Superintendent of Police (Command Terminal)"
        >
          SP
        </div>
      </div>
    </header>
  );
};

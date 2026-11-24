import React, { useState, useEffect } from 'react';
import { Search, Bell, Activity } from 'lucide-react';

interface CommanderHeaderProps {
  onSearchPlate: (plate: string) => void;
  onOpenNotifications: () => void;
  alertCount: number;
  isLive: boolean;
}

export const CommanderHeader: React.FC<CommanderHeaderProps> = ({
  onSearchPlate,
  onOpenNotifications,
  alertCount,
  isLive,
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
    <header className="h-[60px] px-6 bg-transparent flex items-center justify-between select-none">
      {/* Left Title & Subtitle */}
      <div>
        <h2 className="text-[19px] font-bold text-slate-800 tracking-tight leading-snug">
          Welcome back, Commander
        </h2>
        <p className="text-[11.5px] font-medium text-slate-400">
          Real-time vehicle intelligence across Delhi NCR
        </p>
      </div>

      {/* Center Search Input */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex items-center w-[360px] bg-white border border-slate-200/90 rounded-full px-3.5 py-1.5 shadow-sm hover:border-slate-300 transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          <input
            id="commander-plate-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by Plate (e.g. DL8CAF2381)..."
            className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none font-medium"
          />
          <kbd className="hidden sm:inline-flex items-center space-x-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 rounded border border-slate-200 shrink-0">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </form>

      {/* Right User & Status Badges */}
      <div className="flex items-center space-x-3.5">
        {/* Live Indicator */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200/70 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] tracking-wide">Live</span>
        </div>

        {/* Notifications Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 transition-all shadow-xs"
          title="Recent Intelligence Alerts"
        >
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute 0 top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* Profile Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm cursor-pointer hover:bg-blue-700 transition"
          title="Commander Profile"
        >
          D
        </div>
      </div>
    </header>
  );
};

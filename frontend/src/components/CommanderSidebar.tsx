import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  Search,
  Route,
  Car,
  Scale,
  Video,
  BarChart3,
  Settings,
  Shield
} from 'lucide-react';

interface CommanderSidebarProps {
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onOpenConsecutiveTracker: () => void;
  feedStatus?: 'live' | 'demo' | 'degraded' | 'offline' | 'connecting';
  lastSyncedAt?: Date | null;
}

export const CommanderSidebar: React.FC<CommanderSidebarProps> = ({
  activeNav,
  onSelectNav,
  onOpenConsecutiveTracker,
  feedStatus = 'demo',
  lastSyncedAt = null,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live_map', label: 'Live Map', icon: MapPin },
    { id: 'vehicle_search', label: 'Vehicle Search', icon: Search },
    { id: 'trajectories', label: 'Trajectories', icon: Route },
    { id: 'convoy_intelligence', label: 'Convoy Intelligence', icon: Car },
    { id: 'camera_network', label: 'Camera Network', icon: Video },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-[210px] shrink-0 h-full bg-white border-r border-slate-200/90 flex flex-col justify-between select-none">
      {/* Top Header Logo */}
      <div>
        <div className="px-5 pt-4 pb-4">
          <div className="flex items-center space-x-2.5">
            {/* TraceX Shield Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
                TraceX
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                ANPR Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectNav(item.id);
                }}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Feed Status Panel */}
      <div className="p-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 space-y-2 shadow-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">System State</span>
            {feedStatus === 'live' ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                LIVE
              </span>
            ) : feedStatus === 'demo' ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />
                DEMO
              </span>
            ) : feedStatus === 'degraded' ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-yellow-50 text-yellow-800 border border-yellow-300">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1" />
                DEGRADED
              </span>
            ) : feedStatus === 'connecting' ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-300">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse mr-1" />
                CONNECTING
              </span>
            ) : (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" />
                OFFLINE
              </span>
            )}
          </div>
          <div className="text-[10.5px] text-slate-500 font-mono flex items-center justify-between pt-0.5 border-t border-slate-200/60">
            <span>Sync:</span>
            <span className="text-slate-700 font-medium">
              {lastSyncedAt ? (
                `Last synced ${lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              ) : (
                'Awaiting first sync.'
              )}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

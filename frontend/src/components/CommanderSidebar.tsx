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
  onOpenLiveVehiclesDB: () => void;
  onOpenConsecutiveTracker: () => void;
}

export const CommanderSidebar: React.FC<CommanderSidebarProps> = ({
  activeNav,
  onSelectNav,
  onOpenLiveVehiclesDB,
  onOpenConsecutiveTracker,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'live_map', label: 'Live Map', icon: MapPin },
    { id: 'vehicle_search', label: 'Vehicle Search', icon: Search },
    { id: 'trajectories', label: 'Trajectories', icon: Route },
    { id: 'convoy_intelligence', label: 'Convoy Intelligence', icon: Car },
    { id: 'alibi_verification', label: 'Alibi Verification', icon: Scale },
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
            {/* Crusaders Shield Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
                Crusaders
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

      {/* Bottom India Gate Banner */}
      <div className="p-3">
        <div className="relative rounded-xl overflow-hidden shadow-sm h-32 flex flex-col justify-end p-3 border border-slate-200/60 group">
          <img
            src="/mockup_assets/sidebar_indiagate_banner.jpg"
            alt="India Gate"
            className="absolute inset-0 w-full h-full object-cover brightness-[0.7] contrast-125 group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // fallback gradient if image not ready
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="relative z-10">
            <h4 className="text-[11.5px] font-bold text-white tracking-tight leading-snug drop-shadow">
              Smarter Surveillance.
            </h4>
            <p className="text-[10px] font-medium text-slate-300 drop-shadow">
              Safer Tomorrow.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

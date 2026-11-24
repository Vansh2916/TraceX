import React from 'react';
import { ArrowRight } from 'lucide-react';

interface TopTrackedVehiclesCardProps {
  onSelectPlate?: (plate: string) => void;
  onViewAll?: () => void;
}

export const TopTrackedVehiclesCard: React.FC<TopTrackedVehiclesCardProps> = ({
  onSelectPlate,
  onViewAll,
}) => {
  const vehicles = [
    {
      rank: 1,
      plate: 'DL8CAF2381',
      duration: '2h 12m',
      img: '/mockup_assets/car_dl8caf2381.jpg',
      fallback: '/mockup_assets/selected_vehicle_corolla.jpg',
    },
    {
      rank: 2,
      plate: 'HR26DK9723',
      duration: '1h 48m',
      img: '/mockup_assets/car_hr26dk9723.jpg',
      fallback: '/sample_cars/sample_fortuner_black.jpg',
    },
    {
      rank: 3,
      plate: 'UP16BT4097',
      duration: '1h 32m',
      img: '/mockup_assets/car_up16bt4097.jpg',
      fallback: '/sample_cars/sample_swift_red.jpg',
    },
    {
      rank: 4,
      plate: 'DL3CC0456',
      duration: '1h 20m',
      img: '/mockup_assets/car_dl3cc0456.jpg',
      fallback: '/sample_cars/sample_city_silver.jpg',
    },
    {
      rank: 5,
      plate: 'PB10HS3187',
      duration: '1h 15m',
      img: '/mockup_assets/car_pb10hs3187.jpg',
      fallback: '/sample_cars/sample_scorpio_white.jpg',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between h-[190px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-[12.5px] font-bold text-slate-800">
          Top Tracked Vehicles
        </h4>
        <button
          onClick={onViewAll}
          className="text-[10.5px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-0.5 group"
        >
          <span>View All</span>
          <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Ranked List */}
      <div className="space-y-1.5 overflow-y-auto pr-1">
        {vehicles.map((v) => (
          <div
            key={v.plate}
            onClick={() => onSelectPlate?.(v.plate)}
            className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5">
              <span className="text-[10.5px] font-bold text-slate-400 w-3 text-center">
                {v.rank}
              </span>
              <img
                src={v.img}
                alt={v.plate}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== v.fallback) {
                    target.src = v.fallback;
                  } else {
                    target.src = '/mockup_assets/selected_vehicle_corolla.jpg';
                  }
                }}
                className="w-7 h-5 rounded object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
              />
              <span className="font-mono text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {v.plate}
              </span>
            </div>
            <span className="text-[10.5px] font-medium text-slate-400 font-mono">
              {v.duration}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

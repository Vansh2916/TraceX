import React from 'react';

export type CorridorZone = 'ALL' | 'CENTRAL' | 'SOUTH' | 'RING_ROAD' | 'EAST';

interface Props {
  selectedZone: CorridorZone;
  onSelectZone: (zone: CorridorZone) => void;
  totalCameras: number;
  activeCount: number;
}

export const CameraFilterBar: React.FC<Props> = ({
  selectedZone,
  onSelectZone,
  totalCameras,
  activeCount,
}) => {
  const zones: { id: CorridorZone; label: string }[] = [
    { id: 'ALL', label: 'All Corridors' },
    { id: 'CENTRAL', label: 'Central Delhi (CP / ITO)' },
    { id: 'SOUTH', label: 'South Corridor (AIIMS / Dhaula Kuan)' },
    { id: 'RING_ROAD', label: 'Outer Ring Road (Kashmere Gate / Ashram)' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-zinc-900/60 border-b border-zinc-800">
      <div className="flex flex-wrap gap-1.5">
        {zones.map((z) => (
          <button
            key={z.id}
            onClick={() => onSelectZone(z.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedZone === z.id
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-zinc-400 font-mono">
        Active Feeds: <span className="text-emerald-400 font-semibold">{activeCount}</span> / {totalCameras}
      </div>
    </div>
  );
};

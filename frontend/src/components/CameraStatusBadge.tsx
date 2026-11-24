import React from 'react';

interface Props {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  fps?: number;
}

export const CameraStatusBadge: React.FC<Props> = ({ status, fps }) => {
  const config = {
    ONLINE: {
      color: 'bg-emerald-500',
      text: 'ONLINE',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    DEGRADED: {
      color: 'bg-amber-500',
      text: 'DEGRADED',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    OFFLINE: {
      color: 'bg-red-500',
      text: 'OFFLINE',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    },
  }[status];

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono ${config.badgeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} animate-pulse`} />
      <span>{config.text}</span>
      {fps !== undefined && <span className="opacity-70">({fps} fps)</span>}
    </div>
  );
};

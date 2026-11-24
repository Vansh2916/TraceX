import React from 'react';

export type StreamQuality = '720p' | '1080p' | '4k';

interface Props {
  quality: StreamQuality;
  onQualityChange: (q: StreamQuality) => void;
  fps: number;
  onFpsChange: (fps: number) => void;
}

export const CameraStreamControls: React.FC<Props> = ({
  quality,
  onQualityChange,
  fps,
  onFpsChange,
}) => {
  return (
    <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 rounded-lg p-2 text-xs">
      <span className="text-zinc-400 font-medium">Stream Quality:</span>
      <div className="flex rounded-md overflow-hidden border border-zinc-700">
        {(['720p', '1080p', '4k'] as StreamQuality[]).map((q) => (
          <button
            key={q}
            onClick={() => onQualityChange(q)}
            className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              quality === q
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {q.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="h-4 w-[1px] bg-zinc-700" />

      <span className="text-zinc-400 font-medium">Inference FPS:</span>
      <select
        value={fps}
        onChange={(e) => onFpsChange(Number(e.target.value))}
        className="bg-zinc-800 border border-zinc-700 text-white text-[11px] rounded px-2 py-1 outline-none"
      >
        <option value={10}>10 FPS (Eco)</option>
        <option value={15}>15 FPS (Standard)</option>
        <option value={30}>30 FPS (Full Realtime)</option>
      </select>
    </div>
  );
};

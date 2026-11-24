import React from 'react';

interface CameraFeedsCardProps {
  onOpenFeed: (camId: string) => void;
}

export const CameraFeedsCard: React.FC<CameraFeedsCardProps> = ({ onOpenFeed }) => {
  const feeds = [
    {
      id: 'CAM_01',
      name: 'Connaught Place',
      video: '/footage/consecutive_cam01_cp.mp4',
      corridor: 'Barakhamba Axis',
      plate: 'AP 10 AR 0658',
      isActive: true,
    },
    {
      id: 'CAM_02',
      name: 'India Gate C-Hex',
      video: '/footage/consecutive_cam02_indiagate.mp4',
      corridor: 'Kartavya Path',
      plate: 'AP 10 AR 0658',
      isActive: false,
    },
    {
      id: 'CAM_06',
      name: 'Dhaula Kuan NH-48',
      video: '/footage/car-detection.mp4',
      corridor: 'Airport Expressway',
      plate: 'UP 16 Z 4455',
      isActive: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between h-[190px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h4 className="text-[12.5px] font-bold text-slate-800">Live CCTV Feeds</h4>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
        <span className="text-[9.5px] font-mono text-slate-400">RTSP SIMULATOR</span>
      </div>

      {/* 3 Feeds Grid with Real Video Playback */}
      <div className="grid grid-cols-3 gap-2 h-[135px]">
        {feeds.map((feed) => (
          <div
            key={feed.id}
            onClick={() => onOpenFeed(feed.id)}
            className={`rounded-xl overflow-hidden border p-1 flex flex-col justify-between transition-all cursor-pointer group ${
              feed.isActive
                ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                : 'border-slate-200/90 hover:border-slate-300 bg-slate-50/50'
            }`}
          >
            {/* Live Video Thumbnail */}
            <div className="relative w-full h-[85px] rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
              <video
                src={feed.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-[8px] font-mono text-emerald-400 px-1 py-0.5 rounded flex items-center space-x-1">
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
              </div>
              <div className="absolute bottom-1 right-1 bg-black/80 text-[7.5px] font-mono text-slate-300 px-1 rounded">
                25 FPS
              </div>
            </div>

            {/* Labels */}
            <div className="px-0.5 pt-1 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">
                  {feed.id}
                </p>
                <p className="text-[9px] text-slate-500 truncate leading-tight">
                  {feed.name}
                </p>
              </div>
              <span className="text-[8.5px] font-mono bg-blue-100 text-blue-700 px-1 py-0.2 rounded font-bold">
                OCR
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

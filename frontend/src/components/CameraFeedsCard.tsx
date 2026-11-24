import React from 'react';

interface CameraFeedsCardProps {
  onOpenFeed: (camId: string) => void;
}

export const CameraFeedsCard: React.FC<CameraFeedsCardProps> = ({ onOpenFeed }) => {
  const feeds = [
    {
      id: 'CAM_01',
      name: 'Connaught Place',
      img: '/mockup_assets/cam01_thumb.jpg',
      isActive: false,
    },
    {
      id: 'CAM_07',
      name: 'Rajpath Rd',
      img: '/mockup_assets/cam07_thumb.jpg',
      isActive: true,
    },
    {
      id: 'CAM_12',
      name: 'India Gate',
      img: '/mockup_assets/cam12_thumb.jpg',
      isActive: false,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between h-[190px] select-none">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <h4 className="text-[12.5px] font-bold text-slate-800">Camera Feeds</h4>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      {/* 3 Feeds Grid */}
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
            {/* Live Video / Photo Thumbnail */}
            <div className="relative w-full h-[85px] rounded-lg overflow-hidden bg-slate-900">
              <img
                src={feed.img}
                alt={feed.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/sample_scorpio_white.jpg';
                }}
              />
              <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-[8.5px] font-mono text-white px-1.5 py-0.5 rounded">
                LIVE
              </div>
            </div>

            {/* Labels */}
            <div className="px-0.5 pt-1">
              <p className="text-[10.5px] font-bold text-slate-800 leading-tight truncate">
                {feed.id}
              </p>
              <p className="text-[9.5px] text-slate-500 truncate leading-tight">
                {feed.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Convoy, WatchlistItem } from '../types';
import { Network, Car, Shield, AlertTriangle, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ConvoyPanelProps {
  onHighlightConvoyPlates: (plates: string[]) => void;
}

export const ConvoyPanel: React.FC<ConvoyPanelProps> = ({ onHighlightConvoyPlates }) => {
  const [convoys, setConvoys] = useState<Convoy[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'convoys' | 'watchlist'>('convoys');

  const fetchConvoyData = async () => {
    setLoading(true);
    try {
      const [convoyRes, watchlistRes] = await Promise.all([
        fetch('/api/convoys'),
        fetch('/api/watchlist')
      ]);
      const cData = await convoyRes.json();
      const wData = await watchlistRes.json();
      setConvoys(cData.convoys || []);
      setWatchlist(wData.watchlist || []);
    } catch (err) {
      console.error('Failed fetching convoy/watchlist data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConvoyData();
  }, []);

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200">
      {/* Header with Sub-tabs */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setActiveSubTab('convoys')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'convoys'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Convoy Formations ({convoys.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('watchlist')}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
              activeSubTab === 'watchlist'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Active Watchlist ({watchlist.length})</span>
          </button>
        </div>

        <button
          onClick={fetchConvoyData}
          disabled={loading}
          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* SUBTAB: CONVOY DETECTIONS */}
        {activeSubTab === 'convoys' && (
          <div className="space-y-3">
            <div className="p-2 rounded bg-purple-950/20 border border-purple-900/40 text-[11px] font-mono text-purple-300">
              <b>Tactical Rule:</b> Co-occurring vehicle pairs observed across &ge; 3 distinct cameras within a 45-second sliding window.
            </div>

            {convoys.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No convoy formations matching &ge; 3 junctions currently recorded.
              </div>
            ) : (
              convoys.map((convoy, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-purple-900/50 bg-purple-950/10 hover:border-purple-600/60 transition space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4 text-purple-400" />
                      <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                        Convoy Pair #{idx + 1}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      {convoy.co_occurrence_count} JUNCTIONS
                    </span>
                  </div>

                  {/* Vehicle Plates */}
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="p-2 rounded bg-black/40 border border-purple-900/40">
                      <div className="text-[10px] text-purple-300 font-bold">LEAD VEHICLE</div>
                      <div className="text-white font-bold text-sm">{convoy.plates[0]}</div>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-purple-900/40">
                      <div className="text-[10px] text-purple-300 font-bold">ESCORT / CHASER</div>
                      <div className="text-white font-bold text-sm">{convoy.plates[1]}</div>
                    </div>
                  </div>

                  {/* Junction Chain Sequence */}
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                      Chronological Corridors Traversed
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {convoy.junction_names.map((jName, jIdx) => (
                        <div
                          key={jIdx}
                          className="flex items-center justify-between p-1.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300"
                        >
                          <span>
                            {jIdx + 1}. <b>{jName}</b> ({convoy.cameras_traversed[jIdx]})
                          </span>
                          <span className="text-purple-400 text-[10px]">
                            Δt: {convoy.events[jIdx]?.dt_sec ? `${convoy.events[jIdx].dt_sec}s` : '< 25s'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Profile */}
                  <div className="text-[11px] text-purple-200 bg-purple-950/40 p-2 rounded border border-purple-900/50 font-sans">
                    <b>Intelligence Assessment:</b> {convoy.risk_assessment}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => onHighlightConvoyPlates(convoy.plates)}
                    className="w-full py-1.5 rounded bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-500/50 font-mono text-xs flex items-center justify-center space-x-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Highlight Convoy Trajectory on Map</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUBTAB: ACTIVE WATCHLIST */}
        {activeSubTab === 'watchlist' && (
          <div className="space-y-2.5">
            {watchlist.map((item) => (
              <div
                key={item.plate}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {item.plate}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      item.severity === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : item.severity === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-200">{item.reason}</div>
                {item.description && (
                  <div className="text-[11px] text-slate-400 leading-relaxed font-sans">{item.description}</div>
                )}
                <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-900">
                  Enrolled: {new Date(item.added_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

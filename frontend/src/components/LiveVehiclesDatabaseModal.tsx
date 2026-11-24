import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  X,
  AlertTriangle,
  Download,
  Server,
  Radio,
} from 'lucide-react';
import { MOCK_LIVE_VEHICLES } from '../data/mockData';
import { fetchJson } from '../utils/api';
import { ConnectionStatus, DataOrigin } from '../types';

interface LiveVehicleRecord {
  id: number;
  plate: string;
  car_model: string;
  vehicle_type: string;
  color: string;
  speed_kmh: number;
  speed_limit: number;
  is_overspeed: number | boolean;
  station_id: string;
  station_name: string;
  corridor: string;
  timestamp_sec: number;
  iso_time: string;
  confidence: number;
  detection_engine: string;
  flags: string;
}

interface LiveVehiclesDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlate?: (plate: string) => void;
}

export const LiveVehiclesDatabaseModal: React.FC<LiveVehiclesDatabaseModalProps> = ({
  isOpen,
  onClose,
  onSelectPlate,
}) => {
  const [vehicles, setVehicles] = useState<LiveVehicleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStation, setFilterStation] = useState<string>('ALL');
  const [filterOverspeed, setFilterOverspeed] = useState<boolean>(false);
  const [dataOrigin, setDataOrigin] = useState<DataOrigin>('mock');
  const [fetchStatus, setFetchStatus] = useState<ConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const fetchLiveVehicles = async () => {
    try {
      setLoading(true);
      setFetchStatus('connecting');
      const data = await fetchJson('/api/live-vehicles?limit=100');
      if (data.success && data.vehicles && data.vehicles.length > 0) {
        setVehicles(data.vehicles);
        setDataOrigin('live');
        setFetchStatus('connected');
        setErrorMessage(null);
        setLastSyncTime(new Date());
      } else {
        setVehicles(MOCK_LIVE_VEHICLES as any);
        setDataOrigin('mock');
        setFetchStatus('offline');
        setErrorMessage('Backend returned empty or invalid records. Showing 5 demo records.');
      }
    } catch (err: any) {
      console.warn('Failed to fetch live streaming vehicles, using mock data:', err);
      setVehicles(MOCK_LIVE_VEHICLES as any);
      setDataOrigin('mock');
      setFetchStatus('offline');
      setErrorMessage(err?.message || 'Backend API unreachable: showing 5 demo records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveVehicles();
      const interval = setInterval(fetchLiveVehicles, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.car_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.station_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStation = filterStation === 'ALL' || v.station_id === filterStation;
    const matchesOverspeed = !filterOverspeed || Boolean(v.is_overspeed);

    return matchesSearch && matchesStation && matchesOverspeed;
  });

  const exportCSV = () => {
    const headers = [
      'ID',
      'Number Plate',
      'Make & Model',
      'Type',
      'Color',
      'Speed (km/h)',
      'Limit',
      'Overspeed',
      'Station',
      'Corridor',
      'Timestamp',
      'Engine',
    ];
    const rows = filtered.map((v) => [
      v.id,
      v.plate,
      v.car_model,
      v.vehicle_type,
      v.color,
      v.speed_kmh,
      v.speed_limit,
      v.is_overspeed ? 'YES' : 'NO',
      `"${v.station_name}"`,
      `"${v.corridor}"`,
      v.iso_time,
      v.detection_engine,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crusaders_live_vehicles_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[650] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-6 space-y-4 max-h-[92vh] flex flex-col overflow-hidden font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              dataOrigin === 'live' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">
                  {dataOrigin === 'live'
                    ? 'Passing Live Streaming Vehicles Database (SQLite)'
                    : 'Passing Vehicles Database — Demo Simulation Dataset'}
                </h3>
                {/* Data Origin Badge */}
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border flex items-center space-x-1 ${
                  dataOrigin === 'live'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {dataOrigin === 'live' ? (
                    <span>● DATA ORIGIN: LIVE SQLITE ({vehicles.length} LOGGED)</span>
                  ) : (
                    <span>▲ DATA ORIGIN: 5 DEMO RECORDS (FALLBACK)</span>
                  )}
                </span>
                {/* Connection Status Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex items-center space-x-1 ${
                  fetchStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : fetchStatus === 'connecting'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  <Server className="w-3 h-3" />
                  <span>
                    API:{' '}
                    {fetchStatus === 'connected'
                      ? 'CONNECTED (200 OK)'
                      : fetchStatus === 'connecting'
                      ? 'CONNECTING...'
                      : 'OFFLINE / UNREACHABLE'}
                  </span>
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">
                {dataOrigin === 'live'
                  ? 'Real-time ingestion of all vehicular license plates, velocity telemetry, and camera station checkpoints.'
                  : 'Notice: Backend API is currently offline. Displaying 5 demo vehicle records for operational testing.'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchLiveVehicles}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              title="Manual Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning Banner When in Demo Mode */}
        {dataOrigin === 'mock' && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between text-amber-900 text-xs shrink-0">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Live Backend Ingestion Offline: </span>
                <span>Displaying 5 demo vehicle records for operational testing. Real-time camera telemetry is paused.</span>
                {errorMessage && (
                  <span className="block text-[10.5px] text-amber-700/80 font-mono mt-0.5">
                    Detail: {errorMessage}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={fetchLiveVehicles}
              className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold text-xs transition shrink-0"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 text-xs">
          <div className="flex items-center space-x-2.5 flex-1 min-w-[240px] bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by plate, vehicle model, or camera station..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 w-full text-xs font-medium"
            />
          </div>

          <div className="flex items-center space-x-2.5">
            <select
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 text-xs font-medium outline-none shadow-2xs"
            >
              <option value="ALL">All Camera Stations</option>
              <option value="CAM_01">CAM_01 • Connaught Place</option>
              <option value="CAM_02">CAM_02 • India Gate</option>
              <option value="CAM_03">CAM_03 • ITO Junction</option>
              <option value="CAM_07">CAM_07 • Rajpath Rd</option>
            </select>

            <button
              onClick={() => setFilterOverspeed(!filterOverspeed)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                filterOverspeed
                  ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Overspeed Only</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 sticky top-0 z-10 text-[11px] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Plate</th>
                <th className="py-2.5 px-3">Vehicle</th>
                <th className="py-2.5 px-3">Speed</th>
                <th className="py-2.5 px-3">Camera Station</th>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-blue-50/50 transition">
                  <td className="py-2 px-3 font-mono font-bold text-slate-900">
                    <div className="flex items-center space-x-1.5">
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        {v.plate}
                      </span>
                      {dataOrigin === 'mock' ? (
                        <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                          DEMO
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <span className="font-semibold text-slate-800">{v.car_model}</span>
                    <span className="text-[10px] text-slate-400 block">{v.color} • {v.vehicle_type}</span>
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10.5px] ${
                        v.is_overspeed
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {v.speed_kmh} km/h
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">
                    {v.station_name}
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">
                    {v.corridor}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500 text-[10.5px]">
                    {v.iso_time}
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => {
                        onSelectPlate?.(v.plate);
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition"
                    >
                      Lock Radar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

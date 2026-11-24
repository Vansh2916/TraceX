import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Radio,
  Play,
  Pause,
  Maximize2,
  Columns,
  Grid3X3,
  Scan,
  Copy,
  Check,
  Zap,
  VideoOff,
  AlertCircle
} from 'lucide-react';
import { Camera } from '../../types';
import { formatClockIST, formatTimeIST } from '../../utils/timeFormat';
import { safeFetchJson } from '../../services/apiClient';

interface CameraNetworkViewProps {
  cameras: Camera[];
  onOpenFeed?: (cameraId: string) => void;
}

const FOOTAGE_MAP: Record<string, {
  file: string;
  fallbackFile?: string;
  fps: number;
  res: string;
  bitrate: string;
  rtspUrl: string;
  plate: string;
  vehicle: string;
  corridor: string;
}> = {
  CAM_01: {
    file: '/footage/consecutive_cam01_cp.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '2.85 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam01_cp',
    plate: 'AP 10 AR 0658',
    vehicle: 'Red Hyundai Grand i10',
    corridor: 'Connaught Place Outer Circle'
  },
  CAM_02: {
    file: '/footage/consecutive_cam02_indiagate.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '2.91 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam02_indiagate',
    plate: 'AP 10 AR 0658',
    vehicle: 'Red Hyundai Grand i10',
    corridor: 'India Gate C-Hexagon / Kartavya Path'
  },
  CAM_03: {
    file: '/footage/city-junction.mp4',
    fallbackFile: '/footage/consecutive_cam01_cp.mp4',
    fps: 30,
    res: '720p HD',
    bitrate: '2.20 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam03_ito',
    plate: 'DL 1C AA 9999',
    vehicle: 'White Mahindra Scorpio-N',
    corridor: 'Vikas Marg & ITO Intersection'
  },
  CAM_04: {
    file: '/footage/consecutive_cam01_cp.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '2.75 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam04_isbt',
    plate: 'DL 8C AB 9110',
    vehicle: 'Dark Grey Toyota Fortuner',
    corridor: 'Ring Road / Old Delhi Gate'
  },
  CAM_05: {
    file: '/footage/consecutive_cam02_indiagate.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '2.80 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam05_aiims',
    plate: 'UP 16 Z 4455',
    vehicle: 'Silver Honda City',
    corridor: 'Ring Road & Aurobindo Marg Flyover'
  },
  CAM_06: {
    file: '/footage/car-detection.mp4',
    fps: 25,
    res: '720p HD',
    bitrate: '2.40 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam06_dhaulakuan',
    plate: 'UP 16 Z 4455',
    vehicle: 'Silver Honda City (Speeding)',
    corridor: 'NH-48 & Ring Road Flyover'
  },
  CAM_07: {
    file: '/footage/real_traffic_cctv.mp4',
    fallbackFile: '/footage/consecutive_cam02_indiagate.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '3.10 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam07_airport',
    plate: 'DL 1C AB 1100',
    vehicle: 'White Toyota Fortuner',
    corridor: 'IGI Airport T3 Terminal & Expressway'
  },
  CAM_08: {
    file: '/footage/real_traffic_cctv.mp4',
    fallbackFile: '/footage/consecutive_cam01_cp.mp4',
    fps: 25,
    res: '720p HD',
    bitrate: '2.30 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam08_ashram',
    plate: 'HR 26 DK 9723',
    vehicle: 'Red Maruti Suzuki Swift',
    corridor: 'Mathura Road & Ashram Underpass'
  },
  CAM_09: {
    file: '/footage/consecutive_cam01_cp.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '2.70 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam09_motibagh',
    plate: 'DL 1C WX 0007',
    vehicle: 'Dark Grey Toyota Fortuner',
    corridor: 'Ring Road & Shanti Path'
  },
  CAM_10: {
    file: '/footage/city-junction.mp4',
    fallbackFile: '/footage/car-detection.mp4',
    fps: 25,
    res: '720p HD',
    bitrate: '2.25 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam10_lajpatnagar',
    plate: 'DL 8C AF 2381',
    vehicle: 'Silver Honda City',
    corridor: 'Ring Road Central Market Axis'
  },
  CAM_11: {
    file: '/footage/consecutive_cam02_indiagate.mp4',
    fps: 25,
    res: '1080p Full HD',
    bitrate: '2.80 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam11_karolbagh',
    plate: 'DL 1C AA 9999',
    vehicle: 'White Mahindra Scorpio-N',
    corridor: 'Pusa Road Metro Pillar 110'
  },
  CAM_12: {
    file: '/footage/car-detection.mp4',
    fps: 25,
    res: '720p HD',
    bitrate: '2.40 Mbps',
    rtspUrl: 'rtsp://127.0.0.1:8554/cam12_saraikalekhan',
    plate: 'AP 10 AR 0658',
    vehicle: 'Red Hyundai Grand i10',
    corridor: 'Ring Road & Barapullah Entry'
  }
};

interface ScanToastState {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export const CameraNetworkView: React.FC<CameraNetworkViewProps> = ({ cameras, onOpenFeed }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'quad' | 'focus'>('grid');
  const [activeZone, setActiveZone] = useState<string>('all');
  const [focusCamId, setFocusCamId] = useState<string>('CAM_01');
  const [isAiOverlayEnabled, setIsAiOverlayEnabled] = useState(true);
  const [isRtspModalOpen, setIsRtspModalOpen] = useState(false);
  const [selectedRtspCam, setSelectedRtspCam] = useState<string>('CAM_01');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Playback state detection per camera
  const [playbackStatus, setPlaybackStatus] = useState<Record<string, 'playing' | 'paused' | 'unavailable' | 'loading'>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Real-time Asia/Kolkata (IST) clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Live Simulator state
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [isScanningNow, setIsScanningNow] = useState(false);
  const [scanToast, setScanToast] = useState<ScanToastState | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const { timeStr } = formatClockIST();
      setCurrentTimeStr(timeStr);
    };
    const timer = setInterval(updateTime, 100);
    updateTime();
    return () => clearInterval(timer);
  }, []);

  const handleCopyRtsp = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Ensure effective canonical cameras
  const effectiveCameras = cameras && cameras.length > 0 ? cameras : Object.keys(FOOTAGE_MAP).map(cid => ({
    id: cid,
    name: FOOTAGE_MAP[cid].corridor,
    landmark: FOOTAGE_MAP[cid].corridor,
    lat: 28.62,
    lon: 77.22,
    zone: 'Delhi NCR',
    speed_limit: 50
  }));

  // Filter cameras based on active corridor zone
  const filteredCameras = effectiveCameras.filter((cam) => {
    if (activeZone === 'all') return true;
    if (activeZone === 'central') return ['CAM_01', 'CAM_02', 'CAM_03'].includes(cam.id);
    if (activeZone === 'ring') return ['CAM_04', 'CAM_05', 'CAM_08', 'CAM_09', 'CAM_10'].includes(cam.id);
    if (activeZone === 'express') return ['CAM_06', 'CAM_07', 'CAM_11', 'CAM_12'].includes(cam.id);
    return true;
  });

  // Preserve the selected corridor when switching from grid to Single High-Res Focus
  useEffect(() => {
    if (filteredCameras.length > 0 && !filteredCameras.some((c) => c.id === focusCamId)) {
      setFocusCamId(filteredCameras[0].id);
    }
  }, [activeZone, filteredCameras, focusCamId]);

  const quadCameras = effectiveCameras.filter((c) => ['CAM_01', 'CAM_02', 'CAM_03', 'CAM_06'].includes(c.id));
  const focusCam = filteredCameras.find((c) => c.id === focusCamId) || filteredCameras[0] || effectiveCameras[0];
  const focusMeta = FOOTAGE_MAP[focusCam?.id || 'CAM_01'] || FOOTAGE_MAP['CAM_01'];

  // Optical OCR scan with frame capture, validation, and distinct outcomes
  const handleTriggerOpticalScan = async () => {
    setIsScanningNow(true);
    setScanToast({
      type: 'info',
      message: `Running Optical ANPR Scan on ${focusCam.id} (${focusCam.name})...`
    });

    try {
      const videoEl = videoRefs.current[focusCam.id];
      let frameBlob: Blob | null = null;

      // Check if video element is readable and decoded
      if (videoEl && videoEl.videoWidth > 0 && videoEl.readyState >= 2) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            frameBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
          }
        } catch {
          // Canvas tainting fallback
        }
      }

      const currentStatus = playbackStatus[focusCam.id];
      if (!frameBlob && currentStatus === 'unavailable') {
        setScanToast({
          type: 'warning',
          message: `⚠️ No frame: Camera ${focusCam.id} stream is unavailable or paused.`
        });
        return;
      }

      const formData = new FormData();
      formData.append('camera_id', focusCam.id);
      if (frameBlob) {
        formData.append('file', frameBlob, `${focusCam.id}_capture.jpg`);
      }

      const res = await safeFetchJson<any>('/api/ocr/scan', {
        method: 'POST',
        body: formData,
      }, 8000);

      if (!res.success) {
        if (res.status === 408) {
          setScanToast({
            type: 'error',
            message: `⏱️ OCR Scan Timeout: Server failed to respond within 8s.`
          });
        } else if (res.isHtmlFallback) {
          setScanToast({
            type: 'error',
            message: `❌ Service failure: Endpoint returned HTML (Gateway/Proxy misconfiguration).`
          });
        } else {
          setScanToast({
            type: 'error',
            message: `❌ Service failure: ${res.error || 'OCR Engine error'}`
          });
        }
        return;
      }

      const outcome = res.data?.outcome;
      if (outcome === 'plate_detected' && res.data?.plate) {
        const conf = res.data.confidence ? `${Math.round(res.data.confidence * 100)}%` : 'Verified';
        const time = formatTimeIST(res.data.capture_time || new Date());
        setScanToast({
          type: 'success',
          message: `✅ Recognized ${res.data.plate} at ${res.data.camera_name || focusCam.id} (${conf} conf, ${time})`
        });
      } else if (outcome === 'no_plate_detected') {
        setScanToast({
          type: 'warning',
          message: `🔍 No plate detected in frame for ${focusCam.id}.`
        });
      } else if (outcome === 'no_frame') {
        setScanToast({
          type: 'warning',
          message: `⚠️ No frame available from ${focusCam.id} camera stream.`
        });
      } else {
        setScanToast({
          type: 'error',
          message: `❌ OCR Service error: ${res.data?.error || 'Analysis failed'}`
        });
      }
    } catch (err: any) {
      setScanToast({
        type: 'error',
        message: `❌ Service failure: ${err.message || 'Network exception'}`
      });
    } finally {
      setIsScanningNow(false);
      setTimeout(() => setScanToast(null), 5000);
    }
  };

  const handleToggleSimulator = async () => {
    const nextState = !isSimRunning;
    setIsSimRunning(nextState);
    try {
      await safeFetchJson('/api/cctv/simulator/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextState })
      });
    } catch {
      // offline fallback
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fb] p-6 space-y-4 overflow-y-auto select-none">
      {/* 1. Top Control Banner */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-xs">
            <Video className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-[17px] font-black text-slate-900 tracking-tight">
                Municipal CCTV Stream Simulator & Multi-Junction Matrix
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>12 RTSP STREAMS SYNCHRONIZED</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
                TIMEZONE: ASIA/KOLKATA (IST)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified high-definition CCTV streams across Connaught Place, India Gate, Dhaula Kuan NH-48 & Ring Road corridors.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Simulator Toggle Button */}
          <button
            onClick={handleToggleSimulator}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition cursor-pointer ${
              isSimRunning
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {isSimRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimRunning ? 'Simulator: ACTIVE' : 'Simulator: PAUSED'}</span>
          </button>

          {/* Trigger Scan Button (Restores immediately upon completion/error/timeout) */}
          <button
            onClick={handleTriggerOpticalScan}
            disabled={isScanningNow}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Scan className={`w-3.5 h-3.5 ${isScanningNow ? 'animate-spin' : ''}`} />
            <span>{isScanningNow ? 'Scanning Frame...' : 'Trigger Optical OCR'}</span>
          </button>

          {/* RTSP Endpoints Button */}
          <button
            onClick={() => setIsRtspModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            <span>RTSP URIs</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {scanToast && (
        <div
          className={`px-4 py-2.5 rounded-xl text-xs font-mono shadow-md flex items-center space-x-2 border transition ${
            scanToast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/50'
              : scanToast.type === 'warning'
              ? 'bg-slate-900 text-amber-300 border-amber-500/50'
              : scanToast.type === 'error'
              ? 'bg-slate-900 text-rose-300 border-rose-500/50'
              : 'bg-slate-900 text-sky-300 border-sky-500/50'
          }`}
        >
          {scanToast.type === 'success' && <Zap className="w-4 h-4 text-emerald-400" />}
          {scanToast.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400" />}
          {scanToast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
          {scanToast.type === 'info' && <Scan className="w-4 h-4 text-sky-400 animate-spin" />}
          <span>{scanToast.message}</span>
        </div>
      )}

      {/* 2. Sub-Bar: Filter Tabs & View Modes */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xs rounded-xl p-2 px-3 border border-slate-200/90 shadow-2xs">
        {/* Zone Filters */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveZone('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeZone === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Corridors (12)
          </button>
          <button
            onClick={() => setActiveZone('central')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeZone === 'central'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Central Arterial (CP / India Gate / ITO)
          </button>
          <button
            onClick={() => setActiveZone('ring')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeZone === 'ring'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Ring Road & Flyovers (AIIMS / Ashram)
          </button>
          <button
            onClick={() => setActiveZone('express')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeZone === 'express'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Expressways (Dhaula Kuan / IGI T3)
          </button>
        </div>

        {/* View Layout Controls & AI Toggle */}
        <div className="flex items-center space-x-2">
          {/* AI Reticle Toggle */}
          <button
            onClick={() => setIsAiOverlayEnabled(!isAiOverlayEnabled)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 border transition cursor-pointer ${
              isAiOverlayEnabled
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>AI Reticle HUD: {isAiOverlayEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* View Switchers */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              title="12-Camera Grid Matrix"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('quad')}
              title="Quad 4-Camera Focus"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'quad' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('focus');
                // Ensure focus camera is within the filtered corridor list
                if (filteredCameras.length > 0 && !filteredCameras.some((c) => c.id === focusCamId)) {
                  setFocusCamId(filteredCameras[0].id);
                }
              }}
              title="Single High-Res Focus Camera"
              className={`p-1.5 rounded-md transition cursor-pointer ${
                viewMode === 'focus' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Video Display Section: Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-4 gap-4 pb-6">
          {filteredCameras.map((cam) => {
            const meta = FOOTAGE_MAP[cam.id] || FOOTAGE_MAP['CAM_01'];
            const status = playbackStatus[cam.id] || 'loading';
            const isAvailable = status === 'playing';

            return (
              <div
                key={cam.id}
                onClick={() => {
                  setFocusCamId(cam.id);
                  onOpenFeed?.(cam.id);
                }}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between hover:shadow-md transition cursor-pointer group"
              >
                {/* Real Looping Video Box */}
                <div className="relative w-full h-[155px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <video
                    ref={(el) => { videoRefs.current[cam.id] = el; }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onPlaying={() => setPlaybackStatus((prev) => ({ ...prev, [cam.id]: 'playing' }))}
                    onPause={() => setPlaybackStatus((prev) => ({ ...prev, [cam.id]: 'paused' }))}
                    onError={() => setPlaybackStatus((prev) => ({ ...prev, [cam.id]: 'unavailable' }))}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  >
                    <source src={meta.file} type="video/mp4" />
                    {meta.fallbackFile && <source src={meta.fallbackFile} type="video/mp4" />}
                  </video>

                  {/* Unavailable / Stalled Overlay */}
                  {!isAvailable && status !== 'loading' && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-3 z-20">
                      <VideoOff className="w-6 h-6 text-rose-400 mb-1" />
                      <span className="text-[10px] font-mono font-bold text-rose-300">FEED UNAVAILABLE</span>
                      <span className="text-[8.5px] font-mono text-slate-400">No decoded frame</span>
                    </div>
                  )}

                  {/* Top HUD: Live Ticker & Codec */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[9px] font-mono pointer-events-none z-10">
                    {isAvailable ? (
                      <>
                        <div className="bg-black/75 backdrop-blur-xs px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>LIVE {meta.res.split(' ')[0]}</span>
                        </div>
                        <div className="bg-black/75 backdrop-blur-xs px-1.5 py-0.5 rounded text-slate-300">
                          {meta.fps} FPS
                        </div>
                      </>
                    ) : (
                      <div className="bg-black/85 backdrop-blur-xs px-2 py-0.5 rounded text-amber-300 border border-amber-500/40 flex items-center space-x-1">
                        <span>Preview / Standby</span>
                      </div>
                    )}
                  </div>

                  {/* AI Optical Bounding Box: Cleared when feed is unavailable */}
                  {isAiOverlayEnabled && isAvailable && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3 z-10">
                      <div className="w-3/4 h-3/5 border-2 border-dashed border-cyan-400/70 rounded-lg relative flex items-end justify-center p-1">
                        <div className="absolute -top-3 left-1 bg-cyan-900/90 text-cyan-300 border border-cyan-400 text-[8px] font-mono px-1 rounded">
                          ANPR TRACKER
                        </div>
                        <div className="bg-black/85 text-emerald-300 border border-emerald-400/60 text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm">
                          {meta.plate}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom HUD: Live Clock in Asia/Kolkata */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[8.5px] font-mono text-slate-300 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded pointer-events-none z-10">
                    <span className="text-cyan-300 truncate max-w-[120px]">{cam.landmark}</span>
                    <span className="text-slate-400">{currentTimeStr} IST</span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-700 text-xs">{cam.id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Limit: {cam.speed_limit} km/h</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{cam.name}</p>
                  <p className="text-[10.5px] text-slate-400 truncate">{meta.corridor}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Quad View (4 Primary Corridors) */}
      {viewMode === 'quad' && (
        <div className="grid grid-cols-2 gap-4 pb-6 flex-1">
          {quadCameras.map((cam) => {
            const meta = FOOTAGE_MAP[cam.id] || FOOTAGE_MAP['CAM_01'];
            const status = playbackStatus[cam.id] || 'loading';
            const isAvailable = status === 'playing';

            return (
              <div
                key={cam.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 flex flex-col justify-between"
              >
                <div className="relative w-full h-[270px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <video
                    ref={(el) => { videoRefs.current[cam.id] = el; }}
                    autoPlay
                    loop
                    muted
                    playsInline
                    onPlaying={() => setPlaybackStatus((prev) => ({ ...prev, [cam.id]: 'playing' }))}
                    onPause={() => setPlaybackStatus((prev) => ({ ...prev, [cam.id]: 'paused' }))}
                    onError={() => setPlaybackStatus((prev) => ({ ...prev, [cam.id]: 'unavailable' }))}
                    className="w-full h-full object-cover"
                  >
                    <source src={meta.file} type="video/mp4" />
                    {meta.fallbackFile && <source src={meta.fallbackFile} type="video/mp4" />}
                  </video>

                  {!isAvailable && status !== 'loading' && (
                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-4 z-20">
                      <VideoOff className="w-8 h-8 text-rose-400 mb-2" />
                      <span className="text-xs font-mono font-bold text-rose-300">FEED UNAVAILABLE / NO SIGNAL</span>
                      <span className="text-[10px] font-mono text-slate-400 mt-1">Camera decoder offline</span>
                    </div>
                  )}

                  {/* Quad Top HUD */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono pointer-events-none z-10">
                    {isAvailable ? (
                      <>
                        <div className="bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded text-emerald-400 border border-emerald-500/40 flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span className="font-bold">{cam.id} • LIVE {meta.res}</span>
                        </div>
                        <div className="bg-black/80 px-2 py-1 rounded text-slate-200">
                          RTSP: {meta.bitrate} @ {meta.fps} FPS
                        </div>
                      </>
                    ) : (
                      <div className="bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded text-slate-300 border border-slate-700/60 flex items-center space-x-1.5">
                        <span className="font-bold">{cam.id} • Standby</span>
                      </div>
                    )}
                  </div>

                  {/* AI Scanner: cleared when unavailable */}
                  {isAiOverlayEnabled && isAvailable && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                      <div className="w-1/2 h-1/2 border-2 border-cyan-400/80 rounded-xl relative flex items-end justify-center p-2 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        <div className="absolute -top-3 left-2 bg-cyan-900/90 text-cyan-200 border border-cyan-400 text-[9px] font-mono px-1.5 py-0.5 rounded">
                          OPTICAL OCR ENGINE
                        </div>
                        <div className="bg-black/90 text-emerald-300 border border-emerald-400 text-xs font-mono px-2 py-1 rounded font-bold">
                          PLATE: {meta.plate}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quad Bottom HUD */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[9.5px] font-mono text-slate-300 bg-black/80 px-2.5 py-1 rounded z-10">
                    <span className="text-cyan-300">{cam.name} • {cam.landmark}</span>
                    <span className="text-slate-400">{currentTimeStr} IST (Asia/Kolkata)</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{cam.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">Stream: {meta.rtspUrl}</p>
                  </div>
                  <button
                    onClick={() => onOpenFeed?.(cam.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition cursor-pointer"
                  >
                    Open Live Tracker
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Focus View: Single High-Res Stream (Corridor Preserved) */}
      {viewMode === 'focus' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-600 text-sm">{focusCam.id}</span>
                <h3 className="text-lg font-black text-slate-900">{focusCam.name}</h3>
                {playbackStatus[focusCam.id] === 'playing' ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    REAL-TIME RTSP INGESTION
                  </span>
                ) : (
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                    FEED PAUSED / STANDBY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Corridor: {focusMeta.corridor} • Lat/Lon: {focusCam.lat}, {focusCam.lon}
              </p>
            </div>

            {/* Junction Switcher: ONLY offers eligible cameras in selected corridor */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Eligible Cameras:</span>
              <select
                value={focusCamId}
                onChange={(e) => setFocusCamId(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {filteredCameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative w-full h-[480px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner">
            <video
              ref={(el) => { videoRefs.current[focusCam.id] = el; }}
              autoPlay
              loop
              muted
              playsInline
              onPlaying={() => setPlaybackStatus((prev) => ({ ...prev, [focusCam.id]: 'playing' }))}
              onPause={() => setPlaybackStatus((prev) => ({ ...prev, [focusCam.id]: 'paused' }))}
              onError={() => setPlaybackStatus((prev) => ({ ...prev, [focusCam.id]: 'unavailable' }))}
              className="w-full h-full object-cover"
            >
              <source src={focusMeta.file} type="video/mp4" />
              {focusMeta.fallbackFile && <source src={focusMeta.fallbackFile} type="video/mp4" />}
            </video>

            {/* Unavailable State Overlay */}
            {playbackStatus[focusCam.id] !== 'playing' && playbackStatus[focusCam.id] !== 'loading' && (
              <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center text-center p-6 z-20">
                <VideoOff className="w-12 h-12 text-rose-400 mb-3 animate-pulse" />
                <h4 className="text-sm font-mono font-bold text-rose-300">MEDIA STREAM UNAVAILABLE</h4>
                <p className="text-xs font-mono text-slate-400 mt-1 max-w-md">
                  No decoded video frames received for {focusCam.id} ({focusCam.name}). Live overlays and telemetry metrics have been cleared.
                </p>
                <span className="mt-3 text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  STATUS: NO_FRAME / DECODER_STANDBY
                </span>
              </div>
            )}

            {/* High-Res HUD: Cleared when stream is unavailable */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between font-mono text-xs z-10">
              {playbackStatus[focusCam.id] === 'playing' ? (
                <>
                  <div className="bg-black/85 backdrop-blur px-3 py-1.5 rounded-lg text-emerald-400 border border-emerald-500/40 flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold">LIVE RTSP STREAM • {focusMeta.res}</span>
                  </div>
                  <div className="bg-black/85 px-3 py-1.5 rounded-lg text-slate-300">
                    BITRATE: {focusMeta.bitrate} | FPS: {focusMeta.fps} | PACKET LOSS: 0.0%
                  </div>
                </>
              ) : (
                <div className="bg-black/85 px-3 py-1.5 rounded-lg text-slate-400 border border-slate-700">
                  STREAM OFFLINE • NO ACTIVE METRICS
                </div>
              )}
            </div>

            {/* Scanning Box: Cleared when unavailable, clearly labels retained/simulated data */}
            {isAiOverlayEnabled && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
                {playbackStatus[focusCam.id] === 'playing' ? (
                  <div className="w-2/5 h-2/5 border-2 border-cyan-400 rounded-2xl relative flex items-end justify-center p-3 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                    <div className="absolute -top-3.5 left-3 bg-cyan-950 text-cyan-300 border border-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded">
                      ACTIVE NEURAL ANPR TRACKER
                    </div>
                    <div className="bg-black/95 text-emerald-300 border border-emerald-400 text-sm font-mono px-3 py-1.5 rounded-lg font-black shadow-lg">
                      {focusMeta.plate}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/90 text-amber-300 border border-amber-500/50 text-xs font-mono px-4 py-2 rounded-xl shadow-lg text-center">
                    <div>[SIMULATED DATA / LAST KNOWN RESULT]</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{focusMeta.plate} ({focusMeta.vehicle})</div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom High-Res Bar in Asia/Kolkata */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-xs text-slate-300 bg-black/85 px-4 py-2 rounded-lg z-10">
              <span className="text-cyan-300 font-bold">{focusCam.name} • {focusMeta.corridor}</span>
              <span className="text-slate-400">{currentTimeStr} IST (DELHI TRAFFIC MANAGEMENT • ASIA/KOLKATA)</span>
            </div>
          </div>

          {/* Telemetry Row */}
          <div className="grid grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono text-slate-500">RTSP URI</span>
              <p className="text-xs font-mono font-bold text-slate-800 truncate mt-0.5">{focusMeta.rtspUrl}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono text-slate-500">VEHICLE CLASSIFICATION</span>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{focusMeta.vehicle}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-mono text-slate-500">SPEED LIMIT</span>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{focusCam.speed_limit} km/h (Radar Active)</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500">ANPR OCR ENGINE</span>
                <p className="text-xs font-bold text-blue-700 truncate mt-0.5">NVIDIA NIM / FastOCR</p>
              </div>
              <button
                onClick={() => onOpenFeed?.(focusCam.id)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Inspect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. RTSP Endpoints Modal */}
      {isRtspModalOpen && (
        <div className="fixed inset-0 z-[700] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Municipal RTSP Video Stream Endpoints
                </h3>
              </div>
              <button
                onClick={() => setIsRtspModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Each corridor streams live H.264 video. You can open any RTSP URL in VLC (Media &gt; Open Network Stream) or pipe it via FFmpeg.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {Object.keys(FOOTAGE_MAP).map((cid) => (
                  <button
                    key={cid}
                    onClick={() => setSelectedRtspCam(cid)}
                    className={`p-2 rounded-xl text-left border transition text-xs font-mono cursor-pointer ${
                      selectedRtspCam === cid
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>{cid}</div>
                    <div className="text-[10px] text-slate-400 truncate font-sans">
                      {FOOTAGE_MAP[cid].corridor.split(' ')[0]}
                    </div>
                  </button>
                ))}
              </div>

              {selectedRtspCam && (
                <div className="bg-slate-900 rounded-2xl p-4 text-xs font-mono space-y-2 text-slate-200 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">RTSP Stream URI:</span>
                    <button
                      onClick={() => handleCopyRtsp(FOOTAGE_MAP[selectedRtspCam].rtspUrl, 'rtsp')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedKey === 'rtsp' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'rtsp' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg text-emerald-400 break-all select-all">
                    {FOOTAGE_MAP[selectedRtspCam].rtspUrl}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-cyan-400 font-bold">FFmpeg Stream Ingestion:</span>
                    <button
                      onClick={() =>
                        handleCopyRtsp(
                          `ffmpeg -re -stream_loop -1 -i ${FOOTAGE_MAP[selectedRtspCam].file} -c copy -f rtsp ${FOOTAGE_MAP[selectedRtspCam].rtspUrl}`,
                          'ffmpeg'
                        )
                      }
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedKey === 'ffmpeg' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'ffmpeg' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg text-slate-300 text-[11px] break-all select-all">
                    ffmpeg -re -stream_loop -1 -i {FOOTAGE_MAP[selectedRtspCam].file} -c copy -f rtsp {FOOTAGE_MAP[selectedRtspCam].rtspUrl}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsRtspModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

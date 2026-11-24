import React, { useState } from 'react';
import { Sparkles, Ghost, AlertTriangle, Zap, Film, HelpCircle, CheckCircle2, ChevronRight, X, Info, Database } from 'lucide-react';

interface JudgeDemoBarProps {
  onSimulateTick: () => void;
  onTriggerHitAndRun: () => void;
  onTriggerGhostPlate: () => void;
  onOpenDashcam: () => void;
  onOpenNlSearch: () => void;
  onOpenConsecutiveTracker: () => void;
  onOpenLiveVehiclesDB?: () => void;
  isAutoSimulating: boolean;
  onToggleAutoSim: () => void;
  lastScenario: {
    title: string;
    description: string;
    algorithm: string;
    action: string;
  } | null;
  onDismissScenario: () => void;
}

export const JudgeDemoBar: React.FC<JudgeDemoBarProps> = ({
  onSimulateTick,
  onTriggerHitAndRun,
  onTriggerGhostPlate,
  onOpenDashcam,
  onOpenNlSearch,
  onOpenConsecutiveTracker,
  onOpenLiveVehiclesDB,
  isAutoSimulating,
  onToggleAutoSim,
  lastScenario,
  onDismissScenario,
}) => {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="bg-[#0b101c] border-b border-slate-800 text-xs select-none">
      {/* Top Quick-Demo Ribbon */}
      <div className="px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px] border border-amber-500/40 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Judge Demo Bar</span>
          </span>
          <span className="text-slate-300 font-sans hidden sm:inline text-[11px]">
            1-Click Interactive Scenarios:
          </span>
        </div>

        {/* 5 Interactive Hackathon Scenarios */}
        <div className="flex items-center space-x-2 flex-wrap">
          {/* Consecutive Cameras Distance & Speed Engine */}
          <button
            onClick={onOpenConsecutiveTracker}
            className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-[11px] flex items-center space-x-1.5 transition active:scale-95 shadow-md shadow-amber-950/60"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
            <span>⚡ 2-Cam Speed & Distance Auto-Tracker</span>
          </button>

          {/* Step 1: Real Car CCTV Footage & OCR */}
          <button
            onClick={onOpenDashcam}
            className="px-2.5 py-1 rounded bg-sky-900/80 hover:bg-sky-800 text-sky-100 border border-sky-400/80 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-md"
          >
            <Film className="w-3.5 h-3.5 text-sky-300" />
            <span>1. 🎥 Real Car CCTV Feed</span>
          </button>

          {/* Live Passing Vehicles Database */}
          {onOpenLiveVehiclesDB && (
            <button
              onClick={onOpenLiveVehiclesDB}
              className="px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-500/80 text-[11px] font-mono font-bold flex items-center space-x-1.5 transition active:scale-95 shadow-md"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>📊 Vehicle Sightings</span>
            </button>
          )}

          {/* Step 2: Ghost Plate / Cloned Car */}
          <button
            onClick={onTriggerGhostPlate}
            className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-600/60 text-[11px] font-mono font-medium flex items-center space-x-1.5 transition active:scale-95 shadow"
          >
            <Ghost className="w-3.5 h-3.5 text-purple-400" />
            <span>2. 👻 Ghost Plate Clone</span>
          </button>

          {/* Step 3: Hit & Run / Watchlist */}
          <button
            onClick={onTriggerHitAndRun}
            className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-600/60 text-[11px] font-mono font-medium flex items-center space-x-1.5 transition active:scale-95 shadow"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>3. 🚨 Hit & Run Intercept</span>
          </button>

          {/* Step 4: Plain English Police Search */}
          <button
            onClick={onOpenNlSearch}
            className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-200 border border-emerald-600/60 text-[11px] font-mono font-medium flex items-center space-x-1.5 transition active:scale-95 shadow"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>4. 💬 Plain-English Search</span>
          </button>

          {/* Guide Explainer Toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center space-x-1 transition"
          >
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span>{showGuide ? 'Hide Guide' : 'How It Works?'}</span>
          </button>
        </div>
      </div>

      {/* Live Incident Explanation Banner (Shows up immediately when judge clicks a button) */}
      {lastScenario && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-t border-indigo-500/40 px-4 py-2.5 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-1.5 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-400/40 mt-0.5">
              <Info className="w-4 h-4 text-cyan-300 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs">{lastScenario.title}</span>
                <span className="px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 font-mono text-[10px] border border-cyan-500/40">
                  {lastScenario.algorithm}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">{lastScenario.description}</p>
              <p className="text-emerald-400 font-mono text-[10px] font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 inline" />
                <span>Police Response: {lastScenario.action}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onDismissScenario}
            className="text-slate-400 hover:text-white p-1"
            title="Dismiss explanation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Expandable Judge Pitch Guide */}
      {showGuide && (
        <div className="bg-slate-950 border-t border-slate-800 p-4 text-xs font-mono space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="font-bold text-sky-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>JUDGE PITCH CHEATSHEET: What Crusaders Solves</span>
            </h4>
            <span className="text-[10px] text-slate-400">Delhi City-Wide ANPR Intelligence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
              <div className="text-sky-300 font-bold flex items-center space-x-1">
                <span>1. Multi-LLM ANPR Vision</span>
              </div>
              <p className="text-slate-400 font-sans">
                Uploads vehicle photos or CCTV frames, extracts registration plates via multimodal AI (OpenRouter / Groq) with zero manual tagging.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
              <div className="text-purple-300 font-bold flex items-center space-x-1">
                <span>2. Cloned / Ghost Plates</span>
              </div>
              <p className="text-slate-400 font-sans">
                Calculates minimum physical traversal time via <b>Dijkstra Graph Algorithms</b>. If a car teleports across Delhi faster than speed of light, it flags duplicate fake plates.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
              <div className="text-rose-300 font-bold flex items-center space-x-1">
                <span>3. Hit & Run Interception</span>
              </div>
              <p className="text-slate-400 font-sans">
                <b>Markov Transition Probability</b> calculates which camera the fleeing car will hit next and dispatches the nearest PCR patrol unit with live intercept countdown.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
              <div className="text-emerald-300 font-bold flex items-center space-x-1">
                <span>4. Groq 120B Police Chat</span>
              </div>
              <p className="text-slate-400 font-sans">
                Officers don't need SQL knowledge. Type <i>"Show red SUVs speeding near AIIMS"</i> and AI queries SQLite in ~150ms and pins targets on the OpenStreetMap.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

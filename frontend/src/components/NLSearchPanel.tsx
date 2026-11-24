import React, { useState } from 'react';
import { NLQueryResult } from '../types';
import { Sparkles, Terminal, Database, Send, MapPin, Check, Copy, AlertCircle } from 'lucide-react';

interface NLSearchPanelProps {
  onPinResultsToMap: (pins: Array<{ lat: number; lon: number; label: string; plate?: string }>) => void;
}

export const NLSearchPanel: React.FC<NLSearchPanelProps> = ({ onPinResultsToMap }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NLQueryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const presets = [
    'Find all speeding vehicles over 80 km/h',
    'Show cloned / ghost plate anomalies',
    'List all vehicles spotted near IGI Airport',
    'Active watchlist suspects caught on camera',
    'Tactical convoy pairs moving together',
    'Vehicles spotted at Connaught Place'
  ];

  const handleSearch = async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    setLoading(true);
    setQuery(queryText);

    try {
      const res = await fetch('/api/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data: NLQueryResult = await res.json();
      setResult(data);

      // Auto pin to map if results contain lat/lon or camera info
      extractAndPin(data.results);
    } catch (err) {
      console.error('NL Query failed', err);
    } finally {
      setLoading(false);
    }
  };

  const extractAndPin = (rows: any[]) => {
    const pins: Array<{ lat: number; lon: number; label: string; plate?: string }> = [];
    rows.forEach((r) => {
      if (r.lat && r.lon) {
        pins.push({
          lat: r.lat,
          lon: r.lon,
          label: r.camera_name || r.camera_id || 'Matched Camera',
          plate: r.plate
        });
      }
    });
    if (pins.length > 0) {
      onPinResultsToMap(pins);
    }
  };

  const handleCopySql = () => {
    if (result?.generated_sql) {
      navigator.clipboard.writeText(result.generated_sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-slate-200">
      {/* Search Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
            Gemini NL-to-SQL Intelligence
          </span>
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            gemini-2.5-flash
          </span>
        </div>

        {/* Query Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(query);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything in natural language (e.g. find all speeding vehicles)..."
            className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono shadow-inner"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-1.5 p-1.5 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Query Preset Pills */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(preset)}
              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[10px] font-mono text-slate-300 hover:text-white transition border border-slate-700"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && (
          <div className="py-12 text-center space-y-2">
            <Sparkles className="w-7 h-7 mx-auto text-sky-400 animate-spin" />
            <div className="text-xs font-mono text-slate-400">Synthesizing SQL and querying SQLite telemetry...</div>
          </div>
        )}

        {!loading && !result && (
          <div className="text-center py-16 text-slate-500 space-y-2">
            <Database className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-mono">Run a natural language query or pick a preset above.</p>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-3">
            {/* Generated SQL Box */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 space-y-2 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-800 pb-1.5">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" />
                  <span>GENERATED SQL (READ-ONLY)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold ${
                    result.mode === 'GEMINI_2.5_FLASH'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {result.mode}
                  </span>
                  <button
                    onClick={handleCopySql}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Copy SQL"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <pre className="text-[11px] font-mono text-sky-300 whitespace-pre-wrap break-all bg-black/40 p-2 rounded border border-slate-900 overflow-x-auto">
                {result.generated_sql}
              </pre>

              <div className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {result.explanation}
              </div>
            </div>

            {/* Results Controls */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="text-slate-300">
                Matched Rows: <b className="text-emerald-400">{result.results_count}</b>
              </div>
              <button
                onClick={() => extractAndPin(result.results)}
                className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono flex items-center space-x-1 transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Pin to Map</span>
              </button>
            </div>

            {/* Results Table */}
            {result.results_count > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60 shadow">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                      {Object.keys(result.results[0]).slice(0, 5).map((col) => (
                        <th key={col} className="p-2 whitespace-nowrap">
                          {col.replace('_', ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {result.results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition">
                        {Object.keys(result.results[0]).slice(0, 5).map((col) => (
                          <td key={col} className="p-2 whitespace-nowrap text-slate-300">
                            {col === 'plate' ? (
                              <span className="font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {row[col]}
                              </span>
                            ) : col === 'speed_kmh' ? (
                              <span className={row[col] > 80 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                {row[col]} km/h
                              </span>
                            ) : (
                              String(row[col] ?? '-')
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded border border-slate-800 text-center text-xs text-slate-500 font-mono">
                Query executed successfully with 0 matching rows.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

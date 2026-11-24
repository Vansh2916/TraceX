import React, { useState, useRef } from 'react';
import { Sparkles, Send, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface AISearchAssistantCardProps {
  onExecuteQuery?: (query: string) => void;
}

interface AssistantMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  found?: boolean;
  isError?: boolean;
  requestedPlate?: string;
  thumb?: string;
}

export const AISearchAssistantCard: React.FC<AISearchAssistantCardProps> = ({
  onExecuteQuery,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-1',
      sender: 'user',
      text: 'Show sightings for DL 1C AA 9999',
    },
    {
      id: 'init-2',
      sender: 'ai',
      text: 'Vehicle DL 1C AA 9999 logged at Lajpat Nagar Flyover (CAM_10). Moving within speed limit.',
      found: true,
      requestedPlate: 'DL 1C AA 9999',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const activeRequestIdRef = useRef<number>(0);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const requestId = ++activeRequestIdRef.current;
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: `u-${requestId}`, sender: 'user', text: userText },
    ]);
    setLoading(true);

    try {
      const res = await fetch('/api/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText }),
      });

      // Ignore outdated response if a newer query was submitted
      if (requestId !== activeRequestIdRef.current) return;

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      let answerText = '';
      let isFound = data.found ?? (data.results && data.results.length > 0);

      if (data.query_type === 'vehicle_lookup' && !isFound) {
        const plate = data.requested_plate || userText;
        answerText = `No vehicle records found. No sightings are currently available for ${plate}. Please verify the registration number or try another search.`;
      } else if (!isFound) {
        answerText = data.message || `No records found matching: "${userText}".`;
      } else {
        answerText =
          data.message ||
          data.explanation ||
          `Found ${data.results_count || data.results?.length} sighting(s) matching your inquiry.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${requestId}`,
          sender: 'ai',
          text: answerText,
          found: isFound,
          requestedPlate: data.requested_plate,
        },
      ]);
      if (onExecuteQuery) onExecuteQuery(userText);
    } catch (err) {
      if (requestId !== activeRequestIdRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${requestId}`,
          sender: 'ai',
          text: `Query service temporarily unavailable. Failed to process "${userText}". Please verify connection and retry.`,
          isError: true,
          found: false,
        },
      ]);
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3 flex flex-col justify-between h-[190px] select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center space-x-1.5">
          <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-[12px] font-bold text-slate-800">
            AI Search Assistant ✨
          </h4>
        </div>
        {/* Soundwave audio icon */}
        <div className="flex items-center space-x-0.5 text-indigo-500">
          <span className="w-0.5 h-2 bg-indigo-500 rounded-full" />
          <span className="w-0.5 h-3.5 bg-indigo-500 rounded-full" />
          <span className="w-0.5 h-1.5 bg-indigo-500 rounded-full" />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="space-y-1.5 overflow-y-auto max-h-[92px] pr-1 py-1 text-[10.5px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'user' ? (
              <div className="bg-blue-600 text-white rounded-xl rounded-tr-xs px-2.5 py-1 max-w-[85%] font-medium leading-relaxed shadow-xs">
                {m.text}
              </div>
            ) : (
              <div
                className={`border rounded-xl rounded-tl-xs p-1.5 max-w-[95%] flex items-start space-x-1.5 shadow-xs ${
                  m.isError
                    ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                    : m.found === false
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200/80 text-slate-700'
                }`}
              >
                {m.isError ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                ) : m.found === false ? (
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="leading-snug">{m.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-[10px] text-slate-400 font-mono animate-pulse">
            Analyzing Delhi corridor network...
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything..."
          className="w-full bg-slate-50 border border-slate-200 rounded-full pl-3 pr-8 py-1 text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="absolute right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition shadow-xs cursor-pointer"
        >
          <Send className="w-2.5 h-2.5" />
        </button>
      </form>
    </div>
  );
};

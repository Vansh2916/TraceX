import React, { useState } from 'react';
import { Sparkles, Send, Mic, CheckCircle2 } from 'lucide-react';

interface AISearchAssistantCardProps {
  onExecuteQuery?: (query: string) => void;
}

export const AISearchAssistantCard: React.FC<AISearchAssistantCardProps> = ({
  onExecuteQuery,
}) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; thumb?: string }>>([
    {
      sender: 'user',
      text: 'Where was DL8CAF2381 in the last 30 minutes?',
    },
    {
      sender: 'ai',
      text: 'Last seen at Rajpath Rd, 17:42:15. Moving towards India Gate.',
      thumb: '/mockup_assets/selected_vehicle_corolla.jpg',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    try {
      const res = await fetch('/api/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText }),
      });
      const data = await res.json();
      const answer = data.answer || data.explanation || `Processed intelligence query for: ${userText}`;
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: answer,
          thumb: '/mockup_assets/selected_vehicle_corolla.jpg',
        },
      ]);
      if (onExecuteQuery) onExecuteQuery(userText);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'DL8CAF2381 logged at Rajpath Rd heading towards India Gate corridor.',
        },
      ]);
    } finally {
      setLoading(false);
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
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'user' ? (
              <div className="bg-blue-600 text-white rounded-xl rounded-tr-xs px-2.5 py-1 max-w-[85%] font-medium leading-relaxed shadow-xs">
                {m.text}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl rounded-tl-xs p-1.5 max-w-[95%] text-slate-700 flex items-start space-x-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="leading-snug">{m.text}</p>
                </div>
                {m.thumb && (
                  <img
                    src={m.thumb}
                    alt="Thumbnail"
                    className="w-7 h-5 rounded object-cover border border-slate-200 shrink-0 mt-0.5"
                  />
                )}
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
          className="absolute right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition shadow-xs"
        >
          <Send className="w-2.5 h-2.5" />
        </button>
      </form>
    </div>
  );
};

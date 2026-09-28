import React, { useState } from 'react';

export default function SmartRoomSearch({ onSearchResults, allRoomsAvailability, currentDay, currentPeriod }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState('');

  const quickPrompts = [
    "I need an AC room on the ground floor for the next 2 hours",
    "Quiet room with a projector on 1st or 2nd floor",
    "Any empty room with 50+ seats right now"
  ];

  const handleAISearch = async (queryText) => {
    const searchQuery = queryText || prompt;
    if (!searchQuery.trim() || loading) return;
    setLoading(true);
    setAiAnalysis('');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not defined in .env");

      const systemContext = `
You are the Smart-Search Floor Manager AI for a college campus.
Current Day: ${currentDay}, Current Period Index: ${currentPeriod + 1}.

LIVE ROOM STATUSES:
${JSON.stringify(allRoomsAvailability, null, 2)}

TASK:
1. Parse the student's natural language request (extract: floor preference, duration/hours, amenities like AC/Projector/Capacity).
2. Filter the rooms strictly matching their criteria.
3. Recommend the BEST 1-3 rooms. Specify: Room ID, Floor, AC status, and how many periods/hours it stays free.
4. Output concise bullet points followed by actionable advice.
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemContext}\n\nStudent Query: "${searchQuery}"` }] }]
          })
        }
      );

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No suitable rooms found.";
      setAiAnalysis(reply);
    } catch (err) {
      console.error(err);
      setAiAnalysis(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 border border-purple-500/20 mb-8 backdrop-blur-2xl">
      <div className="flex items-center space-x-2.5 mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">
          AI Smart Room Finder (Natural Language)
        </h3>
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
          placeholder='e.g., "I need an AC room on the ground floor for me and my team for the next 2 hours"'
          className="flex-1 glass-input px-4 py-3 rounded-xl text-sm"
        />
        <button
          onClick={() => handleAISearch()}
          disabled={loading || !prompt.trim()}
          className="px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] disabled:opacity-40 border border-white/20 hover:border-purple-400/40 text-purple-200 font-bold text-sm backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all cursor-pointer whitespace-nowrap"
        >
          {loading ? "Searching..." : "Locate Room"}
        </button>
      </div>

      {/* Preset Chip Queries */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => { setPrompt(q); handleAISearch(q); }}
            className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 whitespace-nowrap transition-all cursor-pointer text-[11px]"
          >
            ⚡ {q}
          </button>
        ))}
      </div>

      {/* AI Search Output */}
      {aiAnalysis && (
        <div className="mt-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap animate-[fadeIn_0.3s_ease-out]">
          <strong className="block text-purple-300 font-bold uppercase tracking-wider mb-1.5 text-[11px]">
            AI Allocation Recommendation:
          </strong>
          {aiAnalysis}
        </div>
      )}
    </div>
  );
}
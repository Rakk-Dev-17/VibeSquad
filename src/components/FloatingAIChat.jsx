import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';

export default function FloatingAIChat({ currentUser, selectedSection, results }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Hello! I'm your Attendance Strategist. Ask me anything like: "If I skip 3 classes in Transforms, will I fall below 75%?" or "Which subject is most dangerous?"`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing VITE_GEMINI_API_KEY in .env");
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `
You are the AI Attendance Strategist for a college student inside the VibeCraft Attendance Portal.
Semester boundary: August 29, 2026 to November 29, 2026.
Mandatory minimum attendance threshold: 75%.
Excellence threshold: 90%.

STUDENT CONTEXT:
Roll Number: ${currentUser || 'Unknown'}
Section: ${selectedSection || 'Unknown'}
CURRENT LIVE ATTENDANCE DATA:
${JSON.stringify(results || {}, null, 2)}

YOUR INSTRUCTIONS:
1. When a student asks about skipping, taking leaves, or bunks (e.g., "What if I take 3 days off in [Subject]?" or "Can I miss next week?"), ALWAYS run the exact math:
   - Calculate new attendance percentage: (Attended / (Conducted + missedOrRemainingAttended)) or based on projected denominator.
   - Specifically tell them if it drops below 75%.
   - State exactly how many safe bunks remain after that scenario.
2. If their current percentage is already below 75%, trigger a sharp WARNING for that subject.
3. If they are in 'Irreversible Detention' (impossible to hit 75% even with 100% attendance from now on), inform them with empathy and clarity.
4. Keep replies clear, structured with short bullet points, actionable, and mathematically exact. No fluff.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nStudent Question: ${userMessage}` }] }
        ]
      });

      const replyText = response.text || "I was unable to calculate that scenario. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          text: `Error connecting to AI: ${err.message || 'Check your VITE_GEMINI_API_KEY'}. Ensure it is set in .env.` 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button (Glass Edition) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center space-x-3 px-5 py-3.5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-95 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(168,85,247,0.25)] text-slate-100 font-semibold transition-all duration-300 hover:border-purple-400/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-indigo-200 to-pink-200">
            Ask AI Strategist
          </span>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[370px] sm:w-[420px] h-[550px] glass-card flex flex-col bg-slate-950/90 backdrop-blur-2xl border border-white/20 shadow-[0_12px_45px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden animate-[fadeIn_0.25s_ease-out]">
          
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/[0.04] backdrop-blur-md flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 border border-white/20 flex items-center justify-center text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  AI Attendance Strategist
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-mono">LIVE</span>
                </h4>
                <p className="text-[10px] text-slate-400">Contextual simulator for {currentUser || 'Student'}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                      : 'bg-white/[0.05] border border-white/10 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.05] border border-white/10 p-3 rounded-2xl rounded-bl-none text-slate-400 flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="text-[11px] text-purple-300 font-medium ml-1">Analyzing schedule math...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Scenario Chips */}
          <div className="px-3 py-2 border-t border-white/10 bg-black/30 backdrop-blur-md flex gap-2 overflow-x-auto text-[10px]">
            <button
              onClick={() => setInput("What happens if I take 2 days leave this week?")}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-purple-300 whitespace-nowrap transition-all cursor-pointer"
            >
              ⚡ 2 Days Leave Impact
            </button>
            <button
              onClick={() => setInput("Which subject has my lowest safe margin?")}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-purple-300 whitespace-nowrap transition-all cursor-pointer"
            >
              ⚠️ Most Dangerous Subject
            </button>
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-slate-950/80 backdrop-blur-md">
            <input
              type="text"
              placeholder="Ask scenario (e.g. Can I skip tomorrow?)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.16] disabled:opacity-30 border border-white/20 hover:border-purple-400/40 text-purple-200 font-bold text-xs backdrop-blur-xl shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all cursor-pointer"
            >
              Send
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect } from "react";
import { chatWithAssistantApi } from "../services/api";

export function AIAssistantWidget({ profile, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! 👋 I am your AI Career Companion Assistant. How can I help you with internship matching, resume parsing, or skill gap roadmaps today?"
    }
  ]);

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: "user", content: query.trim() };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const data = await chatWithAssistantApi(query.trim(), profile, messages);
      const botMsg = { role: "assistant", content: data.reply || "I'm here to help!" };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an issue connecting to the AI Assistant. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "🎯 How does 5-factor matching work?",
    "📄 How do I upload my resume?",
    "💡 How to bridge my skill gap?"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Orb Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center animate-glow"
          title="Open AI Career Assistant"
        >
          <span className="text-2xl animate-float">🤖</span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900"></span>
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className={`w-[90vw] sm:w-[380px] h-[520px] rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-300 animate-fade-in-up ${
          darkMode ? "bg-slate-900/95 border-slate-800 text-white backdrop-blur-xl" : "bg-white/95 border-slate-200 text-slate-900 backdrop-blur-xl"
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">AI Career Assistant</h3>
                <span className="text-[10px] text-blue-200 flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online & Ready
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-md"
                      : darkMode
                      ? "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60"
                      : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-fade-in">
                <div className={`p-3.5 rounded-2xl rounded-bl-none border flex items-center gap-2 ${
                  darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
                }`}>
                  <svg className="animate-spin h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI Assistant is typing...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className={`px-4 py-2 border-t flex gap-1.5 overflow-x-auto ${
            darkMode ? "border-slate-800/80 bg-slate-950/40" : "border-slate-100 bg-slate-50"
          }`}>
            {suggestions.map((sug, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleSend(sug)}
                disabled={loading}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  darkMode
                    ? "bg-slate-800 hover:bg-slate-750 text-blue-300 border-slate-700"
                    : "bg-white hover:bg-slate-100 text-blue-700 border-slate-200"
                }`}
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className={`p-3 border-t flex gap-2 items-center ${
              darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
            }`}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any question..."
              className={`flex-1 border rounded-2xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                darkMode
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
              }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white p-2.5 rounded-2xl shadow transition-all flex items-center justify-center"
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

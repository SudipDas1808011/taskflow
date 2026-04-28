"use client";
import { useState, useRef, useEffect } from "react";

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! How can I help you today?" }
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" , block: "end"});
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", text: inputValue };
    const botResponse = { role: "bot", text: "That's interesting! Tell me more." };

    setMessages((prev) => [...prev, userMessage, botResponse]);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="w-full h-[450px] flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md">
        <h2 className="text-white font-bold text-lg tracking-tight">AI Assistant</h2>
        <p className="text-indigo-100 text-xs">Always active</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-white/50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-slate-200 text-slate-800 rounded-tl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-5 bg-white border-t border-slate-200">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 ml-1 tracking-wider uppercase">
            Your Message
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="flex-1 border-2 border-slate-100 bg-slate-50 p-3 text-sm rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
            />
            <button
              onClick={handleSend}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
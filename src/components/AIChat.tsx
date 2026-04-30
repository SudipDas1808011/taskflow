"use client";

import { useState, useRef, useEffect } from "react";
import { sendToAI } from "@/services/aiService";
import { deleteTask, postTask, updateTask } from "@/services/taskService";
import { getChatHistory, replaceChatHistory } from "@/services/chatService";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function AIChat({
  setRefresh,
}: {
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // Track the stream to close it
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Cleanup: Ensure mic is off if component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    const saveMessagesToDB = async () => {
      await replaceChatHistory(messages, token);
    };
    if (token) {
      saveMessagesToDB();
    }
  }, [messages, isLoading, token]);

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setEmail(localStorage.getItem("email") || "");
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!token) return;
      const history = await getChatHistory(token);
      setMessages(history || []);
    };
    fetchChatHistory();
  }, [token]);

  const normalizeAIResponse = (res: any) => ({
    type: res?.type || "chat",
    reply: res?.reply || "",
    intent: res?.intent || {},
    match: res?.match || null,
  });

  const sendAI = async (updatedMessages: Message[]) => {
    const email = localStorage.getItem("email");
    if (!email) return null;
    const resRaw = await sendToAI(updatedMessages, email);
    return normalizeAIResponse(resRaw);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", text: inputValue };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiRes = await sendAI(updatedMessages);
      if (!aiRes) {
        setIsLoading(false);
        return;
      }

      const intent = aiRes.intent || {};
      const operation = intent.operation;
      const match = aiRes.match;
      let botReply = aiRes.reply || "I couldn't understand that request";

      if (aiRes.type === "chat") {
        setMessages([...updatedMessages, { role: "bot", text: botReply }]);
      } else if (aiRes.type === "goal") {
        const goalRes = await fetch("/api/ai/goal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: intent.data.goal,
            context: intent.data.context,
            email: localStorage.getItem("email"),
          }),
        });
        const goalData = await goalRes.json();
        if (goalData?.plan) {
          setRefresh((prev) => !prev);
        } else {
          setMessages([...updatedMessages, { role: "bot", text: "Failed to generate goal plan" }]);
        }
      } else if (aiRes.type === "task") {
        if (operation === "add") {
          await postTask(
            {
              name: intent.data?.name,
              dueDate: intent.data?.dueDate,
              dueTime: intent.data?.dueTime,
              description: intent.data?.description || "",
              isGoal: false,
              isCompleted: false,
            },
            token
          );
          botReply = "Task added successfully";
          setRefresh((prev) => !prev);
        }

        if (match?.status === "matched") {
          const taskId = match.taskId;
          const userEmail = localStorage.getItem("email") || "";
          if (operation === "delete") await deleteTask(userEmail, taskId, token);
          if (operation === "retry") await updateTask(userEmail, taskId, false, token);
          if (operation === "complete") await updateTask(userEmail, taskId, true, token);
          botReply = "Done";
          setRefresh((prev) => !prev);
        }
        setMessages([...updatedMessages, { role: "bot", text: botReply }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = async () => {
    if (isRecording) {
      // 1. Stop the recorder
      mediaRecorderRef.current?.stop();
      
      // 2. IMPORTANT: Stop the physical hardware (microphone tracks)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Keep reference to close later
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");
        
        const res = await fetch("/api/whisper", { method: "POST", body: formData });
        const data = await res.json();
        if (data?.text) setInputValue(data.text);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full h-[450px] flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
          <h2 className="text-white font-bold text-lg tracking-tight">AI Assistant</h2>
        </div>
        <div className="text-[10px] bg-white/20 backdrop-blur-sm border border-white/30 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest">
          v2.0
        </div>
      </div>

      {/* Chat History */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-sm ${
                msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center shadow-sm">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-end">
        <button
          onClick={handleVoice}
          className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 ${
            isRecording 
              ? "bg-red-500 text-white shadow-lg shadow-red-200 ring-2 ring-red-100 animate-pulse" 
              : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200"
          }`}
        >
          {isRecording ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="6"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          )}
        </button>

        <div className="flex-1 relative">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me to schedule something..."
            disabled={isLoading}
            className="w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-xl outline-none focus:border-indigo-400 transition-all"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className={`h-10 px-4 flex items-center justify-center gap-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${
            isLoading || !inputValue.trim() ? "bg-slate-100 text-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-100"
          }`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Send</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendToAI } from "@/services/aiService";
import { deleteTask, postTask, updateTask } from "@/services/taskService";
import { getChatHistory, replaceChatHistory } from "@/services/chatService";

/**
 * Represents a single message in the chat interface.
 */
interface Message {
  role: "user" | "bot";
  text: string;
}

/**
 * Structure for normalized AI responses.
 */
interface AIResponse {
  type: "chat" | "goal" | "task" | "information";
  reply: string;
  intent: {
    operation?: "add" | "delete" | "retry" | "complete";
    data?: {
      query?: string;
      goal?: string;
      context?: string;
      name?: string;
      dueDate?: string;
      dueTime?: string;
      description?: string;
    };
  };
  match: {
    status: string;
    taskId: string;
  } | null;
}

interface AIChatProps {
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AIChat({ setRefresh }: AIChatProps): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((): void => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
    const saveMessagesToDB = async (): Promise<void> => {
      try {
        await replaceChatHistory(messages, token);
      } catch {
        // Error handled silently for background persistence
      }
    };
    if (token && messages.length > 0) {
      void saveMessagesToDB();
    }
  }, [messages, token, scrollToBottom]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    setToken(storedToken);

    const fetchChatHistory = async (activeToken: string): Promise<void> => {
      try {
        const history = await getChatHistory(activeToken);
        if (history && Array.isArray(history)) {
          setMessages(history);
        }
      } catch {
        // Fallback to initial state
      }
    };

    if (storedToken) {
      void fetchChatHistory(storedToken);
    }
  }, []);

  const normalizeAIResponse = (res: any): AIResponse => ({
    type: res?.type || "chat",
    reply: res?.reply || "",
    intent: res?.intent || {},
    match: res?.match || null,
  });

  const sendAI = async (updatedMessages: Message[]): Promise<AIResponse | null> => {
    const userEmail = localStorage.getItem("email");
    if (!userEmail) return null;
    try {
      const resRaw = await sendToAI(updatedMessages, userEmail);
      return normalizeAIResponse(resRaw);
    } catch {
      return null;
    }
  };

  const runAgent = async (res: AIResponse) => {
    console.log("agent input:", res);

    const { type, intent, match, reply } = res;

    if (type === "chat") {
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
      return;
    }

    // INFORMATION
    if (type === "information") {
      try {
        const getTasks = (key:any) => JSON.parse(localStorage.getItem(key) || "[]");

        const formatTask = (t:any) => `${t.name}${t.dueDate ? ` (${t.dueDate}${t.dueTime ? ' ' + t.dueTime : ''})` : ''}`;

        const runningTasks = getTasks("runningTasks").map(formatTask);
        const dueTasks = getTasks("dueTasks").map(formatTask);
        const completedTasks = getTasks("completedTasks").map(formatTask);

        if (!runningTasks.length && !dueTasks.length && !completedTasks.length) {
          setMessages(prev => [...prev, { role: "bot", text: "You have no tasks at the moment." }]);
          return;
        }

        const infoRes = await fetch("/api/ai/information", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: intent?.data?.query,
            tasks: { runningTasks, dueTasks, completedTasks },
          }),
        });

        const data = await infoRes.json();
        setMessages((prev) => [...prev, { role: "bot", text: data?.reply || "No information found" }]);
      } catch (err) {
        console.error("Error:", err);
        setMessages((prev) => [...prev, { role: "bot", text: "Failed to fetch information" }]);
      }
      return;
    }

    if (type === "goal") {
      const goalRes = await fetch("/api/ai/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: intent?.data?.goal,
          context: intent?.data?.context,
          email: localStorage.getItem("email"),
        }),
      });

      const data = await goalRes.json();
      console.log("goal api:", data);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: data?.plan
            ? "Goal plan created successfully!"
            : "Failed to create goal",
        },
      ]);

      setRefresh((p) => !p);
      return;
    }

    if (type === "task") {
      const email = localStorage.getItem("email") || "";

      // ADD TASK
      if (intent?.operation === "add") {
        await postTask(
          {
            name: intent?.data?.name || "Untitled Task",
            dueDate: intent?.data?.dueDate || "",
            dueTime: intent?.data?.dueTime || "",
            description: intent?.data?.description || "",
            isGoal: false,
            isCompleted: false,
          },
          token
        );

        console.log("task added");

        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "Task added successfully" },
        ]);

        setRefresh((p) => !p);
        return;
      }

      // MATCHED TASK OPS
      if (match?.status === "matched") {
        const taskId = match.taskId;

        console.log("task matched:", taskId);

        if (intent?.operation === "delete") {
          await deleteTask(email, taskId, token);
        }

        if (intent?.operation === "retry") {
          //await updateTask(email, taskId, false, token);
        }

        if (intent?.operation === "complete") {
          await updateTask(
            { taskId: taskId, isCompleted: true },
            token
          );
        }

        setMessages((prev) => [...prev, { role: "bot", text: "Done" }]);

        setRefresh((p) => !p);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: reply || "Task not processed" },
      ]);

      return;
    }

    // fallback
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: reply || "Unsupported response" },
    ]);
  };

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", text: inputValue };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const aiRes = await sendAI(updatedMessages);

      console.log("final AI:", aiRes);

      if (!aiRes) return;

      await runAgent(aiRes);
    } catch (err) {
      console.log("handleSend error:", err);

      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Something went wrong" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoice = async (): Promise<void> => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => audioChunksRef.current.push(e.data);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice.webm");

        try {
          const res = await fetch("/api/whisper", { method: "POST", body: formData });
          const data = await res.json();
          if (data?.text) setInputValue(data.text);
        } catch {
          // Voice processing error
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  return (
    <div className= "w-full h-[450px] flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm" >
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between shadow-md z-10" >
      <div className="flex items-center gap-2" >
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" > </div>
          < h2 className = "text-white font-bold text-lg tracking-tight" > AI Assistant </h2>
            </div>
            < div className = "text-[10px] bg-white/20 backdrop-blur-sm border border-white/30 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-widest" >
              v2.0
                </div>
                </div>

                < div ref = { chatContainerRef } className = "flex-1 overflow-y-auto p-4 space-y-4" >
                {
                  messages.map((msg, i) => (
                    <div key= { i } className = {`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`} >
                  <div className={
    `px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] shadow-sm ${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"
      }`
  }>
    { msg.text }
    </div>
    </div>
        ))
}
{
  isLoading && (
    <div className="flex justify-start" >
      <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1.5 items-center shadow-sm" >
        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" > </span>
          < span className = "w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" > </span>
            < span className = "w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" > </span>
              </div>
              </div>
        )
}
</div>

  < div className = "p-4 bg-white border-t border-slate-100 flex gap-2 items-end" >
    <button
          type="button"
onClick = { handleVoice }
className = {`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl transition-all duration-300 ${isRecording
  ? "bg-red-500 text-white shadow-lg shadow-red-200 ring-2 ring-red-100 animate-pulse"
  : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200"
  }`}
        >
  {
    isRecording?(
             <svg xmlns = "http://www.w3.org/2000/svg" width = "18" height = "18" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "2.5" strokeLinecap = "round" strokeLinejoin = "round" > <circle cx="12" cy = "12" r = "6" /> </svg>
    ): (
        <svg xmlns = "http://www.w3.org/2000/svg" width = "18" height = "18" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "2.5" strokeLinecap = "round" strokeLinejoin = "round"><path d = "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/> <path d="M19 10v2a7 7 0 0 1-14 0v-2" /> <line x1="12" x2 = "12" y1 = "19" y2 = "22" /> </svg>
          )}
</button>

  < div className = "flex-1 relative" >
    <input
            type="text"
value = { inputValue }
onChange = {(e) => setInputValue(e.target.value)}
onKeyDown = {(e) => e.key === "Enter" && void handleSend()}
placeholder = "Ask me to schedule something..."
disabled = { isLoading }
className = "w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-xl outline-none focus:border-indigo-400 transition-all"
  />
  </div>

  < button
type = "button"
onClick = { handleSend }
disabled = { isLoading || !inputValue.trim()}
className = {`h-10 px-4 flex items-center justify-center gap-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 ${isLoading || !inputValue.trim() ? "bg-slate-100 text-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-100"
  }`}
        >
  {
    isLoading?(
            <div className = "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" > </div>
    ): (
        <>
              <span>Send</ span >
  <svg xmlns="http://www.w3.org/2000/svg" width = "14" height = "14" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "3" strokeLinecap = "round" strokeLinejoin = "round" > <line x1="22" y1 = "2" x2 = "11" y2 = "13" /> <polygon points="22 2 15 22 11 13 2 9 22 2" /> </svg>
    </>
          )}
</button>
  </div>
  </div>
  );
}
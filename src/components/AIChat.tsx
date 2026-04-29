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
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hello! How can I help you today?" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token_local = localStorage.getItem("token") || "";
    setToken(token_local);
    const email_local = localStorage.getItem("email") || "";
    setEmail(email_local);
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      console.log("token-for-history", token);
      if (token) {
        const history = await getChatHistory(token);
        console.log("chat-history: ", history);
        setMessages(history);
      }

    };
    fetchChatHistory();
  }, [token]);

  const normalizeAIResponse = (res: any) => {
    return {
      type: res?.type || "chat",
      reply: res?.reply || "",
      intent: res?.intent || {},
      match: res?.match || null,
    };
  };

  const sendAI = async (updatedMessages: Message[]) => {
    try {
      const email = localStorage.getItem("email");
      const token = localStorage.getItem("token");

      if (!email || !token) {
        console.log("Missing auth data");
        return;
      }

      const resRaw = await sendToAI(updatedMessages, email);
      const res = normalizeAIResponse(resRaw);

      console.log("AI response received:", res);

      const intent = res.intent || {};
      const match = res.match;
      const operation = intent.operation;

      // =========================
      // BOT MESSAGE
      // =========================
      const botMessage: Message = {
        role: "bot",
        text:
          match?.message ||
          res.reply ||
          "I couldn't process that request.",
      };
      const botMessageManual = (message:String) =>{
        let failedMessage: Message = {
        role: "bot",
        text:
          `${message}`,
      };
      setMessages((prev) => [...prev, failedMessage]);
      }

      setMessages((prev) => [...prev, botMessage]);

      // =========================
      // VALIDATION GUARD
      // =========================
      if (!operation) {
        console.log("No operation detected");
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: "I couldn't understand that action." },
        ]);
        return;
      }

      const data = intent.data || {};

      // =========================
      // ADD TASK
      // =========================
      if (res.type === "task" && operation === "add") {
        if (!data.name || !data.dueDate || !data.dueTime) {
          console.log("Invalid task data");
          return;
        }

        const taskPayload = {
          name: data.name,
          dueDate: data.dueDate,
          dueTime: data.dueTime,
          description: data.description || "",
          isGoal: false,
          isCompleted: false,
        };

        console.log("Saving task:", taskPayload);

        const response = await postTask(taskPayload, token);
        console.log("DB add response:", response);

        setRefresh((prev) => !prev);
        return;
      }

      // =========================
      // MATCH HANDLING
      // =========================
      if (!match) return;
      if (!match?.status) return;

      console.log("Match result:", match);

      if (match.status === "already_completed") {
        console.log("Task already completed");
        botMessageManual("The requested task already completed");
        return;
      }

      if (match.status === "not_found") {
        console.log("No matching task found");
        botMessageManual("I couldn't find the task");
        return;
      }

      // =========================
      // EXECUTE ACTIONS
      // =========================
      if (match.status === "matched" && match.taskId) {
        const taskId = match.taskId;

        console.log("Matched taskId:", taskId);

        if (operation === "delete") {
          const response = await deleteTask(email, taskId, token);
          console.log("DB delete response:", response);
        }

        if (operation === "retry") {
          const response = await updateTask(email, taskId, false, token);
          console.log("DB retry response:", response);
        }

        if (operation === "complete") {
          const response = await updateTask(email, taskId, true, token);
          console.log("DB complete response:", response);
        }

        setRefresh((prev) => !prev);
        return;
      }
    } catch (error) {
      console.error("AI error:", error);
      
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: inputValue,
    };

    const updated = [...messages, userMessage];
    setMessages(updated);

    sendAI(updated);
    setInputValue("");
  };

  const handleVoice = () => {
    setIsListening(true);
    console.log("Voice started...");

    setTimeout(() => {
      const fakeSpeech = "Hello AI, this is voice input";

      setInputValue((prev) => (prev ? prev + " " + fakeSpeech : fakeSpeech));

      setIsListening(false);
      console.log("Voice captured:", fakeSpeech);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className= "w-full h-[450px] flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm" >
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md" >
      <h2 className="text-white font-bold text-lg tracking-tight" >
        AI Assistant
          </h2>
          < p className = "text-indigo-100 text-xs" > Always active </p>
            </div>

            < div className = "flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-white/50" >
            {
              messages.map((msg, index) => (
                <div
            key= { index }
            className = {`flex ${msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
              >
              <div
              className={
    `max-w-[80%] p-3 rounded-lg text-sm shadow-sm ${msg.role === "user"
      ? "bg-indigo-600 text-white rounded-tr-none"
      : "bg-slate-200 text-slate-800 rounded-tl-none"
      }`
  }
            >
    { msg.text }
    </div>
    </div>
        ))
}
<div ref={ scrollRef } />
  </div>

  < div className = "p-5 bg-white border-t border-slate-200" >
    <div className="flex flex-col gap-1.5" >
      <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase" >
        Your Message
          </label>

          < div className = "flex gap-3 items-center w-full" >
            <button
              onClick={ handleVoice }
className = {`shrink-0 px-4 py-3 rounded-lg text-sm font-bold transition-all active:scale-95
              ${isListening
    ? "bg-red-500 text-white"
    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
  }`}
            >
  { isListening? "🎙": "🎤" }
  </button>

  < input
type = "text"
value = { inputValue }
onChange = {(e) => setInputValue(e.target.value)}
onKeyDown = { handleKeyDown }
placeholder = "Ask me anything..."
className = "flex-1 min-w-0 border-2 border-slate-100 bg-slate-50 p-3 text-sm rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
  />

  <button
              onClick={ handleSend }
className = "shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md"
  >
  Send
  </button>
  </div>
  </div>
  </div>
  </div>
  );
}

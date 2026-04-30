"use client";

import { useState, useRef, useEffect } from "react";
import { sendToAI } from "@/services/aiService";
import { deleteTask, postTask, updateTask } from "@/services/taskService";
import { getChatHistory } from "@/services/chatService";
import { generateGoalPlan } from "@/services/goalService";

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

  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setEmail(localStorage.getItem("email") || "");
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (token) {
        const history = await getChatHistory(token);
        setMessages(history);
      }
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
    try {
      const email = localStorage.getItem("email");
      const token = localStorage.getItem("token");

      if (!email || !token) return;

      const resRaw = await sendToAI(updatedMessages, email);
      const res = normalizeAIResponse(resRaw);

      const intent = res.intent || {};
      const match = res.match;
      const operation = intent.operation;

      const botMessage = (text: string) =>
        setMessages((prev) => [...prev, { role: "bot", text }]);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            match?.message ||
            res.reply ||
            "I couldn't process that request.",
        },
      ]);

      if (!operation) {
        botMessage("I couldn't understand that action.");
        return;
      }

      const data = intent.data || {};

      // =========================
      // ADD TASK
      // =========================
      if (res.type === "task" && operation === "add") {
        const taskPayload = {
          name: data.name,
          dueDate: data.dueDate,
          dueTime: data.dueTime,
          description: data.description || "",
          isGoal: false,
          isCompleted: false,
        };

        await postTask(taskPayload, token);
        setRefresh((prev) => !prev);
        return;
      }

      // =========================
      // GOAL FLOW (FIXED)
      // =========================
      if (res.type === "goal") {
        const goalRes = await fetch("/api/ai/goal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goal: intent.data.goal,
            context: intent.data.context,
            email,
          }),
        });

        const goalData = await goalRes.json();

        if (!goalData?.plan) {
          botMessage("Failed to generate goal plan");
          return;
        }

        setActiveGoal(goalData.plan);
        setGoalModalOpen(true);
        setRefresh((prev) => !prev);

        return;
      }

      // =========================
      // TASK MATCHING
      // =========================
      if (!match || !match.status) return;

      if (match.status === "already_completed") {
        botMessage("The task is already completed");
        return;
      }

      if (match.status === "not_found") {
        botMessage("I couldn't find the task");
        return;
      }

      if (match.status === "matched" && match.taskId) {
        const taskId = match.taskId;

        if (operation === "delete") {
          await deleteTask(email, taskId, token);
        }

        if (operation === "retry") {
          await updateTask(email, taskId, false, token);
        }

        if (operation === "complete") {
          await updateTask(email, taskId, true, token);
        }

        setRefresh((prev) => !prev);
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

    setTimeout(() => {
      const fakeSpeech = "Hello AI, this is voice input";
      setInputValue(fakeSpeech);
      setIsListening(false);
    }, 2000);
  };

  return (
    <div className="w-full h-[450px] flex flex-col bg-slate-50 border rounded-xl overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white font-bold">
        AI Assistant
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg text-sm max-w-[80%] ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="p-3 flex gap-2 border-t">
        <button onClick={handleVoice} className="px-3 bg-slate-200 rounded">
          🎤
        </button>

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 border p-2 rounded"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button
          onClick={handleSend}
          className="bg-indigo-600 text-white px-4 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
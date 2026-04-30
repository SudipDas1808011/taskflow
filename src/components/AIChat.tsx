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

  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    const saveMessagesToDB = async () =>{
      await replaceChatHistory(messages, token);
      console.log("bot reply saved to DB");
    }
    console.log("message is: ",messages);
    if(token){
      saveMessagesToDB();
    }
  }, [messages]);

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setEmail(localStorage.getItem("email") || "");
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!token) return;

      const history = await getChatHistory(token);
      console.log("Chat history:", history);

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
    const token = localStorage.getItem("token");

    if (!email || !token) return null;

    const resRaw = await sendToAI(updatedMessages, email);
    console.log("AI RAW:", resRaw);

    return normalizeAIResponse(resRaw);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: inputValue,
    };

    let updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await replaceChatHistory(updatedMessages, token);
    console.log("use message  saved to DB");
    setInputValue("");

    const aiRes = await sendAI(updatedMessages);
    if (!aiRes) return;

    const intent = aiRes.intent || {};
    const operation = intent.operation;
    const match = aiRes.match;

    let botReply = aiRes.reply || "I couldn't understand that request";
    
    // =========================
    // CHAT ONLY
    // =========================
    if (aiRes.type === "chat") {
      setMessages([...updatedMessages, { role: "bot", text: botReply }]);
      return;
    }

    // =========================
    // GOAL FLOW (ADDED)
    // =========================
    if (aiRes.type === "goal") {
      const email = localStorage.getItem("email");

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

      console.log("Goal Response:", goalData);

      if (!goalData?.plan) {
        botReply = "Failed to generate goal plan";
      } else {
        setActiveGoal(goalData.plan);
        setGoalModalOpen(true);
        setRefresh((prev) => !prev);
        return;
      }
    }

    // =========================
    // TASK FLOW
    // =========================
    if (aiRes.type === "task") {
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

        if (operation === "delete") {
          await deleteTask(email, taskId, token);
        }

        if (operation === "retry") {
          await updateTask(email, taskId, false, token);
        }

        if (operation === "complete") {
          await updateTask(email, taskId, true, token);
        }

        botReply = "Done";
        setRefresh((prev) => !prev);
      }
    }

    setMessages([...updatedMessages, { role: "bot", text: botReply }]);
    
  };

  const handleVoice = () => {
    setIsListening(true);

    setTimeout(() => {
      setInputValue("Hello AI, this is voice input");
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
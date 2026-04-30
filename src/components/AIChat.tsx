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

  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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

  useEffect(() => {
    scrollToBottom();
    const saveMessagesToDB = async () => {
      await replaceChatHistory(messages, token);
    };
    if (token) {
      saveMessagesToDB();
    }
  }, [messages, isLoading]);

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

    const userMessage: Message = {
      role: "user",
      text: inputValue,
    };

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
          setActiveGoal(goalData.plan);
          setGoalModalOpen(true);
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
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
      console.log("mic error:", err);
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full h-[450px] flex flex-col bg-slate-50 border rounded-xl overflow-hidden">
      <div className="bg-indigo-600 p-4 text-white font-bold">AI Assistant</div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-200"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-200 p-3 rounded-lg flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex gap-2 border-t bg-white">
        <button
          onClick={handleVoice}
          className={`px-3 rounded transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-slate-200"}`}
        >
          🎤
        </button>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 border p-2 rounded outline-none focus:border-indigo-600"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !inputValue.trim()}
          className={`${isLoading ? "bg-indigo-300" : "bg-indigo-600"} text-white px-4 rounded transition-colors`}
        >
          {isLoading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
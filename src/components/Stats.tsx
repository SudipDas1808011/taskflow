"use client";
import { useEffect, useState } from "react";
import { TaskItem } from "@/types/types";
import { getTasks } from "@/services/taskService";

export function Stats() {
  return (
    <div className="border-2 border-black p-4 bg-white">
      <p className="font-bold border-b border-black mb-4">
        Strength and Weakness
      </p>
      <div className="space-y-4">
        {["X%", "Y%", "Z%"].map((stat, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-black"></div>
            <div className="flex-1 h-1 bg-black"></div>
            <span className="text-xs">{stat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function History({ refresh }: { refresh: boolean }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<"completed" | "due">("completed");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTasks();
        console.log("All tasks:", data);
        setTasks(data);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    };
    loadTasks();
  }, [refresh]);

  const handleRetry = (task: TaskItem) => {
    console.log("Retry clicked for:", task);
  };

  const now = new Date();

  const completedTasks = tasks.filter((t) => t.isCompleted);

  const dueTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const taskDateTime = new Date(`${t.dueDate}T${t.dueTime}`);
    return taskDateTime < now;
  });

  const getStatusStyle = (type: string) => {
    switch (type) {
      case "due":
        return "text-rose-600 bg-rose-50 border-rose-100";
      case "success":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      default:
        return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const renderTasks = (list: TaskItem[], type: "completed" | "due") => {
    return list.map((item, index) => (
      <li
        key={item._id}
        className="flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="font-bold text-indigo-600 text-xs">
            {index + 1}.
          </span>

          <span className="font-medium text-sm text-slate-700 truncate flex items-center gap-2">
            {item.name}

            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {item.dueDate} at {item.dueTime}
            </span>
          </span>
        </div>

        {type === "completed" ? (
          <div
            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusStyle(
              "success"
            )}`}
          >
            Completed
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusStyle(
                "due"
              )}`}
            >
              Due
            </div>

            <button
              onClick={() => handleRetry(item)}
              className="text-[10px] px-2 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
            >
              Retry
            </button>
          </div>
        )}
      </li>
    ));
  };

  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* Header + Tabs */}
      <div className="p-5">
        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Task History
          </label>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1 text-xs rounded-md border transition ${
              activeTab === "completed"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Completed
          </button>

          <button
            onClick={() => setActiveTab("due")}
            className={`px-3 py-1 text-xs rounded-md border transition ${
              activeTab === "due"
                ? "bg-rose-500 text-white border-rose-500"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            Due Tasks
          </button>
        </div>

        {/* Scrollable list */}
        <div className="max-h-[380px] overflow-y-auto pr-1">
          <ul className="flex flex-col gap-2">
            {activeTab === "completed"
              ? renderTasks(completedTasks, "completed")
              : renderTasks(dueTasks, "due")}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-100/50 px-5 py-2 border-t border-slate-200">
        <p className="text-[10px] text-slate-400 font-medium italic">
          Last updated: Just now
        </p>
      </div>
    </div>
  );
}
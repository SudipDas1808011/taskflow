"use client";
import { useState } from "react";
import { postTask } from "@/services/taskService";
import { TaskItem } from "@/types/types";

export default function CreateTask({ onCreated }: { onCreated: () => void }) {
  const [task, setTask] = useState<Partial<TaskItem>>({});
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setTask({
      ...task,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!task.name || !task.dueDate || !task.dueTime) {
      alert("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      const response = await postTask(task);

      if (response.ok) {
        setTask({ name: "", dueDate: "", dueTime: "", description: "", isCompleted: false });
        setLoading(false);
        onCreated();
      } else {
        alert("Something went wrong on the server.");
      }
    } catch (error) {
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md text-center sm:text-left">
        <h2 className="text-white font-bold text-lg tracking-tight">
          New Task Assignment
        </h2>
        <p className="text-indigo-100 text-xs">
          Fill in the details to schedule your work
        </p>
      </div>

      {/* Main Content */}
      <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto">

        {/* TASK TITLE - FULL WIDTH SINGLE LINE */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 ml-1">
            TASK TITLE
          </label>
          <input
            type="text"
            name="name"
            placeholder="e.g. Project Review"
            value={task.name || ""}
            onChange={handleChange}
            className="w-full border-2 border-slate-100 bg-white p-2.5 text-sm rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* DATE + TIME SAME ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">
              DATE
            </label>
            <input
              type="date"
              name="dueDate"
              min={today}
              value={task.dueDate || ""}
              onChange={handleChange}
              className="w-full border-2 border-slate-100 bg-white p-2.5 text-sm rounded-lg focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">
              TIME
            </label>
            <input
              type="time"
              name="dueTime"
              value={task.dueTime || ""}
              onChange={handleChange}
              className="w-full border-2 border-slate-100 bg-white p-2.5 text-sm rounded-lg focus:border-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-[140px]">
          <label className="text-xs font-semibold text-slate-600 ml-1">
            DESCRIPTION & NOTES
          </label>
          <textarea
            name="description"
            placeholder="Outline the steps or goals for this task..."
            value={task.description || ""}
            onChange={handleChange}
            className="w-full flex-1 border-2 border-slate-100 bg-white p-3 text-sm rounded-lg resize-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
          />
        </div>

        {/* ACTION BUTTON */}
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-64 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>

          <span className="text-[11px] text-slate-400 font-medium text-center">
            The date picker will only allow current or future selections.
          </span>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { TaskItem } from "@/types/types";

export default function EditTaskModal({
  task,
  isOpen,
  onClose,
  onSave,
}: {
  task: TaskItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskItem) => void;
}) {
  const [form, setForm] = useState<TaskItem | null>(task);

  useEffect(() => {
    setForm(task);
  }, [task]);

  if (!isOpen || !form) return null;

  const handleChange = (key: string, value: any) => {
    setForm((prev) => prev && { ...prev, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-5 rounded-xl w-[350px] space-y-3 shadow-xl">
        
        <h2 className="font-bold text-lg text-slate-800">Edit Task</h2>

        <input
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Task name"
        />

        <input
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full border p-2 rounded"
          placeholder="Description"
        />

        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => handleChange("dueDate", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="time"
          value={form.dueTime}
          onChange={(e) => handleChange("dueTime", e.target.value)}
          className="w-full border p-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm text-slate-500"
          >
            Cancel
          </button>

          <button
            onClick={() => form && onSave(form)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
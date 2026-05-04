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
    setForm((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        {/* Header */}
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-xl font-semibold text-slate-800">Edit Task Details</h2>
          <p className="text-sm text-slate-500">Update the information below to modify your task.</p>
        </div>

        {/* Form Content */}
        <div className="space-y-4 px-6 py-6">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 ml-1">
              Task Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              placeholder="e.g. Design Landing Page"
            />
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 ml-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 resize-none"
              placeholder="Briefly describe the task objectives..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 ml-1">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => handleChange("dueDate", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-500 mb-1 ml-1">
                Time
              </label>
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => handleChange("dueTime", e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={() => form && onSave(form)}
            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-lg active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
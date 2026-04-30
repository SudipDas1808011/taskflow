"use client";

import { useEffect, useMemo, useState } from "react";

type SubTask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

type GoalDetails = {
  id: string;
  title: string;
  description?: string;
  days?: {
    day: number;
    tasks: {
      title: string;
      description: string;
      done: boolean;
    }[];
  }[];
};

export default function GoalDetailsModal({
  goal,
  isOpen,
  onClose,
}: {
  goal: GoalDetails | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);

  // Convert nested days → flat subtasks
  useEffect(() => {
    console.log("Goal received in modal:", goal);

    if (!goal?.days) {
      setSubtasks([]);
      return;
    }

    const flat: SubTask[] = goal.days.flatMap((d, dayIndex) =>
      (d.tasks || []).map((t, taskIndex) => ({
        id: `${goal.id}-${dayIndex}-${taskIndex}`,
        title: t.title,
        isCompleted: t.done || false,
      }))
    );

    console.log("Flattened subtasks:", flat);

    setSubtasks(flat);
  }, [goal]);

  // Toggle checkbox
  const handleToggle = (id: string) => {
    setSubtasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
      );

      console.log("Updated subtasks:", updated);

      return updated;
    });
  };

  // Progress calculation
  const progress = useMemo(() => {
    if (!subtasks.length) return 0;
    const done = subtasks.filter((t) => t.isCompleted).length;
    return Math.round((done / subtasks.length) * 100);
  }, [subtasks]);

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-[520px] max-h-[80vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600">
          <h2 className="text-white font-semibold text-lg">
            {goal.title}
          </h2>
          <p className="text-indigo-100 text-xs">
            {goal.description}
          </p>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {progress}% completed
          </div>
        </div>

        {/* Subtasks */}
        <div className="p-4 flex flex-col gap-2 overflow-y-auto">
          {subtasks.length === 0 ? (
            <p className="text-sm text-slate-400">No subtasks found</p>
          ) : (
            subtasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-all duration-300 ${
                  task.isCompleted
                    ? "bg-slate-50 opacity-70"
                    : "bg-white hover:border-indigo-200"
                }`}
              >
                {/* Title */}
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-indigo-50 text-indigo-600 rounded">
                    {index + 1}
                  </span>

                  <span
                    className={`text-sm transition-all duration-300 ${
                      task.isCompleted
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(task.id)}
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
                    task.isCompleted
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300"
                  }`}
                >
                  {task.isCompleted && (
                    <span className="text-white text-[10px]">✓</span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-3 py-1 text-sm bg-slate-200 rounded-md hover:bg-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
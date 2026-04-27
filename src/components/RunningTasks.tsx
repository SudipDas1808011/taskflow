"use client";
import { useEffect, useState } from "react";
import { TaskItem } from "@/types/types";
import { getTasks, updateTask } from "@/services/taskService";

export default function RunningTasks({ refresh }: { refresh: boolean }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTasks();
        setTasks(data.filter((t: TaskItem) => !t.isCompleted));
      } catch (err) {
        console.error("Error loading tasks:", err);
      }
    };
    loadTasks();
  }, [refresh]);

  const handleToggle = async (task: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id ? { ...t, isCompleted: true } : t
      )
    );

    try {
      const response = await updateTask(task._id!, { isCompleted: true });

      if (response) {
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t._id !== task._id));
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to update task:", err);
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, isCompleted: false } : t
        )
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md">
        <h2 className="text-white font-bold text-lg tracking-tight">Running Tasks</h2>
        <p className="text-indigo-100 text-xs">Track and manage your active progress</p>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
        
        {tasks.map((task, index) => (
          <div
            key={task._id}
            className={`group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg transition-all duration-1000 
              ${task.isCompleted ? "opacity-50 scale-[0.98]" : "hover:border-indigo-200 hover:shadow-md"}`}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                {index + 1}
              </span>

              <div className="flex flex-col relative">
                <span className="text-sm font-semibold text-slate-700 relative inline-block">
                  {task.name}
                 
                  <div 
                    className={`absolute top-1/2 left-0 h-[1.5px] bg-slate-500 transition-all duration-[1500ms] ease-out
                    ${task.isCompleted ? "w-full opacity-100" : "w-0 opacity-0"}`}
                  />
                </span>
                <span className={`text-[11px] text-slate-400 font-medium transition-opacity duration-500 ${task.isCompleted ? "opacity-40" : ""}`}>
                  {task.description}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!task.isGoal && (
                <button
                  onClick={() => handleToggle(task)}
                  disabled={task.isCompleted}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
                  ${task.isCompleted ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 hover:border-indigo-400"}`}
                >
                  {task.isCompleted && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 flex justify-center">
        <span className="text-[10px] text-slate-400 font-medium italic">
          Showing {tasks.filter(t => !t.isCompleted).length} active assignments
        </span>
      </div>
    </div>
  );
}
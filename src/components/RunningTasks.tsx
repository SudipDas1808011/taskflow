"use client";
import { useEffect, useState } from "react";
import { TaskItem } from "@/types/types";
import { getTasks } from "@/services/taskService";

export default function RunningTasks({ refresh }: { refresh: boolean }) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTasks();
        console.log("fetched data: ", data);
        setTasks(data);
      } catch (err) {
        console.error("Error loading tasks:", err);
      }
    };

    loadTasks();
  }, [refresh]);
  
  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header aligned with CreateTask style */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md">
        <h2 className="text-white font-bold text-lg tracking-tight">Running Tasks</h2>
        <p className="text-indigo-100 text-xs">Track and manage your active progress</p>
      </div>

      {/* Task List Area */}
      <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
        {tasks
          .filter(task => !task.isCompleted)
          .map((task, index) => (
            <div
              key={task._id}
              className="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-200 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                  {index + 1}
                </span>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">
                    {task.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Title: {task.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {task.description ? (
                  <button className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors">
                    Details
                  </button>
                ) : (
                  <div
                    className="w-5 h-5 border-2 rounded-md transition-colors cursor-pointer flex items-center justify-center bg-white border-slate-200 hover:border-indigo-400"
                  />
                )}
              </div>
            </div>
          ))}
      </div>


      {/* Footer Info */}
      <div className="p-3 bg-white border-t border-slate-200 flex justify-center">
        <span className="text-[10px] text-slate-400 font-medium italic">
          Showing {tasks.length} active assignments
        </span>
      </div>
    </div>
  );
}
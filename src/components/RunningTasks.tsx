"use client";
import { useEffect, useState } from "react";
import { TaskItem } from "@/types/types";
import { getTasks, updateTask, deleteTask } from "@/services/taskService";

export default function RunningTasks({
  refresh,
  setRefresh,
}: {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [email] = useState(localStorage.getItem("email") || "")
  const [token,setToken] = useState("");
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token") || "";
        setToken(token);
        const res = await getTasks(token);

        const rawTasks: TaskItem[] = res?.tasks || [];

        console.log("Tasks loaded:", rawTasks);
        const now = new Date();

        const filtered = rawTasks
          .filter((t) => {
            if (t.isCompleted) return false;

            const taskTime = new Date(`${t.dueDate}T${t.dueTime}`);
            return taskTime >= now;
          })
          .sort((a, b) => {
            const aTime = new Date(`${a.dueDate}T${a.dueTime}`).getTime();
            const bTime = new Date(`${b.dueDate}T${b.dueTime}`).getTime();

            return aTime - bTime;
          });

        setTasks(filtered);
      } catch (err) {
        console.error("Error loading tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [refresh]);

  useEffect(()=>{
    localStorage.setItem("runningTasks",JSON.stringify(tasks));
  },[tasks])

  const handleToggle = async (task: TaskItem) => {    
    if (!task.id) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, isCompleted: true } : t)),
    );

    try {
      console.log("before response email is:",email);
      const response = await updateTask(email, task.id,true,token); //isCompleted true

      console.log("Update response:", response);

      if (response) {
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          setRefresh((prev) => !prev);
        }, 1200);
      }
    } catch (err) {
      console.error("Failed to update task:", err);

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, isCompleted: false } : t)),
      );
    }
  };

  const handleDelete = async (task: TaskItem) => {
    if (!task.id) return;

    try {
      const res = await deleteTask(email,task.id,token);

      console.log("Delete response:", res);

      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  function handleDetails(task: TaskItem): void {
    console.log("Task details:", task);
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md">
        <h2 className="text-white font-bold text-lg tracking-tight">
          Running Tasks
        </h2>
        <p className="text-indigo-100 text-xs">
          Track and manage your active progress
        </p>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-sm text-slate-400">Loading tasks...</span>
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={task.id || index}
              className={`group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg transition-all duration-500 
              ${task.isCompleted ? "opacity-50 scale-[0.98]" : "hover:border-indigo-200 hover:shadow-md"}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold">
                  {index + 1}
                </span>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700">
                    {task.name}
                  </span>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {task.dueDate} at {task.dueTime}
                    <br />
                    {task.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(task)}
                  className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                >
                  ✕
                </button>

                {!task.isGoal ? (
                  <button
                    onClick={() => handleToggle(task)}
                    disabled={task.isCompleted}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center
                    ${
                      task.isCompleted
                        ? "bg-indigo-600 border-indigo-600"
                        : "bg-white border-slate-300"
                    }`}
                  >
                    {task.isCompleted && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </button>
                ) : (
                  <button className="px-2 py-1 text-xs bg-indigo-500 text-white rounded-md">
                    Details
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 flex justify-center">
        <span className="text-[10px] text-slate-400">
          Showing {tasks.length} active tasks
        </span>
      </div>
    </div>
  );
}

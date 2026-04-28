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

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);

        const data = await getTasks();
        // setTasks(data.filter((t: TaskItem) => !t.isCompleted));
        const now = new Date();
        const filtered = data
          .filter((t: TaskItem) => {
            if (t.isCompleted) return false;

            const taskTime = new Date(`${t.dueDate}T${t.dueTime}`);
            return taskTime >= now;
          })
          .sort((a: TaskItem, b: TaskItem) => {
            const aTime = new Date(`${a.dueDate}T${a.dueTime}`).getTime();
            const bTime = new Date(`${b.dueDate}T${b.dueTime}`).getTime();

            return aTime - bTime;
          });

        setTasks(filtered);

        console.log("Tasks loaded:", data);
      } catch (err) {
        console.error("Error loading tasks:", err);
      } finally {
        setLoading(false);
        console.log("Loading finished");
      }
    };

    loadTasks();
  }, [refresh]);

  const handleToggle = async (task: TaskItem) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, isCompleted: true } : t)),
    );

    try {
      const response = await updateTask(task._id!, { isCompleted: true });

      console.log("Update response:", response);

      if (response) {
        setTimeout(() => {
          setTasks((prev) => prev.filter((t) => t._id !== task._id));

          setRefresh((prev) => !prev);

          console.log("Moved to history");
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to update task:", err);

      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, isCompleted: false } : t,
        ),
      );
    }
  };

  const handleDelete = async (task: TaskItem) => {
    console.log("Delete button clicked for task:", task);

    try {
      if (task._id) {
        const res = await deleteTask(task._id);

        console.log("DeleteTask response:", res);

        setTasks((prev) => {
          const updated = prev.filter((t) => t._id !== task._id);
          console.log("Updated task list:", updated);
          return updated;
        });

        console.log("Task deleted successfully:", task._id);
      } else {
        console.error("task id not found or task is undefined");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  function handleDetails(task: TaskItem): void {
    throw new Error("Function not implemented.");
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
                  <span
                    className={`text-[11px] text-slate-400 font-medium transition-opacity duration-500 ${task.isCompleted ? "opacity-40" : ""}`}
                  >
                    {task.dueDate + " at " + task.dueTime}
                    <br />
                    {task.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(task)}
                  className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-800 active:bg-red-200 transition duration-200 ease-in-out"
                  aria-label="Delete task"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {!task.isGoal ? (
                  <button
                    onClick={() => handleToggle(task)}
                    disabled={task.isCompleted}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200
                   ${
                     task.isCompleted
                       ? "bg-indigo-600 border-indigo-600"
                       : "bg-white border-slate-300 hover:border-indigo-400"
                   }`}
                  >
                    {task.isCompleted && (
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDetails(task)}
                    className="px-2 py-1 text-xs bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition"
                  >
                    Details
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-white border-t border-slate-200 flex justify-center">
        <span className="text-[10px] text-slate-400 font-medium italic">
          Showing {tasks.filter((t) => !t.isCompleted).length} active
          assignments
        </span>
      </div>
    </div>
  );
}
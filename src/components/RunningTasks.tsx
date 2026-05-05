"use client";

import { useEffect, useState, useRef } from "react";
import { TaskItem } from "@/types/types";
import { getTasks, updateTask, deleteTask } from "@/services/taskService";
import GoalDetailsModal from "./GoalDetailsModal";
import EditTaskModal from "./EditTaskModal";
type GoalDetails = {
  id: string;
  title: string;
  description?: string;
  days: {
    day: number;
    tasks: {
      title: string;
      description: string;
      done: boolean;
    }[];
  }[];
};

export default function RunningTasks({
  refresh,
  setRefresh,
}: {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"tasks" | "goals">("tasks");
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState("");

  const [selectedGoal, setSelectedGoal] = useState<GoalDetails | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [prevTaskCount, setPrevTaskCount] = useState(0);

  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [openEditModal, setOpenEditModal] = useState(false);

  const prevTasksRef = useRef<TaskItem[]>([]);

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
  }, []);

  useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      const res = await getTasks(localStorage.getItem("token") || "");

      const rawTasks: TaskItem[] = res?.tasks || [];
      const rawGoals: any[] = res?.goals || [];

      const now = new Date();

      const filteredTasks = rawTasks
        .filter((t) => {
          if (t.isCompleted) return false;
          const taskTime = new Date(`${t.dueDate}T${t.dueTime}`);
          return taskTime >= now;
        })
        .sort((a, b) => {
          return (
            new Date(`${a.dueDate}T${a.dueTime}`).getTime() -
            new Date(`${b.dueDate}T${b.dueTime}`).getTime()
          );
        });

     const formattedGoals = (rawGoals || []).map((g: any) => {
  const created = new Date(g.createdAt);

  const formattedDate = created.toLocaleDateString();
  const formattedTime = created.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    id: g.id,
    title: g.title || "Goal",
    description: `${g.goal || ""} (Created: ${formattedDate} ${formattedTime})`,
    days: g.days || [],
    createdAt: g.createdAt,
  };
});
      const prevTasks = prevTasksRef.current;

      const prevIds = new Set(prevTasks.map((t) => t.id));
      const newIds = new Set(filteredTasks.map((t) => t.id));

      const removedIds = prevTasks
        .filter((t) => t.id && !newIds.has(t.id))
        .map((t) => t.id as string);

      if (removedIds.length > 0) {
        console.log("Refresh remove animation:", removedIds);

        setAnimatingIds((prev) => [...prev, ...removedIds]);

        setTimeout(() => {
          setTasks(filteredTasks);
          localStorage.setItem("runningTasks", JSON.stringify(filteredTasks));
          setGoals(formattedGoals);
          setAnimatingIds([]);
          console.log("Refresh UI updated after animation");
        }, 300);
      } else {
        setTasks(filteredTasks);
        localStorage.setItem("runningTasks", JSON.stringify(filteredTasks));
        setGoals(formattedGoals);
      }

      prevTasksRef.current = filteredTasks;
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [refresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      const hasOverdue = tasks.some((task) => {
        if (task.isCompleted) return false;

        const taskTime = new Date(`${task.dueDate}T${task.dueTime}`);
        return taskTime < now;
      });

      if (hasOverdue) {
        console.log("Overdue task detected from RunningTasks → refreshing UI");

        setRefresh((prev) => !prev);
      }
    }, 30000); // every 30 sec

    return () => clearInterval(interval);
  }, [tasks, setRefresh]);

  useEffect(() => {
    if (tasks.length > prevTaskCount && activeTab !== "tasks") {
      setActiveTab("tasks");
    }
    setPrevTaskCount(tasks.length);
  }, [tasks, activeTab, prevTaskCount]);

  const handleToggle = async (task: TaskItem) => {
    if (!task.id) return;

    setAnimatingIds((prev) => [...prev, task.id!]);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isCompleted: true } : t
      )
    );

    try {
      await updateTask(
        { taskId: task.id, isCompleted: true },
        token
      );

      setTimeout(() => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        setAnimatingIds((prev) => prev.filter((id) => id !== task.id));
        setRefresh((prev) => !prev);
      }, 500);
    } catch (err) {
      console.error(err);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, isCompleted: false } : t
        )
      );

      setAnimatingIds((prev) => prev.filter((id) => id !== task.id));
    }
  };
  const handleEditClick = (task: TaskItem) => {
    setEditTask(task);
    setOpenEditModal(true);
  };
  const handleUpdateTask = async (updatedTask: TaskItem) => {
    if (!updatedTask.id) return;

    try {
      console.log("Updating task:", updatedTask);

      const res = await updateTask(
        {
          taskId: updatedTask.id,
          name: updatedTask.name,
          description: updatedTask.description,
          dueDate: updatedTask.dueDate,
          dueTime: updatedTask.dueTime,
          isCompleted: updatedTask.isCompleted,
        },
        token
      );

      console.log("Edit update response:", res);

      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );

      setOpenEditModal(false);
      setEditTask(null);

      console.log("Update success");

    } catch (err) {
      console.log("Update error:", err);
    }
  };
  const handleDelete = async (item: any, isGoal = false) => {
    if (!item.id) return;

    setAnimatingIds((prev) => [...prev, item.id]);

    try {
      await deleteTask(
        "",
        item.id,
        token,
        isGoal ? "goal" : "task"
      );


      setTimeout(() => {
        if (isGoal) {
          setGoals((prev) => prev.filter((g) => g.id !== item.id));
        } else {
          setTasks((prev) => prev.filter((t) => t.id !== item.id));
        }

        setAnimatingIds((prev) => prev.filter((id) => id !== item.id));
      }, 300);
    } catch (err) {
      console.log("delete error:", err);
      setAnimatingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  function handleDetails(goal: any) {
    const formattedGoal = {
      id: goal.id,
      title: goal.title || goal.name,
      description: goal.description || goal.goal || "",
      days: goal.days ?? [],
    };

    setSelectedGoal(formattedGoal);
    setOpenModal(true);
  }

  return (
    <div className= "w-full h-full flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm" >

    {/* Header - Reverted to previous Gradient Style */ }
    < div className = "bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between shadow-md z-10" >
      <h2 className="text-white font-bold text-lg tracking-tight" > Running Tasks </h2>
        < div className = "bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-white/30" >
          Live Feed
            </div>
            </div>

  {/* Tabs */ }
  <div className="flex bg-white/50 p-1 mx-4 mt-4 rounded-xl border border-slate-200" >
    <button
          onClick={ () => setActiveTab("tasks") }
  className = {`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "tasks"
    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
    : "text-slate-500 hover:text-slate-700"
    }`
}
        >
  Individual Tasks
    </button>

    < button
onClick = {() => setActiveTab("goals")}
className = {`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "goals"
  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
  : "text-slate-500 hover:text-slate-700"
  }`}
        >
  AI Goal Plan
    </button>
    </div>

{/* Content */ }
<div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto" >

{
  loading?(
          <div className = "flex flex-col items-center justify-center h-full gap-2 py-10" >
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"> </div>
  < span className = "text-xs font-medium text-slate-400 uppercase tracking-widest" > Updating...</span>
    </div>
        ) : activeTab === "tasks" ? (
  tasks.length === 0 ? (
    <div className= "text-center py-10 text-slate-400 text-xs italic" > No pending tasks found.</div>
          ) : (
  tasks.map((task, index) => (
    <div
              key= { task.id || index }
              className = {`group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 ${animatingIds.includes(task.id || "") ? "opacity-0 scale-95 translate-x-4" : "opacity-100"
      }`}
            >
    <div className="flex-1 min-w-0 pr-4" >
  <div className="font-bold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors" >
  { task.name }
  </div>
                
                {
      task.description && (
        <div className="relative group/desc">
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic font-medium">
            { task.description }
            </p>
            < div className="absolute left-0 bottom-full mb-2 hidden group-hover/desc:block z-50 w-64 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl pointer-events-none" >
            { task.description }
            < div className="absolute left-4 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-800" > </div>
            </div>
            </div>
                )}

<div className="flex items-center gap-1.5 mt-1" >
  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" > </div>
    < span className = "text-[11px] font-semibold text-slate-400 uppercase" >
      { task.dueDate } • { task.dueTime }
</span>
  </div>
  </div>

  < div className = "flex items-center gap-3" >
    {/* EDIT (NEW) */ }
    < button
onClick = {() => handleEditClick(task)}
className = "p-2 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
title = "Edit Task"
  >
  <svg xmlns="http://www.w3.org/2000/svg" width = "16" height = "16" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "2.5" strokeLinecap = "round" strokeLinejoin = "round" >
    <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
        </button>
        < button
onClick = {() => handleDelete(task)}
className = "p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
title = "Remove Task"
  >
  <svg xmlns="http://www.w3.org/2000/svg" width = "16" height = "16" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "2.5" strokeLinecap = "round" strokeLinejoin = "round" > <path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> </svg>
    </button>

    < button
onClick = {() => handleToggle(task)}
className = "group/check w-10 h-10 flex items-center justify-center bg-slate-50 border-2 border-slate-100 rounded-xl hover:bg-indigo-600 hover:border-indigo-600 transition-all duration-300 shadow-sm"
title = "Mark as Done"
  >
  <svg xmlns="http://www.w3.org/2000/svg" className = "w-5 h-5 text-slate-400 group-hover/check:text-white group-hover/check:scale-110 transition-all" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "3" strokeLinecap = "round" strokeLinejoin = "round" > <polyline points="20 6 9 17 4 12" /> </svg>
    </button>
    </div>
    </div>
          ))
          )
        ) : (
  goals.length === 0 ? (
    <div className= "text-center py-10 text-slate-400 text-xs italic" > No active goals found.</div>
          ) : (
  goals.map((goal: any, index) => (
    <div
              key= { goal.id || index }
              className = "group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-violet-200 transition-all duration-300 shadow-sm hover:shadow-violet-500/5"
    >
    <div className="flex-1 min-w-0 pr-4" >
  <div className="font-bold text-slate-800 text-sm truncate" > { goal.title } </div>

  < div className = "relative group/gdesc" >
  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic font-medium" >
  { goal.description || "No description provided" }
  </p>
                  {
      goal.description && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover/gdesc:block z-50 w-64 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl pointer-events-none">
          { goal.description }
          < div className="absolute left-4 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-800" > </div>
          </div>
                  )}
</div>
  </div>

  < div className = "flex items-center gap-2" >
    <button 
                  onClick={ () => handleDelete(goal, true) }
className = "p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
  >
  <svg xmlns="http://www.w3.org/2000/svg" width = "16" height = "16" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "2.5" strokeLinecap = "round" strokeLinejoin = "round" > <path d="M3 6h18" /> <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /> <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /> </svg>
    </button>

    < button
onClick = {() => handleDetails(goal)}
className = "flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white text-[11px] font-bold rounded-xl transition-all duration-300 ring-1 ring-indigo-100 hover:ring-indigo-600 shadow-sm"
  >
  DETAILS
  < svg xmlns = "http://www.w3.org/2000/svg" width = "12" height = "12" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" strokeWidth = "3" strokeLinecap = "round" strokeLinejoin = "round" > <path d="m9 18 6-6-6-6" /> </svg>
    </button>
    </div>
    </div>
          ))
          )
        )}
</div>

{/* Footer */ }
<div className="px-5 py-3 bg-white border-t border-slate-100 flex justify-between items-center" >
  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest" >
    Status: { loading ? "Syncing" : "Up to date" }
</span>
  < div className = "text-[10px] font-extrabold text-indigo-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200" >
    { activeTab === "tasks" ? tasks.length : goals.length} Items
      </div>
      </div>

{/* Modal */ }
<GoalDetailsModal
        goal={ selectedGoal }
isOpen = { openModal }
onClose = {() => setOpenModal(false)}
      />

  < EditTaskModal
task = { editTask }
isOpen = { openEditModal }
onClose = {() => setOpenEditModal(false)}
onSave = { handleUpdateTask }
  />
  </div>
  );
}
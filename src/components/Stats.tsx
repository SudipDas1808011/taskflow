"use client";
import { useEffect, useState } from "react";
import { TaskItem } from "@/types/types";
import { getTasks } from "@/services/taskService";
import { analyzeStats } from "@/services/statsService";
import { updateStats } from "@/services/updateStatsService";
import { getStats } from "@/services/getStatsService";

export function Stats() {
  const [stats, setStats] = useState([
    { label: "Strength", value: "0%", color: "bg-indigo-600" },
    { label: "Agility", value: "0%", color: "bg-violet-600" },
    { label: "Endurance", value: "0%", color: "bg-blue-500" },
  ]);

  // load from DB on refresh
  useEffect(() => {
    const loadStats = async () => {
      try {
        const email = localStorage.getItem("email");
        if (!email) return;

        const dbStats = await getStats(email);

        console.log("DB Stats Loaded:", dbStats);

        if (dbStats?.length > 0) {
          setStats(
            dbStats.map((s: any) => ({
              label: s.label,
              value: s.value + "%",
              color: getColor(s.label),
            }))
          );
        }
      } catch (err) {
        console.log("Load Stats Error:", err);
      }
    };

    loadStats();
  }, []);

  const handleAnalyze = async () => {
    try {
      const email = localStorage.getItem("email");
      const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

      console.log("Tasks:", tasks);

      // 1. AI analysis
      const aiStats = await analyzeStats({ tasks });

      console.log("AI Stats:", aiStats);

      // 2. update DB
      await updateStats(email || "", aiStats);

      console.log("DB updated");

      // 3. update UI instantly
      setStats(
        aiStats.map((s: any) => ({
          label: s.label,
          value: s.value + "%",
          color: getColor(s.label),
        }))
      );
    } catch (err) {
      console.log("Handle Analyze Error:", err);
    }
  };

  const getColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "focus":
        return "bg-indigo-600";
      case "discipline":
        return "bg-violet-600";
      case "endurance":
        return "bg-blue-500";
      case "task completion speed":
        return "bg-indigo-600";
      case "planning quality":
        return "bg-violet-600";
      case "procrastination control":
        return "bg-blue-500";
      default:
        return "bg-indigo-600";
    }
  };

  return (
    <div className= "w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm" >
    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md" >
      <h2 className="text-white font-bold text-lg tracking-tight" >
        Performance Metrics
          </h2>
          < p className = "text-indigo-100 text-xs" >
            Analysis of current capabilities
              </p>
              </div>

              < div className = "p-5 flex flex-col gap-5" >
                <label className="text-xs font-semibold text-slate-600 ml-1 uppercase tracking-wider" >
                  Strength and Weakness
                    </label>

                    < div className = "space-y-6" >
                    {
                      stats.map((stat, i) => (
                        <div key= { i } className = "flex flex-col gap-2" >
                        <div className="flex justify-between items-center px-1" >
                      <span className="text-sm font-medium text-slate-700" >
                      { stat.label }
                      </span>
                      < span className = "text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full" >
                      { stat.value }
                      </span>
                      </div>

                      < div className = "flex items-center gap-3" >
                      <div className="w-2.5 h-2.5 rounded-full border-2 border-indigo-400 bg-white" />

                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden" >
                      <div
                    className={`h-full ${stat.color} transition-all duration-700 ease-in-out`}
  style = {{ width: stat.value }
}
                  />
  </div>
  </div>
  </div>
          ))}
</div>

  < div className = "flex flex-col items-center gap-3 pt-6 border-t border-slate-200 mt-2" >
    <button
            onClick={ handleAnalyze }
className = "w-full sm:w-64 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
  >
  Analyze Performance
    </button>

    < span className = "text-[11px] text-slate-400 font-medium text-center" >
      Click analyze to synchronize your latest activity data.
          </span>
        </div>
        </div>
        </div>
  );
}


export function History({
  refresh,
  onRetry,
}: {
  refresh: boolean;
  onRetry: (task: TaskItem) => void;
}) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activeTab, setActiveTab] = useState<"completed" | "due">("completed");

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const token = localStorage.getItem("token") || "";

        const data = await getTasks(token);

        console.log("All tasks:", data);

        const allTasks: TaskItem[] = data?.tasks || [];

        setTasks(allTasks);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    };

    loadTasks();
  }, [refresh]);

  const now = new Date();

  const completedTasks = tasks
    .filter((t) => t.isCompleted)
    .sort((a, b) => {
      return (
        new Date(`${b.dueDate}T${b.dueTime}`).getTime() -
        new Date(`${a.dueDate}T${a.dueTime}`).getTime()
      );
    });

  const incompletedTasks = tasks
    .filter((t) => !t.isCompleted)
    .sort((a, b) => {
      return (
        new Date(`${b.dueDate}T${b.dueTime}`).getTime() -
        new Date(`${a.dueDate}T${a.dueTime}`).getTime()
      );
    });

  const dueTasks = tasks.filter((t) => {
    if (t.isCompleted) return false;
    const taskDateTime = new Date(`${t.dueDate}T${t.dueTime}`);
    return taskDateTime < now;
  });
  localStorage.setItem("completedTask", JSON.stringify(completedTasks));
  localStorage.setItem("dueTasks", JSON.stringify(dueTasks));
  localStorage.setItem("runningTasks",JSON.stringify(incompletedTasks));
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
        key= { item.id } 
        className = "flex items-center justify-between gap-4 bg-white p-3 rounded-lg border border-slate-100 shadow-sm"
      >
      <div className="flex items-center gap-3 overflow-hidden" >
    <span className="font-bold text-indigo-600 text-xs" >
    { index + 1}.
  </span>

    < span className = "font-medium text-sm text-slate-700 truncate flex items-center gap-2" >
      { item.name }

      < span className = "text-[10px] text-slate-400 whitespace-nowrap" >
        { item.dueDate } at { item.dueTime }
  </span>
    </span>
    </div>

  {
    type === "completed" ? (
      <div
            className= {`text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusStyle(
        "success"
      )}`}
          >
    Completed
    </div>
        ) : (
    <div className= "flex items-center gap-2" >
    <div
              className={
    `text-[10px] font-bold px-2.5 py-1 rounded-md border ${getStatusStyle(
      "due"
    )}`
  }
            >
    Due
    </div>

    < button
  onClick = {() => onRetry(item)
}
className = "text-[10px] px-2 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
  >
  Retry
  </button>
  </div>
        )}
</li>
    ));
  };

return (
  <div className= "w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm" >

  {/* Header + Tabs */ }
  < div className = "p-5" >
    <div className="mb-3" >
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider" >
        Task History
          </label>
          </div>

{/* Tabs */ }
<div className="flex gap-2 mb-4" >
  <button
            onClick={ () => setActiveTab("completed") }
className = {`px-3 py-1 text-xs rounded-md border transition ${activeTab === "completed"
  ? "bg-emerald-500 text-white border-emerald-500"
  : "bg-white text-slate-600 border-slate-200"
  }`}
          >
  Completed
  </button>

  < button
onClick = {() => setActiveTab("due")}
className = {`px-3 py-1 text-xs rounded-md border transition ${activeTab === "due"
  ? "bg-rose-500 text-white border-rose-500"
  : "bg-white text-slate-600 border-slate-200"
  }`}
          >
  Due Tasks
    </button>
    </div>

{/* Scrollable list */ }
<div className="max-h-[380px] overflow-y-auto pr-1" >
  <ul className="flex flex-col gap-2" >
    { activeTab === "completed"
    ? renderTasks(completedTasks, "completed")
    : renderTasks(dueTasks, "due")}
</ul>
  </div>
  </div>

{/* Footer */ }
<div className="bg-slate-100/50 px-5 py-2 border-t border-slate-200" >
  <p className="text-[10px] text-slate-400 font-medium italic" >
    Last updated: Just now
      </p>
      </div>
      </div>
  );
}
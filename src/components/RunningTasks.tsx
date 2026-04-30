"use client";

import { useEffect, useState } from "react";
import { TaskItem } from "@/types/types";
import { getTasks, updateTask, deleteTask } from "@/services/taskService";
import GoalDetailsModal from "./GoalDetailsModal";

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

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  const [selectedGoal, setSelectedGoal] = useState<GoalDetails | null>(null);
  const [openModal, setOpenModal] = useState(false);

  const [animatingIds, setAnimatingIds] = useState<string[]>([]);
  const [prevTaskCount, setPrevTaskCount] = useState(0);

  useEffect(() => {
    setEmail(localStorage.getItem("email") || "");
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

        const formattedGoals = (rawGoals || []).map((g: any) => ({
          id: g.id,
          title: g.title || "Goal",
          description: g.goal || "",
          days: g.days || [],
        }));

        setTasks(filteredTasks);
        setGoals(formattedGoals);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refresh]);

  useEffect(() => {
    if (tasks.length > prevTaskCount && activeTab !== "tasks") {
      setActiveTab("tasks");
    }
    setPrevTaskCount(tasks.length);
  }, [tasks]);

  const handleToggle = async (task: TaskItem) => {
    if (!task.id) return;

    setAnimatingIds((prev) => [...prev, task.id!]);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, isCompleted: true } : t
      )
    );

    try {
      await updateTask(email, task.id, true, token);

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

  const handleDelete = async (item: any, isGoal = false) => {
    if (!item.id) return;

    setAnimatingIds((prev) => [...prev, item.id]);

    try {
      await deleteTask(
        email,
        item.id,
        token,
        isGoal ? "goal" : "task"
      );

      console.log("after await response - delete success");

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
    console.log("Raw goal clicked:", goal);

    const formattedGoal = {
      id: goal.id,
      title: goal.title || goal.name,
      description: goal.description || goal.goal || "",
      days: goal.days ?? [],
    };

    console.log("Formatted goal sent to modal:", formattedGoal);

    setSelectedGoal(formattedGoal);
    setOpenModal(true);
  }

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 border rounded-xl overflow-hidden">

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4">
        <h2 className="text-white font-bold text-lg">Running Tasks</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 p-2 text-sm font-semibold ${
            activeTab === "tasks"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500"
          }`}
        >
          Tasks
        </button>

        <button
          onClick={() => setActiveTab("goals")}
          className={`flex-1 p-2 text-sm font-semibold ${
            activeTab === "goals"
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-slate-500"
          }`}
        >
          Goals
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">

        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : activeTab === "tasks" ? (
          tasks.map((task, index) => (
            <div
              key={task.id || index}
              className={`flex justify-between p-3 bg-white border rounded-lg transition-all ${
                animatingIds.includes(task.id || "")
                  ? "opacity-0 scale-95"
                  : "opacity-100"
              }`}
            >
              <div>
                <div className="font-semibold text-sm">
                  {task.title || task.name}
                </div>
                <div className="text-xs text-slate-400">
                  {task.dueDate} {task.dueTime}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleDelete(task)}>✕</button>

                <button
                  onClick={() => handleToggle(task)}
                  className="w-6 h-6 border rounded"
                >
                  ✓
                </button>
              </div>
            </div>
          ))
        ) : (
          goals.map((goal: any, index) => (
            <div
              key={goal.id || index}
              className="flex justify-between p-3 bg-white border rounded-lg"
            >
              <div>
                <div className="font-semibold text-sm">{goal.title}</div>
                <div className="text-xs text-slate-400">
                  {goal.description}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleDelete(goal, true)}>
                  ✕
                </button>

                <button
                  onClick={() => handleDetails(goal)}
                  className="px-2 py-1 text-xs bg-indigo-500 text-white rounded"
                >
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-2 text-center text-xs text-slate-400 bg-white border-t">
        {activeTab === "tasks"
          ? `Showing ${tasks.length} tasks`
          : `Showing ${goals.length} goals`}
      </div>

      {/* Modal */}
      <GoalDetailsModal
        goal={selectedGoal}
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
      />
    </div>
  );
}
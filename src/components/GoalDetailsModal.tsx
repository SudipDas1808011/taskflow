"use client";

import { useEffect, useMemo, useState } from "react";
import { getTasks } from "@/services/taskService";
import { updateSubTask } from "@/services/subTaskService";
import { updateGoalCompletion } from "@/services/updateGoalCompletionService";

type SubTask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;

const parseDurationToMs = (duration: string) => {
  if (!duration) return 0;

  const text = duration.toLowerCase();
  const num = parseInt(text.match(/\d+/)?.[0] || "1");

  if (text.includes("week")) return num * 7 * DAY;
  if (text.includes("month")) return num * 30 * DAY;
  if (text.includes("day")) return num * DAY;
  if (text.includes("hour")) return num * HOUR;

  return 0;
};

const getTimeProgress = (createdAt: string, duration: string) => {
  const totalMs = parseDurationToMs(duration);
  if (!totalMs) return null;

  const start = new Date(createdAt).getTime();
  const now = Date.now();

  const elapsed = now - start;
  const remaining = Math.max(totalMs - elapsed, 0);

  const percent = Math.min(100, Math.round((elapsed / totalMs) * 100));

  let unit: "days" | "hours" | "minutes" = "days";
  let divider = DAY;

  if (totalMs < 2 * DAY) {
    unit = "hours";
    divider = HOUR;
  }

  if (totalMs < 2 * HOUR) {
    unit = "minutes";
    divider = MIN;
  }

  const used = Math.floor(elapsed / divider);
  const total = Math.floor(totalMs / divider);

  return {
    used: Math.min(used, total),
    total,
    unit,
    percent,
  };
};

export default function GoalDetailsModal({
  goal,
  isOpen,
  onClose,
}: any) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [activeGoal, setActiveGoal] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !goal?.id) return;

      const token = localStorage.getItem("token") || "";
      const data = await getTasks(token);

      console.log("Get tasks:", data);

      const freshGoal = data?.goals?.find((g: any) => g.id === goal.id);
      if (!freshGoal) return;

      setActiveGoal(freshGoal);

      const flat: SubTask[] = freshGoal.days.flatMap((d: any, di: number) =>
        (d.tasks || []).map((t: any, ti: number) => ({
          id: `${freshGoal.id}-${di}-${ti}`,
          title: t.title,
          isCompleted: t.done,
        }))
      );

      setSubtasks(flat);
    };

    load();
  }, [isOpen, goal?.id]);

  const handleToggle = async (id: string) => {
    const token = localStorage.getItem("token") || "";

    const updated = subtasks.map((t) =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );

    setSubtasks(updated);

    const changed = updated.find((t) => t.id === id);

    await updateSubTask(
      token,
      activeGoal.id,
      id,
      changed?.isCompleted || false
    );

    const data = await getTasks(token);

    const freshGoal = data?.goals?.find((g: any) => g.id === goal.id);
    if (!freshGoal) return;

    setActiveGoal(freshGoal);

    const flat: SubTask[] = freshGoal.days.flatMap((d: any, di: number) =>
      (d.tasks || []).map((t: any, ti: number) => ({
        id: `${freshGoal.id}-${di}-${ti}`,
        title: t.title,
        isCompleted: t.done,
      }))
    );

    setSubtasks(flat);
  };

  const progress = useMemo(() => {
    if (!subtasks.length) return 0;
    const done = subtasks.filter((t) => t.isCompleted).length;
    return Math.round((done / subtasks.length) * 100);
  }, [subtasks]);

  const timeProgress = useMemo(() => {
    if (!activeGoal?.createdAt || !activeGoal?.duration) return null;

    return getTimeProgress(activeGoal.createdAt, activeGoal.duration);
  }, [activeGoal]);

  if (!isOpen || !activeGoal) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-[520px] max-h-[80vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600">
          <h2 className="text-white font-semibold text-lg">
            {activeGoal.title}
          </h2>
          <p className="text-indigo-100 text-xs">
            {activeGoal.description}
          </p>
        </div>

        {/* PROGRESS */}
        <div className="px-4 pt-3">

          {/* TASK PROGRESS */}
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-500 mt-1">
            {progress}% completed
          </div>

          {/* TIME PROGRESS */}
          <div className="mt-3">

            <div className="flex justify-between text-[11px] text-slate-500 mb-1">
              <span>Time Progress</span>

              <span>
                {timeProgress
                  ? `${timeProgress.used}/${timeProgress.total} ${timeProgress.unit}`
                  : "0/0"}
              </span>
            </div>

            {timeProgress && (
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    timeProgress.percent > 70 ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{ width: `${timeProgress.percent}%` }}
                />
              </div>
            )}

          </div>
        </div>

        {/* SUBTASKS */}
        <div className="p-4 flex flex-col gap-2 overflow-y-auto">
          {subtasks.length === 0 ? (
            <p className="text-sm text-slate-400">No subtasks found</p>
          ) : (
            subtasks.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  task.isCompleted
                    ? "bg-slate-50 opacity-70"
                    : "bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-indigo-50 text-indigo-600 rounded">
                    {index + 1}
                  </span>

                  <span
                    className={`text-sm ${
                      task.isCompleted
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <button
                  onClick={() => handleToggle(task.id)}
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
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

        {/* FOOTER */}
        <div className="p-3 border-t flex justify-end bg-slate-50">
          <button
            onClick={async () => {
              const token = localStorage.getItem("token") || "";

              const total = subtasks.length;
              const done = subtasks.filter((t) => t.isCompleted).length;

              const completionPercentage = total
                ? Math.round((done / total) * 100)
                : 0;

              console.log("Saving completion:", completionPercentage);

              await updateGoalCompletion(
                token,
                activeGoal.id,
                completionPercentage
              );

              console.log("after await response - goal completion saved");

              onClose();
            }}
            className="px-3 py-1 text-sm bg-slate-200 rounded-md hover:bg-slate-300"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
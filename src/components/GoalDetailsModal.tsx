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

export default function GoalDetailsModal({
  goal,
  isOpen,
  onClose,
}: any) {
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);

  // IMPORTANT: keep latest goal from DB (NOT prop)
  const [activeGoal, setActiveGoal] = useState<any>(null);

  // 🔥 LOAD FRESH DATA ON OPEN (no UI change)
  useEffect(() => {
    const load = async () => {
      if (!isOpen || !goal?.id) return;

      const token = localStorage.getItem("token") || "";
      const data = await getTasks(token);

      console.log("Fresh DB:", data);

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

  // 🔥 ONLY DB UPDATE LOGIC (no UI change)
  const handleToggle = async (id: string) => {
    const email = localStorage.getItem("email") || "";

    const updated = subtasks.map((t) =>
      t.id === id ? { ...t, isCompleted: !t.isCompleted } : t
    );

    setSubtasks(updated);

    const changed = updated.find((t) => t.id === id);

    await updateSubTask(
      email,
      activeGoal.id,
      id,
      changed?.isCompleted || false
    );

    // 🔥 REFRESH FROM DB (important fix)
    const token = localStorage.getItem("token") || "";
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

  if (!isOpen || !activeGoal) return null;

  return (
    <div className= "fixed inset-0 bg-black/40 flex items-center justify-center z-50" >
    <div className="w-[520px] max-h-[80vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden" >

      {/* HEADER (UNCHANGED) */ }
      < div className = "p-4 border-b bg-gradient-to-r from-indigo-600 to-violet-600" >
        <h2 className="text-white font-semibold text-lg" >
          { activeGoal.title }
          </h2>
          < p className = "text-indigo-100 text-xs" >
            { activeGoal.description }
            </p>
            </div>

  {/* PROGRESS (UNCHANGED) */ }
  <div className="px-4 pt-3" >
    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden" >
      <div
              className="h-full bg-indigo-600 transition-all duration-500"
  style = {{ width: `${progress}%` }
}
            />
  </div>
  < div className = "text-[11px] text-slate-500 mt-1" >
    { progress } % completed
    </div>
    </div>

{/* SUBTASKS (UNCHANGED UI) */ }
<div className="p-4 flex flex-col gap-2 overflow-y-auto" >
  {
    subtasks.length === 0 ? (
      <p className= "text-sm text-slate-400" > No subtasks found</ p >
          ) : (
  subtasks.map((task, index) => (
    <div
                key= { task.id }
                className = {`flex items-center justify-between p-3 border rounded-lg ${task.isCompleted
        ? "bg-slate-50 opacity-70"
        : "bg-white hover:border-indigo-200"
      }`}
              >
    <div className="flex items-center gap-3" >
  <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-indigo-50 text-indigo-600 rounded" >
  { index + 1}
    </span>

    < span
                    className = {`text-sm ${task.isCompleted
        ? "line-through text-slate-400"
        : "text-slate-700"
      }`}
                  >
    { task.title }
    </span>
    </div>

    < button
                  onClick = {() => handleToggle(task.id)}
    className = {`w-5 h-5 border-2 rounded flex items-center justify-center ${task.isCompleted
        ? "bg-indigo-600 border-indigo-600"
        : "border-slate-300"
      }`}
                >
    {
      task.isCompleted && (
        <span className="text-white text-[10px]">✓</span>
  )}
</button>
  </div>
            ))
          )}
</div>

{/* FOOTER (UNCHANGED) */ }
<div className="p-3 border-t flex justify-end bg-slate-50" >
  <button
  onClick={
  async () => {
    const email = localStorage.getItem("email") || "";

    const total = subtasks.length;
    const done = subtasks.filter((t) => t.isCompleted).length;

    const completionPercentage = total
      ? Math.round((done / total) * 100)
      : 0;

    console.log("Saving completion:", completionPercentage);

    await updateGoalCompletion(
      email,
      activeGoal.id,
      completionPercentage
    );

    console.log("after await response - goal completion saved");

    onClose();
  }
}
className = "px-3 py-1 text-sm bg-slate-200 rounded-md hover:bg-slate-300"
  >
  Close
  </button>
  </div>

  </div>
  </div>
  );
}
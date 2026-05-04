"use client";
import { useEffect, useState, useRef } from "react";
import { postTask } from "@/services/taskService";
import { TaskItem } from "@/types/types";

type CreateTaskProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialData: TaskItem | null;
};

export default function CreateTask({
  open,
  onClose,
  onCreated,
  initialData,
}: CreateTaskProps) {
  const [task, setTask] = useState<Partial<TaskItem>>(() => ({
    name: initialData?.name || "",
    dueDate: initialData?.dueDate || "",
    dueTime: initialData?.dueTime || "",
    description: initialData?.description || "",
    isCompleted: false,
  }));

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialData) {
      setTask({
        name: initialData.name,
        dueDate: initialData.dueDate,
        dueTime: initialData.dueTime,
        description: initialData.description,
        isCompleted: false,
      });
    }
  }, [initialData]);

 
  const isValidDateTime = (date: string, time: string) => {
    if (!date || !time) return true;

    const selected = new Date(`${date}T${time}`);
    const now = new Date();

    return selected >= now;
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (errorMessage) setErrorMessage(null);
    setTask({
      ...task,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!task.name || !task.dueDate || !task.dueTime) {
      setErrorMessage("Please fill all required fields");
      return;
    }

    const valid = isValidDateTime(task.dueDate, task.dueTime);

    if (!valid) {
      setErrorMessage("You cannot select past date/time");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setErrorMessage("User not authenticated");
        setLoading(false);
        return;
      }

      console.log("Submitting task:", task);

      const data = await postTask(task, token);
      console.log("Create task response:", data);

      console.log("after await response:", data);

      if (!data) {
        setErrorMessage("Something went wrong on server");
        return;
      }

      setTask({
        name: "",
        dueDate: "",
        dueTime: "",
        description: "",
        isCompleted: false,
      });

      onCreated();
      console.log("Task created successfully");
    } catch (error) {
      console.error("Create task error:", error);
      setErrorMessage("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
  ref= { topRef }
  className = "w-full h-full flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm"
    >

    {/* Header - Fixed at top */ }
    < div className = "bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shrink-0 shadow-md text-center sm:text-left z-10" >
      <h2 className="text-white font-bold text-lg tracking-tight" >
        New Task Assignment
          </h2>
          < p className = "text-indigo-100 text-xs" >
            Fill in the details to schedule your work
              </p>
              </div>

  {/* Main Content - Scrollable area */ }
  <div className="p-5 flex flex-col gap-5 flex-1 overflow-y-auto" >

    {/* IN-CANVAS ERROR MESSAGE */ }
  {
    errorMessage && (
      <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-200" >
        { errorMessage }
        </div>
        )
  }

  {/* TASK TITLE */ }
  <div className="flex flex-col gap-1.5" >
    <label className="text-xs font-semibold text-slate-600 ml-1" >
      TASK TITLE
        </label>
        < input
  type = "text"
  name = "name"
  placeholder = "e.g. Project Review"
  value = { task.name || "" }
  onChange = { handleChange }
  className = "w-full border-2 border-slate-100 bg-white p-2.5 text-sm rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
    />
    </div>

  {/* DATE + TIME SAME ROW */ }
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" >
    <div className="flex flex-col gap-1.5" >
      <label className="text-xs font-semibold text-slate-600 ml-1" >
        DATE
        </label>
        < input
  type = "date"
  name = "dueDate"
  min = { today }
  value = { task.dueDate || "" }
  onChange = { handleChange }
  className = "w-full border-2 border-slate-100 bg-white p-2.5 text-sm rounded-lg focus:border-indigo-500 outline-none transition-all"
    />
    </div>

    < div className = "flex flex-col gap-1.5" >
      <label className="text-xs font-semibold text-slate-600 ml-1" >
        TIME
        </label>
        < input
  type = "time"
  name = "dueTime"
  value = { task.dueTime || "" }
  onChange = { handleChange }
  className = "w-full border-2 border-slate-100 bg-white p-2.5 text-sm rounded-lg focus:border-indigo-500 outline-none transition-all"
    />
    </div>
    </div>

  {/* DESCRIPTION - No flex-1 here so it takes only needed space and allows scrolling */ }
  <div className="flex flex-col gap-1.5 min-h-[140px]" >
    <label className="text-xs font-semibold text-slate-600 ml-1" >
      DESCRIPTION & NOTES
      </label>
      < textarea
  name = "description"
  placeholder = "Outline the steps or goals for this task..."
  value = { task.description || "" }
  onChange = { handleChange }
  className = "w-full h-20 border-2 border-slate-100 bg-white p-3 text-sm rounded-lg resize-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
    />
    </div>
    </div>

  {/* ACTION BUTTON - Fixed at the very bottom outside scroll area */ }
  <div className="p-5 bg-white border-t border-slate-200 shrink-0" >
    <div className="flex flex-col items-center gap-3" >
      <button
            onClick={ handleSubmit }
  disabled = { loading }
  className = "w-full sm:w-64 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center"
    >
    { loading? "Creating...": "Create Task" }
    </button>

    < span className = "text-[11px] text-slate-400 font-medium text-center" >
      The date picker will only allow current or future selections.
          </span>
        </div>
        </div>
        </div>
  );
}
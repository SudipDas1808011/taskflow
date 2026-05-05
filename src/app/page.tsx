"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import CreateTask from "@/components/CreateTask";
import RunningTasks from "@/components/RunningTasks";
import AIChat from "@/components/AIChat";
import { Stats, History } from "@/components/Stats";
import { TaskItem } from "@/types/types";
import { deleteTask } from "@/services/taskService";
import Login from "@/components/Login";

export default function Home() {
  const [refresh, setRefresh] = useState(false);
  const [retryTask, setRetryTask] = useState<TaskItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);


  const handleRetry = (task: TaskItem) => {
    setRetryTask(task);
    setIsCreateOpen(true);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    console.log("Loaded token:", savedToken);
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  if (!token) {
    return <Login onLoginSuccess={setToken} />;
  }
  const handleCreated = async () => {
    if (retryTask?.id) {
      try {
        await deleteTask("",retryTask.id,token);
        console.log("Old task deleted after retry");
      } catch (err) {
        console.error("Failed to delete old task:", err);
      }
    }

    setRetryTask(null);
    setRefresh((prev) => !prev);
  };
  return (
    <main className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 md:border-4 border-black p-3 md:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <Header />

        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 mb-6">
          <div className="overflow-hidden lg:col-span-4 min-h-[300px] lg:h-[450px] ">
            <CreateTask
              open={isCreateOpen}
              onClose={() => setIsCreateOpen(false)}
              initialData={retryTask}
              onCreated={handleCreated}
            />
          </div>

          <div className="lg:col-span-4 min-h-[300px] lg:h-[450px]">
            <RunningTasks refresh={refresh} setRefresh={setRefresh} />
          </div>

          <div className="md:col-span-2 lg:col-span-4 min-h-[400px] lg:h-[450px]">
            <AIChat setRefresh={setRefresh} />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <div className="lg:col-span-4">
            <Stats />
          </div>
          <div className="lg:col-span-8">
            <History refresh={refresh} onRetry={handleRetry} />
          </div>
        </div>
      </div>
    </main>
  );
}

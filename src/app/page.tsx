"use client";
import { useState } from "react";
import Header from "@/components/Header";
import CreateTask from "@/components/CreateTask";
import RunningTasks from "@/components/RunningTasks";
import AIChat from "@/components/AIChat";
import { Stats, History } from "@/components/Stats";

export default function Home() {
  const [refresh, setRefresh] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-50 p-4 md:p-8 font-sans text-black">
      <div className="max-w-7xl mx-auto border-2 md:border-4 border-black p-3 md:p-6 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        
        <Header />
        
        {/* Middle Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 mb-6">
          
          <div className="lg:col-span-3 min-h-[300px] lg:h-[450px]">
            <CreateTask onCreated={() => setRefresh(prev => !prev)} />
          </div>

          <div className="lg:col-span-5 min-h-[300px] lg:h-[450px]">
            <RunningTasks refresh={refresh} />
          </div>

          <div className="md:col-span-2 lg:col-span-4 min-h-[400px] lg:h-[450px]">
            <AIChat />
          </div>

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
          <div className="lg:col-span-3">
            <Stats />
          </div>
          <div className="lg:col-span-9">
            <History />
          </div>
        </div>

      </div>
    </main>
  );
}
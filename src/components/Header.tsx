"use client";

import { useState, useEffect } from "react";

export default function Header() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Initialize state from localStorage or empty array/set
  const [activeNotifications, setActiveNotifications] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeNotifications");
      if (saved) {
        // Parse and convert stored date strings back into Date objects
        return JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));
      }
    }
    return [];
  });

  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("notifiedTaskIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  const [lastSeenTime, setLastSeenTime] = useState<Date>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lastSeenNotifTime");
      return saved ? new Date(saved) : new Date();
    }
    return new Date();
  });

  const [, setTick] = useState(0);

  // Sync notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("activeNotifications", JSON.stringify(activeNotifications));
  }, [activeNotifications]);

  // Sync notified IDs to localStorage
  useEffect(() => {
    localStorage.setItem("notifiedTaskIds", JSON.stringify(Array.from(notifiedTaskIds)));
  }, [notifiedTaskIds]);

  // Sync last seen time to localStorage
  useEffect(() => {
    localStorage.setItem("lastSeenNotifTime", lastSeenTime.toISOString());
  }, [lastSeenTime]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const hasUnseenNotifications = activeNotifications.some(
    (notif) => notif.createdAt > lastSeenTime
  );

  const toggleNotifications = () => {
    if (!isNotificationOpen) {
      setLastSeenTime(new Date());
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
    return "Just now";
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkTasks = () => {
      const storedTasks = localStorage.getItem("runningTasks");
      if (!storedTasks) return;

      const tasks = JSON.parse(storedTasks);
      const now = new Date();
      const newAlerts: any[] = [];

      // Update current notifications (Upcoming -> Passed)
      setActiveNotifications((prev) =>
        prev.map((notif) => {
          const [year, month, day] = notif.originalTask.dueDate.split("-").map(Number);
          const [hours, minutes] = notif.originalTask.dueTime.split(":").map(Number);
          const taskTime = new Date(year, month - 1, day, hours, minutes);
          return {
            ...notif,
            type: now > taskTime ? "passed" : "reminder"
          };
        })
      );

      // Check for new tasks to alert
      tasks.forEach((task: any) => {
        if (task.isCompleted) return;
        const [year, month, day] = task.dueDate.split("-").map(Number);
        const [hours, minutes] = task.dueTime.split(":").map(Number);
        const taskTime = new Date(year, month - 1, day, hours, minutes);

        const diffInMs = taskTime.getTime() - now.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

        if (diffInMinutes >= 0 && diffInMinutes <= 5 && !notifiedTaskIds.has(task.id)) {
          const alertMsg = {
            id: task.id,
            text: `Upcoming Task: ${task.name} starts in ${diffInMinutes} minutes!`,
            createdAt: new Date(),
            type: "reminder",
            originalTask: task
          };
          newAlerts.push(alertMsg);

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Task Reminder", {
              body: `${task.name} is starting soon.`,
              icon: "/favicon.ico"
            });
          }
          setNotifiedTaskIds((prev) => new Set(prev).add(task.id));
        }
      });

      if (newAlerts.length > 0) {
        setActiveNotifications((prev) => [...newAlerts, ...prev]);
      }
      setTick((t) => t + 1);
    };

    checkTasks();
    const interval = setInterval(checkTasks, 60000);
    return () => clearInterval(interval);
  }, [notifiedTaskIds]);

  return (
    <header className="relative w-full flex items-center justify-between p-4 mb-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex flex-col">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">TF</div>
          TaskFlow
        </h1>
        <p className="hidden sm:block text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-10">
          Smart Management System
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={toggleNotifications}
            className={`p-2 rounded-lg border transition-all duration-200 ${
              isNotificationOpen 
                ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
            }`}
          >
            <span className="relative inline-block">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {hasUnseenNotifications && (
                <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </span>
          </button>

          {isNotificationOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsNotificationOpen(false)}></div>
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-black ring-opacity-5">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Task Alerts</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Auto-monitoring Tasks</p>
                  </div>
                  {activeNotifications.length > 0 && (
                    <button 
                      onClick={() => {
                        setActiveNotifications([]);
                        setNotifiedTaskIds(new Set());
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-[350px] overflow-y-auto p-2 bg-slate-50 space-y-2">
                  {activeNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-xs text-slate-400">No recent task activity.</p>
                    </div>
                  ) : (
                    activeNotifications.map((notif) => (
                      <div key={notif.id} className="group p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 shadow-sm transition-all relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${notif.type === 'passed' ? 'bg-slate-300' : 'bg-amber-500'}`} />
                        <div className="flex flex-col gap-1.5 pl-1">
                          <p className={`text-xs font-semibold leading-snug ${notif.type === 'passed' ? 'text-slate-500' : 'text-slate-800'}`}>
                            {notif.text}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${notif.type === 'passed' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-600'}`}>
                              {notif.type === 'passed' ? 'Passed' : 'Upcoming'}
                            </span>
                            <span className="text-[10px] text-slate-400">{formatTimeAgo(notif.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={handleLogout} className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all duration-200">
          <span className="text-sm font-bold text-slate-600 group-hover:text-red-600 transition-colors">Logout</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
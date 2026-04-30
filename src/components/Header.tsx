"use client";

export default function Header() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <header className="w-full flex items-center justify-between p-4 mb-6 bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* Brand Section */}
      <div className="flex flex-col">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs">
            TF
          </div>
          TaskFlow
        </h1>
        <p className="hidden sm:block text-[11px] font-medium text-slate-400 uppercase tracking-widest ml-10">
          Smart Management System
        </p>
      </div>

      {/* Action Section */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-xs font-semibold text-slate-700">Active Session</span>
          <span className="text-[10px] text-indigo-500 font-medium italic">Synchronized</span>
        </div>

        <button
          onClick={handleLogout}
          className="group flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg transition-all duration-200"
        >
          <span className="text-sm font-bold text-slate-600 group-hover:text-red-600 transition-colors">
            Logout
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 text-slate-400 group-hover:text-red-500 transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
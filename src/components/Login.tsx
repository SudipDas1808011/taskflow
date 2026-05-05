"use client";
import { useState, FormEvent } from "react";

type Props = {
  onLoginSuccess: (token: string) => void;
};

type AuthResponse = {
  token?: string;
  message?: string;
};

export default function Login({ onLoginSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loading) return;

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 4) {
      setError("Password must be at least 4 characters long.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? "login" : "register";

      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let data: AuthResponse = {};

      try {
        const text = await res.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
      }

      if (!res.ok) {
        // This catches the "Email already exists" message from your backend
        throw new Error(data.message || "Authentication failed");
      }

      if (!data.token) {
        throw new Error("Token not received from server");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email", email);

      setEmail("");
      setPassword("");
      onLoginSuccess(data.token);

    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-center">
        <h2 className="text-white font-bold text-xl">
          {isLogin ? "Welcome" : "Create Account"}
        </h2>
        <p className="text-indigo-100 text-xs mt-1">
          {isLogin
            ? "Log in to manage your tasks"
            : "Sign up to start tracking goals"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
        
        {error && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-amber-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 ml-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            value={email}
            disabled={loading}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="border-2 border-slate-100 p-3 rounded-lg text-sm focus:font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-600 ml-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            disabled={loading}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-slate-100 p-3 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-3 rounded-lg text-sm font-bold mt-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          {loading ? "Processing..." : isLogin ? "Sign In" : "Get Started"}
        </button>

        <div className="mt-2 text-center">
          <p className="text-xs text-slate-500">
            {isLogin
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                if (!loading) {
                  setIsLogin(!isLogin);
                  setError(null);
                }
              }}
              className="ml-1 text-indigo-600 hover:text-indigo-800 font-bold"
            >
              {isLogin ? "Register now" : "Log in"}
            </button>
          </p>
        </div>

      </form>
    </div>
  );
}
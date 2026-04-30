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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password.length < 4) {
      alert("Password must be at least 4 characters long.");
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

      console.log("Raw response:", res);

      let data: AuthResponse = {};

      try {
        const text = await res.text();
        console.log("Response text:", text);

        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
      }

      console.log("Parsed response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (!data.token) {
        throw new Error("Token not received from server");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("email",email);
      console.log("Token saved:", data.token);

      setEmail("");
      setPassword("");

      onLoginSuccess(data.token);

    } catch (err: any) {
      console.error("Auth error:", err);
      alert(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-center">
        <h2 className="text-white font-bold text-xl">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p className="text-indigo-100 text-xs mt-1">
          {isLogin
            ? "Log in to manage your tasks"
            : "Sign up to start tracking goals"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

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
              onClick={() => !loading && setIsLogin(!isLogin)}
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
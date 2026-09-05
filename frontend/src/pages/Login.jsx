import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === "Admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setForm({ email: "admin@kalakosh.org", password: "admin123" });
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl border border-earth-900/10 shadow-lift p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-terracotta/10 to-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta to-amber-accent flex items-center justify-center shadow-md mx-auto mb-3">
            <span className="text-2xl">🏺</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-earth-900">
            Welcome Back
          </h1>
          <p className="text-xs text-earth-600 mt-1">
            Sign in to access your KalaKosh curator & contributor account.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@kalakosh.org"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-cultural"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-cultural"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-md w-full justify-center text-sm font-bold shadow-md mt-2"
          >
            {submitting ? <span className="spinner" /> : "Sign In to KalaKosh"}
          </button>
        </form>

        {/* Quick Fill Demo Helper */}
        <div className="mt-6 pt-5 border-t border-earth-900/10 text-center">
          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="btn btn-secondary btn-sm text-xs w-full justify-center"
          >
            ⚡ Quick Fill Admin Demo Credentials
          </button>
        </div>

        <p className="text-xs text-earth-600 mt-6 text-center">
          Don't have an account?{" "}
          <Link to="/register" className="text-terracotta font-bold hover:underline">
            Register as Contributor
          </Link>
        </p>
      </div>
    </div>
  );
}

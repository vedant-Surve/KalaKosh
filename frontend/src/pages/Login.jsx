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
      setError(err.message || "Invalid credentials. Please verify email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFillAdmin = () => {
    setForm({ email: "admin@kalakosh.org", password: "admin123" });
  };

  return (
    <div className="max-w-md mx-auto py-14 px-4">
      <div className="bg-white rounded-3xl border border-earth-900/10 shadow-card p-8 sm:p-10 relative overflow-hidden">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-earth-900 text-parchment flex items-center justify-center font-serif font-black text-xl shadow-md mx-auto mb-3">
            K
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-terracotta mb-1 block">
            National Cultural Archive
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-earth-900">
            Sign In to KalaKosh
          </h1>
          <p className="text-xs text-earth-600 mt-1">
            Access your curator, researcher, or contributor portal.
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
              placeholder="admin@kalakosh.org"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-cultural"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider">
                Password
              </label>
            </div>
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
            className="btn btn-primary btn-md w-full justify-center text-xs font-bold tracking-wider uppercase shadow-md mt-2"
          >
            {submitting ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>

        {/* Admin Quick Fill Credentials Panel */}
        <div className="mt-6 pt-5 border-t border-earth-900/10 space-y-3">
          <div className="bg-earth-50 rounded-2xl p-3 border border-earth-900/5 text-center">
            <p className="text-[11px] font-bold text-earth-800 uppercase tracking-wider mb-1">
              Curator / Admin Demo Credentials:
            </p>
            <p className="font-mono text-xs text-earth-900 font-semibold select-all">
              admin@kalakosh.org / admin123
            </p>
          </div>

          <button
            type="button"
            onClick={handleQuickFillAdmin}
            className="btn btn-secondary btn-sm text-xs w-full justify-center font-bold"
          >
            Autofill Admin Credentials
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


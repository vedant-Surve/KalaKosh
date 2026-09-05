import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl border border-earth-900/10 shadow-lift p-8 sm:p-10 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-terracotta/10 to-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta to-amber-accent flex items-center justify-center shadow-md mx-auto mb-3">
            <span className="text-2xl">🌿</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-earth-900">
            Join the Living Archive
          </h1>
          <p className="text-xs text-earth-600 mt-1">
            Create an account to contribute folklore, oral stories, and preserve indigenous heritage.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              required
              placeholder="e.g. Jivya Soma Mashe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-cultural"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="you@domain.org"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-cultural"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
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
            {submitting ? <span className="spinner" /> : "Create Contributor Account"}
          </button>
        </form>

        <p className="text-xs text-earth-600 mt-6 text-center">
          Already a member?{" "}
          <Link to="/login" className="text-terracotta font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

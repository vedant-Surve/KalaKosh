import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navLinkClass = (path) => {
    const active = isActive(path);
    return `relative px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
      active
        ? "bg-terracotta text-white shadow-sm"
        : "text-earth-800/80 hover:text-earth-950 hover:bg-earth-100/70"
    }`;
  };

  return (
    <header className="sticky top-0 z-50 bg-parchment/95 backdrop-blur-md border-b border-earth-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-earth-900 text-parchment flex items-center justify-center font-serif font-black text-lg shadow-sm group-hover:bg-terracotta transition-colors">
            K
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-black tracking-tight text-earth-900 leading-none">
              Kala<span className="text-terracotta">Kosh</span>
            </span>
            <span className="text-[9px] uppercase font-bold tracking-widest text-earth-600 mt-0.5">
              National Tribal Heritage Archive
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/80 p-1 rounded-full border border-earth-900/10 shadow-sm backdrop-blur">
          <Link to="/" className={navLinkClass("/")}>
            Home
          </Link>
          <Link to="/gallery" className={navLinkClass("/gallery")}>
            Tradition Gallery
          </Link>
          <Link to="/ar" className={navLinkClass("/ar")}>
            3D AR Scanner
          </Link>
          <Link to="/scan" className={navLinkClass("/scan")}>
            QR Heritage Sites
          </Link>
          <Link to="/contribute" className={navLinkClass("/contribute")}>
            Folklore Archive
          </Link>
          {user?.role === "Admin" && (
            <Link to="/admin" className={navLinkClass("/admin")}>
              Curatorial Deck
            </Link>
          )}
        </nav>

        {/* Right Action & User Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Ask AI quick pill */}
          <button
            onClick={() => document.dispatchEvent(new CustomEvent("open-pratyaksha"))}
            className="btn btn-sm text-xs font-bold px-3.5 py-1.5 bg-earth-900 text-parchment hover:bg-terracotta transition-all rounded-full shadow-sm"
            title="Open Pratyaksha AI Cultural Assistant"
          >
            Pratyaksha AI Guide
          </button>

          {user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-earth-900/15">
              <div className="flex items-center gap-2 bg-white/90 py-1 pl-1.5 pr-3 rounded-full border border-earth-900/10 shadow-sm">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-inner ${
                    user.role === "Admin"
                      ? "bg-earth-900"
                      : user.is_verified
                      ? "bg-teal-700"
                      : "bg-terracotta"
                  }`}
                >
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-earth-900 leading-tight">
                      {user.name?.split(" ")[0]}
                    </span>
                    {user.is_verified && (
                      <span className="text-[10px] text-teal-700 font-bold" title="Verified Contributor">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] text-earth-600 font-semibold tracking-wider uppercase">
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="btn btn-outline btn-sm text-xs font-semibold py-1.5 px-3 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 border-l border-earth-900/15">
              <Link to="/login" className="btn btn-outline btn-sm text-xs px-4 py-1.5">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm text-xs px-4 py-1.5">
                Join Archive
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden p-2 rounded-xl text-earth-900 hover:bg-earth-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-earth-900/10 bg-parchment/95 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col gap-1.5">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass("/")}
            >
              Home
            </Link>
            <Link
              to="/gallery"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass("/gallery")}
            >
              Tradition Gallery
            </Link>
            <Link
              to="/ar"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass("/ar")}
            >
              3D AR Scanner
            </Link>
            <Link
              to="/scan"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass("/scan")}
            >
              QR Heritage Sites
            </Link>
            <Link
              to="/contribute"
              onClick={() => setMobileOpen(false)}
              className={navLinkClass("/contribute")}
            >
              Folklore Archive
            </Link>
            {user?.role === "Admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className={navLinkClass("/admin")}
              >
                Curatorial Deck
              </Link>
            )}
          </nav>

          <div className="pt-3 border-t border-earth-900/10 flex flex-col gap-2">
            <button
              onClick={() => {
                document.dispatchEvent(new CustomEvent("open-pratyaksha"));
                setMobileOpen(false);
              }}
              className="w-full btn btn-primary btn-sm justify-center text-xs py-2"
            >
              Pratyaksha AI Guide
            </button>

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-terracotta text-white flex items-center justify-center font-bold text-xs">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-earth-900">{user.name}</p>
                    <p className="text-[10px] text-earth-600">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                    setMobileOpen(false);
                  }}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-outline btn-sm justify-center"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-primary btn-sm justify-center"
                >
                  Join Archive
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


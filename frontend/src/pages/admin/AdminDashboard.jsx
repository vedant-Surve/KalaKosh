import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";

/* ── Metric Card ─────────────────────────────────────────────────────── */
function MetricCard({ label, value, icon, highlight, subtext }) {
  return (
    <div
      className={`rounded-3xl p-6 border transition-all ${
        highlight
          ? "bg-gradient-to-br from-terracotta/10 via-amber-500/10 to-white border-terracotta/30 shadow-md"
          : "bg-white border-earth-900/10 shadow-card"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl p-2.5 rounded-2xl bg-earth-50 border border-earth-900/5">{icon}</span>
        {highlight && (
          <span className="badge-cultural badge-terracotta text-[10px] font-bold">
            Action Needed
          </span>
        )}
      </div>
      <p className="font-serif text-3xl sm:text-4xl font-black text-earth-900 leading-tight mb-1">
        {value === undefined || value === null ? "—" : value}
      </p>
      <p className="text-xs uppercase font-bold tracking-wider text-earth-600">
        {label}
      </p>
      {subtext && <p className="text-[11px] text-earth-500 mt-2 font-medium">{subtext}</p>}
    </div>
  );
}

/* ── Status Pill ─────────────────────────────────────────────────────── */
function StatusPill({ status }) {
  if (status === "Approved") return <span className="badge-cultural badge-success">✅ Approved</span>;
  if (status === "Rejected") return <span className="badge-cultural badge-danger">❌ Rejected</span>;
  return <span className="badge-cultural badge-amber">⏳ Pending Review</span>;
}

/* ── Role Badge ──────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  if (role === "Admin") return <span className="badge-cultural badge-indigo">Admin</span>;
  if (role === "User") return <span className="badge-cultural badge-earth">Contributor</span>;
  return <span className="badge-cultural badge-earth">{role}</span>;
}

/* ══════════════════════════════════════════════════════════════════════
   AdminDashboard Page
══════════════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("metrics");
  const [metrics, setMetrics] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [users, setUsers] = useState([]);
  const [artForms, setArtForms] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [newArtForm, setNewArtForm] = useState({ name: "", description: "", region: "" });
  const [newArtwork, setNewArtwork] = useState({
    art_form_id: "",
    title: "",
    description: "",
    image_url: "",
    region: "",
  });

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };
  const fail = (msg) => {
    setError(msg);
    setTimeout(() => setError(""), 6000);
  };

  const loadAll = async () => {
    try {
      const [{ data: m }, { data: c }, { data: forms }, { data: u }, { data: works }] =
        await Promise.all([
          client.get("/admin/metrics"),
          client.get("/admin/contributions"),
          client.get("/art-forms"),
          client.get("/admin/users"),
          client.get("/artworks"),
        ]);
      setMetrics(m);
      setContributions(c);
      setArtForms(forms);
      setUsers(u);
      setArtworks(works);
    } catch (err) {
      fail(err.message);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* Contribution moderation */
  const handleModeration = async (id, action) => {
    try {
      await client.put(`/admin/contributions/${id}/${action}`);
      setContributions((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: action === "approve" ? "Approved" : "Rejected" } : c
        )
      );
      flash(`Contribution successfully ${action}d.`);
      const { data: m } = await client.get("/admin/metrics");
      setMetrics(m);
    } catch (err) {
      fail(err.message);
    }
  };

  /* User verification */
  const handleVerify = async (userId, verify) => {
    try {
      await client.put(`/admin/users/${userId}/${verify ? "verify" : "unverify"}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_verified: verify } : u))
      );
      flash(`User ${verify ? "verified" : "unverified"} successfully.`);
      const { data: m } = await client.get("/admin/metrics");
      setMetrics(m);
    } catch (err) {
      fail(err.message);
    }
  };

  const handlePromote = async (userId) => {
    if (!window.confirm("Promote this user to Admin? This grants full curatorial access.")) return;
    try {
      await client.put(`/admin/users/${userId}/promote`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: "Admin", is_verified: true } : u))
      );
      flash("User promoted to Admin.");
    } catch (err) {
      fail(err.message);
    }
  };

  /* Art form creation */
  const submitArtForm = async (e) => {
    e.preventDefault();
    try {
      await client.post("/admin/art-forms", newArtForm);
      flash("Art form created successfully.");
      setNewArtForm({ name: "", description: "", region: "" });
      loadAll();
    } catch (err) {
      fail(err.message);
    }
  };

  /* Artwork creation */
  const submitArtwork = async (e) => {
    e.preventDefault();
    try {
      await client.post("/admin/artworks", {
        ...newArtwork,
        art_form_id: Number(newArtwork.art_form_id),
      });
      flash("Artwork created! Open Visual Hotspot Mapper to annotate symbol hotspots.");
      setNewArtwork({ art_form_id: "", title: "", description: "", image_url: "", region: "" });
      loadAll();
    } catch (err) {
      fail(err.message);
    }
  };

  const pendingCount = contributions.filter((c) => c.status === "Pending").length;

  return (
    <div className="space-y-8 pb-16">
      {/* ── Deck Header ─────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-2">
            <span>⚙️</span>
            <span>Curatorial Control Center</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-earth-900 leading-tight">
            Curatorial Deck
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1">
            Manage living archive assets, moderate community contributions, and verify cultural contributors.
          </p>
        </div>

        <Link
          to="/admin/hotspot-mapper"
          className="btn btn-primary btn-md shadow-md flex items-center gap-2 self-start md:self-auto"
        >
          <span>🗺️</span>
          <span>Visual Hotspot Mapper →</span>
        </Link>
      </div>

      {/* ── Notifications ───────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* ── Modern Navigation Tabs ──────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/70 rounded-2xl border border-earth-900/10 shadow-sm overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "metrics"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>📊</span>
          <span>Archive Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "content"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>🖼️</span>
          <span>Content Curator</span>
        </button>

        <button
          onClick={() => setActiveTab("heritage")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "heritage"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>🏛️</span>
          <span>Heritage Sites & QR</span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "users"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>👥</span>
          <span>Community Contributors</span>
          {metrics?.total_users > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "users" ? "bg-white/20 text-white" : "bg-earth-100 text-earth-800"}`}>
              {metrics.total_users}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("contributions")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "contributions"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>📝</span>
          <span>Contribution Queue</span>
          {pendingCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-accent text-white font-black animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ════════════ TAB: METRICS ════════════ */}
      {activeTab === "metrics" && (
        <div className="space-y-6 fade-up">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <MetricCard
              icon="🖼️"
              label="Verified Artworks"
              value={metrics?.total_verified_artworks}
              subtext="Curated digital representations"
            />
            <MetricCard
              icon="🎯"
              label="Live Symbol Hotspots"
              value={metrics?.live_pins}
              subtext="Millimeter-annotated coordinate pins"
            />
            <MetricCard
              icon="🎙️"
              label="Oral Stories Preserved"
              value={metrics?.narrated_stories}
              subtext="Native dialect recordings"
            />
            <MetricCard
              icon="⏳"
              label="Pending Moderation"
              value={metrics?.pending_review}
              highlight={metrics?.pending_review > 0}
              subtext="Submissions waiting curatorial sign-off"
            />
            <MetricCard
              icon="🏛️"
              label="QR Heritage Sites"
              value={metrics?.total_heritage_sites}
              subtext="Documented physical historical sites"
            />
            <MetricCard
              icon="🛡️"
              label="Verified Contributors"
              value={metrics?.verified_contributors}
              subtext="Verified tribal elders & scholars"
            />
          </div>
        </div>
      )}

      {/* ════════════ TAB: HERITAGE SITES MANAGEMENT ════════════ */}
      {activeTab === "heritage" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-card space-y-6 fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-earth-900/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-earth-900">
                Heritage Sites & QR Placard Registry
              </h2>
              <p className="text-xs text-earth-600 mt-0.5">
                Manage registered historical sites, geographic coordinates, and associated QR codes.
              </p>
            </div>
            <Link to="/scan" className="btn btn-primary btn-sm text-xs">
              Open QR Scanner & Generator →
            </Link>
          </div>

          <div className="p-4 bg-earth-50 rounded-2xl border border-earth-900/5 text-xs text-earth-700">
            ℹ️ Physical historical sites are scanned via QR code placards by on-site visitors to display historical dossiers and related gallery masterworks.
          </div>
        </div>
      )}

      {/* ════════════ TAB: CONTRIBUTIONS QUEUE ════════════ */}
      {activeTab === "contributions" && (
        <div className="bg-white rounded-3xl overflow-hidden border border-earth-900/10 shadow-card fade-up">
          <div className="p-6 border-b border-earth-900/10 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-earth-900">
                Folklore & History Moderation Queue
              </h2>
              <p className="text-xs text-earth-600 mt-0.5">
                Review community oral narratives, tribal histories, and attached photos before publishing.
              </p>
            </div>
            <span className="badge-cultural badge-amber font-bold text-xs">
              {pendingCount} Pending
            </span>
          </div>

          {contributions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-3xl">📝</p>
              <p className="text-xs italic text-earth-500">No community contributions submitted yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-earth-900/5">
              {contributions.map((c) => (
                <div key={c.id} className="p-6 space-y-4 hover:bg-earth-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="badge-cultural badge-terracotta text-[10px]">
                          {c.category || "Regional Folklore"}
                        </span>
                        {c.region && (
                          <span className="badge-cultural badge-earth text-[10px]">
                            📍 {c.region}
                          </span>
                        )}
                        <StatusPill status={c.status} />
                      </div>

                      <h3 className="font-serif text-lg font-bold text-earth-900">
                        {c.title || "Oral Narrative"}
                      </h3>

                      <p className="text-xs text-earth-600 mt-0.5">
                        By <strong className="text-earth-900">{c.contributor_name || `User #${c.user_id}`}</strong>
                        {c.artwork_title && (
                          <span> on <em>"{c.artwork_title}"</em></span>
                        )}
                        <span className="text-earth-400 ml-2">
                          • {new Date(c.created_at).toLocaleString("en-IN")}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Uploaded photo if present */}
                  {c.image_url && (
                    <div className="w-56 h-36 rounded-2xl overflow-hidden border border-earth-900/10 bg-earth-100 shadow-sm">
                      <img
                        src={c.image_url}
                        alt="Folklore attachment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-earth-50 rounded-2xl border border-earth-900/5">
                    <p className="text-xs sm:text-sm text-earth-800 leading-relaxed font-normal">
                      "{c.content}"
                    </p>
                  </div>

                  {c.status === "Pending" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleModeration(c.id, "approve")}
                        className="btn btn-sm btn-primary text-xs flex items-center gap-1.5"
                      >
                        <span>✅</span>
                        <span>Approve & Generate Verified Card</span>
                      </button>
                      <button
                        onClick={() => handleModeration(c.id, "reject")}
                        className="btn btn-sm btn-outline text-xs text-red-700 hover:bg-red-50 hover:border-red-300"
                      >
                        <span>❌</span>
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

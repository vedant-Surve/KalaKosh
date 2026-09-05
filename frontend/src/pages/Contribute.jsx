import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Contribute() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("submit"); // "submit" | "my" | "public"
  const [categoryFilter, setCategoryFilter] = useState("All");

  const [artworks, setArtworks] = useState([]);
  const [myContributions, setMyContributions] = useState([]);
  const [publicContributions, setPublicContributions] = useState([]);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Regional Folklore");
  const [region, setRegion] = useState("");
  const [selectedArtworkId, setSelectedArtworkId] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const categories = [
    "Regional Folklore",
    "Tribal History",
    "Folk Song & Oral Lore",
    "Craft Traditions & Pigments",
    "Sacred Ritual Practices",
  ];

  const loadData = async () => {
    setLoadingData(true);
    try {
      await refreshUser?.();
      const [{ data: works }, { data: myDocs }, { data: pubDocs }] = await Promise.all([
        client.get("/artworks"),
        client.get("/contributions/my").catch(() => ({ data: [] })),
        client.get("/contributions/approved").catch(() => ({ data: [] })),
      ]);
      setArtworks(works);
      setMyContributions(myDocs);
      setPublicContributions(pubDocs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await client.post("/contributions/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrl(data.image_url);
      setSuccess("✅ Image attached successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setImageUploading(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await client.post("/contributions", {
        artwork_id: selectedArtworkId ? Number(selectedArtworkId) : null,
        title: title.trim() || "Oral Folklore Narrative",
        category,
        region: region.trim() || null,
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      });

      setSuccess("✅ Your regional folklore & tribal history submission has been submitted! It is now in the Curatorial Review queue for administrator verification.");
      setTitle("");
      setCategory("Regional Folklore");
      setRegion("");
      setContent("");
      setImageUrl("");
      setSelectedArtworkId("");
      loadData();
      setActiveTab("my");
    } catch (err) {
      setError(err.message || "Failed to submit contribution.");
    } finally {
      setSubmitting(false);
    }
  };

  const isVerified = user?.is_verified || user?.role === "Admin";

  const displayedPublic = categoryFilter === "All"
    ? publicContributions
    : publicContributions.filter((c) => c.category === categoryFilter);

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header Banner ───────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-2">
            <span>📜</span>
            <span>Living Oral & Folklore Archive</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-earth-900 leading-tight">
            Community Folklore & History Hub
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1 max-w-2xl">
            Preserve ancestral oral history, dialect narratives, folk songs, and tribal traditions in collaboration with indigenous communities. Submissions are reviewed by curators and published as verified community folklore cards.
          </p>
        </div>

        {/* Contributor Status Badge */}
        <div className="bg-earth-50 rounded-2xl p-4 border border-earth-900/10 flex items-center gap-3 self-start md:self-auto min-w-[240px]">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${
              isVerified ? "bg-teal-700" : "bg-amber-600"
            }`}
          >
            {isVerified ? "✓" : "⏳"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-earth-900">
                {isVerified ? "Verified Contributor" : "Verification Pending"}
              </p>
            </div>
            <p className="text-[10px] text-earth-500 font-medium">
              {isVerified
                ? "Full contribution privileges active"
                : "Awaiting curatorial approval"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Verification Guidance (if unverified) ─────────────── */}
      {!isVerified && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-accent/30 flex items-start gap-3">
          <span className="text-2xl text-amber-accent">🛡️</span>
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Cultural Authenticity & Provenance Safeguard
            </h3>
            <p className="text-xs text-earth-800 leading-relaxed font-normal">
              To ensure all documented folklore respects native heritage and tribal provenance, contributions can only be published by{" "}
              <strong>verified indigenous community members, elders, or recognized researchers</strong>.
              Administrators review new contributor accounts regularly. An admin can grant you verification directly from the Curatorial Deck.
            </p>
          </div>
        </div>
      )}

      {/* ── Notifications ───────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* ── Navigation Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/70 rounded-2xl border border-earth-900/10 shadow-sm overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("submit")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "submit"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>✍️</span>
          <span>Submit Folklore / History</span>
        </button>

        <button
          onClick={() => setActiveTab("my")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "my"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>📂</span>
          <span>My Submissions</span>
          {myContributions.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "my" ? "bg-white/20 text-white" : "bg-earth-100 text-earth-800"}`}>
              {myContributions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("public")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === "public"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          <span>🏛️</span>
          <span>Community Living Archive</span>
          {publicContributions.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "public" ? "bg-white/20 text-white" : "bg-earth-100 text-earth-800"}`}>
              {publicContributions.length}
            </span>
          )}
        </button>
      </div>

      {/* ════════════ TAB 1: SUBMIT FOLKLORE & TRIBAL HISTORY ════════════ */}
      {activeTab === "submit" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-card max-w-3xl space-y-6 fade-up">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-1">
              <span>🌿</span>
              <span>Curatorial Ingestion</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-earth-900">
              Submit Regional Folklore & Tribal History
            </h2>
            <p className="text-xs text-earth-600 mt-1">
              Share dialect songs, cosmic creation legends, ritual customs, or regional history. All submissions enter a pending queue for admin review before generating a verified card.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
                Folklore / Narrative Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. The Legend of the Tarpa Horn & Cosmic Spiral Dance"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-cultural"
              />
            </div>

            {/* Category & Region Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
                  Knowledge Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-cultural"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
                  Region / Tribal Community
                </label>
                <input
                  type="text"
                  placeholder="e.g. Palghar, Maharashtra - Warli Tribe"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="input-cultural"
                />
              </div>
            </div>

            {/* Target Artwork (Optional) */}
            <div>
              <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
                Related Masterwork in Archive (Optional)
              </label>
              <select
                value={selectedArtworkId}
                onChange={(e) => setSelectedArtworkId(e.target.value)}
                className="input-cultural"
              >
                <option value="">General Regional Folklore / Standalone History</option>
                {artworks.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} ({a.region || "Heritage"})
                  </option>
                ))}
              </select>
            </div>

            {/* Oral Narrative Text Content */}
            <div>
              <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
                Folklore Story, Oral History & Traditional Context *
              </label>
              <textarea
                required
                minLength={10}
                rows={6}
                placeholder="Describe the oral narrative, dialect song meanings, spiritual cosmology, or ritual context as passed down by community elders..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-cultural text-sm"
              />
            </div>

            {/* Image Attachment (File upload or URL) */}
            <div>
              <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
                Attach Photo / Visual Artefact (Optional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <label className="btn btn-outline btn-sm text-xs cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center">
                  <span>📷</span>
                  <span>{imageUploading ? "Uploading..." : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-earth-400 font-bold">OR</span>
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="input-cultural text-xs flex-1"
                />
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="mt-3 relative w-32 h-24 rounded-xl overflow-hidden border border-earth-900/10 shadow-sm bg-earth-100">
                  <img
                    src={imageUrl}
                    alt="Uploaded Folklore attachment"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="p-3.5 bg-earth-50 rounded-xl flex items-center justify-between text-[11px] text-earth-600">
              <span>🛡️ All submissions go into a pending queue for administrator review before publication.</span>
              <span>Min. 10 chars</span>
            </div>

            <button
              type="submit"
              disabled={submitting || !isVerified || !content.trim()}
              className="btn btn-primary btn-md w-full justify-center disabled:opacity-50"
            >
              {submitting ? (
                <span className="spinner" />
              ) : isVerified ? (
                "Submit Folklore & History to Pending Queue"
              ) : (
                "Contributor Verification Required to Submit"
              )}
            </button>
          </form>
        </div>
      )}

      {/* ════════════ TAB 2: MY SUBMISSIONS QUEUE ════════════ */}
      {activeTab === "my" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-card space-y-6 fade-up">
          <div className="border-b border-earth-900/10 pb-4 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-earth-900">
                My Folklore & History Submissions
              </h2>
              <p className="text-xs text-earth-600 mt-0.5">
                Track administrator validation and curatorial review for each of your submitted folklore items.
              </p>
            </div>
            <span className="badge-cultural badge-earth font-bold text-xs">
              {myContributions.length} Total Submissions
            </span>
          </div>

          {loadingData ? (
            <div className="py-12 flex justify-center">
              <span className="spinner" />
            </div>
          ) : myContributions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-4xl">📝</p>
              <h3 className="font-serif text-lg font-bold text-earth-900">No Submissions Yet</h3>
              <p className="text-xs text-earth-600 max-w-sm mx-auto">
                You haven't submitted any folklore narratives yet. Switch to the "Submit Folklore / History" tab to contribute.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myContributions.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-earth-900/10 bg-earth-50/50 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-cultural badge-terracotta text-[10px]">
                          {c.category || "Regional Folklore"}
                        </span>
                        {c.region && (
                          <span className="badge-cultural badge-earth text-[10px]">
                            📍 {c.region}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-base font-bold text-earth-900">
                        {c.title || "Oral Narrative"}
                      </h4>
                      {c.artwork_title && (
                        <p className="text-xs text-earth-600">
                          Linked to: <strong>{c.artwork_title}</strong>
                        </p>
                      )}
                      <p className="text-[11px] text-earth-500 mt-0.5">
                        Submitted {new Date(c.created_at).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <div>
                      {c.status === "Approved" && (
                        <span className="badge-cultural badge-success">✅ Published in Living Archive</span>
                      )}
                      {c.status === "Pending" && (
                        <span className="badge-cultural badge-amber">⏳ Administrator Review Pending</span>
                      )}
                      {c.status === "Rejected" && (
                        <span className="badge-cultural badge-danger">❌ Needs Revision</span>
                      )}
                    </div>
                  </div>

                  {c.image_url && (
                    <div className="w-48 h-32 rounded-xl overflow-hidden border border-earth-900/10 bg-earth-100 shadow-sm">
                      <img
                        src={c.image_url}
                        alt={c.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 bg-white rounded-xl border border-earth-900/5">
                    <p className="text-xs sm:text-sm text-earth-800 leading-relaxed font-normal">
                      "{c.content}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════ TAB 3: COMMUNITY LIVING FOLKLORE CARDS ════════════ */}
      {activeTab === "public" && (
        <div className="space-y-6 fade-up">
          {/* Section Header */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
                <span>🛡️</span>
                <span>Verified Indigenous Knowledge</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-black text-earth-900">
                Verified Community Folklore & History Cards
              </h2>
              <p className="text-xs sm:text-sm text-earth-600 mt-1">
                Browse verified regional lore, dialect stories, and tribal histories preserved by community members.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none self-start md:self-auto">
              <button
                onClick={() => setCategoryFilter("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  categoryFilter === "All"
                    ? "bg-terracotta text-white shadow-sm"
                    : "bg-earth-100 text-earth-800 hover:bg-earth-200"
                }`}
              >
                All ({publicContributions.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? "bg-terracotta text-white shadow-sm"
                      : "bg-earth-100 text-earth-800 hover:bg-earth-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {displayedPublic.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-earth-900/10 p-8 space-y-2">
              <p className="text-4xl">🏛️</p>
              <h3 className="font-serif text-lg font-bold text-earth-900">No Folklore Cards in this Category</h3>
              <p className="text-xs text-earth-500">Be the first verified contributor to submit lore in this category!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedPublic.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl overflow-hidden border border-earth-900/10 shadow-card hover:shadow-lift transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Optional Image Header */}
                    {c.image_url && (
                      <div className="relative aspect-[16/9] overflow-hidden bg-earth-100">
                        <img
                          src={c.image_url}
                          alt={c.title || "Folklore visual"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/sample-warli-artwork.svg";
                          }}
                        />
                      </div>
                    )}

                    <div className="p-6 space-y-3">
                      {/* Badge Row */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="badge-cultural badge-terracotta text-[10px] font-bold">
                          {c.category || "Regional Folklore"}
                        </span>
                        {c.region && (
                          <span className="badge-cultural badge-earth text-[10px]">
                            📍 {c.region}
                          </span>
                        )}
                        {c.artwork_title && (
                          <span className="badge-cultural badge-amber text-[10px] truncate max-w-[150px]">
                            🎨 {c.artwork_title}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-lg font-bold text-earth-900 leading-snug">
                        {c.title || "Oral Folklore & Tribal History"}
                      </h3>

                      {/* Story Text */}
                      <p className="text-xs sm:text-sm text-earth-800 leading-relaxed font-normal">
                        "{c.content}"
                      </p>
                    </div>
                  </div>

                  {/* PROMINENT CONTRIBUTOR ATTRIBUTION FOOTER */}
                  <div className="px-6 py-4 bg-earth-50/80 border-t border-earth-900/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌿</span>
                      <div>
                        <p className="text-xs font-bold text-earth-900">
                          Contributed by: <span className="text-terracotta">{c.contributor_name || "Verified Contributor"}</span>
                        </p>
                        <span className="text-[10px] text-teal-700 font-bold flex items-center gap-1">
                          ✓ Verified Cultural Elder
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] text-earth-400">
                      {new Date(c.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

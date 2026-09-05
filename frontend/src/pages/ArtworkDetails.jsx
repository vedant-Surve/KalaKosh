import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import client from "../api/client";
import HotspotOverlay from "../components/HotspotOverlay";
import AudioPlayer from "../components/AudioPlayer";
import { useAuth } from "../context/AuthContext";

/* ── Breadcrumb Navigation ───────────────────────────────────────────── */
function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-earth-600 flex-wrap mb-6" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-earth-400">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-terracotta transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-earth-900 font-bold truncate max-w-xs">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/* ── Contribution Form (Verified Users) ──────────────────────────────── */
function ContributionForm({ artworkId, onSubmitted }) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await client.post("/contributions", { artwork_id: artworkId, content });
      setSuccess(true);
      setContent("");
      onSubmitted?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <span>✅</span>
          <span>Your oral knowledge submission has been sent for curatorial verification. Thank you!</span>
        </div>
      )}
      {error && (
        <div className="rounded-2xl p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1.5">
          Share Oral Narrative or Indigenous Context
        </label>
        <textarea
          required
          minLength={10}
          placeholder="Share ancestral folklore, local dialect variations, ritual use, or oral history regarding this artwork or its motifs..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="input-cultural rounded-xl text-sm"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-earth-500 font-medium">
          🛡️ Reviewed by curators before being preserved in the living archive.
        </p>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="btn btn-primary btn-sm disabled:opacity-50"
        >
          {submitting ? <span className="spinner" /> : "Submit Oral Knowledge"}
        </button>
      </div>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main ArtworkDetails Page
══════════════════════════════════════════════════════════════════════ */
export default function ArtworkDetails() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [artwork, setArtwork] = useState(null);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [communityStories, setCommunityStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadArtwork = () => {
    setLoading(true);
    setError("");
    refreshUser?.();
    Promise.all([
      client.get(`/artworks/${id}`),
      client.get(`/artworks/${id}/contributions`).catch(() => ({ data: [] })),
    ])
      .then(([{ data: art }, { data: stories }]) => {
        setArtwork(art);
        setActiveHotspot(art.hotspots?.[0] || null);
        setCommunityStories(stories);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadArtwork, [id]);

  const handleAskAIAboutArtwork = () => {
    const prompt = `Tell me about the artwork "${artwork?.title}" from the ${artwork?.art_form?.name} tradition (${artwork?.region}). What is its cultural context and symbolism?`;
    document.dispatchEvent(new CustomEvent("open-pratyaksha", { detail: { prompt } }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="spinner" style={{ width: 44, height: 44, borderWidth: 3 }} />
        <p className="text-xs font-bold uppercase tracking-wider text-earth-600">
          Loading Indigenous Canvas & Motifs…
        </p>
      </div>
    );
  }

  if (error || !artwork) {
    return (
      <div className="text-center py-24 bg-white/80 rounded-3xl border border-earth-900/10 max-w-lg mx-auto p-8 space-y-4">
        <p className="text-5xl">🏺</p>
        <h2 className="font-serif text-2xl font-bold text-earth-900">Artwork Not Found</h2>
        <p className="text-sm text-red-700">{error || "The requested artwork could not be loaded."}</p>
        <Link to="/gallery" className="btn btn-primary btn-sm inline-flex mt-4">
          ← Back to Gallery
        </Link>
      </div>
    );
  }

  const activeStory = activeHotspot?.stories?.[0] || null;
  const canContribute = user && (user.is_verified || user.role === "Admin");

  return (
    <div className="space-y-8 pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Gallery", to: "/gallery" },
          { label: artwork.art_form?.name || "Tradition", to: `/gallery?art_form_id=${artwork.art_form_id}` },
          { label: artwork.title },
        ]}
      />

      {/* ── Artwork Main Title Header ───────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="badge-cultural badge-terracotta">
              🏛️ {artwork.art_form?.name}
            </span>
            {artwork.region && (
              <span className="badge-cultural badge-earth">
                📍 {artwork.region}
              </span>
            )}
            <span className="badge-cultural badge-amber">
              🎯 {artwork.hotspots?.length || 0} Motifs Mapped
            </span>
            <span className="badge-cultural badge-teal">
              ✓ Verified Living Archive
            </span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-black text-earth-900 leading-tight">
            {artwork.title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <Link
            to="/ar"
            className="btn btn-primary btn-md shadow-md flex items-center gap-2"
          >
            <span>📱</span>
            <span>Launch AR Experience</span>
          </Link>
          <button
            onClick={handleAskAIAboutArtwork}
            className="btn btn-amber btn-md shadow-md flex items-center gap-2"
          >
            <span>✨</span>
            <span>Ask Pratyaksha AI</span>
          </button>
        </div>
      </div>

      {/* ── Interactive Split Workbench ──────────────────────── */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Visual Canvas Frame */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 border border-earth-900/10 shadow-lift relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-earth-900/5">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="absolute inset-0 w-full h-full object-cover select-none"
                onError={(e) => {
                  e.target.style.opacity = 0.2;
                }}
              />
              <HotspotOverlay
                hotspots={artwork.hotspots}
                activeHotspotId={activeHotspot?.id}
                onSelect={(h) => setActiveHotspot(h)}
              />
            </div>

            {/* Instruction banner */}
            <div className="mt-3 px-3 py-2 bg-earth-50 rounded-xl flex items-center justify-between text-xs text-earth-700 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="text-amber-accent font-bold">💡</span>
                <span>Click any pin on the canvas or select a motif below to explore stories.</span>
              </span>
              <span className="text-[11px] font-bold text-terracotta">
                {artwork.hotspots?.length || 0} Active Pins
              </span>
            </div>
          </div>

          {/* Motif Selector Strip */}
          <div className="bg-white/80 rounded-2xl p-4 border border-earth-900/10 shadow-sm space-y-2">
            <p className="text-xs uppercase font-bold tracking-wider text-earth-600">
              Annotated Ancestral Motifs:
            </p>
            <div className="flex flex-wrap gap-2">
              {artwork.hotspots?.map((h) => {
                const isActive = activeHotspot?.id === h.id;
                return (
                  <button
                    key={h.id}
                    onClick={() => setActiveHotspot(h)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isActive
                        ? "bg-terracotta text-white shadow-md scale-105"
                        : "bg-white text-earth-800 hover:bg-earth-100 border border-earth-900/10"
                    }`}
                  >
                    <span>🎯</span>
                    <span>{h.name}</span>
                  </button>
                );
              })}
              {artwork.hotspots?.length === 0 && (
                <p className="text-xs italic text-earth-500">
                  No symbol hotspots mapped for this artwork yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cultural Dossier & Story Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-earth-900/10 shadow-card space-y-6">
            {activeHotspot ? (
              <>
                {/* Dossier Header */}
                <div className="border-b border-earth-900/10 pb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta/10 text-terracotta text-xs font-bold uppercase tracking-wider mb-2">
                    <span>🎯</span>
                    <span>Selected Motif</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-earth-900 leading-tight">
                    {activeHotspot.name}
                  </h2>
                </div>

                {activeStory ? (
                  <div className="space-y-5">
                    {/* Ancestral Symbolism */}
                    {activeStory.meaning && (
                      <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-accent/20 space-y-1.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <span>✨</span> Ancestral Symbolism & Cosmology
                        </h3>
                        <p className="text-xs sm:text-sm text-earth-900 leading-relaxed font-normal">
                          {activeStory.meaning}
                        </p>
                      </div>
                    )}

                    {/* Folklore / Oral narrative */}
                    {activeStory.description && (
                      <div className="space-y-1.5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                          <span>📖</span> Living Folklore & Lore
                        </h3>
                        <p className="text-xs sm:text-sm text-earth-800 leading-relaxed font-normal">
                          {activeStory.description}
                        </p>
                      </div>
                    )}

                    {/* Audio Narration Component */}
                    <div>
                      <AudioPlayer audioFiles={activeStory.audio_files || []} />
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-earth-50 rounded-2xl p-6 space-y-2">
                    <p className="text-3xl">📜</p>
                    <p className="text-xs font-semibold text-earth-700">
                      Folklore and audio for this motif are currently being transcribed by native community elders.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center space-y-3">
                <p className="text-4xl">🎯</p>
                <h3 className="font-serif text-lg font-bold text-earth-900">
                  Select a Motif to Uncover Its Story
                </h3>
                <p className="text-xs text-earth-600 max-w-xs mx-auto leading-relaxed">
                  Click on any interactive pin on the canvas to view its ancestral meaning and native voice narration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── About This Artwork Description ──────────────────── */}
      {artwork.description && (
        <section className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h3 className="font-serif text-xl font-bold text-earth-900">
              About This Masterpiece
            </h3>
          </div>
          <p className="text-sm text-earth-800 leading-relaxed font-normal">
            {artwork.description}
          </p>
        </section>
      )}

      {/* ── Community Oral Knowledge & Contributions ────────── */}
      <section className="bg-white/80 rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
              <span>🛡️</span>
              <span>Living Community Knowledge</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-earth-900">
              Community Folklore & Oral Contributions
            </h2>
            <p className="text-xs sm:text-sm text-earth-600 mt-1">
              Verified indigenous knowledge holders and researchers can submit oral history, dialect narratives, or ritual context.
            </p>
          </div>

          <Link to="/contribute" className="btn btn-outline btn-sm self-start sm:self-auto">
            ✍️ Open Contribution Hub →
          </Link>
        </div>

        {/* List of Published Community Stories for this Artwork */}
        {communityStories.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-earth-700">
              Published Community Oral Histories ({communityStories.length})
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {communityStories.map((story) => (
                <div
                  key={story.id}
                  className="p-5 bg-earth-50/80 rounded-2xl border border-earth-900/10 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge-cultural badge-terracotta text-[10px] font-bold">
                        {story.category || "Regional Folklore"}
                      </span>
                      {story.region && (
                        <span className="badge-cultural badge-earth text-[10px]">
                          📍 {story.region}
                        </span>
                      )}
                    </div>

                    {story.title && (
                      <h4 className="font-serif text-base font-bold text-earth-900">
                        {story.title}
                      </h4>
                    )}

                    {story.image_url && (
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-earth-100">
                        <img
                          src={story.image_url}
                          alt={story.title || "Story visual"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-earth-800 leading-relaxed">
                      "{story.content}"
                    </p>
                  </div>

                  {/* Prominent short contributor attribution at end of card */}
                  <div className="pt-3 border-t border-earth-900/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span>🌿</span>
                      <span className="font-bold text-earth-900">
                        Contributed by: <span className="text-terracotta">{story.contributor_name || "Verified Contributor"}</span>
                      </span>
                      <span className="text-teal-700 font-semibold text-[10px]">✓</span>
                    </div>
                    <span className="text-[11px] text-earth-400">
                      {new Date(story.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contribution Submission Box */}
        <div className="pt-2">
          {!user ? (
            <div className="rounded-2xl p-5 bg-earth-50 border border-earth-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-earth-900">Have oral history or cultural knowledge about this piece?</p>
                <p className="text-xs text-earth-600">Log in or create a free contributor account to submit oral narratives.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Join Archive</Link>
              </div>
            </div>
          ) : canContribute ? (
            <div className="bg-white p-5 rounded-2xl border border-earth-900/10 shadow-sm">
              <ContributionForm artworkId={artwork.id} onSubmitted={loadArtwork} />
            </div>
          ) : (
            <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-accent/30 flex items-start gap-3">
              <span className="text-xl text-amber-accent">🔒</span>
              <div className="space-y-1">
                <p className="text-xs font-bold text-earth-900 uppercase tracking-wider">
                  Community Verification Required
                </p>
                <p className="text-xs text-earth-700 leading-relaxed">
                  To safeguard cultural authenticity, oral contributions can only be submitted by{" "}
                  <strong>verified indigenous community members or scholars</strong>. An administrator can verify your account from the Curatorial Deck.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

/* ── Warli Decorative SVG Divider ─────────────────────────────────────── */
const WarliDivider = () => (
  <div className="py-8 opacity-40 overflow-hidden" aria-hidden="true">
    <svg viewBox="0 0 1000 36" className="w-full h-8" preserveAspectRatio="none">
      <line x1="0" y1="18" x2="1000" y2="18" stroke="#c0522b" strokeWidth="1" strokeDasharray="6 10" />
      {[100, 250, 400, 550, 700, 850].map((x) => (
        <g key={x} transform={`translate(${x}, 18)`}>
          <circle cx="0" cy="-6" r="3" fill="none" stroke="#c0522b" strokeWidth="1.2" />
          <line x1="0" y1="-3" x2="0" y2="5" stroke="#c0522b" strokeWidth="1.2" />
          <line x1="-5" y1="0" x2="5" y2="0" stroke="#c0522b" strokeWidth="1.2" />
          <line x1="0" y1="5" x2="-4" y2="11" stroke="#c0522b" strokeWidth="1.2" />
          <line x1="0" y1="5" x2="4" y2="11" stroke="#c0522b" strokeWidth="1.2" />
        </g>
      ))}
    </svg>
  </div>
);

/* ── Stat Card Component ──────────────────────────────────────────────── */
function StatCard({ value, label, subtext }) {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-earth-900/10 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
      <div>
        <p className="font-serif text-3xl font-black text-earth-900 leading-none">
          {value ?? "—"}
        </p>
        <p className="text-xs font-bold uppercase tracking-wider text-terracotta mt-2">
          {label}
        </p>
      </div>
      {subtext && <p className="text-xs text-earth-600 mt-2 font-medium">{subtext}</p>}
    </div>
  );
}

/* ── Artwork Card Component ───────────────────────────────────────────── */
function ArtworkCard({ art, artFormName }) {
  return (
    <Link
      to={`/artworks/${art.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-earth-900/10 shadow-card hover:shadow-lift transition-all duration-300 hover:-translate-y-1.5"
    >
      {/* Artwork Image Viewport */}
      <div className="relative aspect-[4/3] overflow-hidden bg-earth-100">
        <img
          src={art.image_url}
          alt={art.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.target.style.opacity = 0.2;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 via-earth-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white text-xs font-bold bg-terracotta px-3.5 py-1.5 rounded-full shadow-md">
            Explore Motifs & Stories →
          </span>
        </div>

        {/* Region Chip */}
        {art.region && (
          <div className="absolute top-3 left-3 bg-parchment/95 backdrop-blur-sm text-earth-900 text-xs font-semibold px-2.5 py-1 rounded-full border border-earth-900/10 shadow-sm">
            <span>{art.region}</span>
          </div>
        )}

        {/* Hotspot Count Indicator */}
        <div className="absolute top-3 right-3 bg-earth-900 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          <span>{art.hotspot_count} Motifs</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {artFormName && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-terracotta mb-1 block">
              {artFormName}
            </span>
          )}
          <h3 className="font-serif text-lg font-bold text-earth-900 mb-2 group-hover:text-terracotta transition-colors line-clamp-1">
            {art.title}
          </h3>
          <p className="text-xs text-earth-700 line-clamp-2 leading-relaxed">
            {art.description || "An authentic indigenous masterwork documented with ancestral oral history."}
          </p>
        </div>

        <div className="pt-4 mt-4 border-t border-earth-900/5 flex items-center justify-between text-xs font-semibold text-terracotta">
          <span className="group-hover:translate-x-0.5 transition-transform">
            Interactive Canvas
          </span>
          <span>→</span>
        </div>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main Home Page
══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const [artForms, setArtForms] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [activeArtFormId, setActiveArtFormId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [{ data: forms }, { data: works }] = await Promise.all([
          client.get("/art-forms"),
          client.get("/artworks"),
        ]);
        setArtForms(forms);
        setArtworks(works);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalHotspots = artworks.reduce((s, a) => s + (a.hotspot_count || 0), 0);
  const filteredArtworks = activeArtFormId
    ? artworks.filter((a) => a.art_form_id === activeArtFormId)
    : artworks;

  const artFormMap = Object.fromEntries(artForms.map((f) => [f.id, f.name]));

  const promptSuggestions = [
    "What is the cultural meaning of the Tarpa Dance in Warli art?",
    "How are natural pigments prepared from rice paste and charcoal?",
    "What is the oral folklore behind the Sacred Mahadev Tree motif?",
    "How does KalaKosh verify tribal folklore contributions?",
  ];

  const handleAskAI = (prompt) => {
    document.dispatchEvent(new CustomEvent("open-pratyaksha", { detail: { prompt } }));
  };

  return (
    <div className="space-y-16 pb-12">
      {/* ── 1. Hero Section ───────────────────────────────────────── */}
      <section className="relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 px-4 sm:px-8 pt-16 pb-20 overflow-hidden bg-gradient-to-b from-parchment-subtle via-parchment to-parchment border-b border-earth-900/10 warli-bg">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full bg-terracotta/10 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-terracotta/25 shadow-sm mb-6 fade-up">
            <span className="text-xs uppercase font-bold tracking-widest text-earth-800">
              National Living Archive of Indigenous Art & Folklore
            </span>
          </div>

          {/* Main Title */}
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-black text-earth-900 leading-[1.1] mb-6 fade-up">
            Where Ancient Traditions Speak Through{" "}
            <span className="text-terracotta underline decoration-amber-accent/40 decoration-wavy decoration-2">
              Living Symbols
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-earth-700 max-w-2xl mx-auto mb-10 leading-relaxed font-normal fade-up">
            Preserving indigenous Indian heritage through high-resolution masterworks, spatial 3D computer-vision reconstruction, native oral folklore, and on-site heritage QR exploration.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 fade-up">
            <a href="#living-archive" className="btn btn-primary btn-lg shadow-md font-bold">
              Explore Curated Archive
            </a>
            <Link to="/ar" className="btn btn-secondary btn-lg shadow-sm hover:border-terracotta font-bold">
              3D AR Scanner
            </Link>
            <Link to="/scan" className="btn btn-outline btn-lg shadow-sm hover:border-terracotta font-bold">
              QR Heritage Sites
            </Link>
          </div>

          {/* Feature Highlights Pill Strip */}
          <div className="mt-12 pt-8 border-t border-earth-900/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <Link to="/ar" className="flex items-center gap-2 p-3 rounded-xl bg-white/70 border border-earth-900/5 hover:border-terracotta transition-colors shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-earth-800">3D Spatial Scanner</span>
            </Link>
            <Link to="/scan" className="flex items-center gap-2 p-3 rounded-xl bg-white/70 border border-earth-900/5 hover:border-terracotta transition-colors shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-earth-800">On-Site QR Placards</span>
            </Link>
            <div
              onClick={() => handleAskAI()}
              className="cursor-pointer flex items-center gap-2 p-3 rounded-xl bg-white/70 border border-earth-900/5 hover:border-terracotta transition-colors shadow-sm"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-earth-800">Pratyaksha AI Guide</span>
            </div>
            <Link to="/contribute" className="flex items-center gap-2 p-3 rounded-xl bg-white/70 border border-earth-900/5 hover:border-terracotta transition-colors shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-earth-800">Folklore Peer Review</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Living Archive Metrics Strip ───────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={artForms.length || "1"}
          label="Art Traditions"
          subtext="Warli, Madhubani, Gond & regional styles"
        />
        <StatCard
          value={artworks.length || "3+"}
          label="Curated Works"
          subtext="High-resolution digital masterworks"
        />
        <StatCard
          value={totalHotspots || "8+"}
          label="Ancestral Motifs"
          subtext="Interactive symbol coordinate hotspots"
        />
        <StatCard
          value="Verified"
          label="Oral Narratives"
          subtext="Preserved native dialect audio recordings"
        />
      </section>

      <WarliDivider />

      {/* ── 3. Living Archive Gallery Section ──────────────────────── */}
      <section id="living-archive" className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-1">
              Curated Repository
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-black text-earth-900">
              The Living Archive
            </h2>
            <p className="text-sm text-earth-600 mt-1">
              Select an indigenous tradition to discover its masterworks and sacred iconography.
            </p>
          </div>
          <Link
            to="/gallery"
            className="btn btn-outline btn-sm self-start sm:self-auto font-bold"
          >
            View Complete Gallery →
          </Link>
        </div>

        {/* Tradition Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 p-2 bg-white/60 rounded-2xl border border-earth-900/10">
          <button
            onClick={() => setActiveArtFormId(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              activeArtFormId === null
                ? "bg-terracotta text-white shadow-sm"
                : "bg-white text-earth-800 hover:bg-earth-100 border border-earth-900/10"
            }`}
          >
            All Traditions ({artworks.length})
          </button>
          {artForms.map((form) => {
            const count = artworks.filter((a) => a.art_form_id === form.id).length;
            const active = activeArtFormId === form.id;
            return (
              <button
                key={form.id}
                onClick={() => setActiveArtFormId(form.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-terracotta text-white shadow-sm"
                    : "bg-white text-earth-800 hover:bg-earth-100 border border-earth-900/10"
                }`}
              >
                <span>{form.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : "bg-earth-100 text-earth-700"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Artwork Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 skeleton rounded-2xl" />
            ))}
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-16 bg-white/50 rounded-2xl border border-earth-900/10">
            <p className="font-semibold text-earth-700">No artworks curated for this tradition yet.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArtworks.map((art) => (
              <ArtworkCard
                key={art.id}
                art={art}
                artFormName={artFormMap[art.art_form_id]}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 4. Pratyaksha AI Cultural Assistant Spotlight ───────────── */}
      <section className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-earth-950 text-white shadow-xl">
        <div className="absolute inset-0 warli-bg opacity-10 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider text-amber-300 mb-4 backdrop-blur">
            <span>Indigenous Intelligence</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-black text-white mb-4">
            Meet Pratyaksha — Cultural AI Companion
          </h2>

          <p className="text-sm sm:text-base text-parchment/80 mb-8 leading-relaxed font-light">
            Have a question regarding tribal cosmology, ritual symbolism, natural pigments, or folklore narratives?
            Pratyaksha is grounded in indigenous archival research and oral histories.
          </p>

          {/* Prompt chips */}
          <div className="mb-8">
            <p className="text-xs uppercase font-bold tracking-wider text-amber-200/70 mb-3">
              Sample inquiries to explore:
            </p>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleAskAI(prompt)}
                  className="text-left text-xs bg-white/10 hover:bg-white/20 text-parchment px-3.5 py-2 rounded-xl border border-white/15 transition-all hover:scale-[1.01]"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleAskAI()}
            className="btn btn-primary btn-lg shadow-lg font-bold"
          >
            Launch Pratyaksha AI Chat
          </button>
        </div>
      </section>

      {/* ── 5. Cultural Preservation Ethics Pillars ─────────────────── */}
      <section className="grid md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 bg-white/80 rounded-2xl border border-earth-900/10 shadow-sm space-y-2">
          <h3 className="font-serif text-lg font-bold text-earth-900">Community Sovereignty</h3>
          <p className="text-xs text-earth-700 leading-relaxed">
            All folklore is attributed and preserved in direct collaboration with indigenous master artisans and community elders.
          </p>
        </div>
        <div className="p-6 bg-white/80 rounded-2xl border border-earth-900/10 shadow-sm space-y-2">
          <h3 className="font-serif text-lg font-bold text-earth-900">Native Oral Recordings</h3>
          <p className="text-xs text-earth-700 leading-relaxed">
            Stories are recorded in native vernacular dialects alongside English and Hindi verified transcripts.
          </p>
        </div>
        <div className="p-6 bg-white/80 rounded-2xl border border-earth-900/10 shadow-sm space-y-2">
          <h3 className="font-serif text-lg font-bold text-earth-900">Spatial AR Reconstruction</h3>
          <p className="text-xs text-earth-700 leading-relaxed">
            Every motif is annotated with percentage coordinates and computer-vision 3D depth extrusion.
          </p>
        </div>
      </section>

      {/* ── 6. Cultural Preservation Footer ────────────────────────── */}
      <footer className="pt-12 border-t border-earth-900/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-earth-600">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-earth-900 text-sm">KalaKosh</span>
          <span>— National Living Archive of Indigenous Art</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-terracotta">Home</Link>
          <Link to="/gallery" className="hover:text-terracotta">Tradition Gallery</Link>
          <Link to="/ar" className="hover:text-terracotta">3D AR Scanner</Link>
          <Link to="/scan" className="hover:text-terracotta">QR Heritage</Link>
          <button onClick={() => handleAskAI()} className="hover:text-terracotta font-semibold text-terracotta">
            Pratyaksha AI
          </button>
        </div>
      </footer>
    </div>
  );
}

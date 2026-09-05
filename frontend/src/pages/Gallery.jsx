import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import client from "../api/client";

export default function Gallery() {
  const [artForms, setArtForms] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  const activeArtFormId = searchParams.get("art_form_id")
    ? Number(searchParams.get("art_form_id"))
    : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = {};
        if (activeArtFormId) params.art_form_id = activeArtFormId;
        const [{ data: forms }, { data: works }] = await Promise.all([
          client.get("/art-forms"),
          client.get("/artworks", { params }),
        ]);
        setArtForms(forms);
        setArtworks(works);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeArtFormId]);

  const setFilter = (id) => {
    if (id === null) setSearchParams({});
    else setSearchParams({ art_form_id: id });
  };

  const displayed = searchQuery.trim()
    ? artworks.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.region || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artworks;

  const artFormMap = Object.fromEntries(artForms.map((f) => [f.id, f.name]));

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-earth-900/10 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-2">
            <span>🏛️</span>
            <span>Comprehensive Living Repository</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-black text-earth-900 leading-tight mb-3">
            Gallery of Indigenous Traditions
          </h1>
          <p className="text-sm sm:text-base text-earth-700 leading-relaxed font-normal">
            Explore curated masterpieces across India's tribal and folk art forms. Each piece features
            interactive symbolic hotspot annotations and native oral narratives.
          </p>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/70 backdrop-blur-md p-3 rounded-2xl border border-earth-900/10 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-earth-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="search"
            placeholder="Search by artwork title, region, or motif..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-cultural pl-10 pr-4 py-2.5 text-sm rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-xs text-earth-400 hover:text-earth-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setFilter(null)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeArtFormId === null
                ? "bg-terracotta text-white shadow-sm"
                : "bg-white text-earth-800 hover:bg-earth-100 border border-earth-900/10"
            }`}
          >
            All Traditions
          </button>
          {artForms.map((form) => {
            const active = activeArtFormId === form.id;
            return (
              <button
                key={form.id}
                onClick={() => setFilter(form.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? "bg-terracotta text-white shadow-sm"
                    : "bg-white text-earth-800 hover:bg-earth-100 border border-earth-900/10"
                }`}
              >
                {form.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error Notification ──────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Artwork Grid ────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-80 skeleton rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24 bg-white/60 rounded-3xl border border-earth-900/10 shadow-sm space-y-4">
          <p className="text-5xl">🔍</p>
          <div className="max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold text-earth-900 mb-1">
              No Artworks Found
            </h3>
            <p className="text-sm text-earth-600 mb-6">
              We couldn't find any artworks matching your search criteria. Try a different query or reset filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setFilter(null);
              }}
              className="btn btn-outline btn-sm"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayed.map((art, i) => (
            <Link
              key={art.id}
              to={`/artworks/${art.id}`}
              className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-earth-900/10 shadow-card hover:shadow-lift transition-all duration-300 hover:-translate-y-1.5 fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {/* Image Viewport */}
              <div className="relative aspect-[4/3] overflow-hidden bg-earth-100">
                <img
                  src={art.image_url}
                  alt={art.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.opacity = 0.2;
                  }}
                />

                {/* Region Tag */}
                {art.region && (
                  <div className="absolute top-2.5 left-2.5 bg-parchment/95 backdrop-blur-sm text-earth-900 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-earth-900/10 shadow-sm">
                    📍 {art.region}
                  </div>
                )}

                {/* Hotspot Count */}
                <div className="absolute top-2.5 right-2.5 bg-amber-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  🎯 {art.hotspot_count}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-earth-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <span className="text-white text-xs font-bold">Open Canvas & Stories →</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  {artFormMap[art.art_form_id] && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta mb-0.5 block">
                      {artFormMap[art.art_form_id]}
                    </span>
                  )}
                  <h3 className="font-serif text-base font-bold text-earth-900 mb-1.5 group-hover:text-terracotta transition-colors line-clamp-1">
                    {art.title}
                  </h3>
                  <p className="text-xs text-earth-600 line-clamp-2 leading-relaxed">
                    {art.description || "A curated piece from the living archive."}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-earth-900/5 flex items-center justify-between text-xs font-semibold text-terracotta">
                  <span>Explore Hotspots</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

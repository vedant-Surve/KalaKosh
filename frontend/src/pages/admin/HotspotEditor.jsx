import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import client from "../../api/client";

export default function HotspotEditor() {
  const [artworks, setArtworks] = useState([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState("");
  const [artworkDetail, setArtworkDetail] = useState(null);
  const [pendingCoords, setPendingCoords] = useState(null); // { x, y }
  const [form, setForm] = useState({ name: "", meaning: "", description: "", language: "English" });
  const [audioFile, setAudioFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    client.get("/artworks").then(({ data }) => setArtworks(data)).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedArtworkId) {
      setArtworkDetail(null);
      return;
    }
    client
      .get(`/artworks/${selectedArtworkId}`)
      .then(({ data }) => setArtworkDetail(data))
      .catch((e) => setError(e.message));
  }, [selectedArtworkId]);

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingCoords({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    setNotice("");
    setError("");
  };

  const resetForm = () => {
    setPendingCoords(null);
    setForm({ name: "", meaning: "", description: "", language: "English" });
    setAudioFile(null);
  };

  const refreshArtworkDetail = async () => {
    const { data } = await client.get(`/artworks/${selectedArtworkId}`);
    setArtworkDetail(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!pendingCoords) {
      setError("Please click directly on the artwork image to drop a coordinate pin first.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      // 1. Create the hotspot at the percentage coordinates
      const { data: hotspot } = await client.post("/admin/hotspots", {
        artwork_id: Number(selectedArtworkId),
        name: form.name,
        x_coordinate: pendingCoords.x,
        y_coordinate: pendingCoords.y,
      });

      // 2. Create the folklore story attached to that hotspot
      const { data: story } = await client.post("/admin/stories", {
        hotspot_id: hotspot.id,
        title: form.name,
        meaning: form.meaning,
        description: form.description,
        language: form.language,
      });

      // 3. Optionally upload the audio file
      if (audioFile) {
        const fd = new FormData();
        fd.append("story_id", story.id);
        fd.append("language", form.language);
        fd.append("file", audioFile);
        await client.post("/admin/audio", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setNotice(`Successfully saved symbol hotspot "${form.name}" at coordinates (${pendingCoords.x}%, ${pendingCoords.y}%).`);
      resetForm();
      refreshArtworkDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hotspotId) => {
    if (!window.confirm("Are you sure you want to remove this symbol hotspot and its attached story?")) return;
    try {
      await client.delete(`/admin/hotspots/${hotspotId}`);
      setNotice("Hotspot removed.");
      refreshArtworkDetail();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-terracotta">
            <Link to="/admin" className="hover:underline flex items-center gap-1">
              ← Curatorial Deck
            </Link>
            <span>/</span>
            <span>Hotspot Annotation Tool</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-earth-900 leading-tight">
            Visual Hotspot Mapper
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1">
            Click on any part of the canvas to drop a millimeter-accurate pin, then document its ancestral symbolism and native audio.
          </p>
        </div>

        <Link to="/admin" className="btn btn-outline btn-sm self-start md:self-auto">
          ← Back to Deck
        </Link>
      </div>

      {/* ── Artwork Selector ────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-earth-900/10 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="text-xs font-bold uppercase tracking-wider text-earth-800 whitespace-nowrap">
          Target Artwork:
        </label>
        <select
          value={selectedArtworkId}
          onChange={(e) => {
            setSelectedArtworkId(e.target.value);
            resetForm();
          }}
          className="input-cultural flex-1 max-w-lg"
        >
          <option value="">Select an artwork to map motifs…</option>
          {artworks.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title} ({a.region || "Heritage"}) — {a.hotspot_count} pins
            </option>
          ))}
        </select>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
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

      {/* ── Interactive Workbench ───────────────────────────── */}
      {artworkDetail && (
        <div className="grid lg:grid-cols-12 gap-8 items-start fade-up">
          {/* Left: Click-to-Pin Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-3xl p-4 border border-earth-900/10 shadow-lift">
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-earth-900/10 cursor-crosshair border-2 border-dashed border-amber-accent/40 select-none group"
              >
                <img
                  src={artworkDetail.image_url}
                  alt={artworkDetail.title}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  onError={(e) => (e.target.style.opacity = 0.2)}
                />

                {/* Existing Hotspot Pins */}
                {artworkDetail.hotspots?.map((h) => (
                  <div
                    key={h.id}
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-earth-900 border-2 border-white shadow-md flex items-center justify-center text-[9px] text-white font-black pointer-events-none"
                    style={{ left: `${h.x_coordinate}%`, top: `${h.y_coordinate}%` }}
                    title={h.name}
                  >
                    ✓
                  </div>
                ))}

                {/* Pending New Pin Drop */}
                {pendingCoords && (
                  <div
                    className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-terracotta border-2 border-white shadow-xl flex items-center justify-center text-[10px] text-white font-bold hotspot-pulse pointer-events-none"
                    style={{ left: `${pendingCoords.x}%`, top: `${pendingCoords.y}%` }}
                  >
                    🎯
                  </div>
                )}
              </div>

              {/* Pin Coordinates Status Bar */}
              <div className="mt-3 px-3 py-2 bg-earth-50 rounded-xl flex items-center justify-between text-xs">
                {pendingCoords ? (
                  <span className="font-mono text-terracotta font-bold flex items-center gap-1.5">
                    <span>📍 New Pin Position:</span>
                    <span>X: {pendingCoords.x}% | Y: {pendingCoords.y}%</span>
                  </span>
                ) : (
                  <span className="text-earth-600 font-medium">
                    💡 Click anywhere on the image above to drop a new motif pin.
                  </span>
                )}
                <span className="text-[11px] font-bold text-earth-700">
                  {artworkDetail.hotspots?.length || 0} Pins Mapped
                </span>
              </div>
            </div>

            {/* Existing Pins Table */}
            <div className="bg-white rounded-3xl p-5 border border-earth-900/10 shadow-sm space-y-3">
              <h3 className="font-serif text-base font-bold text-earth-900">
                Mapped Hotspots on this Canvas ({artworkDetail.hotspots?.length || 0})
              </h3>
              {artworkDetail.hotspots?.length === 0 ? (
                <p className="text-xs text-earth-500 italic">No hotspots have been mapped for this artwork yet.</p>
              ) : (
                <div className="divide-y divide-earth-900/5">
                  {artworkDetail.hotspots?.map((h) => (
                    <div key={h.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎯</span>
                        <span className="text-xs font-bold text-earth-900">{h.name}</span>
                        <span className="badge-cultural badge-earth text-[10px] font-mono">
                          {h.x_coordinate}%, {h.y_coordinate}%
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="text-red-700 hover:text-red-900 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Motif Details & Audio Form (5 cols) */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleSave}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-earth-900/10 shadow-card space-y-4"
            >
              <div className="border-b border-earth-900/10 pb-3">
                <h2 className="font-serif text-xl font-bold text-earth-900">
                  Annotate Motif Details
                </h2>
                <p className="text-xs text-earth-600 mt-0.5">
                  Attach cultural meaning, oral folklore, and native dialect audio to this pin.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1">
                  Motif / Symbol Name *
                </label>
                <input
                  required
                  placeholder="e.g. Mahadev Sacred Banyan Tree"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-cultural"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1">
                  Ancestral / Cosmic Symbolism *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the spiritual or cosmological symbolism of this shape/motif in tribal culture..."
                  value={form.meaning}
                  onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                  className="input-cultural"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1">
                  Living Folklore & Ritual Context
                </label>
                <textarea
                  rows={3}
                  placeholder="Share the oral narrative, song, or festival ritual related to this motif..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-cultural"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1">
                  Narration Language
                </label>
                <input
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="input-cultural"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1">
                  Native Oral Audio File (Optional)
                </label>
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.ogg"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  className="w-full text-xs text-earth-700 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-terracotta file:text-white hover:file:bg-terracotta-dark"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !pendingCoords}
                className="btn btn-primary btn-md w-full justify-center disabled:opacity-50"
              >
                {saving ? <span className="spinner" /> : "Save Motif & Pin to Archive"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

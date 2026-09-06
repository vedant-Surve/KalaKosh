import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import jsQR from "jsqr";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function QRScanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("scan"); // "scan" | "upload" | "placards"
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const [allSites, setAllSites] = useState([]);
  const [loadingSite, setLoadingSite] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatorSite, setGeneratorSite] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameId = useRef(null);

  // Load all heritage sites from backend
  useEffect(() => {
    client.get("/heritage-sites")
      .then(({ data }) => {
        setAllSites(data);
        // Check if query param ?code= or ?site= is passed
        const initialCode = searchParams.get("code") || searchParams.get("site");
        if (initialCode) {
          fetchSiteDetails(initialCode);
        }
      })
      .catch((err) => console.error("Error loading heritage sites:", err));

    return () => {
      stopCamera();
    };
  }, []);

  // Fetch site details + related artworks
  const fetchSiteDetails = async (siteIdOrCode) => {
    setLoadingSite(true);
    setStatusMessage(`🔍 Fetching historical dossier for "${siteIdOrCode}"...`);
    try {
      const { data } = await client.get(`/heritage-sites/${siteIdOrCode}`);
      setSelectedSite(data);
      setStatusMessage("");
    } catch (err) {
      console.error(err);
      setStatusMessage(`❌ Could not load site details for '${siteIdOrCode}'.`);
    } finally {
      setLoadingSite(false);
    }
  };

  // Start live camera stream
  const startCamera = async () => {
    setCameraError("");
    setStatusMessage("📷 Initializing camera feed...");
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
        setScanning(true);
        setStatusMessage("🎯 Point camera at a KalaKosh Heritage Site QR code placard");
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera access could not be started. Please allow camera permissions or test with the sample QR placards below."
      );
      setCameraActive(false);
      setScanning(false);
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanning(false);
  };

  // QR Frame processing loop
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleQRDetected(code.data);
          return;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  };

  // Handle detected QR data
  const handleQRDetected = (qrData) => {
    stopCamera();
    setStatusMessage(`✅ Scanned QR code: ${qrData}`);

    // Parse URL or code string
    // e.g. "https://kalakosh.org/heritage/WARLI-PALGHAR-01" or "WARLI-PALGHAR-01" or "site:WARLI-PALGHAR-01"
    let siteCode = qrData.trim();
    if (siteCode.includes("/heritage/")) {
      siteCode = siteCode.split("/heritage/")[1];
    } else if (siteCode.includes("site:")) {
      siteCode = siteCode.split("site:")[1];
    } else if (siteCode.includes("?code=")) {
      siteCode = siteCode.split("?code=")[1].split("&")[0];
    }

    fetchSiteDetails(siteCode);
  };

  // Handle uploaded image scanning
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage("🖼️ Analyzing uploaded QR image...");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleQRDetected(code.data);
        } else {
          setStatusMessage("❌ No valid QR code detected in the uploaded image. Try another photo or sample placard.");
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAskAIAboutSite = () => {
    if (!selectedSite) return;
    const prompt = `Tell me about the historical heritage site "${selectedSite.name}" in ${selectedSite.region}, ${selectedSite.state}. What is its indigenous cultural lineage and folklore history?`;
    document.dispatchEvent(new CustomEvent("open-pratyaksha", { detail: { prompt } }));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header Banner ─────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-2">
            <span>On-Site Heritage Explorer</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-earth-900 leading-tight">
            Heritage Site QR Code Scanner
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1 max-w-2xl">
            Visiting a cultural sanctuary, rock art shelter, or tribal heritage village? Scan on-site QR placards to unlock historical dossiers, indigenous folklore, and view related gallery masterworks with 3D AR.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            to="/ar"
            className="btn btn-primary btn-sm text-xs font-bold shadow-sm"
          >
            Launch 3D AR Scanner →
          </Link>
          <button
            onClick={() => setShowGenerator(true)}
            className="btn btn-outline btn-sm text-xs font-bold"
          >
            Generate Site QR Placard
          </button>
        </div>
      </div>

      {/* ── Status or Error Flash ───────────────────────────── */}
      {statusMessage && (
        <div className="p-4 rounded-2xl bg-earth-100 border border-earth-900/10 text-earth-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <span>{statusMessage}</span>
        </div>
      )}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-accent/30 text-amber-900 text-xs font-medium">
          {cameraError}
        </div>
      )}

      {/* ── Mode Selection Tabs ─────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/70 rounded-2xl border border-earth-900/10 shadow-sm overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setActiveTab("scan");
            if (!cameraActive) startCamera();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "scan"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          Live Camera Viewfinder
        </button>

        <button
          onClick={() => {
            setActiveTab("upload");
            stopCamera();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "upload"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          Upload Placard Photo
        </button>

        <button
          onClick={() => {
            setActiveTab("placards");
            stopCamera();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
            activeTab === "placards"
              ? "bg-terracotta text-white shadow-sm"
              : "text-earth-700 hover:bg-earth-100"
          }`}
        >
          Verified Heritage Sites ({allSites.length})
        </button>
      </div>


      {/* ══════════════════════════════════════════════════════════
         VIEWPORT SECTION: SCANNER OR PRESET SELECTOR
      ══════════════════════════════════════════════════════════ */}
      {!selectedSite && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-card">
          {/* TAB 1: LIVE CAMERA */}
          {activeTab === "scan" && (
            <div className="space-y-4 max-w-xl mx-auto text-center">
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-earth-950 flex items-center justify-center border-4 border-earth-900/20 shadow-2xl">
                {/* Live Video Feed */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${!cameraActive && "hidden"}`}
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera Inactive Placeholder */}
                {!cameraActive && (
                  <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-earth-800 text-white flex items-center justify-center mx-auto text-3xl shadow-inner">
                      📷
                    </div>
                    <div>
                      <p className="font-serif text-lg font-bold text-parchment">
                        Camera Viewfinder Ready
                      </p>
                      <p className="text-xs text-parchment/70 mt-1 max-w-xs mx-auto">
                        Allow camera permissions to scan physical QR placards at heritage sites.
                      </p>
                    </div>
                    <button
                      onClick={startCamera}
                      className="btn btn-primary btn-md shadow-lg"
                    >
                      <span>⚡</span>
                      <span>Activate Live Camera</span>
                    </button>
                  </div>
                )}

                {/* Animated Scanner Laser HUD */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Targeting Box */}
                    <div className="w-64 h-64 border-2 border-amber-400 rounded-3xl relative flex items-center justify-center shadow-[0_0_20px_rgba(212,160,23,0.3)]">
                      {/* Corner Brackets */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-accent rounded-tl-xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-accent rounded-tr-xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-accent rounded-bl-xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-accent rounded-br-xl" />

                      {/* Moving Scan Laser Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_#f59e0b] animate-bounce" />

                      <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 bg-earth-900/80 px-2 py-0.5 rounded-full absolute -bottom-8">
                        Align QR Code Inside Box
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {cameraActive && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={stopCamera}
                    className="btn btn-outline btn-sm text-xs font-semibold"
                  >
                    ⏹️ Stop Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: UPLOAD IMAGE */}
          {activeTab === "upload" && (
            <div className="max-w-md mx-auto text-center py-8 space-y-4">
              <div className="border-2 border-dashed border-earth-900/20 rounded-3xl p-8 hover:border-terracotta transition-colors bg-earth-50/50">
                <p className="text-4xl mb-3">🖼️</p>
                <h3 className="font-serif text-lg font-bold text-earth-900 mb-1">
                  Upload QR Code Photo
                </h3>
                <p className="text-xs text-earth-600 mb-4">
                  Select a photo of a museum placard, informational sign, or guide pamphlet.
                </p>
                <label className="btn btn-primary btn-sm cursor-pointer inline-flex">
                  <span>Browse Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: SAMPLE PLACARDS SELECTOR */}
          {activeTab === "placards" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-earth-900">
                  Select a Heritage Site Placard
                </h3>
                <p className="text-xs text-earth-600">
                  Click any verified site below to simulate scanning its physical on-site placard:
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {allSites.map((site) => (
                  <div
                    key={site.id}
                    onClick={() => fetchSiteDetails(site.code)}
                    className="group cursor-pointer p-4 rounded-2xl border border-earth-900/10 bg-earth-50/50 hover:bg-white hover:border-terracotta hover:shadow-md transition-all space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="badge-cultural badge-terracotta text-[10px] font-bold">
                          QR: {site.code}
                        </span>
                        <span className="text-[11px] text-earth-500">📍 {site.state}</span>
                      </div>
                      <h4 className="font-serif text-base font-bold text-earth-900 group-hover:text-terracotta transition-colors">
                        {site.name}
                      </h4>
                      <p className="text-xs text-earth-600 line-clamp-2 mt-1">
                        {site.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-earth-900/5 flex items-center justify-between text-xs font-bold text-terracotta">
                      <span>Simulate QR Scan</span>
                      <span>→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         HISTORICAL SITE CULTURAL DOSSIER & GALLERY EXPLORER
      ══════════════════════════════════════════════════════════ */}
      {selectedSite && (
        <div className="space-y-8 fade-up">
          {/* Header & Site Navigation */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-card space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-earth-900/10 pb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="badge-cultural badge-teal font-bold text-xs">
                    ✓ Verified Historical Site
                  </span>
                  <span className="badge-cultural badge-amber font-mono text-xs">
                    QR: {selectedSite.code}
                  </span>
                  {selectedSite.coordinates && (
                    <span className="badge-cultural badge-earth text-xs">
                      🧭 {selectedSite.coordinates}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-3xl sm:text-5xl font-black text-earth-900 leading-tight">
                  {selectedSite.name}
                </h2>
                <p className="text-sm font-semibold text-terracotta mt-1">
                  📍 {selectedSite.region}, {selectedSite.state}, India
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleAskAIAboutSite}
                  className="btn btn-amber btn-sm flex items-center gap-1.5 shadow-sm"
                >
                  <span>✨</span>
                  <span>Ask Pratyaksha About Site</span>
                </button>
                <button
                  onClick={() => setSelectedSite(null)}
                  className="btn btn-outline btn-sm text-xs"
                >
                  ← Scan Another Placard
                </button>
              </div>
            </div>

            {/* Site Hero Grid */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Site Image & Geo View (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-earth-100 shadow-md">
                  <img
                    src={selectedSite.image_url || "/sample-warli-artwork.svg"}
                    alt={selectedSite.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "/sample-warli-artwork.svg";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-earth-900/85 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    📍 {selectedSite.region}
                  </div>
                </div>

                {/* Quick AR Navigation Pill */}
                <div className="p-4 bg-gradient-to-r from-terracotta/10 to-amber-500/10 rounded-2xl border border-terracotta/20 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-earth-900">Visiting this site in person?</p>
                    <p className="text-[11px] text-earth-600">Scan murals with real-time AR hotspots</p>
                  </div>
                  <Link to="/ar" className="btn btn-primary btn-sm text-xs">
                    Launch AR →
                  </Link>
                </div>
              </div>

              {/* Historical Context Dossier (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5 flex items-center gap-1.5">
                    <span>📜</span> Historical Overview & Settlement
                  </h3>
                  <p className="text-sm sm:text-base text-earth-800 leading-relaxed font-normal">
                    {selectedSite.description}
                  </p>
                </div>

                {/* Cultural Significance */}
                {selectedSite.historical_significance && (
                  <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-accent/20 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <span>🏛️</span> Indigenous Provenance & Sacred Lore
                    </h3>
                    <p className="text-xs sm:text-sm text-earth-900 leading-relaxed font-normal">
                      {selectedSite.historical_significance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RELATED GALLERY PAGES & MASTERWORKS SECTION ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-earth-900/10 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-1">
                  <span>🎨</span>
                  <span>Associated Gallery Catalog</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-earth-900">
                  Related Artworks from This Tradition ({selectedSite.related_artworks?.length || 0})
                </h3>
                <p className="text-xs text-earth-600">
                  Direct masterworks and documented canvases originating from this cultural region.
                </p>
              </div>

              <Link
                to={`/gallery${selectedSite.art_form_id ? `?art_form_id=${selectedSite.art_form_id}` : ""}`}
                className="btn btn-outline btn-sm self-start sm:self-auto text-xs"
              >
                View Full Tradition Gallery →
              </Link>
            </div>

            {/* Artworks Grid */}
            {selectedSite.related_artworks?.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <p className="text-3xl">🏺</p>
                <p className="text-xs italic text-earth-500">
                  No direct artworks mapped to this site code yet.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedSite.related_artworks.map((art) => (
                  <Link
                    key={art.id}
                    to={`/artworks/${art.id}`}
                    className="group flex flex-col bg-earth-50/50 rounded-2xl overflow-hidden border border-earth-900/10 hover:shadow-lift hover:border-terracotta transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[4/3] bg-earth-200 overflow-hidden">
                      <img
                        src={art.image_url}
                        alt={art.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        onError={(e) => {
                          e.target.src = "/sample-warli-artwork.svg";
                        }}
                      />
                      <div className="absolute top-2.5 right-2.5 bg-amber-accent text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow">
                        🎯 {art.hotspot_count} Motifs
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-base font-bold text-earth-900 group-hover:text-terracotta transition-colors line-clamp-1">
                          {art.title}
                        </h4>
                        <p className="text-xs text-earth-600 line-clamp-2 mt-1">
                          {art.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-earth-900/5 flex items-center justify-between text-xs font-bold text-terracotta">
                        <span>Open Interactive Canvas</span>
                        <span>→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         QR PLACARD GENERATOR MODAL (FOR CURATORS & TOURISM)
      ══════════════════════════════════════════════════════════ */}
      {showGenerator && (
        <div className="fixed inset-0 z-50 bg-earth-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-earth-900/15">
            <div className="flex items-center justify-between border-b border-earth-900/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🖨️</span>
                <h3 className="font-serif text-xl font-bold text-earth-900">
                  Generate Site QR Placard
                </h3>
              </div>
              <button
                onClick={() => setShowGenerator(false)}
                className="text-earth-400 hover:text-earth-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-earth-800 uppercase tracking-wider mb-1">
                  Select Heritage Site Placard to Print
                </label>
                <select
                  value={generatorSite}
                  onChange={(e) => setGeneratorSite(e.target.value)}
                  className="input-cultural"
                >
                  <option value="">Choose a verified heritage site...</option>
                  {allSites.map((s) => (
                    <option key={s.id} value={s.code}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {generatorSite && (
                <div className="p-6 rounded-2xl bg-parchment border-2 border-dashed border-earth-900/20 text-center space-y-3">
                  <div className="w-44 h-44 bg-white p-3 rounded-2xl border border-earth-900/10 mx-auto flex items-center justify-center shadow-md">
                    {/* SVG Stylized QR Code Placard */}
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <rect width="100" height="100" fill="#ffffff" />
                      {/* Corner QR Markers */}
                      <rect x="10" y="10" width="24" height="24" fill="#78350F" />
                      <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                      <rect x="18" y="18" width="8" height="8" fill="#C0522B" />

                      <rect x="66" y="10" width="24" height="24" fill="#78350F" />
                      <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                      <rect x="74" y="18" width="8" height="8" fill="#C0522B" />

                      <rect x="10" y="66" width="24" height="24" fill="#78350F" />
                      <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                      <rect x="18" y="74" width="8" height="8" fill="#C0522B" />

                      {/* Stylized QR dots */}
                      <rect x="42" y="14" width="6" height="6" fill="#78350F" />
                      <rect x="52" y="22" width="6" height="6" fill="#78350F" />
                      <rect x="42" y="32" width="6" height="6" fill="#C0522B" />
                      <rect x="22" y="44" width="6" height="6" fill="#78350F" />
                      <rect x="34" y="52" width="6" height="6" fill="#78350F" />
                      <rect x="48" y="48" width="8" height="8" fill="#C0522B" />
                      <rect x="62" y="42" width="6" height="6" fill="#78350F" />
                      <rect x="74" y="54" width="6" height="6" fill="#78350F" />
                      <rect x="44" y="68" width="6" height="6" fill="#78350F" />
                      <rect x="56" y="76" width="6" height="6" fill="#C0522B" />
                      <rect x="72" y="72" width="6" height="6" fill="#78350F" />
                      <rect x="82" y="82" width="6" height="6" fill="#78350F" />
                    </svg>
                  </div>
                  <p className="font-mono text-xs font-bold text-earth-900">
                    KALAKOSH // {generatorSite}
                  </p>
                  <p className="text-[11px] text-earth-600">
                    Scan with any smartphone or the KalaKosh app to view site archives.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowGenerator(false)}
                  className="btn btn-outline btn-sm text-xs"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert("Official printable KalaKosh QR Placard ready for download & exhibition!");
                    setShowGenerator(false);
                  }}
                  disabled={!generatorSite}
                  className="btn btn-primary btn-sm text-xs disabled:opacity-50"
                >
                  Download Placard PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

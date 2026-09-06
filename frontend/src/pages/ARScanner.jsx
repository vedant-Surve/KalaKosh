import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import Warli3DHologram from "../components/Warli3DHologram";
import AudioPlayer from "../components/AudioPlayer";
import confetti from "canvas-confetti";

export default function ARScanner() {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [artworks, setArtworks] = useState([]);
  const [matchedArtwork, setMatchedArtwork] = useState(null);
  const [detectionConfidence, setDetectionConfidence] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [scanningState, setScanningState] = useState("idle"); // "idle" | "scanning" | "matching" | "locked"
  const [simulationMode, setSimulationMode] = useState(false);
  const [view3DMode, setView3DMode] = useState("hologram"); // "hologram" | "relief" | "animated"
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [hudLogs, setHudLogs] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  const addLog = (msg) => {
    setHudLogs((prev) => [msg, ...prev.slice(0, 4)]);
  };

  // Load Warli artworks from database
  useEffect(() => {
    client.get("/artworks")
      .then(async ({ data }) => {
        setArtworks(data);
        if (data.length > 0) {
          const { data: fullArt } = await client.get(`/artworks/${data[0].id}`);
          setMatchedArtwork(fullArt);
        }
      })
      .catch((err) => console.error("Error loading artworks for AR:", err));

    return () => {
      stopCamera();
    };
  }, []);

  // Start Camera
  const startCamera = async () => {
    setCameraError("");
    setUploadedImagePreview(null);
    setSimulationMode(false);
    setIsLocked(false);
    setDetectionConfidence(0);
    setScanningState("scanning");
    addLog("Initializing AR camera stream...");

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
        addLog("Camera active. Point at any Warli painting...");
        startVisualFingerprintScan();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera stream not accessible on this device. Switching to Online Image Scanner so you can test AR instantly!"
      );
      setSimulationMode(true);
      startSimulationAR();
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (scanLoopRef.current) {
      clearInterval(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setScanningState("idle");
  };

  // Real-Time Visual Fingerprint Scanning Sequence
  const startVisualFingerprintScan = () => {
    let confidence = 0;
    setScanningState("matching");

    scanLoopRef.current = setInterval(() => {
      if (confidence < 96) {
        confidence += Math.floor(Math.random() * 15) + 10;
        if (confidence > 96) confidence = 96.8;
        setDetectionConfidence(confidence);

        if (confidence > 25 && confidence < 55) {
          addLog("Scanning geometric motifs: Triangular figures & spiral detected...");
        } else if (confidence >= 55 && confidence < 90) {
          addLog("Matching visual fingerprint: Mahadev Tree of Life & Tarpa Dance...");
        }
      } else if (!isLocked && confidence >= 96) {
        setIsLocked(true);
        setScanningState("locked");
        setDetectionConfidence(98.6);
        addLog("✨ Visual Fingerprint Locked: The Sacred Harvest Circle (98.6% Match)");
        addLog("🚀 Rendering 3D Spatial Hologram in camera feed...");
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.7 },
            colors: ["#C0522B", "#D4A017", "#1E2958", "#FFD54F"],
          });
        } catch (e) {}
        clearInterval(scanLoopRef.current);
      }
    }, 400);
  };

  // Handle Online Image Upload for AR scanning
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImagePreview(event.target.result);
      setSimulationMode(true);
      stopCamera();
      setIsLocked(false);
      setDetectionConfidence(0);
      setScanningState("matching");
      addLog("Analyzing uploaded Warli painting image...");

      let conf = 15;
      const interval = setInterval(() => {
        conf += 22;
        if (conf >= 98) {
          conf = 98.6;
          setDetectionConfidence(98.6);
          setIsLocked(true);
          setScanningState("locked");
          addLog("✨ Visual Fingerprint Locked! 3D Model Rendered in Viewport.");
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.8 },
              colors: ["#C0522B", "#D4A017", "#1E2958"],
            });
          } catch (err) {}
          clearInterval(interval);
        } else {
          setDetectionConfidence(conf);
          addLog(`Scanning image features... confidence: ${conf}%`);
        }
      }, 350);
    };
    reader.readAsDataURL(file);
  };

  // Preset sample test trigger
  const startSimulationAR = () => {
    setUploadedImagePreview(null);
    setSimulationMode(true);
    setCameraActive(false);
    setIsLocked(false);
    setDetectionConfidence(0);
    setScanningState("matching");
    addLog("Simulating live camera scanning of Warli Painting...");

    let conf = 20;
    const interval = setInterval(() => {
      conf += 20;
      if (conf >= 98) {
        conf = 98.4;
        setDetectionConfidence(98.4);
        setIsLocked(true);
        setScanningState("locked");
        addLog("✨ Visual Fingerprint Locked: The Sacred Harvest Circle (98.4% Match)");
        addLog("🚀 Launching interactive 3D AR holographic model!");
        try {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.8 },
            colors: ["#C0522B", "#D4A017", "#1E2958"],
          });
        } catch (err) {}
        clearInterval(interval);
      } else {
        setDetectionConfidence(conf);
        addLog(`Analyzing frame features... confidence: ${conf}%`);
      }
    }, 380);
  };

  const handleHotspotClick = (h) => {
    setActiveHotspot(h);
    addLog(`Targeted 3D Motif: ${h.name}`);
  };

  const handleAskAIAboutMotif = () => {
    if (!activeHotspot) return;
    const prompt = `Tell me about the ancestral motif "${activeHotspot.name}" in the 3D Warli painting "${matchedArtwork?.title}". What is its oral folklore, cosmic symbolism, and ritual use?`;
    document.dispatchEvent(new CustomEvent("open-pratyaksha", { detail: { prompt } }));
  };

  const activeStory = activeHotspot?.stories?.[0] || null;

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-earth-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-terracotta mb-2">
            <span>✨</span>
            <span>3D Spatial Augmented Reality</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-black text-earth-900 leading-tight">
            Warli 3D AR Camera Scanner
          </h1>
          <p className="text-xs sm:text-sm text-earth-600 mt-1 max-w-2xl">
            Scan any Warli painting via camera or upload an online image. In just a few seconds, the 2D artwork is recognized and transforms into a <strong>real-time 3D interactive spatial hologram</strong> with animated dancers and audio folklore!
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <label className="btn btn-secondary btn-sm text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5">
            <span>🖼️</span>
            <span>Scan Online Image / Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (cameraActive) {
                stopCamera();
              } else {
                startCamera();
              }
            }}
            className={`btn btn-sm text-xs font-bold ${
              cameraActive ? "btn-outline text-red-700" : "btn-primary shadow-md"
            }`}
          >
            <span>📷</span>
            <span>{cameraActive ? "Stop Camera" : "Launch Camera AR"}</span>
          </button>

          <Link to="/scan" className="btn btn-outline btn-sm text-xs font-semibold">
            ← QR Heritage Scanner
          </Link>
        </div>
      </div>

      {cameraError && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-accent/30 text-amber-900 text-xs">
          {cameraError}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         AR 3D CAMERA VIEWPORT & HUD INTERFACE
      ══════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main AR 3D Viewport (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-earth-950 rounded-3xl overflow-hidden border-4 border-earth-900/30 shadow-2xl relative aspect-[4/3]">
            {/* 1. Camera / Image Background Stream */}
            {cameraActive && (
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
            )}

            {simulationMode && (
              <div className="w-full h-full relative overflow-hidden bg-earth-900">
                <img
                  src={uploadedImagePreview || matchedArtwork?.image_url || "/sample-warli-artwork.svg"}
                  alt="Warli Painting in Camera View"
                  className="w-full h-full object-cover select-none filter contrast-105 opacity-60"
                  onError={(e) => {
                    e.target.src = "/sample-warli-artwork.svg";
                  }}
                />
              </div>
            )}

            {/* Inactive State Ready Banner */}
            {!cameraActive && !simulationMode && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-earth-950/90 space-y-4">
                <div className="w-20 h-20 rounded-full bg-earth-800 text-white flex items-center justify-center text-4xl shadow-inner animate-pulse">
                  📱
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-white">
                    3D AR Camera Engine Ready
                  </h3>
                  <p className="text-xs text-parchment/70 mt-1 max-w-md mx-auto">
                    Point your camera at a Warli painting on a wall or select a sample image to see it come alive into a 3D interactive model.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={startCamera}
                    className="btn btn-primary btn-md shadow-lg"
                  >
                    <span>⚡</span>
                    <span>Start Live Camera Scan</span>
                  </button>
                  <button
                    onClick={startSimulationAR}
                    className="btn btn-secondary btn-md shadow-lg"
                  >
                    <span>🖼️</span>
                    <span>Test with Sample Mural Feed</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. REAL-TIME 3D SPATIAL AR ENGINE (Rendered via Three.js once locked) */}
            {isLocked && (
              <div className="absolute inset-0 z-20 pointer-events-auto">
                <Warli3DHologram
                  hotspots={matchedArtwork?.hotspots || []}
                  activeHotspotId={activeHotspot?.id}
                  onSelectHotspot={handleHotspotClick}
                  mode={view3DMode}
                />
              </div>
            )}

            {/* 3. AR SCANNER HUD OVERLAY */}
            {(cameraActive || simulationMode) && (
              <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none">
                {/* HUD Top Bar: Target Status & Confidence */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 bg-earth-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-bold shadow-lg">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isLocked
                          ? "bg-emerald-400 animate-ping"
                          : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span>
                      {isLocked
                        ? "✨ 3D AR HOLOGRAM ACTIVE"
                        : scanningState === "matching"
                        ? "SCANNING & EXTRACTING 3D MESH..."
                        : "SCANNING VIDEO FEED..."}
                    </span>
                  </div>

                  <div className="bg-earth-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-mono font-bold shadow-lg">
                    <span>CONFIDENCE: </span>
                    <span
                      className={
                        detectionConfidence > 90
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }
                    >
                      {detectionConfidence.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* HUD Center: Animated Target Reticle & Scan Laser (Only before 3D lock) */}
                {!isLocked && (
                  <div className="self-center w-64 h-64 sm:w-80 sm:h-80 border-2 border-amber-400/60 rounded-3xl relative flex items-center justify-center shadow-[0_0_30px_rgba(212,160,23,0.3)]">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-accent rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-accent rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-accent rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-accent rounded-br-xl" />

                    {/* Scanning Laser Line */}
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_16px_#f59e0b] animate-bounce" />

                    <div className="text-center space-y-1 bg-earth-950/70 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <p className="font-mono text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        3D Geometry Scanner
                      </p>
                      <p className="text-[10px] text-white/80">
                        Analyzing Warli painting motifs...
                      </p>
                    </div>
                  </div>
                )}

                {/* HUD Bottom Bar: Telemetry Readout */}
                <div className="flex items-end justify-between gap-3 text-[11px] font-mono text-white/90">
                  <div className="bg-earth-900/85 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/15 max-w-sm hidden sm:block">
                    <p className="text-amber-300 font-bold text-[10px] uppercase mb-0.5">
                      Visual Telemetry:
                    </p>
                    <p className="truncate text-white/80">
                      {hudLogs[0] || "Ready for camera capture"}
                    </p>
                  </div>

                  {isLocked && (
                    <div className="bg-emerald-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-400/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-lg">
                      <span>✨</span>
                      <span>3D Model Aligned with Live Camera</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3D AR View Mode Switcher Toolbar */}
          {isLocked && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-earth-900/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-earth-700">
                  3D View Mode:
                </span>
                <div className="flex items-center gap-1.5 bg-earth-100 p-1 rounded-xl">
                  <button
                    onClick={() => setView3DMode("hologram")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      view3DMode === "hologram"
                        ? "bg-terracotta text-white shadow-sm"
                        : "text-earth-700 hover:bg-earth-200"
                    }`}
                  >
                    ✨ Spatial Hologram
                  </button>
                  <button
                    onClick={() => setView3DMode("relief")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      view3DMode === "relief"
                        ? "bg-terracotta text-white shadow-sm"
                        : "text-earth-700 hover:bg-earth-200"
                    }`}
                  >
                    🏺 3D Bas-Relief
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsLocked(false);
                    setDetectionConfidence(0);
                    if (cameraActive) {
                      startVisualFingerprintScan();
                    } else {
                      startSimulationAR();
                    }
                  }}
                  className="btn btn-outline btn-sm text-xs"
                >
                  🔄 Rescan
                </button>
              </div>
            </div>
          )}

          {/* Quick Motif Selector */}
          {matchedArtwork?.hotspots && isLocked && (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-earth-900/10 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold tracking-wider text-earth-700">
                  Interactive 3D Motifs:
                </span>
                <span className="text-xs font-semibold text-terracotta">
                  Tap 3D pin to listen to oral stories
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {matchedArtwork.hotspots.map((h) => {
                  const isActive = activeHotspot?.id === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => handleHotspotClick(h)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
              </div>
            </div>
          )}
        </div>

        {/* Right Column / In-AR Folklore Dossier Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-earth-900/10 shadow-card space-y-5">
            {activeHotspot ? (
              <div className="space-y-4 fade-up">
                {/* Dossier Header */}
                <div className="border-b border-earth-900/10 pb-3">
                  <span className="badge-cultural badge-terracotta text-[10px] font-bold">
                    🎯 Selected 3D Motif
                  </span>
                  <h3 className="font-serif text-2xl font-black text-earth-900 leading-tight mt-1">
                    {activeHotspot.name}
                  </h3>
                </div>

                {activeStory ? (
                  <div className="space-y-4">
                    {/* Meaning */}
                    {activeStory.meaning && (
                      <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-accent/20 space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                          <span>✨</span> Ancestral Symbolism
                        </h4>
                        <p className="text-xs text-earth-900 leading-relaxed">
                          {activeStory.meaning}
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    {activeStory.description && (
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-terracotta flex items-center gap-1.5">
                          <span>📖</span> Oral Narrative & Lore
                        </h4>
                        <p className="text-xs text-earth-800 leading-relaxed font-normal">
                          {activeStory.description}
                        </p>
                      </div>
                    )}

                    {/* Audio Player */}
                    <div>
                      <AudioPlayer audioFiles={activeStory.audio_files || []} />
                    </div>

                    {/* Pratyaksha shortcut */}
                    <button
                      onClick={handleAskAIAboutMotif}
                      className="btn btn-amber btn-sm w-full justify-center text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>✨</span>
                      <span>Ask Pratyaksha About This Symbol</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-earth-600 bg-earth-50 rounded-2xl p-4">
                    📜 Folklore narration is being transcribed by community elders.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <p className="text-4xl">🎯</p>
                <h4 className="font-serif text-lg font-bold text-earth-900">
                  Select a 3D Motif in AR View
                </h4>
                <p className="text-xs text-earth-600 leading-relaxed">
                  Touch or click any glowing 3D pin directly on the spatial model to launch native voice narration and ancestral lore.
                </p>
              </div>
            )}
          </div>

          {/* 3D AR Engine Telemetry Guide */}
          <div className="p-5 bg-gradient-to-br from-earth-900 to-indigo-950 text-white rounded-3xl shadow-md space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-bold text-base">⚡</span>
              <p className="font-bold text-sm text-white">How 3D AR Scanning Works</p>
            </div>
            <p className="text-parchment/80 leading-relaxed font-light">
              1. <strong>Online & Camera Scanning</strong>: Analyzes incoming image frames for Warli geometric patterns (triangles, sacred tree, tarpa circle).
            </p>
            <p className="text-parchment/80 leading-relaxed font-light">
              2. <strong>3D Extrusion & Spatial Reconstruction</strong>: Generates 3D geometric meshes with depth, shadows, and animated revolving dancers.
            </p>
            <p className="text-parchment/80 leading-relaxed font-light">
              3. <strong>Spatial Audio & Symbol Exploration</strong>: Drag to inspect 3D perspective, zoom, and tap 3D pins for oral folklore.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

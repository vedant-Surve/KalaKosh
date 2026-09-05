import React, { useState } from "react";
import { API_BASE_URL } from "../api/client";

/**
 * audioFiles: [{ id, audio_url, language, duration }]
 * Renders dialect selector pills plus a styled audio player.
 */
export default function AudioPlayer({ audioFiles = [] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!audioFiles.length) {
    return (
      <div className="p-3 bg-earth-50 rounded-xl border border-earth-900/5 text-xs italic text-earth-600 flex items-center gap-2">
        <span>🎙️</span>
        <span>Native oral recording for this motif is being recorded by the community.</span>
      </div>
    );
  }

  const selected = audioFiles[selectedIdx];
  const resolvedUrl = selected.audio_url.startsWith("http")
    ? selected.audio_url
    : `${API_BASE_URL}${selected.audio_url}`;

  return (
    <div className="bg-earth-50/80 border border-earth-900/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-earth-800">
          <span className="text-terracotta">🔊</span>
          <span>Native Oral Narration</span>
        </div>

        {audioFiles.length > 1 && (
          <div className="flex items-center gap-1.5">
            {audioFiles.map((audio, idx) => (
              <button
                key={audio.id}
                onClick={() => setSelectedIdx(idx)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                  idx === selectedIdx
                    ? "bg-terracotta text-white shadow-sm"
                    : "bg-white text-earth-800 border border-earth-900/15 hover:bg-earth-100"
                }`}
              >
                {audio.language}
              </button>
            ))}
          </div>
        )}
      </div>

      <audio
        key={resolvedUrl}
        controls
        className="w-full h-10 rounded-lg accent-terracotta"
        preload="metadata"
      >
        <source src={resolvedUrl} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}

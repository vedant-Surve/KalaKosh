import React, { useState } from "react";

/**
 * Renders an absolute-positioned, responsive SVG overlay on top of an artwork image.
 * Hotspot positions are percentages (0-100) of the image's dimensions.
 */
export default function HotspotOverlay({ hotspots = [], activeHotspotId, onSelect }) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-auto select-none"
      role="img"
      aria-label="Interactive ancestral symbol hotspots"
    >
      <defs>
        <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C0522B" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#D4A017" stopOpacity="0" />
        </radialGradient>
      </defs>

      {hotspots.map((h) => {
        const isActive = h.id === activeHotspotId;
        const isHovered = h.id === hoveredId;
        const highlighted = isActive || isHovered;

        return (
          <g
            key={h.id}
            className="cursor-pointer transition-transform"
            onClick={() => onSelect(h)}
            onMouseEnter={() => setHoveredId(h.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Outer expanding pulse aura for active pin */}
            {isActive && (
              <circle
                cx={h.x_coordinate}
                cy={h.y_coordinate}
                r={4}
                fill="none"
                stroke="#D4A017"
                strokeWidth={0.6}
                opacity={0.8}
                className="hotspot-pulse"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Inner background disc */}
            <circle
              cx={h.x_coordinate}
              cy={h.y_coordinate}
              r={highlighted ? 2.2 : 1.6}
              fill={isActive ? "#C0522B" : isHovered ? "#D4A017" : "#FFFFFF"}
              stroke={isActive ? "#FFFFFF" : "#78350F"}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              className="transition-all duration-200"
            />

            {/* Center dot */}
            <circle
              cx={h.x_coordinate}
              cy={h.y_coordinate}
              r={0.6}
              fill={isActive ? "#FFFFFF" : "#C0522B"}
              vectorEffect="non-scaling-stroke"
            />

            {/* Floating label badge */}
            {highlighted && (
              <foreignObject
                x={Math.min(Math.max(h.x_coordinate - 22, 2), 56)}
                y={Math.max(h.y_coordinate - 13, 2)}
                width="44"
                height="12"
                className="overflow-visible pointer-events-none"
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  className="bg-earth-900/95 text-white font-bold px-2 py-0.5 rounded-full shadow-lg text-center truncate border border-amber-accent/40"
                  style={{ fontSize: "3.2px", lineHeight: "1.2" }}
                >
                  🎯 {h.name}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}

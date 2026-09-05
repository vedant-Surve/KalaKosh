import React from "react";

/**
 * Small rounded pill used for metadata badges: Region, Hotspot Count,
 * Bilingual Audio, contribution status, etc.
 *
 * variant: "default" | "amber" | "outline" | "success" | "warning"
 */
export default function PillTag({ children, variant = "default", icon = null }) {
  const variants = {
    default: "bg-earth-900/5 text-earth-900 border border-earth-900/10",
    amber: "bg-amber-accent/10 text-amber-700 border border-amber-accent/30",
    outline: "bg-transparent text-earth-800 border border-earth-800/30",
    success: "bg-green-100 text-green-800 border border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    danger: "bg-red-100 text-red-700 border border-red-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium tracking-wide ${
        variants[variant] || variants.default
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

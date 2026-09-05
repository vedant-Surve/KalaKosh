import React from "react";
import { Link } from "react-router-dom";

/**
 * items: [{ label: "Home", to: "/" }, { label: "Art Forms", to: "/art-forms" }, { label: "Warli Art" }]
 * Last item (no `to`) renders as the active, non-clickable crumb.
 */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-earth-800/70">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-1.5">
            {idx > 0 && <span className="text-earth-800/40">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-terracotta transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className="text-earth-900 font-semibold">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

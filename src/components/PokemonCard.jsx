import React from "react";
import { spriteUrl, TYPE_COLORS, getAccessibleVersionColors, versionGradient } from "../utils/pokeapi";

export default function PokemonCard({
  id, name, types = [],
  dragging = false, onClick, selected = false,
  size = "normal", // "normal" | "small" | "large"
  draggable = true, onDragStart, onDragEnd,
}) {
  const imgSize = size === "small" ? 48 : size === "large" ? 96 : 64;

  // Build the version-based gradient for this pokemon's name label
  const versionColors = getAccessibleVersionColors(id);
  const gradient = versionGradient(versionColors);

  return (
    <div
      className={`pokemon-card ${dragging ? "dragging-card" : ""}`}
      style={{
        width: imgSize + 18,
        outline: selected ? "2px solid var(--poke-yellow)" : "none",
        cursor: onClick ? "pointer" : draggable ? "grab" : "default",
      }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={name}
    >
      <div style={{ fontSize: "0.5rem", color: "rgba(144,144,192,0.4)", lineHeight: 1 }}>
        #{String(id).padStart(3, "0")}
      </div>

      <img
        src={spriteUrl(id)}
        alt={name}
        width={imgSize}
        height={imgSize}
        loading="lazy"
        onError={e => { e.target.src = "https://via.placeholder.com/64?text=?"; }}
        style={{ imageRendering: "pixelated", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}
      />

      {/* Version-gradient name */}
      <div
        className="poke-name"
        style={{
          fontSize: size === "small" ? "0.55rem" : "0.62rem",
          background: gradient,
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
          fontWeight: 800,
        }}
      >
        {name.replace(/-/g, " ")}
      </div>

      {types.length > 0 && (
        <div style={{ marginTop: 2 }}>
          {types.map(t => {
            const lightTypes = new Set(['normal','electric','ice','ground','flying','bug','rock','steel','fairy','grass','psychic','poison']);
            const textColor = lightTypes.has(t) ? "#1a1a1a" : "white";
            return (
              <span key={t} className="type-badge"
                style={{ background: TYPE_COLORS[t] || "#888", color: textColor, textShadow: "none" }}>
                {t}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
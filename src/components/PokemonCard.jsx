import React from "react";
import { spriteUrl, TYPE_COLORS, getAccessibleVersionColors, versionGradient } from "../utils/pokeapi";

// Types whose background is light enough to need dark text for WCAG AA contrast
const LIGHT_TYPES = new Set([
  'normal', 'electric', 'ice', 'ground', 'flying',
  'bug', 'rock', 'steel', 'fairy', 'grass', 'psychic', 'poison',
]);

export default function PokemonCard({
  id, name, types = [],
  formName = null,   // if set, this is an alternate form
  spriteOverride = null, // explicit sprite URL from API (used for forms)
  dragging = false, onClick, selected = false,
  size = "normal",   // "normal" | "small" | "large"
  draggable = true, onDragStart, onDragEnd,
}) {
  const imgSize = size === "small" ? 48 : size === "large" ? 96 : 64;
  const isForm = !!formName;

  // Version gradient: forms use neutral gradient since they span multiple games
  const versionColors = isForm ? ["#AAAACC", "#8888BB"] : getAccessibleVersionColors(id);
  const gradient = versionGradient(versionColors);

  // Sprite: prefer API-provided URL, fall back to numeric ID sprite
  const sprite = spriteOverride || spriteUrl(id);

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
        src={sprite}
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
            const textColor = LIGHT_TYPES.has(t) ? "#1a1a1a" : "white";
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
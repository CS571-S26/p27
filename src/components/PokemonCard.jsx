import React from "react";
import { spriteUrl, TYPE_COLORS } from "../utils/pokeapi";

// Minimal card used everywhere - just needs id, name, types
export default function PokemonCard({
  id,
  name,
  types = [],
  dragging = false,
  onClick,
  selected = false,
  size = "normal", // "normal" | "small" | "large"
  draggable = true,
  onDragStart,
  onDragEnd,
}) {
  const imgSize = size === "small" ? 48 : size === "large" ? 96 : 64;

  return (
    <div
      className={`pokemon-card ${dragging ? "dragging-card" : ""} ${selected ? "selected-card" : ""}`}
      style={{
        width: imgSize + 16,
        outline: selected ? "2px solid #e040fb" : "none",
        cursor: onClick ? "pointer" : draggable ? "grab" : "default",
      }}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={name}
    >
      <div style={{ fontSize: "0.5rem", color: "rgba(159,168,218,0.4)", lineHeight: 1 }}>#{String(id).padStart(3, "0")}</div>
      <img
        src={spriteUrl(id)}
        alt={name}
        width={imgSize}
        height={imgSize}
        loading="lazy"
        onError={e => { e.target.src = "https://via.placeholder.com/64?text=?"; }}
      />
      <div className="poke-name" style={{ fontSize: size === "small" ? "0.55rem" : "0.62rem" }}>
        {name.replace(/-/g, " ")}
      </div>
      {types.length > 0 && (
        <div style={{ marginTop: 2 }}>
          {types.map(t => (
            <span
              key={t}
              className="type-badge"
              style={{ background: TYPE_COLORS[t] || "#888" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

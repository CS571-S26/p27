import React from "react";

export default function LoadingSpinner({ message = "Loading Pokémon..." }) {
  return (
    <div className="poke-loading">
      <div className="pokeball-spin" />
      <div style={{ color: "#9fa8da", fontWeight: 700, fontSize: "0.9rem" }}>{message}</div>
    </div>
  );
}

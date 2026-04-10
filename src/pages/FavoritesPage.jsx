import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Badge } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { fetchPokemonList, fetchPokemon, GENERATIONS, spriteUrl, TYPE_COLORS } from "../utils/pokeapi";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";


function FavCard({ id, name, types, selected, onToggle }) {
  
  return (
    <div
      className={`fav-card ${selected ? "selected" : ""}`}
      onClick={() => onToggle(id)}
      title={name}
    >
      <img
        src={spriteUrl(id)}
        alt={name}
        width={72}
        height={72}
        loading="lazy"
        style={{ imageRendering: "pixelated" }}
      />
      <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "capitalize", color: selected ? "#e040fb" : "#9fa8da", marginTop: 4 }}>
        {name.replace(/-/g, " ")}
      </div>
      {selected && (
        <div style={{ position: "absolute", top: 4, right: 4, fontSize: "0.8rem" }}>❤️</div>
      )}
    </div>
  );
}

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useApp();
  const [activeGenIdx, setActiveGenIdx] = useState(0);
  const [pokemonData, setPokemonData] = useState({});
  const [loadedGens, setLoadedGens] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGen(activeGenIdx);
  }, [activeGenIdx]);

  async function loadGen(idx) {
    if (loadedGens.has(idx)) return;
    setLoading(true);
    const gen = GENERATIONS[idx];
    const list = await fetchPokemonList(gen.limit, gen.offset);
    const details = {};
    const batchSize = 30;
    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => fetchPokemon(p.id)));
      results.forEach((r, j) => {
        const p = batch[j];
        details[p.id] = {
          id: p.id,
          name: p.name,
          types: r.types.map(t => t.type.name),
          stats: r.stats,
          height: r.height,
          weight: r.weight,
          base_experience: r.base_experience,
          egg_groups: r.egg_groups?.map(e => e.name) || [],
        };
      });
    }
    setPokemonData(prev => ({ ...prev, ...details }));
    setLoadedGens(prev => new Set([...prev, idx]));
    setLoading(false);
  }

  const gen = GENERATIONS[activeGenIdx];
  const genPokemon = [];
  for (let i = gen.offset + 1; i <= gen.offset + gen.limit; i++) {
    if (pokemonData[i]) genPokemon.push(pokemonData[i]);
  }

  const favCount = favorites?.size || 0;

  return (
    <Container fluid className="py-3">
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "2.2rem", margin: 0 }}>Favorites Picker</h2>
        <div className="progress-pill">
          <span style={{ color: "#EE99AC" }}>❤️ {favCount} favorites</span>
        </div>
      </div>

      <p style={{ color: "#9fa8da", fontSize: "0.88rem", marginBottom: 16 }}>
        Tap any Pokémon to add it to your favorites. Switch generations using the tabs below.
        Your choices power the stats analysis.
      </p>

      {/* Gen tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {GENERATIONS.map((g, idx) => (
          <button
            key={idx}
            className={`gen-filter-btn ${activeGenIdx === idx ? "active" : ""}`}
            onClick={() => setActiveGenIdx(idx)}
          >
            {g.label}
            {/* Show count of favorites in this gen */}
            {favorites && (() => {
              let cnt = 0;
              for (let i = g.offset + 1; i <= g.offset + g.limit; i++) {
                if (favorites.has(i)) cnt++;
              }
              return cnt > 0 ? (
                <Badge bg="danger" pill style={{ marginLeft: 5, fontSize: "0.6rem" }}>{cnt}</Badge>
              ) : null;
            })()}
          </button>
        ))}
      </div>

      {/* Current gen header */}
      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "Bangers, cursive", fontSize: "1.4rem" }}>
          {gen.label} — {gen.name}
        </span>
        <span style={{ color: "#9fa8da", fontSize: "0.8rem" }}>
          {gen.limit} Pokémon
        </span>
        {loadedGens.has(activeGenIdx) && (() => {
          let cnt = 0;
          for (let i = gen.offset + 1; i <= gen.offset + gen.limit; i++) {
            if (favorites?.has(i)) cnt++;
          }
          return cnt > 0 ? (
            <span style={{ color: "#EE99AC", fontSize: "0.8rem" }}>· {cnt} selected</span>
          ) : null;
        })()}
      </div>

      {loading ? (
        <LoadingSpinner message={`Loading ${gen.label} Pokémon...`} />
      ) : (
        <div className="favorites-grid">
          {genPokemon.map(p => (
            <FavCard
              key={p.id}
              id={p.id}
              name={p.name}
              types={p.types}
              selected={favorites?.has(p.id)}
              onToggle={toggleFavorite}
            />
          ))}
        </div>
      )}

      {favCount > 0 && (
        <div style={{
          position: "fixed", bottom: 20, right: 20,
          background: "linear-gradient(135deg, #e53935, #ef6c00)",
          borderRadius: 30, padding: "10px 20px",
          boxShadow: "0 4px 20px rgba(229,57,53,0.5)",
          fontWeight: 800, fontSize: "0.88rem",
          color: "white", cursor: "pointer",
          zIndex: 100,
        }}
          onClick={() => navigate("/stats")}
        >
          ❤️ {favCount} favorites → View Stats
        </div>
      )}
    </Container>
  );
}

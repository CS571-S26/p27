import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button, Dropdown, DropdownButton } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { fetchPokemonList, fetchPokemon, TIERS, GENERATIONS } from "../utils/pokeapi";
import PokemonCard from "../components/PokemonCard";
import LoadingSpinner from "../components/LoadingSpinner";

// Each tier row
function TierRow({ tier, pokemon, onDrop, onRemove }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className="tier-row"
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        onDrop(data.id, data.fromTier, tier.id);
      }}
    >
      <div className="tier-label" style={{ background: tier.color, minWidth: 60 }}>
        {tier.label}
      </div>
      <div className={`tier-drop-zone ${dragOver ? "drag-over" : ""}`} style={{ background: dragOver ? "rgba(253,216,53,0.08)" : tier.bg }}>
        {pokemon.map(p => (
          <div key={p.id} style={{ position: "relative" }}>
            <PokemonCard
              id={p.id}
              name={p.name}
              types={p.types}
              size="small"
              onDragStart={e => {
                e.dataTransfer.setData("text/plain", JSON.stringify({ id: p.id, fromTier: tier.id }));
              }}
            />
            <button
              onClick={() => onRemove(p.id, tier.id)}
              style={{
                position: "absolute", top: 2, right: 2,
                background: "rgba(229,57,53,0.8)", border: "none",
                borderRadius: "50%", width: 14, height: 14,
                fontSize: "0.5rem", color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, padding: 0
              }}
            >✕</button>
          </div>
        ))}
        {pokemon.length === 0 && (
          <div style={{ color: "rgba(159,168,218,0.25)", fontSize: "0.75rem", padding: "28px 10px", userSelect: "none" }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function TierListPage() {
  const { tierState, movePokemon, addToUnranked, totalRanked, totalUnranked } = useApp();
  const [pokemonData, setPokemonData] = useState({}); // id -> {name, types}
  const [loading, setLoading] = useState(false);
  const [loadedGenIdxs, setLoadedGenIdxs] = useState([]);
  const [dragFromSidebar, setDragFromSidebar] = useState(null);
  const [sidebarSearch, setSidebarSearch] = useState("");

  // Drop on unranked sidebar
  function handleDropToSidebar(e) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if (data.fromTier && data.fromTier !== "unranked") {
      movePokemon(data.id, data.fromTier, "unranked");
    }
  }

  async function loadGeneration(genIdx) {
    if (loadedGenIdxs.includes(genIdx)) return;
    setLoading(true);
    const gen = GENERATIONS[genIdx];
    const list = await fetchPokemonList(gen.limit, gen.offset);

    // Fetch details in batches
    const details = {};
    const batchSize = 20;
    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => fetchPokemon(p.id)));
      results.forEach((r, j) => {
        details[batch[j].id] = {
          id: batch[j].id,
          name: batch[j].name,
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
    addToUnranked(list.map(p => p.id));
    setLoadedGenIdxs(prev => [...prev, genIdx]);
    setLoading(false);
  }

  function handleTierDrop(pokemonId, fromTier, toTier) {
    movePokemon(pokemonId, fromTier, toTier);
  }

  function handleRemoveFromTier(pokemonId, fromTier) {
    movePokemon(pokemonId, fromTier, "unranked");
  }

  const unrankedFiltered = (tierState?.unranked || []).filter(id => {
    if (!sidebarSearch) return true;
    const p = pokemonData[id];
    return p && p.name.includes(sidebarSearch.toLowerCase());
  });

  if (!tierState) return <LoadingSpinner message="Loading your tier list..." />;

  return (
    <div className="tier-page">
      {/* Main tier list area */}
      <div className="tier-main">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>Tier List</h2>
          <div className="progress-pill">
            <span style={{ color: "#78C850" }}>✓ {totalRanked} ranked</span>
            <span style={{ color: "#9fa8da" }}>·</span>
            <span>{totalUnranked} unranked</span>
          </div>

          <DropdownButton
            title={loading ? "Loading..." : "Load Generation"}
            variant="outline-warning"
            size="sm"
            disabled={loading}
            style={{ marginLeft: "auto" }}
          >
            {GENERATIONS.map((gen, idx) => (
              <Dropdown.Item
                key={idx}
                onClick={() => loadGeneration(idx)}
                disabled={loadedGenIdxs.includes(idx)}
                style={{ fontWeight: 700 }}
              >
                {gen.label} — {gen.name} ({gen.limit})
                {loadedGenIdxs.includes(idx) && " ✓"}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </div>

        {loading && <LoadingSpinner message="Fetching Pokémon data..." />}

        {loadedGenIdxs.length === 0 && !loading && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "#9fa8da", background: "rgba(22,33,62,0.4)",
            borderRadius: 16, border: "1px dashed rgba(15,52,96,0.8)"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎮</div>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.8rem", color: "white", marginBottom: 8 }}>
              Load a Generation to Start
            </div>
            <div style={{ fontSize: "0.9rem" }}>Use the dropdown above to load Gen I and begin ranking!</div>
          </div>
        )}

        {TIERS.map(tier => {
          const tierPokemon = (tierState[tier.id] || [])
            .map(id => pokemonData[id])
            .filter(Boolean);
          return (
            <TierRow
              key={tier.id}
              tier={tier}
              pokemon={tierPokemon}
              onDrop={handleTierDrop}
              onRemove={handleRemoveFromTier}
            />
          );
        })}
      </div>

      {/* Sidebar: unranked pokemon */}
      <div>
        <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.3rem", marginBottom: 6, color: "#9fa8da" }}>
          Unranked ({tierState.unranked?.length || 0})
        </div>
        <input
          value={sidebarSearch}
          onChange={e => setSidebarSearch(e.target.value)}
          placeholder="Filter..."
          style={{
            width: "100%", marginBottom: 6, padding: "4px 8px",
            background: "#16213e", border: "1px solid #0f3460",
            borderRadius: 6, color: "white", fontSize: "0.8rem"
          }}
        />
        <div
          className="pokemon-sidebar"
          onDragOver={e => e.preventDefault()}
          onDrop={handleDropToSidebar}
        >
          {unrankedFiltered.map(id => {
            const p = pokemonData[id];
            if (!p) return (
              <div key={id} style={{
                width: 64, height: 80, background: "rgba(15,52,96,0.4)",
                borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "0.55rem", color: "#9fa8da"
              }}>
                #{id}
              </div>
            );
            return (
              <PokemonCard
                key={id}
                id={p.id}
                name={p.name}
                types={p.types}
                size="small"
                onDragStart={e => {
                  e.dataTransfer.setData("text/plain", JSON.stringify({ id: p.id, fromTier: "unranked" }));
                }}
              />
            );
          })}
          {loadedGenIdxs.length > 0 && unrankedFiltered.length === 0 && (
            <div style={{ color: "#9fa8da", fontSize: "0.8rem", padding: 12 }}>
              {sidebarSearch ? "No matches" : "All ranked! 🎉"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

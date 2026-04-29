import React, { useState, useRef, useCallback } from "react";
import { Button, Dropdown, DropdownButton, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { fetchPokemonList, fetchPokemon, GENERATIONS } from "../utils/pokeapi";
import PokemonCard from "../components/PokemonCard";
import LoadingSpinner from "../components/LoadingSpinner";

// ─── Color palette for new tiers ─────────────────────────────────────────────

const PALETTE = [
  "#FF7F7F","#FFBF7F","#FFFF7F","#BFFF7F","#7FFF7F",
  "#7FFFBF","#7FFFFF","#7FBFFF","#7F7FFF","#BF7FFF",
  "#FF7FFF","#FF7FBF","#FFB347","#87CEEB","#98FB98",
  "#DDA0DD","#F0E68C","#E0FFFF","#FFDAB9","#C0C0C0",
];

function hexToBg(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},0.12)`;
}

function makeTier(idx) {
  const color = PALETTE[idx % PALETTE.length];
  return {
    id: "tier_" + Math.random().toString(36).slice(2, 8),
    label: `Tier ${idx + 1}`,
    color,
    bg: hexToBg(color),
  };
}

// ─── Inline-editable tier label ───────────────────────────────────────────────

function TierLabel({ tier, onRename, onRecolor, onMoveUp, onMoveDown, onDelete, isFirst, isLast, canDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tier.label);
  const inputRef = useRef(null);

  function commit() {
    const v = draft.trim();
    if (v) onRename(tier.id, v);
    else setDraft(tier.label);
    setEditing(false);
  }

  return (
    <div
      className="tier-label"
      style={{
        background: tier.color, minWidth: 70, flexDirection: "column",
        gap: 3, padding: "6px 4px", cursor: "default",
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(tier.label); setEditing(false); }
          }}
          autoFocus
          maxLength={12}
          style={{
            width: 58, textAlign: "center",
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: 4, color: "white", fontFamily: "Bangers, cursive",
            fontSize: "1.1rem", letterSpacing: "0.05em", outline: "none", padding: "2px 4px",
          }}
        />
      ) : (
        <span
          title="Click to rename"
          onClick={() => { setDraft(tier.label); setEditing(true); setTimeout(() => inputRef.current?.select(), 10); }}
          style={{
            fontFamily: "Bangers, cursive",
            fontSize: tier.label.length > 5 ? "0.9rem" : tier.label.length > 3 ? "1.3rem" : "1.9rem",
            lineHeight: 1.1, textAlign: "center", wordBreak: "break-all",
            cursor: "pointer", userSelect: "none",
            textShadow: "1px 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          {tier.label}
        </span>
      )}

      {/* Mini icon controls */}
      <div style={{ display: "flex", gap: 3, justifyContent: "center", flexWrap: "wrap" }}>
        <OverlayTrigger placement="right" overlay={<Tooltip>Change color</Tooltip>}>
          <label style={{ cursor: "pointer", lineHeight: 1, margin: 0 }}>
            <input
              type="color" value={tier.color}
              onChange={e => onRecolor(tier.id, e.target.value)}
              style={{ width: 0, height: 0, opacity: 0, position: "absolute", pointerEvents: "none" }}
            />
            <span style={{ fontSize: "0.7rem" }}>🎨</span>
          </label>
        </OverlayTrigger>

        {!isFirst && (
          <OverlayTrigger placement="right" overlay={<Tooltip>Move up</Tooltip>}>
            <span style={{ fontSize: "0.7rem", cursor: "pointer", opacity: 0.8 }}
              onClick={() => onMoveUp(tier.id)}>▲</span>
          </OverlayTrigger>
        )}

        {!isLast && (
          <OverlayTrigger placement="right" overlay={<Tooltip>Move down</Tooltip>}>
            <span style={{ fontSize: "0.7rem", cursor: "pointer", opacity: 0.8 }}
              onClick={() => onMoveDown(tier.id)}>▼</span>
          </OverlayTrigger>
        )}

        {canDelete && (
          <OverlayTrigger placement="right" overlay={<Tooltip>Delete tier</Tooltip>}>
            <span style={{ fontSize: "0.7rem", cursor: "pointer", color: "rgba(255,120,120,0.9)" }}
              onClick={() => onDelete(tier.id)}>✕</span>
          </OverlayTrigger>
        )}
      </div>
    </div>
  );
}

// ─── Single tier row ──────────────────────────────────────────────────────────

function TierRow({ tier, pokemon, onDrop, onRemove, onRename, onRecolor, onMoveUp, onMoveDown, onDelete, isFirst, isLast, canDelete }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className="tier-row"
      style={{ borderColor: dragOver ? tier.color : undefined, transition: "border-color 0.15s" }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        try {
          const data = JSON.parse(e.dataTransfer.getData("text/plain"));
          onDrop(data.id, data.fromTier, tier.id);
        } catch {}
      }}
    >
      <TierLabel
        tier={tier}
        onRename={onRename} onRecolor={onRecolor}
        onMoveUp={onMoveUp} onMoveDown={onMoveDown}
        onDelete={onDelete}
        isFirst={isFirst} isLast={isLast} canDelete={canDelete}
      />

      <div
        className={`tier-drop-zone ${dragOver ? "drag-over" : ""}`}
        style={{ background: dragOver ? hexToBg(tier.color).replace("0.12", "0.2") : tier.bg }}
      >
        {pokemon.map(p => (
          <div key={p.id} style={{ position: "relative" }}>
            <PokemonCard
              id={p.id} name={p.name} types={p.types} size="small"
              onDragStart={e =>
                e.dataTransfer.setData("text/plain", JSON.stringify({ id: p.id, fromTier: tier.id }))
              }
            />
            <button
              onClick={() => onRemove(p.id, tier.id)}
              style={{
                position: "absolute", top: 2, right: 2,
                background: "rgba(229,57,53,0.85)", border: "none", borderRadius: "50%",
                width: 14, height: 14, fontSize: "0.5rem", color: "white",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", padding: 0,
              }}
            >✕</button>
          </div>
        ))}
        {pokemon.length === 0 && (
          <div style={{ color: "rgba(159,168,218,0.2)", fontSize: "0.75rem", padding: "28px 12px", userSelect: "none" }}>
            Drop Pokémon here
          </div>
        )}
      </div>
    </div>
  );
}

// ─── "Add tier" divider button ────────────────────────────────────────────────

function AddTierDivider({ onClick, disabled }) {
  const [hover, setHover] = useState(false);
  if (disabled) return null;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "4px 0", marginBottom: 3,
        background: "transparent",
        border: `1px dashed ${hover ? "#fdd835" : "rgba(15,52,96,0.6)"}`,
        borderRadius: 6, color: hover ? "#fdd835" : "rgba(159,168,218,0.4)",
        fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
      }}
    >
      + add tier
    </button>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function DeleteTierModal({ tier, pokemonCount, onConfirm, onCancel }) {
  return (
    <Modal show onHide={onCancel} centered className="poke-modal">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title style={{ fontFamily: "Bangers, cursive", fontSize: "1.6rem" }}>
          Delete "{tier?.label}"?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {pokemonCount > 0
          ? <p style={{ color: "#9fa8da" }}>This tier has <strong style={{ color: "white" }}>{pokemonCount} Pokémon</strong> — they'll move back to the unranked sidebar.</p>
          : <p style={{ color: "#9fa8da" }}>This tier is empty and will be removed.</p>
        }
      </Modal.Body>
      <Modal.Footer style={{ borderColor: "rgba(15,52,96,0.8)" }}>
        <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Delete Tier</Button>
      </Modal.Footer>
    </Modal>
  );
}

function ResetConfigModal({ onConfirm, onCancel }) {
  return (
    <Modal show onHide={onCancel} centered className="poke-modal">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title style={{ fontFamily: "Bangers, cursive", fontSize: "1.6rem" }}>Reset to S–F?</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p style={{ color: "#9fa8da" }}>
          Restores the default 6 tiers (S, A, B, C, D, F) and moves all ranked Pokémon back to unranked.
        </p>
      </Modal.Body>
      <Modal.Footer style={{ borderColor: "rgba(15,52,96,0.8)" }}>
        <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm}>Reset Tiers</Button>
      </Modal.Footer>
    </Modal>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TierListPage() {
  const {
    tierConfig, renameTier, recolorTier, addTierWithId, removeTier,
    moveTierUp, moveTierDown, resetTierConfig,
    tierState, movePokemon, addToUnranked, totalRanked,
  } = useApp();

  const [pokemonData, setPokemonData] = useState({});
  const [loadedGenIdxs, setLoadedGenIdxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [deletingTierId, setDeletingTierId] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Add a new tier (appends to end, since insert-after requires context refactor)
  function handleAddTier() {
    if (!tierConfig || tierConfig.length >= 20) return;
    addTierWithId(makeTier(tierConfig.length));
  }

  async function loadGeneration(genIdx) {
    if (loadedGenIdxs.includes(genIdx)) return;
    setLoading(true);
    const gen = GENERATIONS[genIdx];
    const list = await fetchPokemonList(gen.limit, gen.offset);
    const details = {};
    const batchSize = 20;
    for (let i = 0; i < list.length; i += batchSize) {
      const batch = list.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(p => fetchPokemon(p.id)));
      results.forEach((r, j) => {
        details[batch[j].id] = {
          id: batch[j].id, name: batch[j].name,
          types: r.types.map(t => t.type.name),
          stats: r.stats, height: r.height, weight: r.weight,
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

  const deletingTier = tierConfig?.find(t => t.id === deletingTierId);
  const deletingCount = deletingTierId ? (tierState?.[deletingTierId]?.length || 0) : 0;

  const unrankedFiltered = (tierState?.unranked || []).filter(id => {
    if (!pokemonData[id]) return false;
    if (!sidebarSearch) return true;
    return pokemonData[id].name.includes(sidebarSearch.toLowerCase());
  });

  const loadedUnrankedCount = (tierState?.unranked || []).filter(id => pokemonData[id]).length;

  if (!tierState || !tierConfig) return <LoadingSpinner message="Loading your tier list..." />;

  return (
    <div className="tier-page">
      {/* ── Main area ── */}
      <div className="tier-main">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "2rem", margin: 0 }}>Tier List</h2>
          <div className="progress-pill">
            <span style={{ color: "#78C850" }}>✓ {totalRanked} ranked</span>
            <span style={{ color: "#9fa8da" }}>·</span>
            <span>{loadedUnrankedCount} unranked</span>
          </div>
          <DropdownButton
            title={loading ? "Loading..." : "Load Generation"}
            variant="outline-warning" size="sm" disabled={loading}
            style={{ marginLeft: "auto" }}
          >
            {GENERATIONS.map((gen, idx) => (
              <Dropdown.Item key={idx} onClick={() => loadGeneration(idx)}
                disabled={loadedGenIdxs.includes(idx)} style={{ fontWeight: 700 }}>
                {gen.label} — {gen.name} ({gen.limit}){loadedGenIdxs.includes(idx) && " ✓"}
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </div>

        {/* Tier config toolbar */}
        <div style={{
          background: "rgba(22,33,62,0.5)", border: "1px solid rgba(15,52,96,0.8)",
          borderRadius: 8, padding: "8px 12px", marginBottom: 10,
          display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
          fontSize: "0.8rem",
        }}>
          <span style={{ color: "#9fa8da", fontWeight: 700 }}>
            {tierConfig.length} tier{tierConfig.length !== 1 ? "s" : ""}
            <span style={{ color: "rgba(159,168,218,0.4)", marginLeft: 4 }}>(max 20)</span>
          </span>
          <Button size="sm" variant="outline-warning"
            style={{ fontSize: "0.75rem", padding: "2px 10px" }}
            onClick={handleAddTier} disabled={tierConfig.length >= 20}>
            + Add tier
          </Button>
          <Button size="sm" variant="outline-secondary"
            style={{ fontSize: "0.75rem", padding: "2px 10px" }}
            onClick={() => setShowResetModal(true)}>
            Reset to S–F
          </Button>
          <span style={{ color: "rgba(159,168,218,0.35)", fontSize: "0.7rem" }}>
            Click label to rename · 🎨 recolor · ▲▼ reorder · ✕ delete
          </span>
        </div>

        {loading && <LoadingSpinner message="Fetching Pokémon data..." />}

        {loadedGenIdxs.length === 0 && !loading && (
          <div style={{
            textAlign: "center", padding: "40px 20px", color: "#9fa8da",
            background: "rgba(22,33,62,0.4)", borderRadius: 16,
            border: "1px dashed rgba(15,52,96,0.8)", marginBottom: 10,
          }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎮</div>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.8rem", color: "white", marginBottom: 8 }}>
              Load a Generation to Start
            </div>
            <div style={{ fontSize: "0.9rem" }}>Use the dropdown above to load Gen I and begin ranking!</div>
          </div>
        )}

        {/* Tier rows */}
        {tierConfig.map((tier, idx) => {
          const tierPokemon = (tierState[tier.id] || [])
            .map(id => pokemonData[id]).filter(Boolean);
          return (
            <React.Fragment key={tier.id}>
              <TierRow
                tier={tier}
                pokemon={tierPokemon}
                onDrop={movePokemon}
                onRemove={(id, fromTier) => movePokemon(id, fromTier, "unranked")}
                onRename={renameTier}
                onRecolor={recolorTier}
                onMoveUp={moveTierUp}
                onMoveDown={moveTierDown}
                onDelete={id => setDeletingTierId(id)}
                isFirst={idx === 0}
                isLast={idx === tierConfig.length - 1}
                canDelete={tierConfig.length > 2}
              />
              <AddTierDivider
                onClick={handleAddTier}
                disabled={tierConfig.length >= 20 || idx === tierConfig.length - 1}
              />
            </React.Fragment>
          );
        })}

        {/* Bottom add button */}
        {tierConfig.length < 20 && (
          <button
            onClick={handleAddTier}
            style={{
              width: "100%", padding: "6px 0", background: "transparent",
              border: "1px dashed rgba(15,52,96,0.6)", borderRadius: 8,
              color: "rgba(159,168,218,0.5)", fontSize: "0.78rem",
              fontWeight: 700, cursor: "pointer", marginTop: 2,
            }}
          >
            + Add tier at bottom
          </button>
        )}
        {tierConfig.length >= 20 && (
          <div style={{ textAlign: "center", color: "rgba(159,168,218,0.3)", fontSize: "0.7rem", padding: 6 }}>
            Maximum 20 tiers reached
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <div>
        <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.3rem", marginBottom: 6, color: "#9fa8da" }}>
          Unranked ({loadedUnrankedCount})
        </div>
        <input
          value={sidebarSearch}
          onChange={e => setSidebarSearch(e.target.value)}
          placeholder="Filter..."
          style={{
            width: "100%", marginBottom: 6, padding: "4px 8px",
            background: "#16213e", border: "1px solid #0f3460",
            borderRadius: 6, color: "white", fontSize: "0.8rem",
          }}
        />
        <div
          className="pokemon-sidebar"
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault();
            try {
              const data = JSON.parse(e.dataTransfer.getData("text/plain"));
              if (data.fromTier && data.fromTier !== "unranked") {
                movePokemon(data.id, data.fromTier, "unranked");
              }
            } catch {}
          }}
        >
          {unrankedFiltered.map(id => {
            const p = pokemonData[id];
            return (
              <PokemonCard
                key={id} id={p.id} name={p.name} types={p.types} size="small"
                onDragStart={e =>
                  e.dataTransfer.setData("text/plain", JSON.stringify({ id: p.id, fromTier: "unranked" }))
                }
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

      {/* ── Modals ── */}
      {deletingTierId && (
        <DeleteTierModal
          tier={deletingTier}
          pokemonCount={deletingCount}
          onConfirm={() => { removeTier(deletingTierId); setDeletingTierId(null); }}
          onCancel={() => setDeletingTierId(null)}
        />
      )}
      {showResetModal && (
        <ResetConfigModal
          onConfirm={() => { resetTierConfig(); setShowResetModal(false); }}
          onCancel={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}
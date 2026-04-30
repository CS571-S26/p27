import React, { useState, useRef, useEffect } from "react";
import { Button, Dropdown, DropdownButton, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { fetchPokemonList, fetchPokemon, GENERATIONS, ALTERNATE_FORMS, fetchFormPokemon } from "../utils/pokeapi";
import FormSettingsPanel from "../components/FormSettingsPanel";
import PokemonCard from "../components/PokemonCard";
import LoadingSpinner from "../components/LoadingSpinner";

// Tier color utilities live in AppContext to avoid duplication.
// makeTier() is a local convenience that mirrors AppContext's insertTierAfter logic.
function makeTierLabel(count) { return `Tier ${count + 1}`; }

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
          aria-label={`Rename tier ${tier.label}`}
          style={{
            width: 58, textAlign: "center",
            background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.5)",
            borderRadius: 4, color: "white", fontFamily: "Bangers, cursive",
            fontSize: "1.1rem", letterSpacing: "0.05em", outline: "none", padding: "2px 4px",
          }}
        />
      ) : (
        <button
          aria-label={`Rename tier: ${tier.label}`}
          onClick={() => { setDraft(tier.label); setEditing(true); setTimeout(() => inputRef.current?.select(), 10); }}
          style={{
            background: "none", border: "none", padding: 0,
            fontFamily: "Bangers, cursive",
            fontSize: tier.label.length > 5 ? "0.9rem" : tier.label.length > 3 ? "1.3rem" : "1.9rem",
            lineHeight: 1.1, textAlign: "center", wordBreak: "break-all",
            cursor: "pointer", userSelect: "none", color: "inherit",
            textShadow: "1px 1px 3px rgba(0,0,0,0.4)",
          }}
        >
          {tier.label}
        </button>
      )}

      {/* Controls: ▲▼ left group, 🎨✕ right group — inline when space allows, wraps to centered row otherwise */}
      <div style={{
        display: "flex", gap: 2, justifyContent: "center",
        alignItems: "center", flexWrap: "wrap", marginTop: 2,
      }}>
        {/* Move arrows — left side of the row */}
        {(!isFirst || !isLast) && (
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {!isFirst && (
              <OverlayTrigger placement="right" overlay={<Tooltip>Move up</Tooltip>}>
                <button aria-label={`Move ${tier.label} tier up`}
                  onClick={() => onMoveUp(tier.id)}
                  style={{ background:"none", border:"none", padding:"1px 2px", cursor:"pointer", fontSize:"0.75rem", opacity:0.85, lineHeight:1, color:"inherit" }}>▲</button>
              </OverlayTrigger>
            )}
            {!isLast && (
              <OverlayTrigger placement="right" overlay={<Tooltip>Move down</Tooltip>}>
                <button aria-label={`Move ${tier.label} tier down`}
                  onClick={() => onMoveDown(tier.id)}
                  style={{ background:"none", border:"none", padding:"1px 2px", cursor:"pointer", fontSize:"0.75rem", opacity:0.85, lineHeight:1, color:"inherit" }}>▼</button>
              </OverlayTrigger>
            )}
          </div>
        )}

        {/* Color + delete — always together on the right */}
        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
          <OverlayTrigger placement="right" overlay={<Tooltip>Change color</Tooltip>}>
            <label aria-label={`Change color for ${tier.label} tier`} style={{ cursor: "pointer", lineHeight: 1, margin: 0 }}>
              <input
                type="color" value={tier.color}
                onChange={e => onRecolor(tier.id, e.target.value)}
                style={{ width: 0, height: 0, opacity: 0, position: "absolute" }}
              />
              <span style={{ fontSize: "0.75rem" }}>🎨</span>
            </label>
          </OverlayTrigger>

          {canDelete && (
            <OverlayTrigger placement="right" overlay={<Tooltip>Delete tier</Tooltip>}>
              <button
                aria-label={`Delete ${tier.label} tier`}
                onClick={() => onDelete(tier.id)}
                style={{ background:"none", border:"none", padding:"1px 2px", cursor:"pointer", fontSize:"0.75rem", color:"rgba(255,120,120,0.9)", lineHeight:1 }}>✕</button>
            </OverlayTrigger>
          )}
        </div>
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
        style={{ background: dragOver ? tier.bg.replace("0.12", "0.2") : tier.bg }}
      >
        {pokemon.map(p => (
          <div key={p.id} style={{ position: "relative" }}>
            <PokemonCard
              id={p.id} name={p.name} types={p.types} size="small"
              formName={p.formName || null}
              onDragStart={e =>
                e.dataTransfer.setData("text/plain", JSON.stringify({ id: p.id, fromTier: tier.id }))
              }
            />
            <button
              aria-label={`Remove ${p.name} from ${tier.label} tier`}
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
    tierConfig, renameTier, recolorTier, insertTierAfter, removeTier,
    moveTierUp, moveTierDown, resetTierConfig,
    tierState, movePokemon, addToUnranked, totalRanked,
    formSettings,
  } = useApp();

  const [pokemonData, setPokemonData] = useState({});
  const [loadedGenIdxs, setLoadedGenIdxs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [deletingTierId, setDeletingTierId] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);

  function handleAddTier(afterTierId = null) {
    if (!tierConfig || tierConfig.length >= 20) return;
    insertTierAfter(afterTierId);
  }

  // Load pokemon data for alternate forms when their type is enabled
  useEffect(() => {
    if (!formSettings) return;
    const enabledForms = ALTERNATE_FORMS.filter(f => formSettings[f.formType]);
    const missing = enabledForms.filter(f => !pokemonData[f.name]);
    if (missing.length === 0) return;

    async function loadForms() {
      const details = {};
      await Promise.all(missing.map(async form => {
        try {
          const r = await fetchFormPokemon(form.name);
          details[form.name] = {
            id: form.name,         // string key for forms
            name: form.display,
            formName: form.name,   // used for sprite lookup
            types: r.types.map(t => t.type.name),
            stats: r.stats,
            height: r.height,
            weight: r.weight,
            base_experience: r.base_experience || 0,
            egg_groups: [],        // forms don't have separate egg group data
            isForm: true,
            formType: form.formType,
            baseSpecies: form.base,
          };
        } catch (e) {
          // Form not found in API — skip silently
        }
      }));
      setPokemonData(prev => ({ ...prev, ...details }));
    }
    loadForms();
  }, [formSettings]);

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
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Tier List</h1>
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

        {/* Alternate forms quick-toggles */}
        <details style={{ marginBottom: 8 }}>
          <summary style={{
            cursor: "pointer", fontSize: "0.8rem", fontWeight: 700,
            color: "#9fa8da", padding: "4px 0", userSelect: "none",
            listStyle: "none", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span>✨ Alternate Forms</span>
            {Object.values(formSettings || {}).some(Boolean) && (
              <span style={{
                background: "rgba(255,214,0,0.2)", border: "1px solid rgba(255,214,0,0.4)",
                borderRadius: 20, padding: "1px 8px", fontSize: "0.68rem", color: "#fdd835",
              }}>active</span>
            )}
          </summary>
          <div style={{ paddingTop: 8 }}>
            <FormSettingsPanel compact />
          </div>
        </details>

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
                onClick={() => handleAddTier(tier.id)}
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
        <h2 style={{ fontFamily: "Bangers, cursive", fontSize: "1.3rem", marginBottom: 6, color: "#9fa8da" }}>
          Unranked ({loadedUnrankedCount})
        </h2>
        <label htmlFor="sidebar-search" className="visually-hidden">Filter unranked Pokémon</label>
        <input
          id="sidebar-search"
          value={sidebarSearch}
          onChange={e => setSidebarSearch(e.target.value)}
          placeholder="Filter Pokémon..."
          aria-label="Filter unranked Pokémon"
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
                formName={p.formName || null}
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
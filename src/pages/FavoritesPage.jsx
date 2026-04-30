import React, { useState, useEffect } from "react";
import { Container, Badge } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { fetchPokemonList, fetchPokemon, GENERATIONS, spriteUrl, formSpriteUrl, TYPE_COLORS, getGenGradient, ALTERNATE_FORMS, fetchFormPokemon } from "../utils/pokeapi";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

// ─── Picker card ──────────────────────────────────────────────────────────────

function FavCard({ id, name, types, selected, onToggle }) {
  return (
    <button
      className={`fav-card ${selected ? "selected" : ""}`}
      onClick={() => onToggle(id)}
      aria-pressed={selected}
      aria-label={`${selected ? "Remove" : "Add"} ${name.replace(/-/g, " ")} ${selected ? "from" : "to"} favorites`}
      style={{ textAlign: "center" }}
    >
      <img src={spriteUrl(id)} alt={name} width={72} height={72}
        loading="lazy" style={{ imageRendering: "pixelated" }} />
      <div style={{
        fontSize: "0.65rem", fontWeight: 700, textTransform: "capitalize",
        color: selected ? "#e040fb" : "#9fa8da", marginTop: 4,
      }}>
        {name.replace(/-/g, " ")}
      </div>
      {selected && (
        <div style={{ position: "absolute", top: 4, right: 4, fontSize: "0.8rem" }}>❤️</div>
      )}
    </button>
  );
}

// ─── Compact favorites sidebar ────────────────────────────────────────────────

function FavoritesSidebar({ favorites, pokemonData, onRemove, open, onToggle }) {
  // Group favorites by generation
  const byGen = GENERATIONS.map(gen => ({
    gen,
    ids: Array.from(favorites || []).filter(id => id > gen.offset && id <= gen.offset + gen.limit),
  })).filter(g => g.ids.length > 0);

  const favCount = favorites?.size || 0;

  return (
    <div style={{
      width: open ? 220 : 40,
      minWidth: open ? 220 : 40,
      transition: "width 0.25s, min-width 0.25s",
      background: "rgba(22,33,62,0.7)",
      border: "1px solid rgba(15,52,96,0.8)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 110px)",
      position: "sticky",
      top: 80,
      flexShrink: 0,
    }}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? "Collapse favorites panel" : "Expand favorites panel"}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "10px 0", display: "flex", alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          paddingLeft: open ? 12 : 0, paddingRight: open ? 10 : 0,
          borderBottom: "1px solid rgba(15,52,96,0.6)",
          flexShrink: 0,
        }}
        title={open ? "Collapse favorites panel" : "Expand favorites panel"}
      >
        {open ? (
          <>
            <span style={{ fontFamily: "Bangers, cursive", fontSize: "1rem", color: "#EE99AC", letterSpacing: "0.04em" }}>
              ❤️ My Favorites ({favCount})
            </span>
            <span style={{ color: "#9fa8da", fontSize: "0.8rem" }}>◀</span>
          </>
        ) : (
          <span style={{ color: "#EE99AC", fontSize: "1rem", writingMode: "vertical-rl", transform: "rotate(180deg)", padding: "8px 0" }}>
            ❤️ {favCount}
          </span>
        )}
      </button>

      {/* Scrollable list */}
      {open && (
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 8px 80px" }}>
          {favCount === 0 && (
            <div style={{ color: "rgba(159,168,218,0.4)", fontSize: "0.75rem", textAlign: "center", padding: "20px 8px" }}>
              Tap Pokémon to add favorites
            </div>
          )}
          {byGen.map(({ gen, ids }) => (
            <div key={gen.label} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "white",
                marginBottom: 6, paddingBottom: 4,
                borderBottom: `1px solid ${gen.color}55`,
                background: getGenGradient(gen, "90deg"),
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {gen.label} — {gen.name} ({ids.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {ids.map(id => {
                  const p = pokemonData[id];
                  return (
                    <div key={id} style={{ position: "relative", textAlign: "center" }}
                      title={p?.name?.replace(/-/g, " ") || `#${id}`}>
                      <img
                        src={spriteUrl(id)}
                        alt={p?.name || id}
                        width={44} height={44}
                        loading="lazy"
                        style={{ imageRendering: "pixelated", display: "block" }}
                      />
                      <div style={{
                        fontSize: "0.48rem", color: "#9fa8da",
                        textTransform: "capitalize", lineHeight: 1.1,
                        maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {p?.name?.replace(/-/g, " ") || `#${id}`}
                      </div>
                      {/* Click to remove */}
                      <button
                        onClick={e => { e.stopPropagation(); onRemove(id); }}
                        aria-label={`Remove ${p?.name?.replace(/-/g," ") || id} from favorites`}
                        style={{
                          position: "absolute", top: 0, right: 0,
                          background: "rgba(229,57,53,0.85)", border: "none",
                          borderRadius: "50%", width: 13, height: 13,
                          fontSize: "0.45rem", color: "white", cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          padding: 0, lineHeight: 1,
                        }}
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite, formSettings } = useApp();
  const [activeGenIdx, setActiveGenIdx] = useState(0);
  const [pokemonData, setPokemonData] = useState({});
  const [loadedGens, setLoadedGens] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => { loadGen(activeGenIdx); }, [activeGenIdx]);

  // Load form data when formSettings changes
  const [formPokemonData, setFormPokemonData] = useState({});
  useEffect(() => {
    if (!formSettings) return;
    const enabled = ALTERNATE_FORMS.filter(f => formSettings[f.formType]);
    const missing = enabled.filter(f => !formPokemonData[f.name]);
    if (!missing.length) return;
    Promise.all(missing.map(async form => {
      try {
        const r = await fetchFormPokemon(form.name);
        return [form.name, {
          id: form.name, name: form.display, formName: form.name,
          types: r.types.map(t => t.type.name),
          isForm: true, formType: form.formType, baseSpecies: form.base,
        }];
      } catch { return null; }
    })).then(results => {
      const details = Object.fromEntries(results.filter(Boolean));
      setFormPokemonData(prev => ({ ...prev, ...details }));
    });
  }, [formSettings]);

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
          id: p.id, name: p.name,
          types: r.types.map(t => t.type.name),
          stats: r.stats, height: r.height, weight: r.weight,
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
    <div style={{ display: "flex", gap: 12, padding: "12px 12px 80px", alignItems: "flex-start" }}>

      {/* ── Main picker area ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "2.2rem", margin: 0 }}>Favorites Picker</h1>
          <div className="progress-pill">
            <span style={{ color: "#EE99AC" }}>❤️ {favCount} favorites</span>
          </div>
        </div>

        <p style={{ color: "#9fa8da", fontSize: "0.88rem", marginBottom: 16 }}>
          Tap any Pokémon to add it to your favorites. Your selected favorites appear in the panel on the right.
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
          <span style={{ color: "#9fa8da", fontSize: "0.8rem" }}>{gen.limit} Pokémon</span>
          {loadedGens.has(activeGenIdx) && (() => {
            let cnt = 0;
            for (let i = gen.offset + 1; i <= gen.offset + gen.limit; i++) {
              if (favorites?.has(i)) cnt++;
            }
            return cnt > 0
              ? <span style={{ color: "#EE99AC", fontSize: "0.8rem" }}>· {cnt} selected</span>
              : null;
          })()}
        </div>

        {loading ? (
          <LoadingSpinner message={`Loading ${gen.label} Pokémon...`} />
        ) : (
          <div className="favorites-grid">
            {genPokemon.map(p => (
              <FavCard
                key={p.id} id={p.id} name={p.name} types={p.types}
                selected={favorites?.has(p.id)}
                onToggle={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Favorites sidebar ── */}
      <FavoritesSidebar
        favorites={favorites}
        pokemonData={pokemonData}
        onRemove={toggleFavorite}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* ── Floating "View Stats" button ── */}
      {/* Alternate forms section */}
      {formSettings && Object.entries(formSettings).some(([, v]) => v) && (
        <div style={{ marginTop: 24 }}>
          {['mega','gmax','regional','other'].filter(ft => formSettings[ft]).map(ft => {
            const forms = ALTERNATE_FORMS.filter(f => f.formType === ft);
            return (
              <div key={ft} style={{ marginBottom: 20 }}>
                <div style={{
                  fontFamily: "Bangers, cursive", fontSize: "1.2rem",
                  marginBottom: 10, color: "#9fa8da",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>
                    {{ mega:"⚡ Mega Evolutions", gmax:"🌀 Gigantamax Forms",
                       regional:"🌏 Regional Variants", other:"✨ Other Notable Forms" }[ft]}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 400 }}>({forms.length})</span>
                </div>
                <div className="favorites-grid">
                  {forms.map(form => {
                    const p = formPokemonData[form.name];
                    const sel = favorites?.has(form.name);
                    return (
                      <button
                        key={form.name}
                        className={`fav-card ${sel ? "selected" : ""}`}
                        onClick={() => toggleFavorite(form.name)}
                        aria-pressed={sel}
                        aria-label={`${sel ? "Remove" : "Add"} ${form.display} ${sel ? "from" : "to"} favorites`}
                        style={{ textAlign: "center" }}
                      >
                        <img
                          src={formSpriteUrl(form.name)}
                          alt={form.display}
                          width={72} height={72}
                          loading="lazy"
                          style={{ imageRendering: "pixelated" }}
                        />
                        <div style={{
                          fontSize: "0.62rem", fontWeight: 700,
                          color: sel ? "#e040fb" : "#9fa8da", marginTop: 4,
                        }}>
                          {form.display}
                        </div>
                        {sel && <div style={{ position: "absolute", top: 4, right: 4, fontSize: "0.8rem" }}>❤️</div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {favCount > 0 && (
        <div
          onClick={() => navigate("/stats", { state: { tab: "favorites" } })}
          style={{
            position: "fixed", bottom: 20, right: 20,
            background: "linear-gradient(135deg, #e53935, #ef6c00)",
            borderRadius: 30, padding: "10px 20px",
            boxShadow: "0 4px 20px rgba(229,57,53,0.5)",
            fontWeight: 800, fontSize: "0.88rem",
            color: "white", cursor: "pointer", zIndex: 100,
          }}
        >
          ❤️ {favCount} favorites → View Stats
        </div>
      )}
    </div>
  );
}
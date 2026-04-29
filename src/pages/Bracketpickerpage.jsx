import React, { useState } from "react";
import { Container, Button, Badge, Dropdown, DropdownButton, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/AppContext";
import { fetchPokemonList, fetchPokemon, GENERATIONS, spriteUrl, TYPE_COLORS, TIERS } from "../utils/pokeapi";
import LoadingSpinner from "../components/LoadingSpinner";

// ─── Picker Algorithm ─────────────────────────────────────────────────────────

function getBatchSize(roundSize) {
  const ideal = Math.ceil(roundSize / 5);
  return Math.max(2, Math.min(10, ideal));
}

function freshPickerState(ids) {
  const shuffled = [...ids].sort(() => Math.random() - 0.5);
  const batchSize = getBatchSize(shuffled.length);
  return {
    current: shuffled.slice(batchSize),
    evaluating: shuffled.slice(0, batchSize),
    survived: [],
    eliminated: [],
    favorites: [],
    history: [],
    done: false,
  };
}

function pickerPick(state, pickedIds) {
  const notPicked = state.evaluating.filter(id => !pickedIds.includes(id));
  const newEliminated = [
    ...state.eliminated,
    ...notPicked.map(id => ({ id, eliminatedBy: pickedIds })),
  ];
  const newSurvived = [...state.survived, ...pickedIds];

  let newCurrent = [...state.current];
  let newEvaluating = [];
  let newFavorites = [...state.favorites];
  let done = false;
  let newSurvivedFinal = [...newSurvived];

  if (newCurrent.length === 0) {
    if (newSurvived.length === 1) {
      newFavorites = [...newFavorites, newSurvived[0]];
      const remaining = newEliminated
        .filter(e => !newFavorites.includes(e.id))
        .map(e => e.id);
      if (remaining.length === 0) {
        done = true;
      } else if (remaining.length === 1) {
        newFavorites = [...newFavorites, remaining[0]];
        done = true;
      } else {
        const sh = [...remaining].sort(() => Math.random() - 0.5);
        const bs = getBatchSize(sh.length);
        newCurrent = sh.slice(bs);
        newEvaluating = sh.slice(0, bs);
        newSurvivedFinal = [];
      }
    } else {
      const sh = [...newSurvived].sort(() => Math.random() - 0.5);
      const bs = getBatchSize(sh.length);
      newCurrent = sh.slice(bs);
      newEvaluating = sh.slice(0, bs);
      newSurvivedFinal = [];
    }
  } else {
    const bs = getBatchSize(newCurrent.length + newSurvived.length);
    newEvaluating = newCurrent.slice(0, bs);
    newCurrent = newCurrent.slice(bs);
  }

  return {
    current: newCurrent,
    evaluating: newEvaluating,
    survived: newSurvivedFinal,
    eliminated: newEliminated,
    favorites: newFavorites,
    done,
    history: [...state.history.slice(-9), snapshotState(state)],
  };
}

function pickerPass(state) {
  return pickerPick(state, state.evaluating);
}

function pickerUndo(state) {
  if (state.history.length === 0) return state;
  const prev = state.history[state.history.length - 1];
  return { ...prev, history: state.history.slice(0, -1) };
}

function snapshotState(s) {
  return {
    current: [...s.current],
    evaluating: [...s.evaluating],
    survived: [...s.survived],
    eliminated: s.eliminated.map(e => ({ ...e, eliminatedBy: [...e.eliminatedBy] })),
    favorites: [...s.favorites],
    done: s.done,
    history: [],
  };
}

function favoritesToTiers(favoriteIds) {
  const total = favoriteIds.length;
  const result = { S: [], A: [], B: [], C: [], D: [], F: [], unranked: [] };
  favoriteIds.forEach((id, i) => {
    const pct = i / total;
    if (pct < 0.05) result.S.push(id);
    else if (pct < 0.20) result.A.push(id);
    else if (pct < 0.40) result.B.push(id);
    else if (pct < 0.60) result.C.push(id);
    else if (pct < 0.80) result.D.push(id);
    else result.F.push(id);
  });
  return result;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BracketCard({ id, name, types, selected, onClick, size = 100 }) {
  return (
    <div
      onClick={() => onClick(id)}
      style={{
        background: selected ? "rgba(224,64,251,0.2)" : "rgba(22,33,62,0.8)",
        border: `2px solid ${selected ? "#e040fb" : "rgba(15,52,96,0.8)"}`,
        borderRadius: 14, padding: 12, textAlign: "center", cursor: "pointer",
        transition: "all 0.15s", transform: selected ? "scale(1.06)" : "scale(1)",
        boxShadow: selected ? "0 0 20px rgba(224,64,251,0.4)" : "none",
        minWidth: size + 24, userSelect: "none",
      }}
    >
      {selected && (
        <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#e040fb", marginBottom: 4, letterSpacing: "0.08em" }}>
          ★ PICK
        </div>
      )}
      <img src={spriteUrl(id)} alt={name} width={size} height={size}
        style={{ imageRendering: "pixelated" }} loading="lazy" />
      <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "capitalize",
        color: selected ? "white" : "#9fa8da", marginTop: 4 }}>
        {name?.replace(/-/g, " ")}
      </div>
      <div style={{ fontSize: "0.6rem", color: "rgba(159,168,218,0.5)", marginBottom: 4 }}>
        #{String(id).padStart(3, "0")}
      </div>
      {types?.map(t => (
        <span key={t} className="type-badge" style={{ background: TYPE_COLORS[t] || "#888" }}>{t}</span>
      ))}
    </div>
  );
}

function RankedList({ favorites, pokemonData, compact = false }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: compact ? 4 : 8, justifyContent: "center" }}>
      {favorites.map((id, i) => {
        const p = pokemonData[id];
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
        return (
          <div key={id} style={{
            background: "rgba(22,33,62,0.8)", border: "1px solid rgba(15,52,96,0.8)",
            borderRadius: 10, padding: compact ? "4px 6px" : "6px 8px",
            textAlign: "center", minWidth: compact ? 64 : 80,
          }}>
            <div style={{ fontSize: compact ? "0.6rem" : "0.7rem", fontWeight: 800, color: "#fdd835", marginBottom: 2 }}>{medal}</div>
            <img src={spriteUrl(id)} alt={p?.name || id}
              width={compact ? 40 : 56} height={compact ? 40 : 56}
              style={{ imageRendering: "pixelated" }} loading="lazy" />
            <div style={{ fontSize: "0.58rem", color: "#9fa8da", textTransform: "capitalize" }}>
              {p?.name?.replace(/-/g, " ") || `#${id}`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TierProgressRow({ tierState, currentTierId, completedTiers }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
      {TIERS.map(tier => {
        const ids = tierState?.[tier.id] || [];
        if (ids.length === 0) return null;
        const isComplete = completedTiers.includes(tier.id);
        const isCurrent = tier.id === currentTierId;
        return (
          <div key={tier.id} style={{
            flex: 1, borderRadius: 8, padding: "6px 4px",
            background: isComplete ? tier.color + "33" : isCurrent ? tier.color + "22" : "rgba(255,255,255,0.03)",
            border: `2px solid ${isCurrent ? tier.color : isComplete ? tier.color + "88" : "rgba(15,52,96,0.6)"}`,
            textAlign: "center", transition: "all 0.2s",
          }}>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.4rem", color: tier.color }}>{tier.label}</div>
            <div style={{ fontSize: "0.6rem", color: "#9fa8da" }}>{ids.length}</div>
            {isComplete && <div style={{ fontSize: "0.7rem" }}>✓</div>}
            {isCurrent && <div style={{ fontSize: "0.6rem", color: tier.color, fontWeight: 800 }}>NOW</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const MODE_SELECT = "select";
const MODE_BRACKET = "bracket";
const MODE_TIER_SORT = "tiersort";

export default function BracketPickerPage() {
  const { tierState, setTierState } = useApp();
  const navigate = useNavigate();

  const [pokemonData, setPokemonData] = useState({});
  const [loadingPokemon, setLoadingPokemon] = useState(false);
  const [mode, setMode] = useState(MODE_SELECT);

  // Standalone bracket
  const [loadedGenIdxs, setLoadedGenIdxs] = useState([]);
  const [poolIds, setPoolIds] = useState([]);

  // Shared picker
  const [pickerState, setPickerState] = useState(null);
  const [selected, setSelected] = useState(new Set());

  // Tier-sort
  const [tierQueue, setTierQueue] = useState([]);
  const [currentTierQueueIdx, setCurrentTierQueueIdx] = useState(0);
  const [completedTiers, setCompletedTiers] = useState([]);
  const [tierRankedResults, setTierRankedResults] = useState({});
  const [fullRanking, setFullRanking] = useState([]);

  // Modals
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [converted, setConverted] = useState(false);

  // ─── Pokemon data loading ───────────────────────────────────────────────

  async function ensurePokemonLoaded(ids) {
    const missing = ids.filter(id => !pokemonData[id]);
    if (missing.length === 0) return;
    setLoadingPokemon(true);
    const newDetails = {};
    const batchSize = 20;
    for (let i = 0; i < missing.length; i += batchSize) {
      const batch = missing.slice(i, i + batchSize);
      const results = await Promise.all(batch.map(id => fetchPokemon(id)));
      results.forEach((r, j) => {
        newDetails[batch[j]] = {
          id: batch[j], name: r.name,
          types: r.types.map(t => t.type.name),
        };
      });
    }
    setPokemonData(prev => ({ ...prev, ...newDetails }));
    setLoadingPokemon(false);
  }

  async function loadGeneration(genIdx) {
    if (loadedGenIdxs.includes(genIdx)) return;
    setLoadingPokemon(true);
    const gen = GENERATIONS[genIdx];
    const list = await fetchPokemonList(gen.limit, gen.offset);
    await ensurePokemonLoaded(list.map(p => p.id));
    setPoolIds(prev => [...prev, ...list.map(p => p.id)]);
    setLoadedGenIdxs(prev => [...prev, genIdx]);
    setLoadingPokemon(false);
  }

  // ─── Tier-sort: advance through tier queue ──────────────────────────────

  // Note: we pass all accumulated state explicitly to avoid stale closure issues
  function advanceTierSort(queue, queueIdx, prevResults, completedFavorites, prevCompleted) {
    const completedTierId = queue[queueIdx];
    const newResults = { ...prevResults, [completedTierId]: completedFavorites };
    const newCompleted = [...prevCompleted, completedTierId];
    setCompletedTiers(newCompleted);
    setTierRankedResults(newResults);

    const nextIdx = queueIdx + 1;
    if (nextIdx >= queue.length) {
      // Done — merge all tiers into full ranking
      const merged = TIERS.flatMap(t => newResults[t.id] || []);
      setFullRanking(merged);
      setPickerState(null);
    } else {
      setCurrentTierQueueIdx(nextIdx);
      const nextTierId = queue[nextIdx];
      const nextIds = tierState[nextTierId] || [];
      if (nextIds.length <= 1) {
        // Single-pokemon tier, skip bracket
        advanceTierSort(queue, nextIdx, newResults, nextIds, newCompleted);
      } else {
        setPickerState(freshPickerState(nextIds));
      }
    }
  }

  async function startTierSort() {
    const nonEmpty = TIERS.filter(t => (tierState?.[t.id] || []).length > 0);
    if (nonEmpty.length === 0) return;
    const queue = nonEmpty.map(t => t.id);

    setMode(MODE_TIER_SORT);
    setTierQueue(queue);
    setCurrentTierQueueIdx(0);
    setCompletedTiers([]);
    setTierRankedResults({});
    setFullRanking([]);
    setSelected(new Set());
    setConverted(false);

    const allIds = nonEmpty.flatMap(t => tierState[t.id]);
    await ensurePokemonLoaded(allIds);

    const firstIds = tierState[queue[0]] || [];
    if (firstIds.length <= 1) {
      advanceTierSort(queue, 0, {}, firstIds, []);
    } else {
      setPickerState(freshPickerState(firstIds));
    }
  }

  // ─── Picker actions ─────────────────────────────────────────────────────

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handlePick() {
    if (selected.size === 0) return;
    const next = pickerPick(pickerState, Array.from(selected));
    setSelected(new Set());
    if (next.done && mode === MODE_TIER_SORT) {
      advanceTierSort(tierQueue, currentTierQueueIdx, tierRankedResults, next.favorites, completedTiers);
    } else {
      setPickerState(next);
    }
  }

  function handlePass() {
    const next = pickerPass(pickerState);
    setSelected(new Set());
    if (next.done && mode === MODE_TIER_SORT) {
      advanceTierSort(tierQueue, currentTierQueueIdx, tierRankedResults, next.favorites, completedTiers);
    } else {
      setPickerState(next);
    }
  }

  function handleUndo() {
    setPickerState(prev => pickerUndo(prev));
    setSelected(new Set());
  }

  function resetAll() {
    setMode(MODE_SELECT);
    setPickerState(null);
    setSelected(new Set());
    setPoolIds([]);
    setLoadedGenIdxs([]);
    setTierQueue([]);
    setCurrentTierQueueIdx(0);
    setCompletedTiers([]);
    setTierRankedResults({});
    setFullRanking([]);
    setConverted(false);
  }

  // ─── Conversions ─────────────────────────────────────────────────────────

  function handleConvertBracketToTiers() {
    const tiers = favoritesToTiers(pickerState.favorites);
    const favSet = new Set(pickerState.favorites);
    tiers.unranked = poolIds.filter(id => !favSet.has(id));
    setTierState(tiers);
    setConverted(true);
    setShowConvertModal(false);
  }

  function handleConvertRankingToTiers() {
    const tiers = favoritesToTiers(fullRanking);
    const rankSet = new Set(fullRanking);
    tiers.unranked = (tierState?.unranked || []).filter(id => !rankSet.has(id));
    setTierState(tiers);
    setConverted(true);
    setShowConvertModal(false);
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const ps = pickerState;
  const hasTierData = tierState && TIERS.some(t => (tierState[t.id] || []).length > 0);
  const totalRankedInTiers = TIERS.reduce((s, t) => s + (tierState?.[t.id]?.length || 0), 0);

  const currentTierId = tierQueue[currentTierQueueIdx];
  const currentTierDef = TIERS.find(t => t.id === currentTierId);
  const currentTierTotal = currentTierId ? (tierState?.[currentTierId] || []).length : 0;

  const totalInRound = ps ? ps.current.length + ps.evaluating.length + ps.survived.length : 0;
  const standaloneProgress = ps && poolIds.length > 0
    ? Math.round((ps.favorites.length / poolIds.length) * 100) : 0;
  const tierSortProgress = tierQueue.length > 0
    ? Math.round((completedTiers.length / tierQueue.length) * 100) : 0;

  // ─── Mode selection ───────────────────────────────────────────────────────

  if (mode === MODE_SELECT) {
    return (
      <Container fluid className="py-3" style={{ maxWidth: 900 }}>
        <h2 style={{ fontSize: "2.2rem", marginBottom: 8 }}>Bracket Picker</h2>
        <p style={{ color: "#9fa8da", fontSize: "0.88rem", marginBottom: 28 }}>
          Pick your favorites from batches repeatedly until everything is ranked. Choose a mode:
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="feature-card" onClick={() => setMode(MODE_BRACKET)} style={{ textAlign: "left" }}>
            <span className="feature-icon">🏆</span>
            <h3 style={{ color: "#fdd835" }}>Free Bracket</h3>
            <p>Load generations and bracket-pick your way to a full ranked list — 1st to last.</p>
            <p style={{ fontSize: "0.78rem", color: "#78C850", marginTop: 8 }}>Can convert result → Tier List</p>
          </div>

          <div
            className="feature-card"
            onClick={() => hasTierData ? startTierSort() : null}
            style={{ textAlign: "left", opacity: hasTierData ? 1 : 0.5, cursor: hasTierData ? "pointer" : "not-allowed" }}
          >
            <span className="feature-icon">📋→🏆</span>
            <h3 style={{ color: "#78C850" }}>Sort My Tier List</h3>
            <p>
              Break ties within each tier using bracket picking to get a precise ranking
              from #1 to #{totalRankedInTiers || "???"}.
            </p>
            {!hasTierData ? (
              <p style={{ fontSize: "0.78rem", color: "#e53935", marginTop: 8 }}>Build a Tier List first to unlock.</p>
            ) : (
              <p style={{ fontSize: "0.78rem", color: "#78C850", marginTop: 8 }}>
                {totalRankedInTiers} ranked Pokémon across {TIERS.filter(t => (tierState?.[t.id]||[]).length > 0).length} tiers ready
              </p>
            )}
          </div>
        </div>
      </Container>
    );
  }

  // ─── Standalone bracket: gen loader ──────────────────────────────────────

  if (mode === MODE_BRACKET && !ps) {
    return (
      <Container fluid className="py-3" style={{ maxWidth: 900 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <Button variant="link" onClick={resetAll} style={{ color: "#9fa8da", padding: 0 }}>← Back</Button>
          <h2 style={{ fontSize: "2.2rem", margin: 0 }}>Free Bracket</h2>
        </div>
        <div style={{
          background: "rgba(22,33,62,0.6)", border: "1px solid rgba(15,52,96,0.8)",
          borderRadius: 14, padding: 20, marginBottom: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <DropdownButton title={loadingPokemon ? "Loading..." : "Add Generation"}
              variant="outline-warning" size="sm" disabled={loadingPokemon}>
              {GENERATIONS.map((gen, idx) => (
                <Dropdown.Item key={idx} onClick={() => loadGeneration(idx)} disabled={loadedGenIdxs.includes(idx)}>
                  {gen.label} — {gen.name} ({gen.limit}){loadedGenIdxs.includes(idx) && " ✓"}
                </Dropdown.Item>
              ))}
            </DropdownButton>
            {poolIds.length > 0 && (
              <span style={{ color: "#9fa8da", fontSize: "0.85rem" }}>{poolIds.length} Pokémon loaded</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {loadedGenIdxs.map(idx => (
              <span key={idx} style={{
                background: GENERATIONS[idx].color + "33", border: `1px solid ${GENERATIONS[idx].color}`,
                color: "white", borderRadius: 20, padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700,
              }}>
                {GENERATIONS[idx].label}
              </span>
            ))}
          </div>
          {loadingPokemon && <LoadingSpinner message="Fetching Pokémon data..." />}
          {poolIds.length >= 2 && !loadingPokemon && (
            <Button className="btn-poke-primary" onClick={() => { setPickerState(freshPickerState(poolIds)); setConverted(false); }}
              style={{ padding: "10px 28px", fontSize: "1rem" }}>
              🏆 Start Bracket ({poolIds.length} Pokémon)
            </Button>
          )}
          {poolIds.length < 2 && !loadingPokemon && (
            <div style={{ color: "#9fa8da", fontSize: "0.85rem" }}>Load at least one generation to begin.</div>
          )}
        </div>
      </Container>
    );
  }

  // ─── Tier-sort: full ranking done ─────────────────────────────────────────

  if (mode === MODE_TIER_SORT && fullRanking.length > 0) {
    return (
      <Container fluid className="py-3" style={{ maxWidth: 1100 }}>
        <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontFamily: "Bangers, cursive", fontSize: "3rem", color: "#fdd835" }}>
            Full Ranking Complete!
          </h2>
          <p style={{ color: "#9fa8da", marginBottom: 20 }}>
            All {fullRanking.length} Pokémon precisely ranked from #1 to #{fullRanking.length}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 8 }}>
            <Button className="btn-poke-primary" onClick={() => setShowConvertModal(true)} style={{ fontSize: "1rem" }}>
              📋 Re-distribute to Tier List
            </Button>
            <Button variant="outline-info" onClick={() => navigate("/stats", { state: { tab: "ranking" } })}>
              📊 View in Stats
            </Button>
            <Button className="btn-poke-secondary" onClick={resetAll}>↺ Start Over</Button>
          </div>
          {converted && (
            <div style={{
              display: "inline-block", marginTop: 8, padding: "8px 20px",
              background: "rgba(120,200,80,0.15)", border: "1px solid #78C850",
              borderRadius: 10, color: "#78C850", fontSize: "0.88rem", fontWeight: 700,
            }}>✓ Tier List updated!</div>
          )}
        </div>

        {TIERS.map(tier => {
          const ranked = tierRankedResults[tier.id];
          if (!ranked || ranked.length === 0) return null;
          return (
            <div key={tier.id} style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.4rem", color: tier.color, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                {tier.label} Tier
                <span style={{ fontSize: "0.8rem", color: "#9fa8da", fontFamily: "Nunito, sans-serif" }}>({ranked.length})</span>
              </div>
              <RankedList favorites={ranked} pokemonData={pokemonData} compact />
            </div>
          );
        })}

        <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered className="poke-modal">
          <Modal.Header closeButton closeVariant="white">
            <Modal.Title style={{ fontFamily: "Bangers, cursive", fontSize: "1.8rem" }}>Re-distribute to Tier List?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{ color: "#9fa8da" }}>Your full ranking will be re-distributed across tiers by percentile, with exact ordering preserved within each tier.</p>
            <p style={{ color: "#e53935", fontSize: "0.82rem" }}>⚠️ This will overwrite your current Tier List.</p>
          </Modal.Body>
          <Modal.Footer style={{ borderColor: "rgba(15,52,96,0.8)" }}>
            <Button variant="outline-secondary" onClick={() => setShowConvertModal(false)}>Cancel</Button>
            <Button className="btn-poke-primary" onClick={handleConvertRankingToTiers}>Convert</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }

  // ─── Standalone bracket: done ─────────────────────────────────────────────

  if (mode === MODE_BRACKET && ps?.done) {
    return (
      <Container fluid className="py-3" style={{ maxWidth: 1100 }}>
        <div style={{ textAlign: "center", padding: "20px 0 30px" }}>
          <div style={{ fontSize: "3rem", marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontFamily: "Bangers, cursive", fontSize: "3rem", color: "#fdd835" }}>Complete!</h2>
          <p style={{ color: "#9fa8da", marginBottom: 20 }}>You've ranked all {ps.favorites.length} Pokémon!</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Button className="btn-poke-primary" onClick={() => setShowConvertModal(true)} style={{ fontSize: "1rem" }}>
              📊 Convert to Tier List
            </Button>
            <Button className="btn-poke-secondary" onClick={resetAll}>↺ Start Over</Button>
          </div>
          {converted && (
            <div style={{
              marginTop: 12, display: "inline-block", padding: "8px 20px",
              background: "rgba(120,200,80,0.15)", border: "1px solid #78C850",
              borderRadius: 10, color: "#78C850", fontSize: "0.88rem", fontWeight: 700,
            }}>✓ Tier List updated!</div>
          )}
        </div>
        <RankedList favorites={ps.favorites} pokemonData={pokemonData} />

        <Modal show={showConvertModal} onHide={() => setShowConvertModal(false)} centered className="poke-modal">
          <Modal.Header closeButton closeVariant="white">
            <Modal.Title style={{ fontFamily: "Bangers, cursive", fontSize: "1.8rem" }}>Convert to Tier List?</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{ color: "#9fa8da" }}>Your ranked results will be distributed across tiers by percentile.</p>
            <p style={{ color: "#e53935", fontSize: "0.82rem" }}>⚠️ This will overwrite your current Tier List.</p>
          </Modal.Body>
          <Modal.Footer style={{ borderColor: "rgba(15,52,96,0.8)" }}>
            <Button variant="outline-secondary" onClick={() => setShowConvertModal(false)}>Cancel</Button>
            <Button className="btn-poke-primary" onClick={handleConvertBracketToTiers}>Convert</Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }

  // ─── Active picker (both modes) ───────────────────────────────────────────

  if (!ps) return <LoadingSpinner message="Setting up bracket..." />;

  const isTierSort = mode === MODE_TIER_SORT;
  const progress = isTierSort ? tierSortProgress : standaloneProgress;

  return (
    <Container fluid className="py-3" style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
        <Button variant="link" onClick={resetAll} style={{ color: "#9fa8da", padding: 0 }}>← Back</Button>
        <h2 style={{ fontSize: "2rem", margin: 0 }}>
          {isTierSort ? (
            <span>
              Sorting{" "}
              <span style={{ color: currentTierDef?.color, fontFamily: "Bangers, cursive" }}>
                {currentTierId} Tier
              </span>
              <span style={{ fontSize: "1rem", color: "#9fa8da", marginLeft: 8 }}>
                ({completedTiers.length + 1} of {tierQueue.length})
              </span>
            </span>
          ) : "Free Bracket"}
        </h2>
        <div className="progress-pill">
          {isTierSort ? (
            <span style={{ color: "#fdd835" }}>{completedTiers.length} of {tierQueue.length} tiers sorted</span>
          ) : (
            <>
              <span style={{ color: "#78C850" }}>#{ps.favorites.length + 1} place</span>
              <span style={{ color: "#9fa8da" }}>·</span>
              <span>{totalInRound} in round</span>
              <span style={{ color: "#9fa8da" }}>·</span>
              <span style={{ color: "#fdd835" }}>{standaloneProgress}% done</span>
            </>
          )}
        </div>
      </div>

      {isTierSort && (
        <TierProgressRow tierState={tierState} currentTierId={currentTierId} completedTiers={completedTiers} />
      )}

      {/* Progress bar */}
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, marginBottom: 16, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${progress}%`,
          background: isTierSort
            ? `linear-gradient(90deg, ${currentTierDef?.color || "#e040fb"}, #e040fb)`
            : "linear-gradient(90deg, #e53935, #e040fb)",
          borderRadius: 3, transition: "width 0.4s",
        }} />
      </div>

      {/* Completed tiers so far (tier-sort) */}
      {isTierSort && completedTiers.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: "1rem", color: "#9fa8da", marginBottom: 6 }}>
            Completed
          </div>
          {completedTiers.map(tierId => {
            const ranked = tierRankedResults[tierId];
            if (!ranked) return null;
            const td = TIERS.find(t => t.id === tierId);
            return (
              <div key={tierId} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "Bangers, cursive", fontSize: "1.2rem", color: td?.color, minWidth: 24 }}>{tierId}</span>
                <RankedList favorites={ranked} pokemonData={pokemonData} compact />
              </div>
            );
          })}
        </div>
      )}

      {/* Favorites so far (standalone) */}
      {!isTierSort && ps.favorites.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.2rem", color: "#9fa8da", marginBottom: 8 }}>
            Ranked so far ({ps.favorites.length})
          </div>
          <RankedList favorites={ps.favorites} pokemonData={pokemonData} />
        </div>
      )}

      {/* Batch */}
      <div style={{
        background: "rgba(22,33,62,0.5)",
        border: `1px solid ${isTierSort ? (currentTierDef?.color + "44") : "rgba(15,52,96,0.8)"}`,
        borderRadius: 16, padding: 20, marginBottom: 16,
      }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "Bangers, cursive", fontSize: "1.5rem" }}>
            {isTierSort
              ? `Which is your favorite? (${currentTierId} tier · ${currentTierTotal} Pokémon)`
              : "Pick your favorites!"}
          </span>
          <span style={{ color: "#9fa8da", fontSize: "0.85rem" }}>Select one or more, then click Pick</span>
          {selected.size > 0 && <Badge bg="danger" pill>{selected.size} selected</Badge>}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginBottom: 20 }}>
          {ps.evaluating.map(id => {
            const p = pokemonData[id];
            return (
              <BracketCard
                key={id} id={id} name={p?.name} types={p?.types}
                selected={selected.has(id)} onClick={toggleSelect}
                size={ps.evaluating.length <= 4 ? 120 : ps.evaluating.length <= 8 ? 88 : 72}
              />
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Button className="btn-poke-primary" onClick={handlePick}
            disabled={selected.size === 0} style={{ minWidth: 120, fontSize: "1rem" }}>
            ✓ Pick ({selected.size})
          </Button>
          <Button className="btn-poke-secondary" onClick={handlePass} style={{ minWidth: 120, fontSize: "1rem" }}>
            ↷ Pass All
          </Button>
          <Button className="btn-poke-secondary" onClick={handleUndo}
            disabled={ps.history.length === 0} style={{ minWidth: 100 }}>
            ↩ Undo
          </Button>
          <Button variant="outline-danger" size="sm" onClick={resetAll} style={{ marginLeft: 8 }}>
            Reset
          </Button>
        </div>
      </div>

      <div style={{ textAlign: "center", color: "#9fa8da", fontSize: "0.78rem" }}>
        {isTierSort
          ? `${ps.favorites.length} of ${currentTierTotal} sorted in ${currentTierId} tier · ${totalInRound} remaining in round`
          : `${totalInRound} remaining in round · ${ps.survived.length} survived so far`}
      </div>
    </Container>
  );
}
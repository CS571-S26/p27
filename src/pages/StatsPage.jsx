import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Tab, Tabs } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { useApp } from "../hooks/AppContext";
import { fetchPokemon, TYPE_COLORS, GENERATIONS, TIERS, spriteUrl } from "../utils/pokeapi";
import LoadingSpinner from "../components/LoadingSpinner";

// Simple horizontal bar chart
function BarChart({ data, colorFn, max, label }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const maxVal = max || Math.max(...sorted.map(d => d.value), 1);
  return (
    <div>
      {sorted.map(d => (
        <div key={d.key} className="chart-bar-row">
          <div className="chart-bar-label" style={{ textTransform: "capitalize" }}>
            {d.key.replace(/-/g, " ")}
          </div>
          <div className="chart-bar-outer">
            <div
              className="chart-bar-fill"
              style={{
                width: `${(d.value / maxVal) * 100}%`,
                background: colorFn ? colorFn(d.key) : "linear-gradient(90deg, #e53935, #ef6c00)",
                minWidth: d.value > 0 ? 20 : 0,
              }}
            >
              {d.value > 0 ? d.value : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Stat bar for individual pokemon stats
function StatBar({ label, value, max = 255 }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct > 66 ? "#78C850" : pct > 33 ? "#F8D030" : "#F08030";
  return (
    <div className="stat-bar-wrap">
      <div className="stat-bar-label">{label}</div>
      <div className="stat-bar-outer">
        <div className="stat-bar-inner" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="stat-bar-val">{value}</div>
    </div>
  );
}

function InsightCard({ label, value, sub, color = "#e040fb" }) {
  return (
    <div className="stats-insight">
      <div className="insight-label" style={{ color }}>{label}</div>
      <div className="insight-value" style={{ textTransform: "capitalize" }}>{value || "—"}</div>
      {sub && <div className="insight-sub">{sub}</div>}
    </div>
  );
}


// ─── Compact favorites grid for Stats page ────────────────────────────────────

function FavoritesGrid({ favIds, pokemonDetails }) {
  if (favIds.length === 0) return null;

  // Group by generation
  const byGen = GENERATIONS.map(gen => ({
    gen,
    ids: favIds.filter(id => id > gen.offset && id <= gen.offset + gen.limit),
  })).filter(g => g.ids.length > 0);

  return (
    <div className="stat-card" style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: "1.4rem", marginBottom: 4 }}>
        Your Favorites
        <span style={{ fontSize: "0.85rem", fontFamily: "Nunito, sans-serif", color: "#9fa8da", marginLeft: 10, fontWeight: 400 }}>
          {favIds.length} Pokémon
        </span>
      </h3>
      <p style={{ color: "#9fa8da", fontSize: "0.8rem", marginBottom: 16 }}>
        All your favorited Pokémon, grouped by generation.
      </p>
      {byGen.map(({ gen, ids }) => (
        <div key={gen.label} style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.08em", color: gen.color,
            marginBottom: 8, paddingBottom: 4,
            borderBottom: `1px solid ${gen.color}44`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>{gen.label} — {gen.name}</span>
            <span style={{ color: "rgba(159,168,218,0.5)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
              ({ids.length})
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ids.map(id => {
              const p = pokemonDetails[id];
              return (
                <div key={id} style={{ textAlign: "center", width: 56 }}>
                  <img
                    src={spriteUrl(id)}
                    alt={p?.name || `#${id}`}
                    width={52} height={52}
                    loading="lazy"
                    style={{ imageRendering: "pixelated", display: "block", margin: "0 auto" }}
                  />
                  <div style={{
                    fontSize: "0.5rem", color: "#9fa8da", textTransform: "capitalize",
                    lineHeight: 1.2, marginTop: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p?.name?.replace(/-/g, " ") || `#${id}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { tierState, favorites } = useApp();
  const location = useLocation();
  const [pokemonDetails, setPokemonDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(location.state?.tab || "tier");

  // Sync tab when navigated to with state (e.g. from Favorites button)
  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  // Gather all ranked pokemon ids
  const rankedIds = useMemo(() => {
    if (!tierState) return [];
    return Object.entries(tierState)
      .filter(([k]) => k !== "unranked")
      .flatMap(([, v]) => v);
  }, [tierState]);

  const favIds = useMemo(() => Array.from(favorites || []), [favorites]);

  // Which IDs to analyze based on active tab
  const activeIds = activeTab === "tier" ? rankedIds : favIds;

  // Fetch details for any IDs we don't have
  useEffect(() => {
    const missing = activeIds.filter(id => !pokemonDetails[id]);
    if (missing.length === 0) return;
    setLoading(true);
    const batchSize = 30;
    async function loadAll() {
      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(id => fetchPokemon(id)));
        const details = {};
        results.forEach((r, j) => {
          details[batch[j]] = {
            id: batch[j],
            name: r.name,
            types: r.types.map(t => t.type.name),
            stats: Object.fromEntries(r.stats.map(s => [s.stat.name, s.base_stat])),
            height: r.height,
            weight: r.weight,
            base_experience: r.base_experience || 0,
            egg_groups: r.egg_groups?.map(e => e.name) || [],
          };
        });
        setPokemonDetails(prev => ({ ...prev, ...details }));
      }
      setLoading(false);
    }
    loadAll();
  }, [activeIds]);

  // Compute stats from activeIds
  const stats = useMemo(() => {
    const known = activeIds.map(id => pokemonDetails[id]).filter(Boolean);
    if (known.length === 0) return null;

    // Type counts
    const typeCounts = {};
    known.forEach(p => p.types.forEach(t => { typeCounts[t] = (typeCounts[t] || 0) + 1; }));

    // Generation counts
    const genCounts = {};
    GENERATIONS.forEach(g => { genCounts[g.label] = 0; });
    known.forEach(p => {
      const g = GENERATIONS.find(g => p.id > g.offset && p.id <= g.offset + g.limit);
      if (g) genCounts[g.label] = (genCounts[g.label] || 0) + 1;
    });

    // Weight brackets (in hectograms / 10 = kg)
    const weightBrackets = { "Feather (<10kg)": 0, "Light (10–50kg)": 0, "Medium (50–100kg)": 0, "Heavy (100–300kg)": 0, "Giant (300kg+)": 0 };
    known.forEach(p => {
      const kg = p.weight / 10;
      if (kg < 10) weightBrackets["Feather (<10kg)"]++;
      else if (kg < 50) weightBrackets["Light (10–50kg)"]++;
      else if (kg < 100) weightBrackets["Medium (50–100kg)"]++;
      else if (kg < 300) weightBrackets["Heavy (100–300kg)"]++;
      else weightBrackets["Giant (300kg+)"]++;
    });

    // Height brackets (in decimeters / 10 = m)
    const heightBrackets = { "Tiny (<0.5m)": 0, "Small (0.5–1m)": 0, "Medium (1–2m)": 0, "Tall (2–4m)": 0, "Huge (4m+)": 0 };
    known.forEach(p => {
      const m = p.height / 10;
      if (m < 0.5) heightBrackets["Tiny (<0.5m)"]++;
      else if (m < 1) heightBrackets["Small (0.5–1m)"]++;
      else if (m < 2) heightBrackets["Medium (1–2m)"]++;
      else if (m < 4) heightBrackets["Tall (2–4m)"]++;
      else heightBrackets["Huge (4m+)"]++;
    });

    // Egg groups
    const eggCounts = {};
    known.forEach(p => p.egg_groups.forEach(e => { eggCounts[e] = (eggCounts[e] || 0) + 1; }));

    // Average stats
    const statKeys = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
    const avgStats = {};
    statKeys.forEach(k => {
      const vals = known.map(p => p.stats[k] || 0).filter(v => v > 0);
      avgStats[k] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    });

    // Tier distribution
    let tierDist = {};
    if (tierState) {
      TIERS.forEach(t => {
        const intersection = (tierState[t.id] || []).filter(id => activeIds.includes(id));
        tierDist[t.id] = intersection.length;
      });
    }

    // Favorite type
    const favType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favGen = Object.entries(genCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const favWeight = Object.entries(weightBrackets).sort((a, b) => b[1] - a[1])[0]?.[0];
    const avgBST = Math.round(known.reduce((s, p) => s + Object.values(p.stats).reduce((a, b) => a + b, 0), 0) / known.length);

    return {
      count: known.length,
      typeCounts, genCounts, weightBrackets, heightBrackets, eggCounts,
      avgStats, tierDist, favType, favGen, favWeight, avgBST,
    };
  }, [activeIds, pokemonDetails, tierState]);

  const hasData = activeIds.length > 0;
  const hasStats = stats && stats.count > 0;

  return (
    <Container fluid className="py-3">
      <h2 style={{ fontSize: "2.2rem", marginBottom: 4 }}>My Stats</h2>
      <p style={{ color: "#9fa8da", fontSize: "0.88rem", marginBottom: 16 }}>
        What do your rankings say about you? Discover your mathematically favorite type, generation, and more.
      </p>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="tier" title={`Tier List (${rankedIds.length})`} />
        <Tab eventKey="favorites" title={`Favorites (${favIds.length})`} />
      </Tabs>

      {!hasData && (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9fa8da" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>📊</div>
          <div style={{ fontFamily: "Bangers, cursive", fontSize: "1.8rem", color: "white", marginBottom: 8 }}>
            No Data Yet
          </div>
          <div style={{ fontSize: "0.9rem" }}>
            {activeTab === "tier"
              ? "Head to the Tier List and rank some Pokémon first!"
              : "Head to the Favorites Picker and select some Pokémon first!"}
          </div>
        </div>
      )}

      {loading && hasData && <LoadingSpinner message="Crunching the numbers..." />}

      {hasStats && !loading && (
        <>
          {/* Insight cards */}
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <InsightCard
                label="Favorite Type"
                value={stats.favType}
                sub={`${stats.typeCounts[stats.favType]} of your picks`}
                color={TYPE_COLORS[stats.favType] || "#e040fb"}
              />
            </Col>
            <Col xs={6} md={3}>
              <InsightCard label="Top Generation" value={stats.favGen} sub={`${stats.genCounts[stats.favGen]} picks`} color="#fdd835" />
            </Col>
            <Col xs={6} md={3}>
              <InsightCard label="Preferred Weight" value={stats.favWeight} sub="Most common bracket" color="#78C850" />
            </Col>
            <Col xs={6} md={3}>
              <InsightCard label="Avg Base Stat Total" value={stats.avgBST} sub={`Across ${stats.count} Pokémon`} color="#6890F0" />
            </Col>
          </Row>

          <Row className="g-3">
            {/* Type distribution */}
            <Col xs={12} md={6}>
              <div className="stat-card">
                <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Type Distribution</h3>
                <BarChart
                  data={Object.entries(stats.typeCounts).map(([key, value]) => ({ key, value }))}
                  colorFn={k => TYPE_COLORS[k] || "#888"}
                />
              </div>
            </Col>

            {/* Generation distribution */}
            <Col xs={12} md={6}>
              <div className="stat-card">
                <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Generation Distribution</h3>
                <BarChart
                  data={Object.entries(stats.genCounts).filter(([, v]) => v > 0).map(([key, value]) => ({ key, value }))}
                  colorFn={k => {
                    const g = GENERATIONS.find(g => g.label === k);
                    return g?.color || "#888";
                  }}
                />
              </div>
            </Col>

            {/* Average stats */}
            <Col xs={12} md={6}>
              <div className="stat-card">
                <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Average Base Stats</h3>
                {Object.entries(stats.avgStats).map(([k, v]) => (
                  <StatBar key={k} label={k.replace("special-", "sp.")} value={v} />
                ))}
              </div>
            </Col>

            {/* Weight & height */}
            <Col xs={12} md={6}>
              <div className="stat-card">
                <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Weight Preferences</h3>
                <BarChart
                  data={Object.entries(stats.weightBrackets).map(([key, value]) => ({ key, value }))}
                  colorFn={() => "linear-gradient(90deg, #1565c0, #6890F0)"}
                />
                <h3 style={{ fontSize: "1.4rem", margin: "20px 0 16px" }}>Height Preferences</h3>
                <BarChart
                  data={Object.entries(stats.heightBrackets).map(([key, value]) => ({ key, value }))}
                  colorFn={() => "linear-gradient(90deg, #2e7d32, #78C850)"}
                />
              </div>
            </Col>

            {/* Egg groups */}
            <Col xs={12} md={6}>
              <div className="stat-card">
                <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Egg Groups</h3>
                <BarChart
                  data={Object.entries(stats.eggCounts).map(([key, value]) => ({ key, value }))}
                  colorFn={() => "linear-gradient(90deg, #6a1b9a, #e040fb)"}
                />
              </div>
            </Col>

            {/* Tier distribution (only for tier tab) */}
            {activeTab === "tier" && (
              <Col xs={12} md={6}>
                <div className="stat-card">
                  <h3 style={{ fontSize: "1.4rem", marginBottom: 16 }}>Tier Distribution</h3>
                  <BarChart
                    data={Object.entries(stats.tierDist).map(([key, value]) => ({ key, value }))}
                    colorFn={k => {
                      const t = TIERS.find(t => t.id === k);
                      return t?.color || "#888";
                    }}
                  />
                </div>
              </Col>
            )}
          </Row>

          {/* Favorites list — only on favorites tab */}
          {activeTab === "favorites" && (
            <FavoritesGrid favIds={favIds} pokemonDetails={pokemonDetails} />
          )}
        </>
      )}
    </Container>
  );
}
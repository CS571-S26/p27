import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";

const features = [
  {
    icon: "🏆",
    title: "Tier List",
    desc: "Drag & drop all 900+ Pokémon into S–F tiers. Load by generation at your own pace.",
    path: "/tierlist",
    color: "#FF7F7F",
  },
  {
    icon: "❤️",
    title: "Favorites Picker",
    desc: "Tap to select your favorite Pokémon from each generation. Simple, fast, satisfying.",
    path: "/favorites",
    color: "#EE99AC",
  },
  {
    icon: "📊",
    title: "My Stats",
    desc: "Discover your favorite type, generation, weight range, egg group, and more — mathematically.",
    path: "/stats",
    color: "#78C850",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, totalRanked, favorites } = useApp();

  return (
    <div style={{ minHeight: "calc(100vh - 70px)" }}>
      <div className="home-hero">
        <h1>PokéStats<br />Tier</h1>
        <p className="subtitle">
          Rank 'em. Pick 'em. Discover what your choices say about you mathematically.
        </p>
        {currentUser && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(253,216,53,0.1)", border: "1px solid rgba(253,216,53,0.3)",
            borderRadius: 12, padding: "8px 16px", marginBottom: 24,
            fontSize: "0.88rem"
          }}>
            <span>👤</span>
            <span style={{ color: "#fdd835", fontWeight: 800 }}>{currentUser}</span>
            <span style={{ color: "#9fa8da" }}>·</span>
            <span style={{ color: "#9fa8da" }}>{totalRanked} ranked · {favorites?.size || 0} favorites</span>
          </div>
        )}
      </div>

      <Container className="pb-5">
        <Row className="g-4 justify-content-center">
          {features.map(f => (
            <Col key={f.path} xs={12} md={4}>
              <div
                className="feature-card"
                onClick={() => navigate(f.path)}
                style={{ borderColor: "rgba(255,255,255,0.06)" }}
              >
                <span className="feature-icon">{f.icon}</span>
                <h3 style={{ color: f.color }}>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </Col>
          ))}
        </Row>

        <div style={{
          marginTop: 60,
          padding: "28px",
          background: "rgba(22,33,62,0.6)",
          border: "1px solid rgba(15,52,96,0.8)",
          borderRadius: 16,
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 8 }}>How It Works</h2>
          <p style={{ color: "#9fa8da", maxWidth: 560, margin: "0 auto 20px" }}>
            Load Pokémon one generation at a time to avoid overwhelm. Your progress saves automatically — or create an account to keep it safe.
          </p>
          <Row className="g-3 justify-content-center text-start" style={{ maxWidth: 720, margin: "0 auto" }}>
            {[
              ["1️⃣", "Pick a mode", "Tier list for detailed ranking, or Favorites Picker for quick selection."],
              ["2️⃣", "Load gens", "Add generations one at a time. Drag cards into tiers or tap to select."],
              ["3️⃣", "See your stats", "Head to My Stats to see your mathematically favorite type, weight, gen, and more."],
            ].map(([num, title, desc]) => (
              <Col key={title} xs={12} md={4}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{num}</span>
                  <div>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: "0.82rem", color: "#9fa8da" }}>{desc}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
}

import React, { useState } from "react";
import { Navbar, Nav, Container, Badge } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../hooks/AppContext";
import AccountModal from "./AccountModal";

export default function AppNavBar() {
  const { currentUser, totalRanked, favorites } = useApp();
  const [showAccount, setShowAccount] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Navbar expand="md" className="poke-navbar px-2">
        <Container fluid>
          <Navbar.Brand onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            PokéStats Tier
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="main-nav"
            style={{
              borderColor: "rgba(255,255,255,0.4)",
              background: "rgba(0,0,0,0.2)",
            }}
          />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto gap-1">
              <Nav.Link as={NavLink} to="/" end>Home</Nav.Link>
              <Nav.Link as={NavLink} to="/tierlist">
                Tier List{" "}
                {totalRanked > 0 && (
                  <Badge bg="warning" text="dark" pill style={{ fontSize: "0.62rem" }}>
                    {totalRanked}
                  </Badge>
                )}
              </Nav.Link>
              <Nav.Link as={NavLink} to="/favorites">
                Favorites{" "}
                {(favorites?.size || 0) > 0 && (
                  <Badge bg="danger" pill style={{ fontSize: "0.62rem" }}>
                    {favorites.size}
                  </Badge>
                )}
              </Nav.Link>
              <Nav.Link as={NavLink} to="/bracket">Bracket Picker</Nav.Link>
              <Nav.Link as={NavLink} to="/stats">My Stats</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link
                onClick={() => setShowAccount(true)}
                style={{ whiteSpace: "nowrap" }}
              >
                {currentUser ? (
                  <span>
                    <span style={{ fontSize: "0.9rem" }}>👤</span>{" "}
                    <span style={{ color: "#F5C400", fontWeight: 800 }}>{currentUser}</span>
                  </span>
                ) : (
                  <span>
                    <span style={{ fontSize: "0.9rem" }}>🔓</span> Sign In
                  </span>
                )}
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <AccountModal show={showAccount} onHide={() => setShowAccount(false)} />
    </>
  );
}
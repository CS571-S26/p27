import React, { useState } from "react";
import { Modal, Form, Button, Alert, Tab, Tabs } from "react-bootstrap";
import { useApp } from "../hooks/AppContext";
import { getAccounts, saveAccount } from "../utils/pokeapi";

export default function AccountModal({ show, onHide }) {
  const { currentUser, login, logout } = useApp();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function clearForm() {
    setUsername(""); setPassword(""); setError(""); setSuccess("");
  }

  function handleLogin() {
    if (!username.trim()) return setError("Please enter a username.");
    const accounts = getAccounts();
    if (!accounts[username]) return setError("No account found. Register first!");
    if (accounts[username].password !== password) return setError("Incorrect password.");
    login(username.trim());
    setSuccess(`Welcome back, ${username}!`);
    setTimeout(() => { onHide(); clearForm(); }, 1000);
  }

  function handleRegister() {
    if (!username.trim() || username.length < 3) return setError("Username must be at least 3 characters.");
    if (!password || password.length < 4) return setError("Password must be at least 4 characters.");
    const accounts = getAccounts();
    if (accounts[username]) return setError("Username already taken!");
    saveAccount(username.trim(), { password, createdAt: Date.now() });
    login(username.trim());
    setSuccess(`Account created! Welcome, ${username}!`);
    setTimeout(() => { onHide(); clearForm(); }, 1000);
  }

  function handleLogout() {
    logout();
    onHide();
    clearForm();
  }

  return (
    <Modal show={show} onHide={() => { onHide(); clearForm(); }} centered className="poke-modal">
      <Modal.Header closeButton closeVariant="white">
        <Modal.Title style={{ fontFamily: "Bangers, cursive", fontSize: "1.8rem", letterSpacing: "0.05em" }}>
          {currentUser ? "Your Account" : "Sign In / Register"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentUser ? (
          <div className="text-center py-3">
            <div style={{ fontSize: "4rem" }}>👤</div>
            <div style={{ fontFamily: "Bangers, cursive", fontSize: "2rem", color: "#fdd835" }}>
              {currentUser}
            </div>
            <div style={{ color: "#9fa8da", fontSize: "0.85rem", marginBottom: 20 }}>
              Your progress is being saved to your account.
            </div>
            <Button className="btn-poke-primary w-100" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger" style={{ fontSize: "0.85rem" }}>{error}</Alert>}
            {success && <Alert variant="success" style={{ fontSize: "0.85rem" }}>{success}</Alert>}
            <Tabs defaultActiveKey="login" onSelect={clearForm} className="mb-3">
              <Tab eventKey="login" title="Sign In">
                <Form onSubmit={e => { e.preventDefault(); handleLogin(); }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9fa8da" }}>Username</Form.Label>
                    <Form.Control
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="TrainerRed"
                      autoComplete="username"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9fa8da" }}>Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                  </Form.Group>
                  <Button type="submit" className="btn-poke-primary w-100">Sign In</Button>
                </Form>
              </Tab>
              <Tab eventKey="register" title="Register">
                <Form onSubmit={e => { e.preventDefault(); handleRegister(); }}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9fa8da" }}>Choose a Username</Form.Label>
                    <Form.Control
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="TrainerBlue"
                      autoComplete="username"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ fontSize: "0.85rem", fontWeight: 700, color: "#9fa8da" }}>Choose a Password</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </Form.Group>
                  <Button type="submit" className="btn-poke-primary w-100">Create Account</Button>
                </Form>
              </Tab>
            </Tabs>
            <div style={{ fontSize: "0.75rem", color: "#9fa8da", textAlign: "center", marginTop: 8 }}>
              Progress is saved to your browser. Account lets you switch devices via export.
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}

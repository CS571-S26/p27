import React, { createContext, useContext, useState, useEffect } from "react";
import { loadProgress, saveProgress, loadAccount, saveAccount, TIERS, ALTERNATE_FORMS } from "../utils/pokeapi";

const AppContext = createContext(null);

// Generate a stable unique ID for a new tier
function makeTierId() {
  return "tier_" + Math.random().toString(36).slice(2, 8);
}

// A palette of colors to cycle through for new tiers
const TIER_COLOR_PALETTE = [
  "#FF7F7F", "#FFBF7F", "#FFFF7F", "#BFFF7F", "#7FFF7F",
  "#7FFFBF", "#7FFFFF", "#7FBFFF", "#7F7FFF", "#BF7FFF",
  "#FF7FFF", "#FF7FBF", "#FFB347", "#87CEEB", "#98FB98",
  "#DDA0DD", "#F0E68C", "#E0FFFF", "#FFDAB9", "#C0C0C0",
];

function colorForIndex(idx) {
  return TIER_COLOR_PALETTE[idx % TIER_COLOR_PALETTE.length];
}

function bgFromColor(color) {
  // Convert hex to rgba with low opacity for background
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.12)`;
}

// Build default tier config from the static TIERS list
function defaultTierConfig() {
  return TIERS.map(t => ({ ...t }));
}

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() =>
    localStorage.getItem("pokestats_current_user") || null
  );

  // Dynamic tier configuration — array of { id, label, color, bg }
  const [tierConfig, setTierConfig] = useState(null);

  // Tier state: { [tierId]: [pokemonId,...], unranked: [...] }
  const [tierState, setTierState] = useState(null);

  // Favorites: Set of pokemon ids
  const [favorites, setFavorites] = useState(null);

  // Form settings: which alternate form types to include in rankings
  // { mega: bool, gmax: bool, regional: bool, other: bool }
  const DEFAULT_FORM_SETTINGS = { mega: false, gmax: false, regional: false, other: false };
  const [formSettings, setFormSettings] = useState(null);

  function getUserKey(key) {
    return currentUser ? `user_${currentUser}_${key}` : key;
  }

  // Load saved state on mount / user change
  useEffect(() => {
    const savedTierConfig = loadProgress(getUserKey("tierConfig"));
    const config = savedTierConfig || defaultTierConfig();
    setTierConfig(config);

    const savedTier = loadProgress(getUserKey("tiers"));
    // Build fresh state with correct keys from config
    const freshState = { unranked: [] };
    config.forEach(t => { freshState[t.id] = []; });
    setTierState(savedTier ? { ...freshState, ...savedTier } : freshState);

    const savedFavs = loadProgress(getUserKey("favorites"));
    setFavorites(new Set(savedFavs || []));

    const savedFormSettings = loadProgress(getUserKey("formSettings"));
    setFormSettings(savedFormSettings || { mega: false, gmax: false, regional: false, other: false });
  }, [currentUser]);

  // Save tierConfig whenever it changes
  useEffect(() => {
    if (tierConfig !== null) {
      saveProgress(getUserKey("tierConfig"), tierConfig);
      if (currentUser) saveAccount(currentUser, { tierConfig });
    }
  }, [tierConfig, currentUser]);

  // Save tierState whenever it changes
  useEffect(() => {
    if (tierState !== null) {
      saveProgress(getUserKey("tiers"), tierState);
      if (currentUser) saveAccount(currentUser, { tiers: tierState });
    }
  }, [tierState, currentUser]);

  // Save formSettings whenever it changes
  useEffect(() => {
    if (formSettings !== null) {
      saveProgress(getUserKey("formSettings"), formSettings);
      if (currentUser) saveAccount(currentUser, { formSettings });
    }
  }, [formSettings, currentUser]);

  // Save favorites whenever they change
  useEffect(() => {
    if (favorites !== null) {
      saveProgress(getUserKey("favorites"), Array.from(favorites));
      if (currentUser) saveAccount(currentUser, { favorites: Array.from(favorites) });
    }
  }, [favorites, currentUser]);

  // ── Bracket session persistence ──────────────────────────────────────────
  // Saves the active bracket picker session so page reloads don't lose progress.
  // bracketSession is an opaque object managed entirely by BracketPickerPage.

  const [bracketSession, _setBracketSession] = useState(() => {
    try {
      const raw = localStorage.getItem(`pokestats_bracket_session`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  function saveBracketSession(session) {
    try {
      if (session === null) {
        localStorage.removeItem(`pokestats_bracket_session`);
      } else {
        localStorage.setItem(`pokestats_bracket_session`, JSON.stringify(session));
      }
    } catch {}
    _setBracketSession(session);
  }

  function clearBracketSession() {
    saveBracketSession(null);
  }

  function login(username) {
    setCurrentUser(username);
    localStorage.setItem("pokestats_current_user", username);
    const acct = loadAccount(username);
    if (acct?.tierConfig) setTierConfig(acct.tierConfig);
    if (acct?.tiers) setTierState(acct.tiers);
    if (acct?.favorites) setFavorites(new Set(acct.favorites));
    if (acct?.formSettings) setFormSettings(acct.formSettings);
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("pokestats_current_user");
  }

  // ── Tier config mutations ──────────────────────────────────────────────────

  function renameTier(tierId, newLabel) {
    setTierConfig(prev => prev.map(t => t.id === tierId ? { ...t, label: newLabel } : t));
  }

  function recolorTier(tierId, newColor) {
    setTierConfig(prev => prev.map(t =>
      t.id === tierId ? { ...t, color: newColor, bg: bgFromColor(newColor) } : t
    ));
  }

  // Insert after afterTierId, or append if null. ID generated here so both state updates share it.
  function insertTierAfter(afterTierId = null) {
    const newId = makeTierId();
    setTierConfig(prev => {
      const color = colorForIndex(prev.length);
      const newTier = { id: newId, label: `Tier ${prev.length + 1}`, color, bg: bgFromColor(color) };
      if (!afterTierId) return [...prev, newTier];
      const insertIdx = prev.findIndex(t => t.id === afterTierId);
      if (insertIdx === -1) return [...prev, newTier];
      const next = [...prev];
      next.splice(insertIdx + 1, 0, newTier);
      return next;
    });
    setTierState(prev => prev ? { ...prev, [newId]: [] } : prev);
  }


  function removeTier(tierId) {
    setTierConfig(prev => {
      if (prev.length <= 2) return prev; // minimum 2 tiers
      return prev.filter(t => t.id !== tierId);
    });
    // Move all pokemon in removed tier to unranked
    setTierState(prev => {
      if (!prev) return prev;
      const { [tierId]: removed, ...rest } = prev;
      return {
        ...rest,
        unranked: [...(rest.unranked || []), ...(removed || [])],
      };
    });
  }

  function moveTier(tierId, direction) {
    setTierConfig(prev => {
      const idx = prev.findIndex(t => t.id === tierId);
      const delta = direction === "up" ? -1 : 1;
      const target = idx + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }
  // Convenience aliases so callers don't need to know the direction string
  const moveTierUp   = tierId => moveTier(tierId, "up");
  const moveTierDown = tierId => moveTier(tierId, "down");

  function resetTierConfig() {
    const fresh = defaultTierConfig();
    setTierConfig(fresh);
    // Rebuild tierState: keep unranked, move all ranked pokemon back to unranked
    setTierState(prev => {
      const allPokemon = prev
        ? Object.entries(prev).flatMap(([, v]) => v)
        : [];
      const freshState = { unranked: allPokemon };
      fresh.forEach(t => { freshState[t.id] = []; });
      return freshState;
    });
  }

  // ── Form settings ─────────────────────────────────────────────────────────

  // Toggle a form type on or off. When turning on, adds those forms to unranked.
  // When turning off, removes them from all tiers and unranked (with no confirmation
  // here — UI layer should confirm if any are ranked).
  function updateFormSetting(formType, enabled) {
    setFormSettings(prev => ({ ...prev, [formType]: enabled }));

    const affected = ALTERNATE_FORMS
      .filter(f => f.formType === formType)
      .map(f => f.name);

    if (enabled) {
      // Add to unranked pool (addToUnranked handles deduplication)
      setTierState(prev => {
        if (!prev) return prev;
        const allPlaced = new Set(Object.values(prev).flat());
        const newOnes = affected.filter(name => !allPlaced.has(name));
        return { ...prev, unranked: [...prev.unranked, ...newOnes] };
      });
    } else {
      // Remove from everywhere
      setTierState(prev => {
        if (!prev) return prev;
        const removeSet = new Set(affected);
        const next = {};
        for (const [key, ids] of Object.entries(prev)) {
          next[key] = ids.filter(id => !removeSet.has(id));
        }
        return next;
      });
      // Also remove from favorites
      setFavorites(prev => {
        const next = new Set(prev);
        affected.forEach(name => next.delete(name));
        return next;
      });
    }
  }

  // ── Pokemon mutations ──────────────────────────────────────────────────────

  function toggleFavorite(pokemonId) {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(pokemonId) ? next.delete(pokemonId) : next.add(pokemonId);
      return next;
    });
  }

  function movePokemon(pokemonId, fromTier, toTier) {
    setTierState(prev => {
      const next = { ...prev };
      if (fromTier) next[fromTier] = (next[fromTier] || []).filter(id => id !== pokemonId);
      if (!next[toTier]) next[toTier] = [];
      if (!next[toTier].includes(pokemonId)) next[toTier] = [...next[toTier], pokemonId];
      return next;
    });
  }

  function addToUnranked(pokemonIds) {
    setTierState(prev => {
      const allPlaced = new Set(
        Object.values(prev || {}).flat()
      );
      const newOnes = pokemonIds.filter(id => !allPlaced.has(id));
      return { ...prev, unranked: [...(prev?.unranked || []), ...newOnes] };
    });
  }

  function resetTiers() {
    const freshState = { unranked: [] };
    (tierConfig || defaultTierConfig()).forEach(t => { freshState[t.id] = []; });
    setTierState(freshState);
    setFavorites(new Set());
  }

  const totalRanked = tierState && tierConfig
    ? tierConfig.reduce((s, t) => s + (tierState[t.id]?.length || 0), 0)
    : 0;
  const totalUnranked = tierState?.unranked?.length || 0;

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      tierConfig, setTierConfig,
      renameTier, recolorTier, insertTierAfter, removeTier,
      moveTierUp, moveTierDown, resetTierConfig,
      tierState, setTierState, movePokemon, addToUnranked, resetTiers,
      favorites, setFavorites, toggleFavorite,
      totalRanked, totalUnranked,
      bracketSession, saveBracketSession, clearBracketSession,
      formSettings, updateFormSetting,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
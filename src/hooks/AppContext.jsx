import React, { createContext, useContext, useState, useEffect } from "react";
import { loadProgress, saveProgress, loadAccount, saveAccount } from "../utils/pokeapi";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem("pokestats_current_user") || null;
  });

  // Tier list state: { [tierId]: [pokemonId, ...], unranked: [pokemonId, ...] }
  const [tierState, setTierState] = useState(null);

  // Favorites state: Set of selected pokemon ids
  const [favorites, setFavorites] = useState(null);

  // Which generation(s) are loaded
  const [loadedGens, setLoadedGens] = useState([0]); // indices into GENERATIONS

  function getUserKey(key) {
    return currentUser ? `user_${currentUser}_${key}` : key;
  }

  // Load saved state on mount / user change
  useEffect(() => {
    const savedTier = loadProgress(getUserKey("tiers"));
    setTierState(savedTier || { S: [], A: [], B: [], C: [], D: [], F: [], unranked: [] });

    const savedFavs = loadProgress(getUserKey("favorites"));
    setFavorites(new Set(savedFavs || []));
  }, [currentUser]);

  // Save tier state whenever it changes
  useEffect(() => {
    if (tierState !== null) {
      saveProgress(getUserKey("tiers"), tierState);
      if (currentUser) {
        saveAccount(currentUser, { tiers: tierState });
      }
    }
  }, [tierState, currentUser]);

  // Save favorites whenever they change
  useEffect(() => {
    if (favorites !== null) {
      saveProgress(getUserKey("favorites"), Array.from(favorites));
      if (currentUser) {
        saveAccount(currentUser, { favorites: Array.from(favorites) });
      }
    }
  }, [favorites, currentUser]);

  function login(username) {
    setCurrentUser(username);
    localStorage.setItem("pokestats_current_user", username);
    // Load account data
    const acct = loadAccount(username);
    if (acct?.tiers) setTierState(acct.tiers);
    if (acct?.favorites) setFavorites(new Set(acct.favorites));
  }

  function logout() {
    setCurrentUser(null);
    localStorage.removeItem("pokestats_current_user");
  }

  function toggleFavorite(pokemonId) {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(pokemonId)) next.delete(pokemonId);
      else next.add(pokemonId);
      return next;
    });
  }

  function movePokemon(pokemonId, fromTier, toTier) {
    setTierState(prev => {
      const next = { ...prev };
      // Remove from source
      if (fromTier) {
        next[fromTier] = (next[fromTier] || []).filter(id => id !== pokemonId);
      }
      // Add to destination (avoid duplicates)
      if (!next[toTier]) next[toTier] = [];
      if (!next[toTier].includes(pokemonId)) {
        next[toTier] = [...next[toTier], pokemonId];
      }
      return next;
    });
  }

  function addToUnranked(pokemonIds) {
    setTierState(prev => {
      const allRanked = new Set([
        ...Object.entries(prev)
          .filter(([k]) => k !== "unranked")
          .flatMap(([, v]) => v),
        ...(prev.unranked || []),
      ]);
      const newOnes = pokemonIds.filter(id => !allRanked.has(id));
      return { ...prev, unranked: [...(prev.unranked || []), ...newOnes] };
    });
  }

  function resetTiers() {
    const fresh = { S: [], A: [], B: [], C: [], D: [], F: [], unranked: [] };
    setTierState(fresh);
    setFavorites(new Set());
  }

  const totalRanked = tierState
    ? Object.entries(tierState).filter(([k]) => k !== "unranked").reduce((s, [, v]) => s + v.length, 0)
    : 0;

  const totalUnranked = tierState?.unranked?.length || 0;

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      tierState, setTierState, movePokemon, addToUnranked, resetTiers,
      favorites, setFavorites, toggleFavorite,
      loadedGens, setLoadedGens,
      totalRanked, totalUnranked,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

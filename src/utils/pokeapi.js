// PokeAPI utilities
const BASE = "https://pokeapi.co/api/v2";

const CACHE = {};

async function cachedFetch(url) {
  if (CACHE[url]) return CACHE[url];
  const res = await fetch(url);
  const data = await res.json();
  CACHE[url] = data;
  return data;
}

// Returns basic list of pokemon (name + id) for a generation range
export async function fetchPokemonList(limit = 156, offset = 0) {
  const data = await cachedFetch(`${BASE}/pokemon?limit=${limit}&offset=${offset}`);
  return data.results.map((p, i) => ({
    name: p.name,
    id: offset + i + 1,
  }));
}

// Fetch full pokemon details
export async function fetchPokemon(nameOrId) {
  return cachedFetch(`${BASE}/pokemon/${nameOrId}`);
}

// Sprite URL helper
export function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Generation ranges
export const GENERATIONS = [
  { label: "Gen I", name: "Kanto", offset: 0, limit: 151, color: "#b15932" },
  { label: "Gen II", name: "Johto", offset: 151, limit: 100, color: "#d8bb5a" },
  { label: "Gen III", name: "Hoenn", offset: 251, limit: 135, color: "#2e7d32" },
  { label: "Gen IV", name: "Sinnoh", offset: 386, limit: 107, color: "#254767" },
  { label: "Gen V", name: "Unova", offset: 493, limit: 156, color: "#6d6e70" },
  { label: "Gen VI", name: "Kalos", offset: 649, limit: 72, color: "#9dc4a2" },
  { label: "Gen VII", name: "Alola", offset: 721, limit: 88, color: "#2b1674" },
  { label: "Gen VIII", name: "Galar", offset: 809, limit: 96, color: "#ce91b0" },
  { label: "Gen IX", name: "Paldea", offset: 905, limit: 120, color: "#67150a" },
];

export function getGenForId(id) {
  for (const g of GENERATIONS) {
    if (id > g.offset && id <= g.offset + g.limit) return g;
  }
  return GENERATIONS[0];
}

// Type colors
export const TYPE_COLORS = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0",
  electric: "#F8D030", grass: "#78C850", ice: "#98D8D8",
  fighting: "#C03028", poison: "#A040A0", ground: "#E0C068",
  flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8",
  dark: "#705848", steel: "#B8B8D0", fairy: "#EE99AC",
};

// Tier config
export const TIERS = [
  { id: "S", label: "S", color: "#FF7F7F", bg: "rgba(255,127,127,0.15)" },
  { id: "A", label: "A", color: "#FFBF7F", bg: "rgba(255,191,127,0.15)" },
  { id: "B", label: "B", color: "#FFFF7F", bg: "rgba(255,255,127,0.12)" },
  { id: "C", label: "C", color: "#7FFF7F", bg: "rgba(127,255,127,0.12)" },
  { id: "D", label: "D", color: "#7FBFFF", bg: "rgba(127,191,255,0.12)" },
  { id: "F", label: "F", color: "#BF7FFF", bg: "rgba(191,127,255,0.12)" },
];

// Local storage helpers
export function saveProgress(key, data) {
  try {
    localStorage.setItem(`pokestats_${key}`, JSON.stringify(data));
  } catch (e) {}
}

export function loadProgress(key) {
  try {
    const raw = localStorage.getItem(`pokestats_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Account helpers (client-side simulation)
export function saveAccount(username, data) {
  try {
    const accounts = JSON.parse(localStorage.getItem("pokestats_accounts") || "{}");
    accounts[username] = { ...accounts[username], ...data, updatedAt: Date.now() };
    localStorage.setItem("pokestats_accounts", JSON.stringify(accounts));
  } catch (e) {}
}

export function loadAccount(username) {
  try {
    const accounts = JSON.parse(localStorage.getItem("pokestats_accounts") || "{}");
    return accounts[username] || null;
  } catch (e) {
    return null;
  }
}

export function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem("pokestats_accounts") || "{}");
  } catch (e) {
    return {};
  }
}

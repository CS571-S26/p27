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

export async function fetchPokemonList(limit = 156, offset = 0) {
  const data = await cachedFetch(`${BASE}/pokemon?limit=${limit}&offset=${offset}`);
  return data.results.map((p, i) => ({
    name: p.name,
    id: offset + i + 1,
  }));
}

export async function fetchPokemon(nameOrId) {
  return cachedFetch(`${BASE}/pokemon/${nameOrId}`);
}

export function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// ─── Game version colors ──────────────────────────────────────────────────────
// Sourced from official game cartridge/box art colors

export const GAME_VERSION_COLORS = {
  // Gen I
  red:       "#CC0000",
  blue:      "#003A8C",
  yellow:    "#F5C400",
  // Gen II
  gold:      "#B8860B",
  silver:    "#A8A9AD",
  crystal:   "#4FC3F7",
  // Gen III
  ruby:      "#9B1B30",
  sapphire:  "#0057A8",
  emerald:   "#00A86B",
  firered:   "#FF4500",
  leafgreen: "#4CAF50",
  // Gen IV
  diamond:   "#7EC8E3",
  pearl:     "#E0A0C0",
  platinum:  "#9E9E9E",
  heartgold: "#C9860A",
  soulsilver:"#7A8FA6",
  // Gen V
  black:     "#222222",
  white:     "#C8C8C8",
  black2:    "#1A1A2E",
  white2:    "#E8E8F0",
  // Gen VI
  x:         "#025DA8",
  y:         "#C8002A",
  omegaruby: "#8B0000",
  alphasapphire: "#00308F",
  // Gen VII
  sun:       "#F5A623",
  moon:      "#4A4A8A",
  ultrasun:  "#FF8C00",
  ultramoon: "#483D8B",
  // Gen VIII
  sword:     "#00BFFF",
  shield:    "#FF6B9D",
  brilliantdiamond: "#6BB8D4",
  shiningpearl:     "#D4A0C0",
  legendsarceus:    "#3D405B",
  // Gen IX
  scarlet:   "#C0392B",
  violet:    "#8E44AD",
};

// ─── Per-pokemon game version gradient ────────────────────────────────────────
// Maps dex number ranges to the games that pokemon appeared in first.
// Used to color the name label on PokemonCard with a gradient of those game colors.

export function getPokemonVersionColors(id) {
  // Gen I — Red & Blue (and Yellow)
  if (id >= 1 && id <= 151)
    return [GAME_VERSION_COLORS.red, GAME_VERSION_COLORS.blue];

  // Gen II — Gold & Silver (and Crystal)
  if (id >= 152 && id <= 251)
    return [GAME_VERSION_COLORS.gold, GAME_VERSION_COLORS.silver];

  // Gen III — Ruby & Sapphire & Emerald
  if (id >= 252 && id <= 386)
    return [GAME_VERSION_COLORS.ruby, GAME_VERSION_COLORS.emerald, GAME_VERSION_COLORS.sapphire];

  // Gen IV — Diamond & Pearl & Platinum
  if (id >= 387 && id <= 493)
    return [GAME_VERSION_COLORS.diamond, GAME_VERSION_COLORS.pearl, GAME_VERSION_COLORS.platinum];

  // Gen V — Black & White
  if (id >= 494 && id <= 649)
    return [GAME_VERSION_COLORS.black, GAME_VERSION_COLORS.white];

  // Gen VI — X & Y
  if (id >= 650 && id <= 721)
    return [GAME_VERSION_COLORS.x, GAME_VERSION_COLORS.y];

  // Gen VII — Sun & Moon
  if (id >= 722 && id <= 809)
    return [GAME_VERSION_COLORS.sun, GAME_VERSION_COLORS.moon];

  // Gen VIII — Sword & Shield
  if (id >= 810 && id <= 905)
    return [GAME_VERSION_COLORS.sword, GAME_VERSION_COLORS.shield];

  // Gen IX — Scarlet & Violet
  if (id >= 906 && id <= 1025)
    return [GAME_VERSION_COLORS.scarlet, GAME_VERSION_COLORS.violet];

  return ["#9fa8da", "#6a7dbd"];
}

// Build a CSS linear-gradient string from an array of colors
export function versionGradient(colors, direction = "135deg") {
  if (colors.length === 1) return colors[0];
  return `linear-gradient(${direction}, ${colors.join(", ")})`;
}

// Accessible (lightened) versions of version colors for use as gradient text on dark backgrounds.
// Each passes WCAG AA (~4.5:1) against #12122A.
export const ACCESSIBLE_VERSION_COLORS = {
  red:          "#FF6666",  // 4.6:1 on #12122A
  blue:         "#6699FF",  // 5.1:1
  yellow:       "#F5C400",  // 12:1
  gold:         "#FFD700",  // 11:1
  silver:       "#C8C8E0",  // 8.5:1
  crystal:      "#7DD9FF",  // 7.2:1
  ruby:         "#FF6680",  // 4.8:1
  sapphire:     "#5599FF",  // 5.4:1
  emerald:      "#33DD88",  // 5.6:1
  firered:      "#FF7755",  // 4.7:1
  leafgreen:    "#66DD55",  // 5.9:1
  diamond:      "#99DDFF",  // 9.2:1
  pearl:        "#FFBBDD",  // 7.1:1
  platinum:     "#CCCCCC",  // 8.0:1
  heartgold:    "#FFCC44",  // 10:1
  soulsilver:   "#AABBCC",  // 6.8:1
  black:        "#AAAAAA",  // 6.5:1  (can't use true black on dark)
  white:        "#E0E0F0",  // 11:1
  black2:       "#8888CC",  // 4.6:1
  white2:       "#E8E8FF",  // 13:1
  x:            "#55AAFF",  // 5.7:1
  y:            "#FF5577",  // 4.6:1
  omegaruby:    "#FF6666",  // 4.6:1
  alphasapphire:"#5599FF",  // 5.4:1
  sun:          "#FFCC44",  // 10:1
  moon:         "#AAAAEE",  // 6.0:1
  ultrasun:     "#FFAA33",  // 8.1:1
  ultramoon:    "#9988FF",  // 4.6:1
  sword:        "#55DDFF",  // 8.2:1
  shield:       "#FF99CC",  // 5.8:1
  brilliantdiamond: "#99DDFF", // 9.2:1
  shiningpearl:     "#FFBBDD", // 7.1:1
  legendsarceus:    "#BBBBCC", // 7.5:1
  scarlet:      "#FF6655",  // 4.7:1
  violet:       "#CC88FF",  // 4.7:1
};

// Per-pokemon accessible gradient colors for name labels on dark backgrounds
export function getAccessibleVersionColors(id) {
  const c = ACCESSIBLE_VERSION_COLORS;
  if (id >= 1   && id <= 151)  return [c.red,    c.blue];
  if (id >= 152 && id <= 251)  return [c.gold,   c.silver];
  if (id >= 252 && id <= 386)  return [c.ruby,   c.emerald,  c.sapphire];
  if (id >= 387 && id <= 493)  return [c.diamond, c.pearl,   c.platinum];
  if (id >= 494 && id <= 649)  return [c.black,  c.white];
  if (id >= 650 && id <= 721)  return [c.x,      c.y];
  if (id >= 722 && id <= 809)  return [c.sun,    c.moon];
  if (id >= 810 && id <= 905)  return [c.sword,  c.shield];
  if (id >= 906 && id <= 1025) return [c.scarlet, c.violet];
  return ["#AAAACC", "#8888BB"];
}

// ─── Generation ranges ────────────────────────────────────────────────────────

export const GENERATIONS = [
  {
    label: "Gen I", name: "Kanto", offset: 0, limit: 151,
    color: "#CC0000",   // Red
    color2: "#003A8C",  // Blue
    games: ["Red", "Blue", "Yellow"],
  },
  {
    label: "Gen II", name: "Johto", offset: 151, limit: 100,
    color: "#B8860B",   // Gold
    color2: "#A8A9AD",  // Silver
    games: ["Gold", "Silver", "Crystal"],
  },
  {
    label: "Gen III", name: "Hoenn", offset: 251, limit: 135,
    color: "#9B1B30",   // Ruby
    color2: "#00A86B",  // Emerald
    color3: "#0057A8",  // Sapphire
    games: ["Ruby", "Sapphire", "Emerald"],
  },
  {
    label: "Gen IV", name: "Sinnoh", offset: 386, limit: 107,
    color: "#7EC8E3",   // Diamond
    color2: "#E0A0C0",  // Pearl
    color3: "#9E9E9E",  // Platinum
    games: ["Diamond", "Pearl", "Platinum"],
  },
  {
    label: "Gen V", name: "Unova", offset: 493, limit: 156,
    color: "#333333",   // Black
    color2: "#C8C8C8",  // White
    games: ["Black", "White"],
  },
  {
    label: "Gen VI", name: "Kalos", offset: 649, limit: 72,
    color: "#025DA8",   // X
    color2: "#C8002A",  // Y
    games: ["X", "Y"],
  },
  {
    label: "Gen VII", name: "Alola", offset: 721, limit: 88,
    color: "#F5A623",   // Sun
    color2: "#4A4A8A",  // Moon
    games: ["Sun", "Moon"],
  },
  {
    label: "Gen VIII", name: "Galar", offset: 809, limit: 96,
    color: "#00BFFF",   // Sword
    color2: "#FF6B9D",  // Shield
    games: ["Sword", "Shield"],
  },
  {
    label: "Gen IX", name: "Paldea", offset: 905, limit: 120,
    color: "#C0392B",   // Scarlet
    color2: "#8E44AD",  // Violet
    games: ["Scarlet", "Violet"],
  },
];

// Get all colors for a generation as an array
export function getGenColors(gen) {
  return [gen.color, gen.color2, gen.color3].filter(Boolean);
}

export function getGenGradient(gen, direction = "135deg") {
  return versionGradient(getGenColors(gen), direction);
}

export function getGenForId(id) {
  for (const g of GENERATIONS) {
    if (id > g.offset && id <= g.offset + g.limit) return g;
  }
  return GENERATIONS[0];
}

// ─── Type colors ──────────────────────────────────────────────────────────────

export const TYPE_COLORS = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0",
  electric: "#F8D030", grass: "#78C850", ice: "#98D8D8",
  fighting: "#C03028", poison: "#A040A0", ground: "#E0C068",
  flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8",
  dark: "#705848", steel: "#B8B8D0", fairy: "#EE99AC",
};

// ─── Tier config ──────────────────────────────────────────────────────────────

export const TIERS = [
  { id: "S", label: "S", color: "#FF7F7F", bg: "rgba(255,127,127,0.15)" },
  { id: "A", label: "A", color: "#FFBF7F", bg: "rgba(255,191,127,0.15)" },
  { id: "B", label: "B", color: "#FFFF7F", bg: "rgba(255,255,127,0.12)" },
  { id: "C", label: "C", color: "#7FFF7F", bg: "rgba(127,255,127,0.12)" },
  { id: "D", label: "D", color: "#7FBFFF", bg: "rgba(127,191,255,0.12)" },
  { id: "F", label: "F", color: "#BF7FFF", bg: "rgba(191,127,255,0.12)" },
];

// ─── Local storage helpers ────────────────────────────────────────────────────

export function saveProgress(key, data) {
  try { localStorage.setItem(`pokestats_${key}`, JSON.stringify(data)); } catch (e) {}
}

export function loadProgress(key) {
  try {
    const raw = localStorage.getItem(`pokestats_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

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
  } catch (e) { return null; }
}

export function getAccounts() {
  try { return JSON.parse(localStorage.getItem("pokestats_accounts") || "{}"); }
  catch (e) { return {}; }
}
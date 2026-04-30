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

// Superseded by getAccessibleVersionColors — kept for reference only
function getPokemonVersionColors(id) {
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

// ─── Alternate Forms ──────────────────────────────────────────────────────────
// Curated list of meaningful alternate forms. These use string-based API names
// rather than numeric dex IDs. Sprites are fetched by name from PokeAPI sprites.
// formType: "mega" | "gmax" | "regional" | "other"

export const FORM_TYPES = [
  { id: "mega",     label: "Mega Evolutions",     icon: "⚡",  color: "#FF6680" },
  { id: "gmax",     label: "Gigantamax Forms",     icon: "🌀",  color: "#CC88FF" },
  { id: "regional", label: "Regional Variants",    icon: "🌏",  color: "#55DDFF" },
  { id: "other",    label: "Other Notable Forms",  icon: "✨",  color: "#FFD700" },
];

export const ALTERNATE_FORMS = [
  // ── Mega Evolutions ────────────────────────────────────────────────────────
  { name: "venusaur-mega",      display: "Mega Venusaur",      base: "venusaur",      formType: "mega" },
  { name: "charizard-mega-x",   display: "Mega Charizard X",   base: "charizard",     formType: "mega" },
  { name: "charizard-mega-y",   display: "Mega Charizard Y",   base: "charizard",     formType: "mega" },
  { name: "blastoise-mega",     display: "Mega Blastoise",     base: "blastoise",     formType: "mega" },
  { name: "beedrill-mega",      display: "Mega Beedrill",      base: "beedrill",      formType: "mega" },
  { name: "pidgeot-mega",       display: "Mega Pidgeot",       base: "pidgeot",       formType: "mega" },
  { name: "alakazam-mega",      display: "Mega Alakazam",      base: "alakazam",      formType: "mega" },
  { name: "slowbro-mega",       display: "Mega Slowbro",       base: "slowbro",       formType: "mega" },
  { name: "gengar-mega",        display: "Mega Gengar",        base: "gengar",        formType: "mega" },
  { name: "kangaskhan-mega",    display: "Mega Kangaskhan",    base: "kangaskhan",    formType: "mega" },
  { name: "pinsir-mega",        display: "Mega Pinsir",        base: "pinsir",        formType: "mega" },
  { name: "gyarados-mega",      display: "Mega Gyarados",      base: "gyarados",      formType: "mega" },
  { name: "aerodactyl-mega",    display: "Mega Aerodactyl",    base: "aerodactyl",    formType: "mega" },
  { name: "mewtwo-mega-x",      display: "Mega Mewtwo X",      base: "mewtwo",        formType: "mega" },
  { name: "mewtwo-mega-y",      display: "Mega Mewtwo Y",      base: "mewtwo",        formType: "mega" },
  { name: "ampharos-mega",      display: "Mega Ampharos",      base: "ampharos",      formType: "mega" },
  { name: "steelix-mega",       display: "Mega Steelix",       base: "steelix",       formType: "mega" },
  { name: "scizor-mega",        display: "Mega Scizor",        base: "scizor",        formType: "mega" },
  { name: "heracross-mega",     display: "Mega Heracross",     base: "heracross",     formType: "mega" },
  { name: "houndoom-mega",      display: "Mega Houndoom",      base: "houndoom",      formType: "mega" },
  { name: "tyranitar-mega",     display: "Mega Tyranitar",     base: "tyranitar",     formType: "mega" },
  { name: "blaziken-mega",      display: "Mega Blaziken",      base: "blaziken",      formType: "mega" },
  { name: "gardevoir-mega",     display: "Mega Gardevoir",     base: "gardevoir",     formType: "mega" },
  { name: "mawile-mega",        display: "Mega Mawile",        base: "mawile",        formType: "mega" },
  { name: "aggron-mega",        display: "Mega Aggron",        base: "aggron",        formType: "mega" },
  { name: "medicham-mega",      display: "Mega Medicham",      base: "medicham",      formType: "mega" },
  { name: "manectric-mega",     display: "Mega Manectric",     base: "manectric",     formType: "mega" },
  { name: "banette-mega",       display: "Mega Banette",       base: "banette",       formType: "mega" },
  { name: "absol-mega",         display: "Mega Absol",         base: "absol",         formType: "mega" },
  { name: "garchomp-mega",      display: "Mega Garchomp",      base: "garchomp",      formType: "mega" },
  { name: "lucario-mega",       display: "Mega Lucario",       base: "lucario",       formType: "mega" },
  { name: "abomasnow-mega",     display: "Mega Abomasnow",     base: "abomasnow",     formType: "mega" },
  { name: "gallade-mega",       display: "Mega Gallade",       base: "gallade",       formType: "mega" },
  { name: "audino-mega",        display: "Mega Audino",        base: "audino",        formType: "mega" },
  { name: "diancie-mega",       display: "Mega Diancie",       base: "diancie",       formType: "mega" },
  { name: "lopunny-mega",       display: "Mega Lopunny",       base: "lopunny",       formType: "mega" },
  { name: "latias-mega",        display: "Mega Latias",        base: "latias",        formType: "mega" },
  { name: "latios-mega",        display: "Mega Latios",        base: "latios",        formType: "mega" },
  { name: "rayquaza-mega",      display: "Mega Rayquaza",      base: "rayquaza",      formType: "mega" },
  { name: "altaria-mega",       display: "Mega Altaria",       base: "altaria",       formType: "mega" },
  { name: "salamence-mega",     display: "Mega Salamence",     base: "salamence",     formType: "mega" },
  { name: "metagross-mega",     display: "Mega Metagross",     base: "metagross",     formType: "mega" },
  { name: "sceptile-mega",      display: "Mega Sceptile",      base: "sceptile",      formType: "mega" },
  { name: "swampert-mega",      display: "Mega Swampert",      base: "swampert",      formType: "mega" },
  { name: "sableye-mega",       display: "Mega Sableye",       base: "sableye",       formType: "mega" },
  { name: "sharpedo-mega",      display: "Mega Sharpedo",      base: "sharpedo",      formType: "mega" },
  { name: "camerupt-mega",      display: "Mega Camerupt",      base: "camerupt",      formType: "mega" },
  { name: "glalie-mega",        display: "Mega Glalie",        base: "glalie",        formType: "mega" },

  // ── Gigantamax Forms ───────────────────────────────────────────────────────
  { name: "charizard-gmax",     display: "G-Max Charizard",    base: "charizard",     formType: "gmax" },
  { name: "butterfree-gmax",    display: "G-Max Butterfree",   base: "butterfree",    formType: "gmax" },
  { name: "pikachu-gmax",       display: "G-Max Pikachu",      base: "pikachu",       formType: "gmax" },
  { name: "meowth-gmax",        display: "G-Max Meowth",       base: "meowth",        formType: "gmax" },
  { name: "machamp-gmax",       display: "G-Max Machamp",      base: "machamp",       formType: "gmax" },
  { name: "gengar-gmax",        display: "G-Max Gengar",       base: "gengar",        formType: "gmax" },
  { name: "kingler-gmax",       display: "G-Max Kingler",      base: "kingler",       formType: "gmax" },
  { name: "lapras-gmax",        display: "G-Max Lapras",       base: "lapras",        formType: "gmax" },
  { name: "eevee-gmax",         display: "G-Max Eevee",        base: "eevee",         formType: "gmax" },
  { name: "snorlax-gmax",       display: "G-Max Snorlax",      base: "snorlax",       formType: "gmax" },
  { name: "garbodor-gmax",      display: "G-Max Garbodor",     base: "garbodor",      formType: "gmax" },
  { name: "melmetal-gmax",      display: "G-Max Melmetal",     base: "melmetal",      formType: "gmax" },
  { name: "rillaboom-gmax",     display: "G-Max Rillaboom",    base: "rillaboom",     formType: "gmax" },
  { name: "cinderace-gmax",     display: "G-Max Cinderace",    base: "cinderace",     formType: "gmax" },
  { name: "inteleon-gmax",      display: "G-Max Inteleon",     base: "inteleon",      formType: "gmax" },
  { name: "corviknight-gmax",   display: "G-Max Corviknight",  base: "corviknight",   formType: "gmax" },
  { name: "orbeetle-gmax",      display: "G-Max Orbeetle",     base: "orbeetle",      formType: "gmax" },
  { name: "drednaw-gmax",       display: "G-Max Drednaw",      base: "drednaw",       formType: "gmax" },
  { name: "coalossal-gmax",     display: "G-Max Coalossal",    base: "coalossal",     formType: "gmax" },
  { name: "flapple-gmax",       display: "G-Max Flapple",      base: "flapple",       formType: "gmax" },
  { name: "appletun-gmax",      display: "G-Max Appletun",     base: "appletun",      formType: "gmax" },
  { name: "sandaconda-gmax",    display: "G-Max Sandaconda",   base: "sandaconda",    formType: "gmax" },
  { name: "toxtricity-amped-gmax", display: "G-Max Toxtricity", base: "toxtricity",   formType: "gmax" },
  { name: "centiskorch-gmax",   display: "G-Max Centiskorch",  base: "centiskorch",   formType: "gmax" },
  { name: "hatterene-gmax",     display: "G-Max Hatterene",    base: "hatterene",     formType: "gmax" },
  { name: "grimmsnarl-gmax",    display: "G-Max Grimmsnarl",   base: "grimmsnarl",    formType: "gmax" },
  { name: "alcremie-gmax",      display: "G-Max Alcremie",     base: "alcremie",      formType: "gmax" },
  { name: "copperajah-gmax",    display: "G-Max Copperajah",   base: "copperajah",    formType: "gmax" },
  { name: "duraludon-gmax",     display: "G-Max Duraludon",    base: "duraludon",     formType: "gmax" },
  { name: "urshifu-rapid-strike-gmax", display: "G-Max Urshifu (Rapid)", base: "urshifu", formType: "gmax" },
  { name: "urshifu-gmax",       display: "G-Max Urshifu (Single)", base: "urshifu",   formType: "gmax" },

  // ── Regional Variants ──────────────────────────────────────────────────────
  { name: "rattata-alola",      display: "Alolan Rattata",     base: "rattata",       formType: "regional" },
  { name: "raticate-alola",     display: "Alolan Raticate",    base: "raticate",      formType: "regional" },
  { name: "raichu-alola",       display: "Alolan Raichu",      base: "raichu",        formType: "regional" },
  { name: "sandshrew-alola",    display: "Alolan Sandshrew",   base: "sandshrew",     formType: "regional" },
  { name: "sandslash-alola",    display: "Alolan Sandslash",   base: "sandslash",     formType: "regional" },
  { name: "vulpix-alola",       display: "Alolan Vulpix",      base: "vulpix",        formType: "regional" },
  { name: "ninetales-alola",    display: "Alolan Ninetales",   base: "ninetales",     formType: "regional" },
  { name: "diglett-alola",      display: "Alolan Diglett",     base: "diglett",       formType: "regional" },
  { name: "dugtrio-alola",      display: "Alolan Dugtrio",     base: "dugtrio",       formType: "regional" },
  { name: "meowth-alola",       display: "Alolan Meowth",      base: "meowth",        formType: "regional" },
  { name: "persian-alola",      display: "Alolan Persian",     base: "persian",       formType: "regional" },
  { name: "geodude-alola",      display: "Alolan Geodude",     base: "geodude",       formType: "regional" },
  { name: "graveler-alola",     display: "Alolan Graveler",    base: "graveler",      formType: "regional" },
  { name: "golem-alola",        display: "Alolan Golem",       base: "golem",         formType: "regional" },
  { name: "grimer-alola",       display: "Alolan Grimer",      base: "grimer",        formType: "regional" },
  { name: "muk-alola",          display: "Alolan Muk",         base: "muk",           formType: "regional" },
  { name: "exeggutor-alola",    display: "Alolan Exeggutor",   base: "exeggutor",     formType: "regional" },
  { name: "marowak-alola",      display: "Alolan Marowak",     base: "marowak",       formType: "regional" },
  { name: "meowth-galar",       display: "Galarian Meowth",    base: "meowth",        formType: "regional" },
  { name: "ponyta-galar",       display: "Galarian Ponyta",    base: "ponyta",        formType: "regional" },
  { name: "rapidash-galar",     display: "Galarian Rapidash",  base: "rapidash",      formType: "regional" },
  { name: "slowpoke-galar",     display: "Galarian Slowpoke",  base: "slowpoke",      formType: "regional" },
  { name: "slowbro-galar",      display: "Galarian Slowbro",   base: "slowbro",       formType: "regional" },
  { name: "farfetchd-galar",    display: "Galarian Farfetch'd",base: "farfetchd",     formType: "regional" },
  { name: "weezing-galar",      display: "Galarian Weezing",   base: "weezing",       formType: "regional" },
  { name: "mr-mime-galar",      display: "Galarian Mr. Mime",  base: "mr-mime",       formType: "regional" },
  { name: "articuno-galar",     display: "Galarian Articuno",  base: "articuno",      formType: "regional" },
  { name: "zapdos-galar",       display: "Galarian Zapdos",    base: "zapdos",        formType: "regional" },
  { name: "moltres-galar",      display: "Galarian Moltres",   base: "moltres",       formType: "regional" },
  { name: "slowking-galar",     display: "Galarian Slowking",  base: "slowking",      formType: "regional" },
  { name: "corsola-galar",      display: "Galarian Corsola",   base: "corsola",       formType: "regional" },
  { name: "zigzagoon-galar",    display: "Galarian Zigzagoon", base: "zigzagoon",     formType: "regional" },
  { name: "linoone-galar",      display: "Galarian Linoone",   base: "linoone",       formType: "regional" },
  { name: "darumaka-galar",     display: "Galarian Darumaka",  base: "darumaka",      formType: "regional" },
  { name: "darmanitan-galar",   display: "Galarian Darmanitan",base: "darmanitan",    formType: "regional" },
  { name: "yamask-galar",       display: "Galarian Yamask",    base: "yamask",        formType: "regional" },
  { name: "stunfisk-galar",     display: "Galarian Stunfisk",  base: "stunfisk",      formType: "regional" },
  { name: "growlithe-hisui",    display: "Hisuian Growlithe",  base: "growlithe",     formType: "regional" },
  { name: "arcanine-hisui",     display: "Hisuian Arcanine",   base: "arcanine",      formType: "regional" },
  { name: "voltorb-hisui",      display: "Hisuian Voltorb",    base: "voltorb",       formType: "regional" },
  { name: "electrode-hisui",    display: "Hisuian Electrode",  base: "electrode",     formType: "regional" },
  { name: "typhlosion-hisui",   display: "Hisuian Typhlosion", base: "typhlosion",    formType: "regional" },
  { name: "qwilfish-hisui",     display: "Hisuian Qwilfish",   base: "qwilfish",      formType: "regional" },
  { name: "sneasel-hisui",      display: "Hisuian Sneasel",    base: "sneasel",       formType: "regional" },
  { name: "samurott-hisui",     display: "Hisuian Samurott",   base: "samurott",      formType: "regional" },
  { name: "lilligant-hisui",    display: "Hisuian Lilligant",  base: "lilligant",     formType: "regional" },
  { name: "zorua-hisui",        display: "Hisuian Zorua",      base: "zorua",         formType: "regional" },
  { name: "zoroark-hisui",      display: "Hisuian Zoroark",    base: "zoroark",       formType: "regional" },
  { name: "braviary-hisui",     display: "Hisuian Braviary",   base: "braviary",      formType: "regional" },
  { name: "sliggoo-hisui",      display: "Hisuian Sliggoo",    base: "sliggoo",       formType: "regional" },
  { name: "goodra-hisui",       display: "Hisuian Goodra",     base: "goodra",        formType: "regional" },
  { name: "avalugg-hisui",      display: "Hisuian Avalugg",    base: "avalugg",       formType: "regional" },
  { name: "decidueye-hisui",    display: "Hisuian Decidueye",  base: "decidueye",     formType: "regional" },
  { name: "tauros-paldea-aqua", display: "Paldean Tauros (Aqua)", base: "tauros",     formType: "regional" },
  { name: "tauros-paldea-blaze",display: "Paldean Tauros (Blaze)",base: "tauros",     formType: "regional" },
  { name: "tauros-paldea-combat",display:"Paldean Tauros",     base: "tauros",        formType: "regional" },
  { name: "wooper-paldea",      display: "Paldean Wooper",     base: "wooper",        formType: "regional" },
  { name: "oinkologne-f",       display: "Oinkologne (F)",     base: "oinkologne",    formType: "regional" },

  // ── Other Notable Forms ────────────────────────────────────────────────────
  { name: "rotom-heat",         display: "Heat Rotom",         base: "rotom",         formType: "other" },
  { name: "rotom-wash",         display: "Wash Rotom",         base: "rotom",         formType: "other" },
  { name: "rotom-frost",        display: "Frost Rotom",        base: "rotom",         formType: "other" },
  { name: "rotom-fan",          display: "Fan Rotom",          base: "rotom",         formType: "other" },
  { name: "rotom-mow",          display: "Mow Rotom",          base: "rotom",         formType: "other" },
  { name: "shaymin-sky",        display: "Sky Shaymin",        base: "shaymin",       formType: "other" },
  { name: "giratina-origin",    display: "Origin Giratina",    base: "giratina",      formType: "other" },
  { name: "tornadus-therian",   display: "Therian Tornadus",   base: "tornadus",      formType: "other" },
  { name: "thundurus-therian",  display: "Therian Thundurus",  base: "thundurus",     formType: "other" },
  { name: "landorus-therian",   display: "Therian Landorus",   base: "landorus",      formType: "other" },
  { name: "kyurem-black",       display: "Black Kyurem",       base: "kyurem",        formType: "other" },
  { name: "kyurem-white",       display: "White Kyurem",       base: "kyurem",        formType: "other" },
  { name: "zygarde-10",         display: "10% Zygarde",        base: "zygarde",       formType: "other" },
  { name: "zygarde-complete",   display: "Complete Zygarde",   base: "zygarde",       formType: "other" },
  { name: "necrozma-dusk",      display: "Dusk Mane Necrozma", base: "necrozma",      formType: "other" },
  { name: "necrozma-dawn",      display: "Dawn Wings Necrozma",base: "necrozma",      formType: "other" },
  { name: "necrozma-ultra",     display: "Ultra Necrozma",     base: "necrozma",      formType: "other" },
  { name: "calyrex-ice",        display: "Ice Rider Calyrex",  base: "calyrex",       formType: "other" },
  { name: "calyrex-shadow",     display: "Shadow Rider Calyrex",base: "calyrex",      formType: "other" },
  { name: "urshifu-rapid-strike",display:"Urshifu (Rapid Strike)",base: "urshifu",    formType: "other" },
  { name: "indeedee-f",         display: "Indeedee (F)",       base: "indeedee",      formType: "other" },
  { name: "palafin-hero",       display: "Hero Palafin",       base: "palafin",       formType: "other" },
  { name: "terapagos-terastal", display: "Terastal Terapagos", base: "terapagos",     formType: "other" },
  { name: "terapagos-stellar",  display: "Stellar Terapagos",  base: "terapagos",     formType: "other" },
  { name: "ogerpon-wellspring",  display: "Wellspring Ogerpon",base: "ogerpon",       formType: "other" },
  { name: "ogerpon-hearthflame", display: "Hearthflame Ogerpon",base: "ogerpon",      formType: "other" },
  { name: "ogerpon-cornerstone", display: "Cornerstone Ogerpon",base: "ogerpon",      formType: "other" },
];

// Fetch full details for an alternate form by name.
// Returns null if the form doesn't exist in the API.
// The API response includes sprites.front_default — the canonical sprite URL.
const FORM_CACHE = {};
export async function fetchFormPokemon(formName) {
  if (FORM_CACHE[formName]) return FORM_CACHE[formName];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${formName}`);
    if (!res.ok) return null;
    const data = await res.json();
    FORM_CACHE[formName] = data;
    return data;
  } catch {
    return null;
  }
}

// Extract the best available sprite URL from a raw PokeAPI pokemon response.
// Falls back through official-artwork → front_default → null.
export function extractSprite(apiResponse) {
  if (!apiResponse) return null;
  return (
    apiResponse.sprites?.other?.["official-artwork"]?.front_default ||
    apiResponse.sprites?.front_default ||
    null
  );
}

// Placeholder for forms that failed to load
export const FORM_FALLBACK_SPRITE = null; // components handle null gracefully
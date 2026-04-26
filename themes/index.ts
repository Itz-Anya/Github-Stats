export interface Theme {
  background: string;
  border: string;
  titleColor: string;
  textColor: string;
  subTextColor: string;
  iconColor: string;
  statValueColor: string;
  accentColor: string;
  borderRadius: number;
}

const themes: Record<string, Theme> = {
  light: {
    background: "#ffffff",
    border: "#e1e4e8",
    titleColor: "#24292f",
    textColor: "#24292f",
    subTextColor: "#57606a",
    iconColor: "#0969da",
    statValueColor: "#0969da",
    accentColor: "#0969da",
    borderRadius: 10,
  },
  dark: {
    background: "#0d1117",
    border: "#30363d",
    titleColor: "#e6edf3",
    textColor: "#c9d1d9",
    subTextColor: "#8b949e",
    iconColor: "#58a6ff",
    statValueColor: "#58a6ff",
    accentColor: "#58a6ff",
    borderRadius: 10,
  },
  tokyonight: {
    background: "#1a1b27",
    border: "#414868",
    titleColor: "#c0caf5",
    textColor: "#a9b1d6",
    subTextColor: "#565f89",
    iconColor: "#7aa2f7",
    statValueColor: "#bb9af7",
    accentColor: "#7aa2f7",
    borderRadius: 12,
  },
  dracula: {
    background: "#282a36",
    border: "#44475a",
    titleColor: "#f8f8f2",
    textColor: "#f8f8f2",
    subTextColor: "#6272a4",
    iconColor: "#50fa7b",
    statValueColor: "#ff79c6",
    accentColor: "#bd93f9",
    borderRadius: 10,
  },
  nord: {
    background: "#2e3440",
    border: "#3b4252",
    titleColor: "#eceff4",
    textColor: "#d8dee9",
    subTextColor: "#4c566a",
    iconColor: "#88c0d0",
    statValueColor: "#81a1c1",
    accentColor: "#88c0d0",
    borderRadius: 8,
  },
  github_dark: {
    background: "#161b22",
    border: "#21262d",
    titleColor: "#e6edf3",
    textColor: "#c9d1d9",
    subTextColor: "#8b949e",
    iconColor: "#3fb950",
    statValueColor: "#58a6ff",
    accentColor: "#3fb950",
    borderRadius: 6,
  },
  solarized: {
    background: "#002b36",
    border: "#073642",
    titleColor: "#93a1a1",
    textColor: "#839496",
    subTextColor: "#586e75",
    iconColor: "#268bd2",
    statValueColor: "#b58900",
    accentColor: "#2aa198",
    borderRadius: 10,
  },

  // === NEW GIRLY / PINK THEMES ===
  pink: {
    background: "#ffe4f3",
    border: "#ff9edb",
    titleColor: "#c0268e",
    textColor: "#831843",
    subTextColor: "#9f1744",
    iconColor: "#ec4899",
    statValueColor: "#db2777",
    accentColor: "#f472b6",
    borderRadius: 14,
  },

  hotpink: {
    background: "#ff1493",
    border: "#ff69b4",
    titleColor: "#ffffff",
    textColor: "#ffe4f3",
    subTextColor: "#ffb6c1",
    iconColor: "#ffff00",
    statValueColor: "#00ffff",
    accentColor: "#ffd700",
    borderRadius: 12,
  },

  bubblegum: {
    background: "#ff9ede",
    border: "#ff69b4",
    titleColor: "#6b1e4a",
    textColor: "#4c1d3f",
    subTextColor: "#7e2a5e",
    iconColor: "#ff1493",
    statValueColor: "#c0268e",
    accentColor: "#ff69b4",
    borderRadius: 16,
  },

  pastel_pink: {
    background: "#fce7f3",
    border: "#fbcfe8",
    titleColor: "#831843",
    textColor: "#9d174d",
    subTextColor: "#be185d",
    iconColor: "#f472b6",
    statValueColor: "#e11d8f",
    accentColor: "#db2777",
    borderRadius: 12,
  },

  cotton_candy: {
    background: "#f9c8ff",
    border: "#e879f9",
    titleColor: "#6b21a8",
    textColor: "#4c1d95",
    subTextColor: "#6d28d9",
    iconColor: "#c026d3",
    statValueColor: "#db2777",
    accentColor: "#f472b6",
    borderRadius: 15,
  },

  // === MORE COLORFUL & VIBRANT THEMES ===
  rainbow: {
    background: "#0f0f23",
    border: "#4b0082",
    titleColor: "#ffffff",
    textColor: "#e0e0ff",
    subTextColor: "#b0b0ff",
    iconColor: "#ff00ff",
    statValueColor: "#00ffff",
    accentColor: "#ffff00",
    borderRadius: 10,
  },

  neon_pink: {
    background: "#1a0033",
    border: "#ff00aa",
    titleColor: "#ffccff",
    textColor: "#ff99ff",
    subTextColor: "#cc66cc",
    iconColor: "#ff00ff",
    statValueColor: "#00ffff",
    accentColor: "#ff00aa",
    borderRadius: 12,
  },

  purple_dream: {
    background: "#1e0033",
    border: "#6b21a8",
    titleColor: "#e0bbff",
    textColor: "#c4b5fd",
    subTextColor: "#a78bfa",
    iconColor: "#a855f7",
    statValueColor: "#c026d3",
    accentColor: "#7e22ce",
    borderRadius: 12,
  },

  mint: {
    background: "#f0fdf4",
    border: "#86efac",
    titleColor: "#166534",
    textColor: "#14532d",
    subTextColor: "#4ade80",
    iconColor: "#22c55e",
    statValueColor: "#16a34a",
    accentColor: "#4ade80",
    borderRadius: 10,
  },

  sunset: {
    background: "#431407",
    border: "#f59e0b",
    titleColor: "#fefce8",
    textColor: "#fed7aa",
    subTextColor: "#fb923c",
    iconColor: "#f97316",
    statValueColor: "#eab308",
    accentColor: "#f59e0b",
    borderRadius: 12,
  },

  ocean: {
    background: "#0c4a6e",
    border: "#22d3ee",
    titleColor: "#e0f2fe",
    textColor: "#bae6fd",
    subTextColor: "#67e8f9",
    iconColor: "#06b6d4",
    statValueColor: "#22d3ee",
    accentColor: "#0ea5e9",
    borderRadius: 10,
  },

  lavender: {
    background: "#f3e8ff",
    border: "#d8b4fe",
    titleColor: "#4c1d95",
    textColor: "#6b21a8",
    subTextColor: "#7e22ce",
    iconColor: "#a855f7",
    statValueColor: "#c026d3",
    accentColor: "#d8b4fe",
    borderRadius: 14,
  },

  cyberpunk: {
    background: "#0a0a0a",
    border: "#ff00ff",
    titleColor: "#00ffff",
    textColor: "#ffffff",
    subTextColor: "#ff00aa",
    iconColor: "#39ff14",
    statValueColor: "#ffff00",
    accentColor: "#ff00ff",
    borderRadius: 8,
  },

  coral: {
    background: "#fff1f2",
    border: "#fb7185",
    titleColor: "#881337",
    textColor: "#9f1239",
    subTextColor: "#e11d48",
    iconColor: "#f43f5e",
    statValueColor: "#fb7185",
    accentColor: "#f472b6",
    borderRadius: 12,
  },

  emerald: {
    background: "#052e16",
    border: "#4ade80",
    titleColor: "#ecfdf5",
    textColor: "#a7f3d0",
    subTextColor: "#6ee7b7",
    iconColor: "#34d399",
    statValueColor: "#10b981",
    accentColor: "#4ade80",
    borderRadius: 10,
  },

  // Extra Girly / Cute Themes
  strawberry: {
    background: "#fff0f5",
    border: "#ff99cc",
    titleColor: "#9f1239",
    textColor: "#881337",
    subTextColor: "#be123c",
    iconColor: "#f472b6",
    statValueColor: "#ec4899",
    accentColor: "#ff69b4",
    borderRadius: 16,
  },

  unicorn: {
    background: "#f3e8ff",
    border: "#e0bbff",
    titleColor: "#6b21a8",
    textColor: "#7c3aed",
    subTextColor: "#a855f7",
    iconColor: "#c026d3",
    statValueColor: "#f472b6",
    accentColor: "#e879f9",
    borderRadius: 18,
  },
};

export const DEFAULT_THEME = "dark";

export function getTheme(name: string, borderRadiusOverride?: number): Theme {
  const theme = themes[name] ?? themes[DEFAULT_THEME];
  if (borderRadiusOverride !== undefined) {
    return { ...theme, borderRadius: borderRadiusOverride };
  }
  return theme;
}

export const THEME_NAMES = Object.keys(themes);

export interface Theme {
  background: string;
  backgroundGradient?: [string, string];
  border: string;
  titleColor: string;
  textColor: string;
  subTextColor: string;
  iconColor: string;
  statValueColor: string;
  accentColor: string;
  accentSecondary: string;
  barBackground: string;
  barFill: string | [string, string];
  badgeBg: string;
  badgeText: string;
  borderRadius: number;
  shadow: string;
}

const themes: Record<string, Theme> = {
  // ── Dark developer themes ─────────────────────────────────────────────────
  dark: {
    background: "#0d1117", border: "#30363d",
    titleColor: "#e6edf3", textColor: "#c9d1d9", subTextColor: "#8b949e",
    iconColor: "#58a6ff", statValueColor: "#58a6ff",
    accentColor: "#58a6ff", accentSecondary: "#3fb950",
    barBackground: "#21262d", barFill: ["#58a6ff", "#3fb950"],
    badgeBg: "#21262d", badgeText: "#8b949e",
    borderRadius: 10, shadow: "rgba(0,0,0,0.4)",
  },
  github_dark: {
    background: "#161b22", border: "#21262d",
    titleColor: "#e6edf3", textColor: "#c9d1d9", subTextColor: "#8b949e",
    iconColor: "#3fb950", statValueColor: "#58a6ff",
    accentColor: "#3fb950", accentSecondary: "#58a6ff",
    barBackground: "#0d1117", barFill: ["#3fb950", "#58a6ff"],
    badgeBg: "#0d1117", badgeText: "#8b949e",
    borderRadius: 6, shadow: "rgba(0,0,0,0.5)",
  },
  tokyonight: {
    background: "#1a1b27", backgroundGradient: ["#1a1b27", "#16161e"],
    border: "#414868",
    titleColor: "#c0caf5", textColor: "#a9b1d6", subTextColor: "#565f89",
    iconColor: "#7aa2f7", statValueColor: "#bb9af7",
    accentColor: "#7aa2f7", accentSecondary: "#9ece6a",
    barBackground: "#16161e", barFill: ["#7aa2f7", "#bb9af7"],
    badgeBg: "#24283b", badgeText: "#565f89",
    borderRadius: 12, shadow: "rgba(0,0,0,0.5)",
  },
  dracula: {
    background: "#282a36", border: "#44475a",
    titleColor: "#f8f8f2", textColor: "#f8f8f2", subTextColor: "#6272a4",
    iconColor: "#50fa7b", statValueColor: "#ff79c6",
    accentColor: "#bd93f9", accentSecondary: "#50fa7b",
    barBackground: "#1e1f29", barFill: ["#bd93f9", "#ff79c6"],
    badgeBg: "#44475a", badgeText: "#6272a4",
    borderRadius: 10, shadow: "rgba(0,0,0,0.4)",
  },
  nord: {
    background: "#2e3440", backgroundGradient: ["#2e3440", "#272c36"],
    border: "#3b4252",
    titleColor: "#eceff4", textColor: "#d8dee9", subTextColor: "#4c566a",
    iconColor: "#88c0d0", statValueColor: "#81a1c1",
    accentColor: "#88c0d0", accentSecondary: "#a3be8c",
    barBackground: "#272c36", barFill: ["#88c0d0", "#81a1c1"],
    badgeBg: "#3b4252", badgeText: "#4c566a",
    borderRadius: 8, shadow: "rgba(0,0,0,0.4)",
  },
  solarized: {
    background: "#002b36", border: "#073642",
    titleColor: "#93a1a1", textColor: "#839496", subTextColor: "#586e75",
    iconColor: "#268bd2", statValueColor: "#b58900",
    accentColor: "#2aa198", accentSecondary: "#859900",
    barBackground: "#073642", barFill: ["#268bd2", "#2aa198"],
    badgeBg: "#073642", badgeText: "#586e75",
    borderRadius: 10, shadow: "rgba(0,0,0,0.4)",
  },
  monokai: {
    background: "#272822", border: "#3e3d32",
    titleColor: "#f8f8f2", textColor: "#f8f8f2", subTextColor: "#75715e",
    iconColor: "#a6e22e", statValueColor: "#66d9e8",
    accentColor: "#f92672", accentSecondary: "#a6e22e",
    barBackground: "#1e1f1a", barFill: ["#f92672", "#a6e22e"],
    badgeBg: "#3e3d32", badgeText: "#75715e",
    borderRadius: 8, shadow: "rgba(0,0,0,0.4)",
  },
  cyberpunk: {
    background: "#0d0221", backgroundGradient: ["#0d0221", "#120429"],
    border: "#ff00ff",
    titleColor: "#00ffff", textColor: "#e0e0ff", subTextColor: "#8080c0",
    iconColor: "#ff00ff", statValueColor: "#00ffff",
    accentColor: "#ff00ff", accentSecondary: "#00ffff",
    barBackground: "#1a0535", barFill: ["#ff00ff", "#00ffff"],
    badgeBg: "#1a0535", badgeText: "#8080c0",
    borderRadius: 4, shadow: "rgba(255,0,255,0.2)",
  },
  midnight: {
    background: "#0a0e1a", backgroundGradient: ["#0a0e1a", "#0d1326"],
    border: "#1a2236",
    titleColor: "#e2e8f0", textColor: "#94a3b8", subTextColor: "#475569",
    iconColor: "#818cf8", statValueColor: "#a78bfa",
    accentColor: "#818cf8", accentSecondary: "#34d399",
    barBackground: "#0d1326", barFill: ["#818cf8", "#a78bfa"],
    badgeBg: "#1a2236", badgeText: "#475569",
    borderRadius: 12, shadow: "rgba(0,0,0,0.6)",
  },
  ocean_dark: {
    background: "#1b2b34", backgroundGradient: ["#1b2b34", "#141f26"],
    border: "#2b3d4f",
    titleColor: "#cdd3de", textColor: "#a7adba", subTextColor: "#65737e",
    iconColor: "#6699cc", statValueColor: "#c594c5",
    accentColor: "#6699cc", accentSecondary: "#99c794",
    barBackground: "#141f26", barFill: ["#6699cc", "#c594c5"],
    badgeBg: "#2b3d4f", badgeText: "#65737e",
    borderRadius: 10, shadow: "rgba(0,0,0,0.4)",
  },
  neon_dreams: {
    background: "#080815", backgroundGradient: ["#080815", "#0c0c1f"],
    border: "#00f5d4",
    titleColor: "#ffffff", textColor: "#e0e0ff", subTextColor: "#7070b0",
    iconColor: "#00f5d4", statValueColor: "#f5a623",
    accentColor: "#00f5d4", accentSecondary: "#f5a623",
    barBackground: "#0c0c1f", barFill: ["#00f5d4", "#f5a623"],
    badgeBg: "#0c0c1f", badgeText: "#7070b0",
    borderRadius: 10, shadow: "rgba(0,245,212,0.2)",
  },
  galaxy: {
    background: "#0b0019", backgroundGradient: ["#0b0019", "#14002e"],
    border: "#3d1f6e",
    titleColor: "#f0e6ff", textColor: "#d4b8ff", subTextColor: "#8b5cf6",
    iconColor: "#a78bfa", statValueColor: "#c084fc",
    accentColor: "#8b5cf6", accentSecondary: "#f472b6",
    barBackground: "#14002e", barFill: ["#8b5cf6", "#f472b6"],
    badgeBg: "#1a003d", badgeText: "#8b5cf6",
    borderRadius: 14, shadow: "rgba(139,92,246,0.3)",
  },
  aurora: {
    background: "#0f1923", backgroundGradient: ["#0f1923", "#0a1520"],
    border: "#1e3a4a",
    titleColor: "#e0f7fa", textColor: "#b2ebf2", subTextColor: "#4dd0e1",
    iconColor: "#80cbc4", statValueColor: "#b39ddb",
    accentColor: "#4dd0e1", accentSecondary: "#ce93d8",
    barBackground: "#0a1520", barFill: ["#4dd0e1", "#ce93d8"],
    badgeBg: "#1e3a4a", badgeText: "#4dd0e1",
    borderRadius: 12, shadow: "rgba(77,208,225,0.2)",
  },

  // ── Light themes ──────────────────────────────────────────────────────────
  light: {
    background: "#ffffff", border: "#e1e4e8",
    titleColor: "#24292f", textColor: "#24292f", subTextColor: "#57606a",
    iconColor: "#0969da", statValueColor: "#0969da",
    accentColor: "#0969da", accentSecondary: "#1a7f37",
    barBackground: "#f6f8fa", barFill: ["#0969da", "#1a7f37"],
    badgeBg: "#f6f8fa", badgeText: "#57606a",
    borderRadius: 10, shadow: "rgba(0,0,0,0.1)",
  },
  github_light: {
    background: "#f6f8fa", border: "#d0d7de",
    titleColor: "#24292f", textColor: "#24292f", subTextColor: "#57606a",
    iconColor: "#0969da", statValueColor: "#0550ae",
    accentColor: "#0969da", accentSecondary: "#1a7f37",
    barBackground: "#ffffff", barFill: ["#0969da", "#1a7f37"],
    badgeBg: "#ffffff", badgeText: "#57606a",
    borderRadius: 6, shadow: "rgba(0,0,0,0.08)",
  },

  // ── Girly / Pastel themes ─────────────────────────────────────────────────
  sakura: {
    background: "#fff0f5", backgroundGradient: ["#fff0f5", "#ffe4ef"],
    border: "#ffb3cc",
    titleColor: "#c2185b", textColor: "#880e4f", subTextColor: "#ad1457",
    iconColor: "#e91e8c", statValueColor: "#c2185b",
    accentColor: "#f48fb1", accentSecondary: "#ff80ab",
    barBackground: "#fce4ec", barFill: ["#f48fb1", "#ff80ab"],
    badgeBg: "#fce4ec", badgeText: "#ad1457",
    borderRadius: 16, shadow: "rgba(244,143,177,0.25)",
  },
  rose_gold: {
    background: "#fff8f8", backgroundGradient: ["#fff8f8", "#fff0f0"],
    border: "#f9c5c5",
    titleColor: "#b5485a", textColor: "#7d3045", subTextColor: "#c47f8a",
    iconColor: "#d4827a", statValueColor: "#b5485a",
    accentColor: "#e8a0a0", accentSecondary: "#f0c0b0",
    barBackground: "#fde8e8", barFill: ["#e8a0a0", "#f0c0b0"],
    badgeBg: "#fde8e8", badgeText: "#c47f8a",
    borderRadius: 14, shadow: "rgba(228,160,160,0.3)",
  },
  lavender: {
    background: "#f8f4ff", backgroundGradient: ["#f8f4ff", "#f0e8ff"],
    border: "#d4b8f0",
    titleColor: "#6a1b9a", textColor: "#4a148c", subTextColor: "#9c6ab5",
    iconColor: "#ab47bc", statValueColor: "#7b1fa2",
    accentColor: "#ce93d8", accentSecondary: "#f48fb1",
    barBackground: "#ede7f6", barFill: ["#ce93d8", "#ab47bc"],
    badgeBg: "#ede7f6", badgeText: "#9c6ab5",
    borderRadius: 16, shadow: "rgba(206,147,216,0.25)",
  },
  cotton_candy: {
    background: "#fef9ff", backgroundGradient: ["#fef9ff", "#fff0fb"],
    border: "#f8c8e8",
    titleColor: "#ad1457", textColor: "#880e4f", subTextColor: "#c2618c",
    iconColor: "#f06292", statValueColor: "#d81b60",
    accentColor: "#f8bbd9", accentSecondary: "#b39ddb",
    barBackground: "#fce4ec", barFill: ["#f06292", "#b39ddb"],
    badgeBg: "#fce4ec", badgeText: "#c2618c",
    borderRadius: 20, shadow: "rgba(240,98,146,0.2)",
  },
  mint_fresh: {
    background: "#f0fff8", backgroundGradient: ["#f0fff8", "#e8fff4"],
    border: "#b2dfdb",
    titleColor: "#00695c", textColor: "#004d40", subTextColor: "#4db6ac",
    iconColor: "#26a69a", statValueColor: "#00796b",
    accentColor: "#80cbc4", accentSecondary: "#a5d6a7",
    barBackground: "#e0f2f1", barFill: ["#26a69a", "#66bb6a"],
    badgeBg: "#e0f2f1", badgeText: "#4db6ac",
    borderRadius: 14, shadow: "rgba(128,203,196,0.25)",
  },
  peach_blossom: {
    background: "#fffaf5", backgroundGradient: ["#fffaf5", "#fff3e8"],
    border: "#ffcc80",
    titleColor: "#e65100", textColor: "#bf360c", subTextColor: "#ff8a65",
    iconColor: "#ff7043", statValueColor: "#e64a19",
    accentColor: "#ffcc80", accentSecondary: "#ffab91",
    barBackground: "#fff3e0", barFill: ["#ffa726", "#ff7043"],
    badgeBg: "#fff3e0", badgeText: "#ff8a65",
    borderRadius: 14, shadow: "rgba(255,167,38,0.2)",
  },
  bubblegum: {
    background: "#fff5fe", backgroundGradient: ["#fff5fe", "#ffeafa"],
    border: "#f9a8d4",
    titleColor: "#9d174d", textColor: "#831843", subTextColor: "#db2777",
    iconColor: "#ec4899", statValueColor: "#be185d",
    accentColor: "#f9a8d4", accentSecondary: "#c4b5fd",
    barBackground: "#fdf2f8", barFill: ["#ec4899", "#a78bfa"],
    badgeBg: "#fdf2f8", badgeText: "#db2777",
    borderRadius: 18, shadow: "rgba(236,72,153,0.2)",
  },
  sunshine: {
    background: "#fffef0", backgroundGradient: ["#fffef0", "#fffde0"],
    border: "#ffe082",
    titleColor: "#f57f17", textColor: "#e65100", subTextColor: "#ffb300",
    iconColor: "#fdd835", statValueColor: "#f9a825",
    accentColor: "#ffe082", accentSecondary: "#ffcc02",
    barBackground: "#fffde7", barFill: ["#fdd835", "#ff8f00"],
    badgeBg: "#fffde7", badgeText: "#f57f17",
    borderRadius: 12, shadow: "rgba(253,216,53,0.25)",
  },
  ocean_breeze: {
    background: "#f0f8ff", backgroundGradient: ["#f0f8ff", "#e8f4ff"],
    border: "#90caf9",
    titleColor: "#0d47a1", textColor: "#1565c0", subTextColor: "#42a5f5",
    iconColor: "#2196f3", statValueColor: "#1976d2",
    accentColor: "#90caf9", accentSecondary: "#80deea",
    barBackground: "#e3f2fd", barFill: ["#42a5f5", "#26c6da"],
    badgeBg: "#e3f2fd", badgeText: "#42a5f5",
    borderRadius: 14, shadow: "rgba(144,202,249,0.3)",
  },
  starlight: {
    background: "#0d0d1a", backgroundGradient: ["#0d0d1a", "#12122a"],
    border: "#2a2a5a",
    titleColor: "#fff9e6", textColor: "#e8d5b7", subTextColor: "#7070aa",
    iconColor: "#ffd700", statValueColor: "#ffb347",
    accentColor: "#ffd700", accentSecondary: "#ff69b4",
    barBackground: "#12122a", barFill: ["#ffd700", "#ff69b4"],
    badgeBg: "#1a1a35", badgeText: "#7070aa",
    borderRadius: 14, shadow: "rgba(255,215,0,0.15)",
  },
  cherry_blossom: {
    background: "#1a0010", backgroundGradient: ["#1a0010", "#230015"],
    border: "#6b1535",
    titleColor: "#ffb3d9", textColor: "#ff99cc", subTextColor: "#99334d",
    iconColor: "#ff6699", statValueColor: "#ff99cc",
    accentColor: "#ff6699", accentSecondary: "#cc99ff",
    barBackground: "#230015", barFill: ["#ff6699", "#cc99ff"],
    badgeBg: "#2d001e", badgeText: "#99334d",
    borderRadius: 14, shadow: "rgba(255,102,153,0.2)",
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

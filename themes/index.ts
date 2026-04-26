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

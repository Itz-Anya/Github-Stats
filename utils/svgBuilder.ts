import { Theme } from "../themes/index.js";
import { GitHubUser, LanguageStat } from "../lib/github.js";
import { formatNumber, formatDate, escapeXml, truncate } from "./sanitize.js";

// ─── Options ──────────────────────────────────────────────────────────────────

export interface RenderOptions {
  theme: Theme;
  hideStats: Set<string>;
  showIcons: boolean;
  compact: boolean;
  borderRadius: number;
}

// ─── SVG Octicon paths (inline, no external deps) ─────────────────────────────

const ICONS: Record<string, string> = {
  repo:       `<path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5H13v-2h-2a1 1 0 01-1-1V8.5a1 1 0 011-1h2V4h-8a1 1 0 00-1 1v1.5a.75.75 0 01-1.5 0V5A2.5 2.5 0 012 2.5z"/>`,
  star:       `<path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`,
  commit:     `<path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zM8 6a2 2 0 100 4 2 2 0 000-4z"/>`,
  fork:       `<path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>`,
  followers:  `<path d="M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM1 5.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm10.5.5a.75.75 0 01.75-.75 3.75 3.75 0 010 7.5.75.75 0 010-1.5 2.25 2.25 0 000-4.5.75.75 0 01-.75-.75zM1.5 13.25a.75.75 0 01.75-.75 9 9 0 018.5 0 .75.75 0 01-1.05.69A7.5 7.5 0 002.25 14a.75.75 0 01-.75-.75zm10 .5A.75.75 0 0112.25 13a4.498 4.498 0 012.5 0 .75.75 0 01-.5 1.414 3 3 0 00-1.75 0 .75.75 0 01-.75-.664z"/>`,
  pr:         `<path d="M1.5 3.25a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zm5.677-.177L9.573.677A.25.25 0 0110 .854V2.5h1A2.5 2.5 0 0113.5 5v5.628a2.251 2.251 0 11-1.5 0V5a1 1 0 00-1-1h-1v1.646a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm0 9.5a.75.75 0 100 1.5.75.75 0 000-1.5zm8.25.75a.75.75 0 101.5 0 .75.75 0 00-1.5 0z"/>`,
  issue:      `<path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path fill-rule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"/>`,
  review:     `<path d="M1.5 2.75C1.5 1.784 2.284 1 3.25 1h9.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0112.75 12H9.06l-2.573 2.573A1.457 1.457 0 014 13.543V12H3.25A1.75 1.75 0 011.5 10.25v-7.5zM3.25 2.5a.25.25 0 00-.25.25v7.5c0 .138.112.25.25.25H5v2.543L7.543 10.5H12.75a.25.25 0 00.25-.25v-7.5a.25.25 0 00-.25-.25H3.25z"/>`,
  gist:       `<path d="M2.75 0A1.75 1.75 0 001 1.75v11.5c0 .966.784 1.75 1.75 1.75h10.5A1.75 1.75 0 0015 13.25v-11.5A1.75 1.75 0 0013.25 0H2.75zM2.5 1.75a.25.25 0 01.25-.25h10.5a.25.25 0 01.25.25v11.5a.25.25 0 01-.25.25H2.75a.25.25 0 01-.25-.25V1.75zM4.75 4a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z"/>`,
  streak:     `<path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-1.044 1.017.452 2.644a.75.75 0 01-1.088.791L8 9.817l-2.75 1.446a.75.75 0 01-.308.07z"/>`,
  calendar:   `<path d="M4.75 0a.75.75 0 01.75.75V2h5V.75a.75.75 0 011.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0113.25 16H2.75A1.75 1.75 0 011 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 014.75 0zm0 3.5h-.75a.25.25 0 00-.25.25V6h10V3.75a.25.25 0 00-.25-.25H10.5V5a.75.75 0 01-1.5 0V3.5h-5V5a.75.75 0 01-1.5 0V3.5zM2.5 7.5V14.25c0 .138.112.25.25.25h10.5a.25.25 0 00.25-.25V7.5h-11z"/>`,
  location:   `<path fill-rule="evenodd" d="M11.536 3.464a5 5 0 010 7.072L8 14.07l-3.536-3.534a5 5 0 117.072-7.072v.001zm1.06 8.132a6.5 6.5 0 10-9.192 0l3.535 3.536a1.5 1.5 0 002.122 0l3.535-3.536zM8 9a2 2 0 100-4 2 2 0 000 4z"/>`,
  link:       `<path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"/>`,
  company:    `<path d="M1.5 14.25c0 .138.112.25.25.25H4v-1.25a.75.75 0 01.75-.75h2.5a.75.75 0 01.75.75v1.25h2.25a.25.25 0 00.25-.25V1.75a.25.25 0 00-.25-.25h-8.5a.25.25 0 00-.25.25v12.5zM3 1.75A1.75 1.75 0 014.75 0h8.5A1.75 1.75 0 0115 1.75v12.5A1.75 1.75 0 0113.25 16h-11.5A1.75 1.75 0 010 14.25V1.75zM6.25 6.5h.5a.25.25 0 01.25.25v3.5a.25.25 0 01-.25.25h-.5a.25.25 0 01-.25-.25v-3.5a.25.25 0 01.25-.25zm3 0h.5a.25.25 0 01.25.25v3.5a.25.25 0 01-.25.25h-.5a.25.25 0 01-.25-.25v-3.5a.25.25 0 01.25-.25z"/>`,
  watcher:    `<path d="M1.679 7.932c.412-.621 1.242-1.75 2.366-2.717C5.175 4.242 6.527 3.5 8 3.5c1.473 0 2.824.742 3.955 1.715 1.124.967 1.954 2.096 2.366 2.717a.119.119 0 010 .136c-.412.621-1.242 1.75-2.366 2.717C10.825 11.758 9.473 12.5 8 12.5c-1.473 0-2.824-.742-3.955-1.715C2.92 9.818 2.09 8.69 1.679 8.068a.119.119 0 010-.136zM8 2c-1.981 0-3.67.992-4.933 2.078C1.797 5.169.88 6.423.43 7.1a1.619 1.619 0 000 1.798c.45.678 1.367 1.932 2.637 3.024C4.329 13.008 6.019 14 8 14c1.981 0 3.67-.992 4.933-2.078 1.27-1.091 2.187-2.345 2.637-3.023a1.619 1.619 0 000-1.798c-.45-.678-1.367-1.932-2.637-3.023C11.671 2.992 9.981 2 8 2zm0 8a2 2 0 100-4 2 2 0 000 4z"/>`,
  hire:       `<path d="M6 1.75C6 .784 6.784 0 7.75 0h.5C9.216 0 10 .784 10 1.75V3h2.75c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0112.75 15h-9.5A1.75 1.75 0 011.5 13.25v-8.5C1.5 3.784 2.284 3 3.25 3H6V1.75zm1.5 0a.25.25 0 01.25-.25h.5a.25.25 0 01.25.25V3h-1V1.75zM3.25 4.5a.25.25 0 00-.25.25v8.5c0 .138.112.25.25.25h9.5a.25.25 0 00.25-.25v-8.5a.25.25 0 00-.25-.25H3.25z"/>`,
};

function icon(name: string, color: string, size = 14): string {
  const path = ICONS[name] ?? "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" fill="${color}">${path}</svg>`;
}

function inlineIcon(name: string, color: string, size = 14): string {
  const svg = icon(name, color, size);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─── Gradient helpers ─────────────────────────────────────────────────────────

function gradientDefs(id: string, from: string, to: string, angle = 0): string {
  const x1 = angle === 0 ? "0%" : "0%";
  const y1 = angle === 0 ? "0%" : "0%";
  const x2 = angle === 0 ? "100%" : "0%";
  const y2 = angle === 0 ? "0%" : "100%";
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
    <stop offset="0%" stop-color="${from}"/>
    <stop offset="100%" stop-color="${to}"/>
  </linearGradient>`;
}

// ─── Sub-section renderers ────────────────────────────────────────────────────

interface StatRow {
  key: string;
  label: string;
  value: string;
  iconName: string;
}

function buildStatRows(user: GitHubUser): StatRow[] {
  return [
    { key: "repos",     label: "Public Repos",     value: formatNumber(user.publicRepos),          iconName: "repo"     },
    { key: "stars",     label: "Total Stars",       value: formatNumber(user.totalStars),           iconName: "star"     },
    { key: "forks",     label: "Total Forks",       value: formatNumber(user.totalForks),           iconName: "fork"     },
    { key: "commits",   label: "Total Commits",     value: formatNumber(user.totalCommits),         iconName: "commit"   },
    { key: "prs",       label: "Pull Requests",     value: formatNumber(user.totalPRs),             iconName: "pr"       },
    { key: "issues",    label: "Issues Opened",     value: formatNumber(user.totalIssuesOpened),    iconName: "issue"    },
    { key: "reviews",   label: "Code Reviews",      value: formatNumber(user.totalCodeReviews),     iconName: "review"   },
    { key: "followers", label: "Followers",         value: formatNumber(user.followers),            iconName: "followers"},
    { key: "following", label: "Following",         value: formatNumber(user.following),            iconName: "followers"},
    { key: "gists",     label: "Public Gists",      value: formatNumber(user.publicGists),          iconName: "gist"     },
    { key: "watchers",  label: "Watchers",          value: formatNumber(user.totalWatchers),        iconName: "watcher"  }
  ];
}

function renderLanguageBar(langs: LanguageStat[], y: number, width: number, padding: number): string {
  if (!langs.length) return "";
  const barW = width - padding * 2;
  let x = 0;
  const segments = langs.map((l) => {
    const w = Math.round((l.percentage / 100) * barW);
    const seg = `<rect x="${padding + x}" y="${y}" width="${w}" height="8" fill="${l.color}" rx="2"/>`;
    x += w;
    return seg;
  }).join("");

  const dots = langs.map((l, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const lx = padding + col * ((barW) / 4);
    const ly = y + 16 + row * 20;
    return `
      <circle cx="${lx + 5}" cy="${ly + 5}" r="5" fill="${l.color}"/>
      <text x="${lx + 14}" y="${ly + 9}" font-family="system-ui,sans-serif" font-size="10" fill="${"#8b949e"}">${escapeXml(l.name)} <tspan font-weight="600" fill="${"#c9d1d9"}">${l.percentage}%</tspan></text>
    `;
  }).join("");

  return `
    <!-- Language bar -->
    <rect x="${padding}" y="${y}" width="${barW}" height="8" rx="4" fill="#21262d" opacity="0.5"/>
    ${segments}
    ${dots}
  `;
}

function renderLanguageBarThemed(
  langs: LanguageStat[], y: number, width: number, padding: number,
  subTextColor: string, textColor: string, barBg: string
): string {
  if (!langs.length) return "";
  const barW = width - padding * 2;
  let x = 0;
  const segments = langs.map((l) => {
    const w = Math.max(2, Math.round((l.percentage / 100) * barW));
    const seg = `<rect x="${padding + x}" y="${y}" width="${w}" height="8" fill="${l.color}" rx="2"/>`;
    x += w;
    return seg;
  }).join("");

  const rows = Math.ceil(langs.length / 4);
  const dots = langs.map((l, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const lx = padding + col * (barW / 4);
    const ly = y + 16 + row * 20;
    return `
      <circle cx="${lx + 5}" cy="${ly + 5}" r="4.5" fill="${l.color}"/>
      <text x="${lx + 14}" y="${ly + 9}" font-family="system-ui,sans-serif" font-size="10" fill="${subTextColor}">${escapeXml(truncate(l.name, 12))} <tspan font-weight="600" fill="${textColor}">${l.percentage}%</tspan></text>
    `;
  }).join("");

  const legendHeight = rows * 20;
  return { segments, dots, legendHeight, barBg } as unknown as string; // trick: return object
  // We can't return an object here so let's just use a tuple approach below
}

// ─── Main card renderer ───────────────────────────────────────────────────────

export function renderStatsCard(user: GitHubUser, opts: RenderOptions): string {
  const { theme, hideStats, showIcons, compact } = opts;
  const br = opts.borderRadius;
  const P = compact ? 18 : 24; // padding
  const AVATAR_SIZE = compact ? 56 : 72;
  const W = compact ? 420 : 500;

  // ── Filter stat rows
  const allStats = buildStatRows(user).filter((s) => !hideStats.has(s.key));
  const cols = 2;
  const statRows = Math.ceil(allStats.length / cols);
  const STAT_ROW_H = compact ? 34 : 40;

  // ── Section heights
  const HEADER_H = AVATAR_SIZE + P * 2;
  const META_H = compact ? 0 : buildMetaLines(user).length * 18 + 12; // metadata below header
  const DIVIDER1_Y = HEADER_H + META_H + 4;
  const STATS_SECTION_H = statRows * STAT_ROW_H + 24;
  const DIVIDER2_Y = DIVIDER1_Y + STATS_SECTION_H;

  // ── Language section
  const hasLangs = user.topLanguages.length > 0 && !hideStats.has("languages");
  const langRows = Math.ceil(user.topLanguages.length / 4);
  const LANG_SECTION_H = hasLangs ? (8 + 16 + langRows * 20 + 24) : 0;
  const DIVIDER3_Y = DIVIDER2_Y + LANG_SECTION_H;

  // ── Streak section
  const hasStreak = user.hasToken && !hideStats.has("streakinfo");
  const STREAK_SECTION_H = hasStreak ? 54 : 0;

  const CARD_H = DIVIDER3_Y + STREAK_SECTION_H + P;

  // ── Gradient IDs
  const bgGradId = `bgGrad_${Math.random().toString(36).slice(2, 7)}`;
  const barGradId = `barGrad_${Math.random().toString(36).slice(2, 7)}`;
  const accentGradId = `accentGrad_${Math.random().toString(36).slice(2, 7)}`;

  const barFill = Array.isArray(theme.barFill) ? theme.barFill : [theme.barFill, theme.barFill];

  const defs = `
    <defs>
      ${theme.backgroundGradient ? gradientDefs(bgGradId, theme.backgroundGradient[0], theme.backgroundGradient[1], 90) : ""}
      ${gradientDefs(barGradId, barFill[0], barFill[1])}
      ${gradientDefs(accentGradId, theme.accentColor, theme.accentSecondary)}
      <clipPath id="avatarClip">
        <circle cx="${P + AVATAR_SIZE / 2}" cy="${P + AVATAR_SIZE / 2}" r="${AVATAR_SIZE / 2}"/>
      </clipPath>
      <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="${theme.shadow}"/>
      </filter>
    </defs>
  `;

  // ── Card background
  const bgFill = theme.backgroundGradient ? `url(#${bgGradId})` : theme.background;
  const cardBg = `
    <rect x="0.5" y="0.5" width="${W - 1}" height="${CARD_H - 1}"
      rx="${br}" ry="${br}"
      fill="${bgFill}"
      stroke="${theme.border}" stroke-width="1"
      filter="url(#cardShadow)"
    />
  `;

  // ── Avatar
  const avatarSrc = user.avatarBase64 ?? `${user.avatarUrl}?s=128`;
  const avatarSvg = `
    <image
      href="${avatarSrc}"
      x="${P}" y="${P}"
      width="${AVATAR_SIZE}" height="${AVATAR_SIZE}"
      clip-path="url(#avatarClip)"
      preserveAspectRatio="xMidYMid slice"
    />
    <circle
      cx="${P + AVATAR_SIZE / 2}" cy="${P + AVATAR_SIZE / 2}"
      r="${AVATAR_SIZE / 2 + 1.5}"
      fill="none"
      stroke="url(#accentGradId_ring)"
      stroke-width="2.5"
      opacity="0.8"
    />
  `;

  // ── Header text
  const nameX = P + AVATAR_SIZE + 16;
  const displayName = truncate(user.name ?? user.login, compact ? 22 : 26);
  const nameY = P + (compact ? 22 : 26);

  let headerSvg = `
    <text x="${nameX}" y="${nameY}"
      font-family="system-ui,-apple-system,Segoe UI,sans-serif"
      font-size="${compact ? 17 : 21}" font-weight="700"
      fill="${theme.titleColor}"
    >${escapeXml(displayName)}</text>
    <text x="${nameX}" y="${nameY + (compact ? 18 : 22)}"
      font-family="system-ui,-apple-system,Segoe UI,sans-serif"
      font-size="${compact ? 11 : 13}"
      fill="${theme.accentColor}"
    >@${escapeXml(user.login)}</text>
  `;

  if (user.bio && !compact) {
    headerSvg += `
      <text x="${nameX}" y="${nameY + 42}"
        font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="11" fill="${theme.subTextColor}"
      >${escapeXml(truncate(user.bio, 46))}</text>
    `;
  }

  // badges: hireable, account age, joined
  const badges: string[] = [];
  if (user.hireable) badges.push("✦ Open to work");
  badges.push(`Joined ${formatDate(user.createdAt)}`);
  if (user.location) badges.push(`📍 ${truncate(user.location, 20)}`);

  let badgeY = nameY + (compact ? 36 : (user.bio ? 60 : 44));
  for (const badge of badges.slice(0, compact ? 1 : 2)) {
    headerSvg += `
      <text x="${nameX}" y="${badgeY}"
        font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="10" fill="${theme.subTextColor}"
      >${escapeXml(badge)}</text>
    `;
    badgeY += 14;
  }

  // ── Metadata row (company, location, website) — full mode only
  
  // ── Dividers
  const divider = (y: number) =>
    `<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="${theme.border}" stroke-width="1" opacity="0.6"/>`;

  // ── Stats grid
  const STATS_Y = DIVIDER1_Y + 16;
  const statColW = (W - P * 2) / cols;

  let statsSvg = "";
  if (!hideStats.has("stats")) {
    statsSvg += `
      <text x="${P}" y="${STATS_Y - 4}"
        font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="11" font-weight="600" text-transform="uppercase"
        fill="${theme.subTextColor}" letter-spacing="0.5"
      >GITHUB STATS</text>
    `;

    allStats.forEach((stat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = P + col * statColW;
      const sy = STATS_Y + 8 + row * STAT_ROW_H;
      const iconX = sx;
      const labelX = showIcons ? sx + 20 : sx;
      const valueX = sx + statColW - 6;

      statsSvg += `
        <g>
          ${showIcons ? `<image href="${inlineIcon(stat.iconName, theme.iconColor, 13)}" x="${iconX}" y="${sy + 1}" width="13" height="13"/>` : ""}
          <text x="${labelX}" y="${sy + 11}"
            font-family="system-ui,-apple-system,Segoe UI,sans-serif"
            font-size="${compact ? 10.5 : 11.5}" fill="${theme.subTextColor}"
          >${escapeXml(stat.label)}</text>
          <text x="${valueX}" y="${sy + 11}"
            font-family="system-ui,-apple-system,Segoe UI,sans-serif"
            font-size="${compact ? 11.5 : 12.5}" font-weight="700"
            fill="${theme.statValueColor}" text-anchor="end"
          >${escapeXml(stat.value)}</text>
          <line x1="${sx}" y1="${sy + 15}" x2="${sx + statColW - 8}" y2="${sy + 15}"
            stroke="${theme.border}" stroke-width="0.5" opacity="0.4"/>
        </g>
      `;
    });
  }

  // ── Language section
  let langSvg = "";
  if (hasLangs) {
    const LANG_Y = DIVIDER2_Y + 16;
    const barW = W - P * 2;

    langSvg += `
      <text x="${P}" y="${LANG_Y - 4}"
        font-family="system-ui,-apple-system,Segoe UI,sans-serif"
        font-size="11" font-weight="600"
        fill="${theme.subTextColor}" letter-spacing="0.5"
      >TOP LANGUAGES</text>
    `;

    // Bar background
    langSvg += `<rect x="${P}" y="${LANG_Y + 6}" width="${barW}" height="8" rx="4" fill="${theme.barBackground}" opacity="0.8"/>`;

    // Colored segments
    let xOff = 0;
    for (const l of user.topLanguages) {
      const w = Math.max(2, Math.round((l.percentage / 100) * barW));
      langSvg += `<rect x="${P + xOff}" y="${LANG_Y + 6}" width="${w}" height="8" fill="${l.color}" rx="2"/>`;
      xOff += w;
    }

    // Legend dots
    const langRows = Math.ceil(user.topLanguages.length / 4);
    for (let row = 0; row < langRows; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        if (idx >= user.topLanguages.length) break;
        const l = user.topLanguages[idx];
        const lx = P + col * (barW / 4);
        const ly = LANG_Y + 22 + row * 20;
        langSvg += `
          <circle cx="${lx + 4}" cy="${ly + 4}" r="4" fill="${l.color}"/>
          <text x="${lx + 12}" y="${ly + 8}"
            font-family="system-ui,-apple-system,Segoe UI,sans-serif"
            font-size="10" fill="${theme.subTextColor}"
          >${escapeXml(truncate(l.name, 11))} <tspan font-weight="600" fill="${theme.textColor}">${l.percentage}%</tspan></text>
        `;
      }
    }
  }

  // ── Streak section
  let streakSvg = "";
  if (hasStreak) {
    const SY = DIVIDER3_Y + 14;
    const halfW = (W - P * 2 - 12) / 2;

    const streakBlocks = [
      { label: "Current Streak", value: `${user.currentStreak} days`, icon: "streak" },
      { label: "Longest Streak", value: `${user.longestStreak} days`, icon: "streak" },
    ];

    streakBlocks.forEach((blk, i) => {
      const bx = P + i * (halfW + 12);
      streakSvg += `
        <rect x="${bx}" y="${SY}" width="${halfW}" height="36"
          rx="8" ry="8"
          fill="${theme.badgeBg}" stroke="${theme.border}" stroke-width="0.8"/>
        <text x="${bx + halfW / 2}" y="${SY + 14}"
          font-family="system-ui,-apple-system,Segoe UI,sans-serif"
          font-size="10" fill="${theme.subTextColor}" text-anchor="middle"
        >${escapeXml(blk.label)}</text>
        <text x="${bx + halfW / 2}" y="${SY + 29}"
          font-family="system-ui,-apple-system,Segoe UI,sans-serif"
          font-size="14" font-weight="700" fill="${theme.accentColor}" text-anchor="middle"
        >${escapeXml(blk.value)}</text>
      `;
    });
  }

  // ── Bottom accent bar
  const accentBar = `
    <rect x="${br < 4 ? 0 : br * 0.5}" y="${CARD_H - 4}" width="${W - (br < 4 ? 0 : br)}" height="4"
      rx="${Math.min(br, 4)}"
      fill="url(#${accentGradId})"/>
  `;

  // Accent gradient for ring needs its own def
  const ringGradDef = `<linearGradient id="accentGradId_ring" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${theme.accentColor}"/>
    <stop offset="100%" stop-color="${theme.accentSecondary}"/>
  </linearGradient>`;

  const fullDefs = defs.replace("</defs>", `${ringGradDef}</defs>`);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${CARD_H}"
  viewBox="0 0 ${W} ${CARD_H}"
  role="img"
  aria-label="GitHub stats for ${escapeXml(user.login)}"
>
  ${fullDefs}
  ${cardBg}
  ${avatarSvg}
  ${headerSvg}
  ${metaSvg}
  ${divider(DIVIDER1_Y)}
  ${statsSvg}
  ${hasLangs ? divider(DIVIDER2_Y) : ""}
  ${langSvg}
  ${hasStreak ? divider(DIVIDER3_Y) : ""}
  ${streakSvg}
  ${accentBar}
</svg>`;
}

function buildMetaLines(user: GitHubUser): string[] {
  const lines: string[] = [];
  if (user.company) lines.push(`🏢 ${truncate(user.company.replace(/^@/, ""), 30)}`);
  if (user.blog) lines.push(`🔗 ${truncate(user.blog.replace(/^https?:\/\//, ""), 35)}`);
  if (user.twitterUsername) lines.push(`𝕏 @${user.twitterUsername}`);
  return lines.slice(0, 2);
}

// ─── Error card ───────────────────────────────────────────────────────────────

export function renderErrorCard(message: string, theme: Theme, br: number): string {
  const W = 460;
  const H = 110;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
    rx="${br}" ry="${br}"
    fill="${theme.background}" stroke="#f85149" stroke-width="1.5"/>
  <rect x="0" y="${H - 3}" width="${W}" height="3" rx="${Math.min(br, 3)}" fill="#f85149" opacity="0.7"/>
  <text x="20" y="36"
    font-family="system-ui,-apple-system,Segoe UI,sans-serif"
    font-size="15" font-weight="700" fill="#f85149"
  >⚠ GitHub Stats — Error</text>
  <text x="20" y="60"
    font-family="system-ui,-apple-system,Segoe UI,sans-serif"
    font-size="12" fill="${theme.subTextColor}"
  >${escapeXml(message)}</text>
  <text x="20" y="82"
    font-family="system-ui,-apple-system,Segoe UI,sans-serif"
    font-size="10" fill="${theme.subTextColor}" opacity="0.5"
  >github-stats-service v2 · add GITHUB_TOKEN for full stats</text>
</svg>`;
}

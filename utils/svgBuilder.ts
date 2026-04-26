import { Theme } from "../themes/index.js";
import { GitHubUser } from "../lib/github.js";
import { formatNumber } from "./sanitize.js";

export interface RenderOptions {
  theme: Theme;
  hideStats: Set<string>;
  showIcons: boolean;
  compact: boolean;
  borderRadius: number;
  hasToken: boolean;
}

// SVG icons as inline paths (no external deps)
const ICONS: Record<string, string> = {
  repo: `<path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 010-1.5H13v-2h-2a1 1 0 01-1-1V8.5a1 1 0 011-1h2V4h-8a1 1 0 00-1 1v1.5a.75.75 0 01-1.5 0V5A2.5 2.5 0 012 2.5z"/>`,
  star: `<path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/>`,
  commit: `<path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5h-3.32zM8 6a2 2 0 100 4 2 2 0 000-4z"/>`,
  contrib: `<path d="M11.93 8.5a4.002 4.002 0 01-7.86 0H.75a.75.75 0 010-1.5h3.32a4.002 4.002 0 017.86 0h3.32a.75.75 0 010 1.5H11.93zM8 6a2 2 0 100 4A2 2 0 008 6zM1.5 2.75a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75zM1.5 13.25a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75z"/>`,
  followers: `<path d="M5.5 3.5a2 2 0 100 4 2 2 0 000-4zM1 5.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM12.5 4a2 2 0 100 4 2 2 0 000-4zM10 5.5a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm-2.05 4.57C8.99 9.42 9.75 9 10.5 9h3a3.5 3.5 0 013.5 3.5v.5a.5.5 0 01-.5.5H10a.5.5 0 01-.5-.5v-.5a3.5 3.5 0 00-.55-1.93zM2 9h3c.75 0 1.51.42 2.05 1.07A3.5 3.5 0 007.5 12.5v.5a.5.5 0 01-.5.5H.5A.5.5 0 010 13v-.5A3.5 3.5 0 013.5 9H2z"/>`,
  following: `<path d="M9.5 0a.75.75 0 01.75.75v2h2a.75.75 0 010 1.5h-2v2a.75.75 0 01-1.5 0v-2h-2a.75.75 0 010-1.5h2v-2A.75.75 0 019.5 0zM5 6.5a2 2 0 100 4 2 2 0 000-4zM.5 9a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zm.5 5.5c0-1.93 1.57-3.5 3.5-3.5h2c.62 0 1.2.16 1.7.45A4.002 4.002 0 006 15H1a.5.5 0 01-.5-.5z"/>`,
};

function icon(name: string, color: string, size = 16): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" fill="${color}">${ICONS[name] ?? ""}</svg>`;
}

interface StatItem {
  key: string;
  label: string;
  value: string;
  iconName: string;
}

function buildStatItems(user: GitHubUser, hasToken: boolean): StatItem[] {
  return [
    { key: "repos", label: "Public Repos", value: formatNumber(user.publicRepos), iconName: "repo" },
    { key: "stars", label: "Total Stars", value: formatNumber(user.totalStars), iconName: "star" },
    { key: "commits", label: "Total Commits", value: hasToken ? formatNumber(user.totalCommits) : formatNumber(user.totalCommits) + (user.totalCommits === 0 ? " (auth required)" : ""), iconName: "commit" },
    { key: "contributions", label: "Contributions (yr)", value: formatNumber(user.contributions + (hasToken ? user.privateContributions : 0)), iconName: "contrib" },
    { key: "followers", label: "Followers", value: formatNumber(user.followers), iconName: "followers" },
    { key: "following", label: "Following", value: formatNumber(user.following), iconName: "following" },
  ];
}

export function renderStatsCard(user: GitHubUser, opts: RenderOptions): string {
  const { theme, hideStats, showIcons, compact, hasToken } = opts;
  const br = opts.borderRadius;

  const allStats = buildStatItems(user, hasToken).filter(
    (s) => !hideStats.has(s.key)
  );

  const CARD_WIDTH = compact ? 380 : 460;
  const PADDING = 24;
  const AVATAR_SIZE = compact ? 52 : 68;
  const HEADER_HEIGHT = AVATAR_SIZE + PADDING * 2;

  // Layout stats in 2 columns
  const cols = 2;
  const rows = Math.ceil(allStats.length / cols);
  const STAT_HEIGHT = compact ? 36 : 44;
  const STATS_TOP = HEADER_HEIGHT + 16;
  const STATS_AREA_HEIGHT = rows * STAT_HEIGHT + 16;
  const CARD_HEIGHT = STATS_TOP + STATS_AREA_HEIGHT + PADDING;

  const statColWidth = (CARD_WIDTH - PADDING * 2) / cols;

  const statsSVG = allStats
    .map((stat, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = PADDING + col * statColWidth;
      const y = STATS_TOP + row * STAT_HEIGHT;
      const iconX = x;
      const textX = showIcons ? x + 22 : x;
      const valueX = x + statColWidth - 8;

      return `
      <g transform="translate(0, ${y})">
        ${showIcons ? `<image href="data:image/svg+xml;charset=utf-8,${encodeURIComponent(icon(stat.iconName, theme.iconColor, 14))}" x="${iconX}" y="2" width="14" height="14"/>` : ""}
        <text x="${textX}" y="13" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${compact ? 11 : 12}" fill="${theme.subTextColor}">${escapeXml(stat.label)}</text>
        <text x="${valueX}" y="13" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-size="${compact ? 12 : 13}" font-weight="600" fill="${theme.statValueColor}" text-anchor="end">${escapeXml(stat.value)}</text>
      </g>`;
    })
    .join("");

  // Divider line between header and stats
  const dividerY = HEADER_HEIGHT + 8;

  const displayName = user.name ?? user.login;
  const bioText = user.bio
    ? truncate(user.bio, compact ? 48 : 64)
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <clipPath id="avatar-clip">
      <circle cx="${PADDING + AVATAR_SIZE / 2}" cy="${PADDING + AVATAR_SIZE / 2}" r="${AVATAR_SIZE / 2}"/>
    </clipPath>
    <style>
      .card { filter: drop-shadow(0px 4px 12px rgba(0,0,0,0.15)); }
    </style>
  </defs>

  <!-- Card background -->
  <rect class="card" x="0.5" y="0.5"
    width="${CARD_WIDTH - 1}" height="${CARD_HEIGHT - 1}"
    rx="${br}" ry="${br}"
    fill="${theme.background}"
    stroke="${theme.border}"
    stroke-width="1"
  />

  <!-- Avatar -->
  <image
    href="${user.avatarUrl}"
    x="${PADDING}" y="${PADDING}"
    width="${AVATAR_SIZE}" height="${AVATAR_SIZE}"
    clip-path="url(#avatar-clip)"
    preserveAspectRatio="xMidYMid slice"
  />

  <!-- Avatar border ring -->
  <circle
    cx="${PADDING + AVATAR_SIZE / 2}" cy="${PADDING + AVATAR_SIZE / 2}"
    r="${AVATAR_SIZE / 2}"
    fill="none"
    stroke="${theme.accentColor}"
    stroke-width="2"
    opacity="0.7"
  />

  <!-- Name -->
  <text
    x="${PADDING + AVATAR_SIZE + 14}"
    y="${PADDING + (compact ? 20 : 24)}"
    font-family="system-ui,-apple-system,Segoe UI,sans-serif"
    font-size="${compact ? 16 : 20}"
    font-weight="700"
    fill="${theme.titleColor}"
  >${escapeXml(truncate(displayName, 28))}</text>

  <!-- Username -->
  <text
    x="${PADDING + AVATAR_SIZE + 14}"
    y="${PADDING + (compact ? 36 : 44)}"
    font-family="system-ui,-apple-system,Segoe UI,sans-serif"
    font-size="${compact ? 11 : 13}"
    fill="${theme.accentColor}"
  >@${escapeXml(user.login)}</text>

  ${
    bioText && !compact
      ? `<text
    x="${PADDING + AVATAR_SIZE + 14}"
    y="${PADDING + 62}"
    font-family="system-ui,-apple-system,Segoe UI,sans-serif"
    font-size="11"
    fill="${theme.subTextColor}"
  >${escapeXml(bioText)}</text>`
      : ""
  }

  <!-- Divider -->
  <line x1="${PADDING}" y1="${dividerY}" x2="${CARD_WIDTH - PADDING}" y2="${dividerY}"
    stroke="${theme.border}" stroke-width="1"/>

  <!-- Stats -->
  ${statsSVG}

  <!-- Bottom accent bar -->
  <rect x="0" y="${CARD_HEIGHT - 3}" width="${CARD_WIDTH}" height="3"
    rx="${br}" ry="${br}"
    fill="${theme.accentColor}" opacity="0.6"/>
</svg>`;
}

export function renderErrorCard(message: string, theme: Theme, borderRadius: number): string {
  const W = 400;
  const H = 100;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
    rx="${borderRadius}" ry="${borderRadius}"
    fill="${theme.background}" stroke="#f85149" stroke-width="1.5"/>
  <text x="20" y="35" font-family="system-ui,-apple-system,sans-serif"
    font-size="14" font-weight="600" fill="#f85149">⚠ GitHub Stats Error</text>
  <text x="20" y="58" font-family="system-ui,-apple-system,sans-serif"
    font-size="12" fill="${theme.subTextColor}">${escapeXml(message)}</text>
  <text x="20" y="78" font-family="system-ui,-apple-system,sans-serif"
    font-size="11" fill="${theme.subTextColor}" opacity="0.6">github-stats-service</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + "…" : str;
}

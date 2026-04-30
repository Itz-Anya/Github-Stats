import { Theme } from "../themes/index.js";
import { GitHubUser, LanguageStat } from "../lib/github.js";
import { formatNumber, formatDate, escapeXml, truncate } from "./sanitize.js";

// ─── Options ───────────────────────────────────────────────────────────────────

export interface RenderOptions {
  theme: Theme;
  hideStats: Set<string>;
  showIcons: boolean;
  compact: boolean;
  borderRadius: number;
  hideAvatarRing?: boolean;
  hideStreakEmoji?: boolean;
  sectionSpacing?: number;   // extra px between lang/streak/pinned sections (default 0)
}

// ─── SVG Octicon paths ────────────────────────────────────────────────────────

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

// ─── Unique ID helper ─────────────────────────────────────────────────────────

function uid(prefix = "g"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Gradient helpers ─────────────────────────────────────────────────────────

function linearGradient(
  id: string,
  stops: Array<{ offset: string; color: string; opacity?: number }>,
  x1 = "0%", y1 = "0%", x2 = "100%", y2 = "0%"
): string {
  const s = stops.map(st =>
    `<stop offset="${st.offset}" stop-color="${st.color}"${st.opacity !== undefined ? ` stop-opacity="${st.opacity}"` : ""}/>`
  ).join("");
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${s}</linearGradient>`;
}

// ─── CSS Animations ───────────────────────────────────────────────────────────

function buildAnimations(): string {
  return `<style>
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes avatarGlow {
      0%,100% { opacity: 0.55; }
      50%      { opacity: 1;    }
    }
    @keyframes barGrow {
      from { width: 0; }
    }
    .card-fade   { animation: fadeIn    0.55s ease both; }
    .header-anim { animation: fadeInUp  0.5s ease 0.08s both; }
    .stat-row-0  { animation: fadeInUp  0.5s ease 0.12s both; }
    .stat-row-1  { animation: fadeInUp  0.5s ease 0.17s both; }
    .stat-row-2  { animation: fadeInUp  0.5s ease 0.22s both; }
    .stat-row-3  { animation: fadeInUp  0.5s ease 0.27s both; }
    .stat-row-4  { animation: fadeInUp  0.5s ease 0.32s both; }
    .stat-row-5  { animation: fadeInUp  0.5s ease 0.37s both; }
    .stat-row-6  { animation: fadeInUp  0.5s ease 0.42s both; }
    .lang-anim   { animation: fadeInUp  0.5s ease 0.48s both; }
    .streak-anim { animation: fadeInUp  0.5s ease 0.54s both; }
    .pinned-anim { animation: fadeInUp  0.5s ease 0.60s both; }
    .avatar-ring { animation: avatarGlow 3s ease-in-out infinite; }
    .bar-fill    { animation: barGrow   1.1s cubic-bezier(.2,.8,.3,1) 0.35s both; }
  </style>`;
}

// ─── Noise filter ─────────────────────────────────────────────────────────────

function noiseFilter(id: string): string {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch" result="noise"/>
    <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise"/>
    <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>
    <feComposite in="blended" in2="SourceGraphic" operator="in"/>
  </filter>`;
}

// ─── Stat row data ────────────────────────────────────────────────────────────

interface StatRow {
  key: string;
  label: string;
  value: string;
  iconName: string;
}

function buildStatRows(user: GitHubUser): StatRow[] {
  return [
    { key: "repos",     label: "Public Repos",   value: formatNumber(user.publicRepos),        iconName: "repo"      },
    { key: "stars",     label: "Total Stars",     value: formatNumber(user.totalStars),         iconName: "star"      },
    { key: "forks",     label: "Total Forks",     value: formatNumber(user.totalForks),         iconName: "fork"      },
    { key: "commits",   label: "Total Commits",   value: formatNumber(user.totalCommits),       iconName: "commit"    },
    { key: "prs",       label: "Pull Requests",   value: formatNumber(user.totalPRs),           iconName: "pr"        },
    { key: "issues",    label: "Issues Opened",   value: formatNumber(user.totalIssuesOpened),  iconName: "issue"     },
    { key: "reviews",   label: "Code Reviews",    value: formatNumber(user.totalCodeReviews),   iconName: "review"    },
    { key: "followers", label: "Followers",       value: formatNumber(user.followers),          iconName: "followers" },
    { key: "following", label: "Following",       value: formatNumber(user.following),          iconName: "followers" },
    { key: "gists",     label: "Public Gists",    value: formatNumber(user.publicGists),        iconName: "gist"      },
    { key: "watchers",  label: "Watchers",        value: formatNumber(user.totalWatchers),      iconName: "watcher"   },
  ];
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function buildSparkline(
  value: number, maxVal: number,
  x: number, y: number, w: number, h: number,
  strokeColor: string, dotColor: string, areaGradId: string
): string {
  // Deterministic pseudo-random points seeded from value
  const pts: number[] = [];
  let s = (value || 1) & 0xffffffff;
  for (let i = 0; i < 12; i++) {
    s = Math.imul(s, 1664525) + 1013904223 | 0;
    pts.push(Math.abs(s) % 100);
  }
  const scale = maxVal > 0 ? value / maxVal : 0.5;
  pts[pts.length - 1] = Math.round(30 + scale * 65);

  const max = Math.max(...pts), min = Math.min(...pts);
  const range = max - min || 1;

  const coords = pts.map((p, i) => [
    x + (i / (pts.length - 1)) * w,
    y + h - ((p - min) / range) * h,
  ]);

  const polyPoints = coords.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" ");
  const lastX = coords[coords.length - 1][0].toFixed(1);
  const lastY = coords[coords.length - 1][1].toFixed(1);
  const areaD = `M ${coords.map(([px,py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(" L ")} L ${(x+w).toFixed(1)},${(y+h).toFixed(1)} L ${x.toFixed(1)},${(y+h).toFixed(1)} Z`;

  return `
    <defs>
      ${linearGradient(areaGradId,
        [{offset:"0%",color:dotColor,opacity:0.3},{offset:"100%",color:dotColor,opacity:0}],
        "0%","0%","0%","100%"
      )}
    </defs>
    <path d="${areaD}" fill="url(#${areaGradId})"/>
    <polyline points="${polyPoints}" fill="none" stroke="${strokeColor}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${lastX}" cy="${lastY}" r="2.2" fill="${dotColor}"/>
  `;
}

// ─── Circular progress ring ───────────────────────────────────────────────────

function circularProgress(
  cx: number, cy: number, r: number,
  percent: number,
  label: string, value: string,
  trackColor: string, gradId: string,
  accentA: string, accentB: string,
  labelColor: string, valueColor: string
): string {
  const circ = 2 * Math.PI * r;
  const dash = Math.min(percent / 100, 1) * circ;
  const gap  = circ - dash;

  return `
    <defs>
      ${linearGradient(gradId,
        [{offset:"0%",color:accentA},{offset:"100%",color:accentB}],
        "0%","0%","100%","100%"
      )}
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${trackColor}" stroke-width="3.5" opacity="0.3"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="url(#${gradId})" stroke-width="3.5"
      stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
      stroke-dashoffset="${(circ * 0.25).toFixed(2)}"
      stroke-linecap="round"
      transform="rotate(-90 ${cx} ${cy})"
    />
    <text x="${cx}" y="${cy - 5}" text-anchor="middle"
      font-family="'SF Mono',ui-monospace,monospace" font-size="10" font-weight="800"
      fill="${valueColor}">${escapeXml(value)}</text>
    <text x="${cx}" y="${cy + 7}" text-anchor="middle"
      font-family="system-ui,sans-serif" font-size="8" fill="${labelColor}" opacity="0.75"
    >${escapeXml(label)}</text>
  `;
}

// ─── Section heading ──────────────────────────────────────────────────────────

function sectionHeading(
  x: number, y: number, label: string,
  accentColor: string, subTextColor: string, totalWidth: number
): string {
  const approxLabelWidth = label.length * 6.2 + 12;
  return `
    <rect x="${x}" y="${y - 9}" width="3" height="11" rx="1.5" fill="${accentColor}" opacity="0.85"/>
    <text x="${x + 8}" y="${y}"
      font-family="system-ui,-apple-system,sans-serif"
      font-size="10" font-weight="700" letter-spacing="1.3"
      fill="${subTextColor}" opacity="0.8"
    >${escapeXml(label)}</text>
    <line x1="${x + approxLabelWidth}" y1="${y - 4.5}" x2="${x + totalWidth}" y2="${y - 4.5}"
      stroke="${accentColor}" stroke-width="0.6" opacity="0.2"/>
  `;
}

// ─── Fancy gradient divider ───────────────────────────────────────────────────

function fancyDivider(x: number, y: number, w: number, gradId: string, accentColor: string, borderColor: string): string {
  return `
    <defs>
      ${linearGradient(gradId,
        [{offset:"0%",color:borderColor,opacity:0},{offset:"30%",color:accentColor,opacity:0.45},
         {offset:"70%",color:accentColor,opacity:0.45},{offset:"100%",color:borderColor,opacity:0}]
      )}
    </defs>
    <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="url(#${gradId})" stroke-width="1"/>
  `;
}

// ─── Account age badge ────────────────────────────────────────────────────────

function accountAgeBadge(
  x: number, y: number, ageDays: number,
  accentColor: string, badgeBg: string, border: string
): string {
  const years = (ageDays / 365).toFixed(1);
  return `
    <rect x="${x}" y="${y}" width="64" height="18" rx="9"
      fill="${badgeBg}" stroke="${border}" stroke-width="0.8" opacity="0.85"/>
    <text x="${x + 32}" y="${y + 12.5}" text-anchor="middle"
      font-family="'SF Mono',ui-monospace,monospace" font-size="9" font-weight="600"
      fill="${accentColor}"
    >⏱ ${escapeXml(years)}yr</text>
  `;
}

// ─── Meta / bio helpers ───────────────────────────────────────────────────────

function buildMetaLines(user: GitHubUser): string[] {
  const lines: string[] = [];
  if (user.company)         lines.push(`🏢 ${truncate(user.company.replace(/^@/, ""), 30)}`);
  if (user.twitterUsername) lines.push(`𝕏 @${user.twitterUsername}`);
  return lines.slice(0, 2);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + w).length <= maxChars) { cur += (cur ? " " : "") + w; }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ─── Pinned repos mini-cards ──────────────────────────────────────────────────

function renderPinnedRepos(
  user: GitHubUser, startY: number, W: number, P: number, theme: Theme
): { svg: string; height: number } {
  if (!user.pinnedRepos || user.pinnedRepos.length === 0) return { svg: "", height: 0 };
  const repos  = user.pinnedRepos.slice(0, 4);
  const cols   = 2;
  const cardW  = Math.floor((W - P * 2 - 8) / cols);
  const cardH  = 62;
  const rows   = Math.ceil(repos.length / cols);
  const totalH = rows * (cardH + 8) + 28;

  let svg = "";
  repos.forEach((repo, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const rx  = P + col * (cardW + 8);
    const ry  = startY + 22 + row * (cardH + 8);
    const bgId = uid("rpbg");

    svg += `
      <defs>
        ${linearGradient(bgId,
          [{offset:"0%",color:theme.badgeBg},{offset:"100%",color:theme.background}],
          "0%","0%","0%","100%"
        )}
      </defs>
      <rect x="${rx}" y="${ry}" width="${cardW}" height="${cardH}" rx="8"
        fill="url(#${bgId})" stroke="${theme.border}" stroke-width="0.8"/>
      <image href="${inlineIcon("repo", theme.iconColor, 11)}" x="${rx+8}" y="${ry+9}" width="11" height="11"/>
      <text x="${rx+22}" y="${ry+19}"
        font-family="system-ui,sans-serif" font-size="10.5" font-weight="700"
        fill="${theme.titleColor}">${escapeXml(truncate(repo.name, 18))}</text>
      ${repo.description
        ? `<text x="${rx+8}" y="${ry+33}" font-family="system-ui,sans-serif" font-size="9" fill="${theme.subTextColor}">${escapeXml(truncate(repo.description, 30))}</text>`
        : ""}
      ${repo.language
        ? `<circle cx="${rx+12}" cy="${ry+50}" r="4" fill="${repo.languageColor ?? theme.accentColor}"/>
           <text x="${rx+20}" y="${ry+54}" font-family="system-ui,sans-serif" font-size="9" fill="${theme.subTextColor}">${escapeXml(repo.language)}</text>`
        : ""}
      <image href="${inlineIcon("star", theme.iconColor, 9)}" x="${rx+cardW-38}" y="${ry+46}" width="9" height="9"/>
      <text x="${rx+cardW-27}" y="${ry+54}" font-family="'SF Mono',ui-monospace,monospace" font-size="9" fill="${theme.subTextColor}">${formatNumber(repo.stars)}</text>
    `;
  });

  return { svg, height: totalH };
}

// ─── Main card ────────────────────────────────────────────────────────────────

export function renderStatsCard(user: GitHubUser, opts: RenderOptions): string {
  const { theme, hideStats, showIcons, compact, hideAvatarRing = false, hideStreakEmoji = false, sectionSpacing = 0 } = opts;
  const br = opts.borderRadius;
  const P  = compact ? 18 : 24;
  const AV = compact ? 56 : 72;  // avatar size
  const W  = compact ? 440 : 520;

  // ── Unique IDs
  const bgGradId    = uid("bg");
  const barGradId   = uid("bar");
  const acGradId    = uid("ac");
  const ringGradId  = uid("ring");
  const noiseId     = uid("noise");
  const glowId      = uid("glow");
  const blurId      = uid("blur");
  const hlId        = uid("hl");
  const avatarClipId = uid("aclip");

  const barFill = Array.isArray(theme.barFill)
    ? theme.barFill as [string, string]
    : [theme.barFill as string, theme.barFill as string];

  // ── Layout measurements
  const allStats   = buildStatRows(user).filter(s => !hideStats.has(s.key));
  const COLS       = 2;
  const statRowCnt = Math.ceil(allStats.length / COLS);
  const STAT_ROW_H = compact ? 31 : 37;

  const bioLines  = (!compact && user.bio) ? wrapText(user.bio, 46).slice(0, 2) : [];
  const metaLines = buildMetaLines(user);

  const HEADER_H       = AV + P * 2;
  const META_H         = compact ? 0 : (metaLines.length * 16 + bioLines.length * 14 + (metaLines.length || bioLines.length ? 12 : 0));
  const DIV1_Y         = HEADER_H + META_H + 4;
  const STATS_H        = statRowCnt * STAT_ROW_H + 30;
  const DIV2_Y         = DIV1_Y + STATS_H;

  const hasLangs  = user.topLanguages.length > 0 && !hideStats.has("languages");
  const langRows  = Math.ceil(user.topLanguages.length / 4);
  const LANG_H    = hasLangs ? (12 + 12 + langRows * 20 + 22 + sectionSpacing) : 0;
  const DIV3_Y    = DIV2_Y + LANG_H;

  const hasStreak  = user.hasToken && !hideStats.has("streakinfo");
  const STREAK_H   = hasStreak ? (66 + sectionSpacing) : 0;
  const DIV4_Y     = DIV3_Y + STREAK_H;

  const hasPinned  = !hideStats.has("pinned") && !!user.pinnedRepos?.length;
  const pinnedData = hasPinned ? renderPinnedRepos(user, DIV4_Y, W, P, theme) : { svg: "", height: 0 };

  const CARD_H = (hasPinned ? DIV4_Y + pinnedData.height : DIV4_Y + (hasStreak ? 4 : 0)) + P + 8;

  // ── Defs
  const defs = `
    <defs>
      ${buildAnimations()}
      ${theme.backgroundGradient
        ? linearGradient(bgGradId,
            [{offset:"0%",color:theme.backgroundGradient[0]},{offset:"100%",color:theme.backgroundGradient[1]}],
            "0%","0%","0%","100%"
          )
        : ""}
      ${linearGradient(barGradId, [{offset:"0%",color:barFill[0]},{offset:"100%",color:barFill[1]}])}
      ${linearGradient(acGradId,  [{offset:"0%",color:theme.accentColor},{offset:"100%",color:theme.accentSecondary}])}
      ${linearGradient(ringGradId,[{offset:"0%",color:theme.accentColor},{offset:"100%",color:theme.accentSecondary}],"0%","0%","100%","100%")}
      ${linearGradient(hlId, [{offset:"0%",color:"#ffffff",opacity:0.05},{offset:"50%",color:"#ffffff",opacity:0}], "0%","0%","0%","100%")}
      <clipPath id="${avatarClipId}">
        <circle cx="${P + AV/2}" cy="${P + AV/2}" r="${AV/2}"/>
      </clipPath>
      <filter id="${glowId}" x="-8%" y="-8%" width="116%" height="120%">
        <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="${theme.shadow}"/>
      </filter>
      <filter id="${blurId}" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="5"/>
      </filter>
      ${noiseFilter(noiseId)}
    </defs>
  `;

  // ── Background
  const bgFill = theme.backgroundGradient ? `url(#${bgGradId})` : theme.background;
  const cardBg = `
    <rect x="1" y="1" width="${W-2}" height="${CARD_H-2}" rx="${br}" fill="${bgFill}"
      stroke="${theme.border}" stroke-width="1" filter="url(#${glowId})" class="card-fade"/>
    <rect x="1" y="1" width="${W-2}" height="${Math.min(CARD_H-2, 100)}" rx="${br}"
      fill="url(#${hlId})" pointer-events="none"/>
    <rect x="1" y="1" width="${W-2}" height="${CARD_H-2}" rx="${br}"
      fill="${theme.background}" opacity="0.025" filter="url(#${noiseId})" pointer-events="none"/>
  `;

  // ── Avatar
  const ACX = P + AV/2, ACY = P + AV/2, AR = AV/2;
  const avatarSrc = user.avatarBase64 ?? `${user.avatarUrl}?s=128`;

  const avatarSvg = `
    <circle cx="${ACX}" cy="${ACY}" r="${AR + 12}" fill="${theme.accentColor}" opacity="0.05" filter="url(#${blurId})"/>
    <image href="${avatarSrc}" x="${P}" y="${P}" width="${AV}" height="${AV}"
      clip-path="url(#${avatarClipId})" preserveAspectRatio="xMidYMid slice"/>
    <circle cx="${ACX}" cy="${ACY}" r="${AR + 0.5}" fill="none" stroke="white" stroke-width="1.5" opacity="0.07"/>
    ${!hideAvatarRing ? `<circle cx="${ACX}" cy="${ACY}" r="${AR + 4}"
      fill="none" stroke="url(#${ringGradId})" stroke-width="2.5"
      stroke-linecap="round"
      class="avatar-ring"
    />` : ""}
  `;

  // ── Header
  const nameX = P + AV + 16;
  const nameY = P + (compact ? 20 : 24);

  let headerSvg = `<g class="header-anim">`;
  headerSvg += `
    <text x="${nameX}" y="${nameY}"
      font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
      font-size="${compact ? 17 : 20}" font-weight="800" letter-spacing="-0.3"
      fill="${theme.titleColor}">${escapeXml(truncate(user.name ?? user.login, compact ? 22 : 28))}</text>
    <text x="${nameX}" y="${nameY + (compact ? 16 : 18)}"
      font-family="'SF Mono',ui-monospace,monospace"
      font-size="${compact ? 10 : 11}" fill="${theme.accentColor}" opacity="0.9"
    >@${escapeXml(user.login)}</text>
  `;

  bioLines.forEach((line, i) => {
    headerSvg += `
      <text x="${nameX}" y="${nameY + 34 + i*14}"
        font-family="system-ui,sans-serif" font-size="11.5" fill="${theme.subTextColor}" opacity="0.82"
      >${escapeXml(line)}</text>`;
  });

  if (!compact && user.accountAgeDays > 0) {
    headerSvg += accountAgeBadge(W - P - 70, P + 3, user.accountAgeDays, theme.accentColor, theme.badgeBg, theme.border);
  }

  headerSvg += `</g>`;

  // ── Meta lines
  let metaSvg = "";
  if (!compact) {
    const metaY0 = HEADER_H + 8;
    metaLines.forEach((line, i) => {
      metaSvg += `
        <text x="${P}" y="${metaY0 + i*16}"
          font-family="system-ui,sans-serif" font-size="10.5" fill="${theme.subTextColor}" opacity="0.75"
        >${escapeXml(line)}</text>`;
    });
  }

  // ── Dividers
  const div1 = fancyDivider(P, DIV1_Y, W-P*2, uid("d1"), theme.accentColor, theme.border);
  const div2 = hasLangs  ? fancyDivider(P, DIV2_Y, W-P*2, uid("d2"), theme.accentColor, theme.border) : "";
  const div3 = hasStreak ? fancyDivider(P, DIV3_Y, W-P*2, uid("d3"), theme.accentColor, theme.border) : "";
  const div4 = hasPinned ? fancyDivider(P, DIV4_Y, W-P*2, uid("d4"), theme.accentColor, theme.border) : "";

  // ── Stats grid
  const STATS_Y  = DIV1_Y + 20;
  const colW     = (W - P*2) / COLS;
  const maxVal   = Math.max(user.totalCommits, user.totalStars, user.publicRepos, user.followers, 1);

  let statsSvg = "";
  if (!hideStats.has("stats")) {
    statsSvg += sectionHeading(P, STATS_Y - 6, "GITHUB STATS", theme.accentColor, theme.subTextColor, W - P*2);

    allStats.forEach((stat, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const sx  = P + col * colW;
      const sy  = STATS_Y + 8 + row * STAT_ROW_H;
      const valX = sx + colW - 8;
      const num  = parseInt(stat.value.replace(/[^0-9]/g, "")) || 0;
      const spId = uid("sp");

      statsSvg += `
        <g class="stat-row-${Math.min(i, 6)}">
          ${showIcons ? `<image href="${inlineIcon(stat.iconName, theme.iconColor, 12)}" x="${sx+1}" y="${sy}" width="12" height="12"/>` : ""}
          <text x="${showIcons ? sx+17 : sx}" y="${sy+10}"
            font-family="system-ui,sans-serif"
            font-size="${compact ? 10 : 10.5}" fill="${theme.subTextColor}"
          >${escapeXml(stat.label)}</text>
          <text x="${valX}" y="${sy+10}"
            font-family="'SF Mono',ui-monospace,monospace"
            font-size="${compact ? 11 : 12}" font-weight="700"
            fill="${theme.statValueColor}" text-anchor="end"
          >${escapeXml(stat.value)}</text>
          ${!compact && num > 0
            ? buildSparkline(num, maxVal, valX-58, sy-2, 40, 13, theme.accentColor+"80", theme.accentColor, spId)
            : ""}
          <line x1="${sx}" y1="${sy+14}" x2="${sx+colW-10}" y2="${sy+14}"
            stroke="${theme.border}" stroke-width="0.4" opacity="0.3"/>
        </g>`;
    });
  }

  // ── Language bar
  let langSvg = "";
  if (hasLangs) {
    const LY  = DIV2_Y + 20;
    const barW = W - P*2;

    langSvg += `<g class="lang-anim">`;
    langSvg += sectionHeading(P, LY - 6, "TOP LANGUAGES", theme.accentColor, theme.subTextColor, barW);
    langSvg += `<rect x="${P}" y="${LY+6}" width="${barW}" height="9" rx="4.5" fill="${theme.barBackground}" opacity="0.65"/>`;

    let xOff = 0;
    user.topLanguages.forEach(l => {
      const segW = Math.max(3, Math.round((l.percentage / 100) * barW));
      langSvg += `<rect x="${P+xOff}" y="${LY+6}" width="${segW}" height="9" fill="${l.color}" rx="2" class="bar-fill"/>`;
      xOff += segW;
    });

    for (let row = 0; row < langRows; row++) {
      for (let col = 0; col < 4; col++) {
        const idx = row * 4 + col;
        if (idx >= user.topLanguages.length) break;
        const l  = user.topLanguages[idx];
        const lx = P + col * (barW / 4);
        const ly = LY + 22 + row * 20;
        langSvg += `
          <circle cx="${lx+4}" cy="${ly+4.5}" r="4" fill="${l.color}"/>
          <text x="${lx+13}" y="${ly+8.5}"
            font-family="system-ui,sans-serif" font-size="10" fill="${theme.subTextColor}"
          >${escapeXml(truncate(l.name, 11))} <tspan font-weight="700" fill="${theme.textColor}">${l.percentage}%</tspan></text>`;
      }
    }
    langSvg += `</g>`;
  }

  // ── Streak section
  let streakSvg = "";
  if (hasStreak) {
    const SY      = DIV3_Y + 12;
    const thirdW  = (W - P*2 - 16) / 3;

    streakSvg += `<g class="streak-anim">`;
    streakSvg += sectionHeading(P, SY - 2, "STREAK & ACTIVITY", theme.accentColor, theme.subTextColor, W-P*2);

    // Helper: streak card
    const streakCard = (x: number, label: string, val: string, hot: boolean, bgId: string, bdrId: string) => {
      return `
        <defs>
          ${linearGradient(bgId,[{offset:"0%",color:theme.badgeBg},{offset:"100%",color:theme.background}],"0%","0%","0%","100%")}
          ${linearGradient(bdrId,[{offset:"0%",color:theme.accentColor},{offset:"100%",color:theme.accentSecondary}])}
        </defs>
        ${hot ? `<rect x="${x-1}" y="${SY+5}" width="${thirdW+2}" height="48" rx="11" fill="${theme.accentColor}" opacity="0.08" filter="url(#${blurId})"/>` : ""}
        <rect x="${x}" y="${SY+6}" width="${thirdW}" height="46" rx="10"
          fill="url(#${bgId})" stroke="url(#${bdrId})" stroke-width="1.2"/>
        <text x="${x+thirdW/2}" y="${SY+19}" text-anchor="middle"
          font-family="system-ui,sans-serif" font-size="9" font-weight="500"
          fill="${theme.subTextColor}" letter-spacing="0.5">${escapeXml(label.toUpperCase())}</text>
        <text x="${x+thirdW/2}" y="${SY+36}" text-anchor="middle"
          font-family="'SF Mono',ui-monospace,monospace" font-size="14" font-weight="800"
          fill="${theme.accentColor}">${escapeXml(val)}</text>
      `;
    };

    streakSvg += streakCard(P, "Current Streak", `${user.currentStreak} days`, user.currentStreak >= 3, uid("s1bg"), uid("s1br"));
    streakSvg += streakCard(P + thirdW + 8, "Longest Streak", `${user.longestStreak} days`, user.longestStreak >= 7, uid("s2bg"), uid("s2br"));

    // Contributions ring
    const circCX = P + (thirdW + 8) * 2 + thirdW / 2;
    const circCY = SY + 29;
    const pct    = Math.min((user.contributionsLastYear / 1500) * 100, 100);
    streakSvg += circularProgress(
      circCX, circCY, 22, pct,
      "Contribs/yr", formatNumber(user.contributionsLastYear),
      theme.barBackground, uid("cg"),
      theme.accentColor, theme.accentSecondary,
      theme.subTextColor, theme.textColor
    );

    streakSvg += `</g>`;
  }

  // ── Pinned repos
  const pinnedSvg = hasPinned ? `
    <g class="pinned-anim">
      ${sectionHeading(P, DIV4_Y + 14, "PINNED REPOS", theme.accentColor, theme.subTextColor, W-P*2)}
      ${pinnedData.svg}
    </g>` : "";

  // ── Bottom accent bar
  const accentBar = `
    <rect x="${br < 4 ? 1 : br * 0.6}" y="${CARD_H - 5}" width="${W - (br < 4 ? 2 : br * 1.2)}" height="4"
      rx="${Math.min(br, 4)}" fill="url(#${acGradId})" opacity="0.9"/>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${CARD_H}"
  viewBox="0 0 ${W} ${CARD_H}"
  role="img"
  aria-label="GitHub stats for ${escapeXml(user.login)}"
>
  ${defs}
  ${cardBg}
  ${avatarSvg}
  ${headerSvg}
  ${metaSvg}
  ${div1}
  ${statsSvg}
  ${div2}
  ${langSvg}
  ${div3}
  ${streakSvg}
  ${div4}
  ${pinnedSvg}
  ${accentBar}
</svg>`;
}

// ─── Error card ───────────────────────────────────────────────────────────────

export function renderErrorCard(message: string, theme: Theme, br: number): string {
  const W = 480, H = 130;
  const bgId = uid("ebg"), glowId = uid("egl");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${linearGradient(bgId, [{offset:"0%",color:theme.background},{offset:"100%",color:"#0d1117"}],"0%","0%","0%","100%")}
    <linearGradient id="errAc" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f85149"/><stop offset="100%" stop-color="#ff7b72"/>
    </linearGradient>
    <filter id="${glowId}">
      <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#f85149" flood-opacity="0.35"/>
    </filter>
    <pattern id="errDots" width="6" height="6" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="0.7" fill="white" opacity="0.03"/>
    </pattern>
  </defs>
  <rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="${br}" fill="url(#${bgId})" stroke="#f85149" stroke-width="1.2"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#errDots)" rx="${br}" opacity="0.5"/>
  <rect x="0" y="0" width="5" height="${H}" fill="url(#errAc)" rx="${br}" filter="url(#${glowId})"/>
  <circle cx="34" cy="42" r="16" fill="#f85149" opacity="0.1"/>
  <text x="34" y="47" text-anchor="middle" font-size="16" font-family="system-ui" fill="#f85149">⚠</text>
  <text x="60" y="36" font-family="system-ui,-apple-system,sans-serif" font-size="15" font-weight="800" fill="#f85149">GitHub Stats — Error</text>
  <text x="22" y="62" font-family="system-ui,sans-serif" font-size="12.5" fill="${theme.subTextColor}">${escapeXml(message)}</text>
  <line x1="22" y1="78" x2="${W-22}" y2="78" stroke="${theme.subTextColor}" opacity="0.1"/>
  <text x="22" y="98" font-family="'SF Mono',ui-monospace,monospace" font-size="9.5" fill="${theme.subTextColor}" opacity="0.5">github-stats v2 · add GITHUB_TOKEN for full stats</text>
  <rect x="${br*0.6}" y="${H-4}" width="${W - br*1.2}" height="3.5" rx="2" fill="url(#errAc)" opacity="0.8"/>
</svg>`;
}

import type { Theme } from "../themes/index.js";
import type { TrophyData } from "../lib/trophies.js";
import { escapeXml, formatNumber } from "./sanitize.js";

const W = 900;
const PAD = 36;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";

const L = {
  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  commit: '<circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/>',
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  repo: '<path d="M10 2v8l3-3 3 3V2"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  code: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
};

const TIERS = [
  { name: "LOCKED", light: "", dark: "", glow: "" },
  { name: "BRONZE", light: "#f0b27a", dark: "#b8651b", glow: "#cd7f32" },
  { name: "SILVER", light: "#f1f5f9", dark: "#8d99a8", glow: "#cbd5e1" },
  { name: "GOLD", light: "#ffe27a", dark: "#d9961a", glow: "#ffc933" },
  { name: "DIAMOND", light: "#8ff3ff", dark: "#8b5cf6", glow: "#6ee7ff" },
];

interface TrophyDef {
  title: string;
  icon: string;
  thresholds: [number, number, number, number];
  value: number | null;
  display?: (n: number) => string;
}

function uid(p: string): string {
  return `${p}_${Math.random().toString(36).slice(2, 8)}`;
}

function tierOf(value: number | null, t: [number, number, number, number]): number {
  if (value === null) return 0;
  return t.filter((x) => value >= x).length;
}

function buildTrophies(d: TrophyData): TrophyDef[] {
  return [
    { title: "STARS", icon: L.star, thresholds: [10, 100, 1000, 10000], value: d.stars },
    { title: "COMMITS", icon: L.commit, thresholds: [100, 1000, 10000, 100000], value: d.commits },
    { title: "FOLLOWERS", icon: L.users, thresholds: [10, 50, 200, 1000], value: d.followers },
    { title: "REPOSITORIES", icon: L.repo, thresholds: [10, 30, 100, 300], value: d.repos },
    { title: "FORKS", icon: L.fork, thresholds: [5, 50, 500, 5000], value: d.forks },
    { title: "MEMBER FOR", icon: L.clock, thresholds: [1, 3, 5, 10], value: d.years, display: (n) => `${n}y` },
    { title: "LANGUAGES", icon: L.code, thresholds: [3, 6, 10, 15], value: d.languages },
    { title: "TOP REPO STARS", icon: L.trophy, thresholds: [10, 100, 500, 5000], value: d.topRepoStars },
  ];
}

const SPARK = "M0 -5.5 L1.5 -1.5 L5.5 0 L1.5 1.5 L0 5.5 L-1.5 1.5 L-5.5 0 L-1.5 -1.5Z";

export interface TrophyOptions {
  hideTitle: boolean;
  columns: number;
  animate: boolean;
}

export function renderTrophyCard(data: TrophyData, theme: Theme, borderRadius: number, opts: TrophyOptions): string {
  const br = borderRadius;
  const id = { bg: uid("bg"), clip: uid("clip"), dots: uid("dots"), glow: uid("glow"), shine: uid("shine"), rank: uid("rank") };
  const bg1 = theme.backgroundGradient?.[0] ?? theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;
  const innerW = W - PAD * 2;

  const trophies = buildTrophies(data);
  const tiers = trophies.map((t) => tierOf(t.value, t.thresholds));
  const unlocked = tiers.filter((t) => t > 0).length;
  const score = tiers.reduce((a, b) => a + b, 0) / (trophies.length * 4);
  const rank = score >= 0.8 ? "S" : score >= 0.6 ? "A" : score >= 0.4 ? "B" : score >= 0.2 ? "C" : "D";

  const cols = Math.max(2, Math.min(4, opts.columns));
  const gap = 16;
  const cw = (innerW - gap * (cols - 1)) / cols;
  const ch = 218;
  const rows = Math.ceil(trophies.length / cols);
  const headerH = opts.hideTitle ? 0 : 74;
  const top = 34 + headerH + (opts.hideTitle ? 0 : 12);
  const H = top + rows * ch + (rows - 1) * gap + 36;
  const cardR = Math.min(br + 6, 20);

  const header = opts.hideTitle
    ? ""
    : `<g class="rise">
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.accentColor}" opacity="0.16"/>
    <svg x="${PAD + 12}" y="40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.trophy}</svg>
    <text x="${PAD + 62}" y="52" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="-0.3" fill="${theme.titleColor}">Trophy Case</text>
    <text x="${PAD + 62}" y="77" font-family="${MONO}" font-size="13" font-weight="600" fill="${theme.iconColor}">@${escapeXml(data.login)}<tspan fill="${theme.subTextColor}" font-weight="500">  ·  ${unlocked}/${trophies.length} unlocked</tspan></text>
    <g transform="translate(${W - PAD - 34} 54)">
      <circle r="34" fill="${theme.accentColor}" opacity="0.1" class="pulse"/>
      <circle r="28" fill="${theme.badgeBg}" stroke="url(#${id.rank})" stroke-width="3"/>
      <text y="9" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="900" fill="url(#${id.rank})">${rank}</text>
      <text y="-37" text-anchor="middle" font-family="${MONO}" font-size="9.5" font-weight="700" letter-spacing="2" fill="${theme.subTextColor}">RANK</text>
    </g>
  </g>`;

  const cardsSvg = trophies
    .map((t, i) => {
      const tier = tiers[i];
      const meta = TIERS[tier];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = PAD + col * (cw + gap);
      const y = top + row * (ch + gap);
      const cx = x + cw / 2;
      const mcy = y + 86;
      const locked = tier === 0;
      const delay = (0.1 + i * 0.09).toFixed(2);
      const accent = locked ? theme.subTextColor : meta.glow;
      const medalFill = locked ? theme.barBackground : `url(#med_${id.glow}_${tier})`;
      const iconStroke = locked ? theme.subTextColor : "#1b1b1f";

      const maxed = tier === 4;
      const prev = tier > 0 ? t.thresholds[tier - 1] : 0;
      const next = maxed ? t.thresholds[3] : t.thresholds[tier];
      const pct = t.value === null ? 0 : maxed ? 1 : Math.max(0.03, Math.min(1, (t.value - prev) / (next - prev)));
      const barW = cw - 44;
      const valueText = t.value === null ? "—" : t.display ? t.display(t.value) : formatNumber(t.value);
      const label = t.value === null ? "UNAVAILABLE" : maxed ? "MAX TIER" : `NEXT  ${formatNumber(next)}${t.title === "MEMBER FOR" ? " yrs" : ""}`;

      const sparkles =
        tier >= 3
          ? [[-48, -34], [50, -26], [-42, 34], [46, 38]]
              .map(
                (p, k) =>
                  `<g transform="translate(${(cx + p[0]).toFixed(1)} ${(mcy + p[1]).toFixed(1)})"><path d="${SPARK}" fill="${meta.light}" class="twinkle" style="animation-delay:${(k * 0.55 + i * 0.2).toFixed(2)}s"/></g>`
              )
              .join("")
          : "";

      return `<g class="rise" style="animation-delay:${delay}s">
      <clipPath id="${id.clip}_${i}"><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="${cardR}"/></clipPath>
      <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="${cardR}" fill="${theme.badgeBg}"/>
      <rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="${cardR}" fill="url(#${id.glow}_${i})"/>
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${ch - 1}" rx="${cardR}" fill="none" stroke="${accent}" stroke-opacity="${locked ? 0.18 : 0.5}"/>
      ${locked ? "" : `<rect x="${x + 22}" y="${y}" width="${cw - 44}" height="3" rx="1.5" fill="${accent}" opacity="0.9"/>`}

      <g clip-path="url(#${id.clip}_${i})">
        ${locked ? "" : `<rect class="shine" x="${x - 70}" y="${y - 10}" width="46" height="${ch + 20}" fill="url(#${id.shine})" transform="skewX(-18)" style="animation-delay:${(1.2 + i * 0.45).toFixed(2)}s; --travel:${(cw + 160).toFixed(0)}px"/>`}
      </g>

      <g transform="translate(${cx} ${y + 20})">
        <rect x="-38" y="-10" width="76" height="20" rx="10" fill="${accent}" opacity="${locked ? 0.1 : 0.18}"/>
        <rect x="-37.5" y="-9.5" width="75" height="19" rx="9.5" fill="none" stroke="${accent}" stroke-opacity="${locked ? 0.25 : 0.55}"/>
        <text y="3.8" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="800" letter-spacing="1.6" fill="${locked ? theme.subTextColor : meta.light}">${meta.name}</text>
      </g>

      ${locked ? "" : `<circle cx="${cx}" cy="${mcy}" r="46" fill="${meta.glow}" opacity="0.28" class="pulse" style="animation-delay:${(i * 0.3).toFixed(2)}s"/>`}
      ${tier >= 3 ? `<circle cx="${cx}" cy="${mcy}" r="41" fill="none" stroke="${meta.light}" stroke-opacity="0.75" stroke-width="1.6" stroke-dasharray="3 7" stroke-linecap="round" class="spin" style="transform-origin:${cx.toFixed(1)}px ${mcy}px"/>` : ""}
      <g class="medal" style="animation-delay:${(0.25 + i * 0.09).toFixed(2)}s">
        <circle cx="${cx}" cy="${mcy}" r="33" fill="${locked ? "none" : "#0b0b10"}" opacity="0.35"/>
        <circle cx="${cx}" cy="${mcy}" r="31" fill="${medalFill}"${locked ? ` stroke="${theme.subTextColor}" stroke-opacity="0.3" stroke-dasharray="4 4"` : ""}/>
        ${locked ? "" : `<circle cx="${cx}" cy="${mcy}" r="26" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.4"/>`}
        <svg x="${cx - 14}" y="${mcy - 14}" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${iconStroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="${locked ? 0.5 : 1}">${t.icon}</svg>
      </g>
      ${sparkles}

      <text x="${cx}" y="${y + 155}" text-anchor="middle" font-family="${FONT}" font-size="30" font-weight="800" letter-spacing="-0.5" fill="${locked ? theme.subTextColor : theme.statValueColor}">${escapeXml(valueText)}</text>
      <text x="${cx}" y="${y + 173}" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="700" letter-spacing="1.4" fill="${theme.subTextColor}">${t.title}</text>

      <rect x="${x + 22}" y="${y + 184}" width="${barW}" height="5" rx="2.5" fill="${theme.barBackground}"/>
      <rect class="grow" x="${x + 22}" y="${y + 184}" width="${(barW * pct).toFixed(1)}" height="5" rx="2.5" fill="${locked ? theme.subTextColor : `url(#bar_${id.glow}_${tier})`}" opacity="${locked ? 0.5 : 1}" style="animation-delay:${(0.5 + i * 0.09).toFixed(2)}s"/>
      <text x="${cx}" y="${y + 206}" text-anchor="middle" font-family="${MONO}" font-size="9.5" font-weight="600" letter-spacing="1.2" fill="${theme.subTextColor}" opacity="0.85">${label}</text>
    </g>`;
    })
    .join("");

  const tierDefs = [1, 2, 3, 4]
    .map(
      (n) => `<linearGradient id="med_${id.glow}_${n}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${TIERS[n].light}"/>
      <stop offset="100%" stop-color="${TIERS[n].dark}"/>
    </linearGradient>
    <linearGradient id="bar_${id.glow}_${n}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${TIERS[n].dark}"/>
      <stop offset="100%" stop-color="${TIERS[n].light}"/>
    </linearGradient>`
    )
    .join("");

  const cardGlows = trophies
    .map((_, i) => {
      const meta = TIERS[tiers[i]];
      const c = tiers[i] === 0 ? theme.subTextColor : meta.glow;
      return `<radialGradient id="${id.glow}_${i}" cx="0.5" cy="0.28" r="0.75">
      <stop offset="0%" stop-color="${c}" stop-opacity="${tiers[i] === 0 ? 0.05 : 0.2}"/>
      <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
    </radialGradient>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub trophies of ${escapeXml(data.login)}">
  <title>${escapeXml(data.login)} - Trophy case</title>
  <defs>
    <linearGradient id="${id.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="${id.rank}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <linearGradient id="${id.shine}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    ${tierDefs}
    ${cardGlows}
    <pattern id="${id.dots}" width="14" height="14" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="0.9" fill="${theme.subTextColor}" opacity="0.18"/>
    </pattern>
    <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <style>
      @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pop { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
      @keyframes pulse { 0%,100% { opacity: .22; } 50% { opacity: .5; } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes twinkle { 0%,100% { opacity: 0; transform: scale(.3); } 50% { opacity: 1; transform: scale(1.15); } }
      @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes shine { 0%,55% { transform: translateX(0) skewX(-18deg); opacity: 0; } 58% { opacity: 1; } 85%,100% { transform: translateX(var(--travel)) skewX(-18deg); opacity: 0; } }
      .rise { animation: rise .6s ease both; }
      .medal { transform-box: fill-box; transform-origin: center; animation: pop .7s cubic-bezier(.2,.9,.3,1.2) both, bob 3.6s ease-in-out 1s infinite; }
      .pulse { transform-box: fill-box; transform-origin: center; animation: pulse 2.8s ease-in-out infinite; }
      .spin { animation: spin 14s linear infinite; }
      .twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 2.6s ease-in-out infinite; }
      .grow { transform-box: fill-box; transform-origin: left center; animation: grow 1s cubic-bezier(.2,.8,.2,1) both; }
      .shine { animation: shine 6s ease-in-out infinite; }
      ${opts.animate ? "" : "* { animation: none !important; }"}
    </style>
  </defs>

  <g clip-path="url(#${id.clip})">
    <rect width="${W}" height="${H}" fill="url(#${id.bg})"/>
    <rect width="${W}" height="${H}" fill="url(#${id.dots})"/>
    <rect x="${PAD}" y="0" width="${innerW}" height="3" fill="url(#${id.rank})" opacity="0.9"/>
    <rect x="${PAD}" y="${H - 3}" width="${innerW}" height="3" fill="url(#${id.rank})" opacity="0.7"/>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>

  ${header}
  ${cardsSvg}
</svg>`;
}

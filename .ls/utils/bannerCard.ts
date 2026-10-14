import type { Theme } from "../themes/index.js";
import type { BannerData } from "../lib/banner.js";
import { escapeXml, formatNumber, truncate } from "./sanitize.js";
import { contrast, drawGlyph, getTechIcon } from "./techIcons.js";
import { isDarkLogo, logoId } from "./techLogos.js";
import { langColor } from "./langCard.js";

const W = 1200;
const H = 360;
const PAD = 60;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";

const L = {
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  repo: '<path d="M10 2v8l3-3 3 3V2"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
};

function uid(p: string): string {
  return `${p}_${Math.random().toString(36).slice(2, 8)}`;
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  let used = 0;
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= maxChars) { line = next; continue; }
    if (line) { lines.push(line); used += line.length + 1; if (lines.length === maxLines) { line = ""; break; } }
    line = w.length > maxChars ? w.slice(0, maxChars - 1) + "…" : w;
  }
  if (line && lines.length < maxLines) { lines.push(line); used += line.length + 1; }
  if (used < text.trim().length && lines.length) {
    const last = lines[lines.length - 1].replace(/[\s.,;:!-]+$/, "");
    lines[lines.length - 1] = (last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last) + "…";
  }
  return lines.slice(0, maxLines);
}

function wavePath(y: number, amp: number): string {
  let d = `M0 ${y} Q150 ${y - amp} 300 ${y}`;
  for (let x = 600; x <= 2400; x += 300) d += ` T${x} ${y}`;
  return `${d} V${H + 10} H0 Z`;
}

const PARTICLES: Array<[number, number, number, number]> = [
  [140, 40, 2.2, 0], [330, 300, 1.8, 1.2], [520, 60, 2.4, 0.6], [690, 330, 1.6, 2.0], [880, 48, 2.0, 1.4],
  [1010, 310, 2.6, 0.3], [1120, 90, 1.8, 2.4], [1160, 250, 2.2, 0.9], [250, 150, 1.4, 1.8], [800, 180, 1.4, 0.2],
];

export interface BannerOptions {
  animate: boolean;
  hideStats: boolean;
}

export function renderBanner(
  data: BannerData,
  theme: Theme,
  borderRadius: number,
  logos: Record<string, string>,
  opts: BannerOptions
): string {
  const br = borderRadius;
  const id = {
    bg: uid("bg"), clip: uid("clip"), dots: uid("dots"), o1: uid("o1"), o2: uid("o2"), o3: uid("o3"),
    ring: uid("ring"), name: uid("name"), avclip: uid("avclip"), wave: uid("wave"),
  };
  const bg1 = theme.backgroundGradient?.[0] ?? theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;

  const avR = 112;
  const avCx = PAD + 20 + avR + 14;
  const avCy = H / 2;
  const tx = avCx + avR + 58;
  const textW = W - PAD - tx;

  const displayName = truncate(data.name?.trim() || data.login, 34);
  const nameLen = Math.max(displayName.length, 1);
  const nameSize = Math.max(40, Math.min(70, Math.floor(textW / (nameLen * 0.58))));
  const nameOverflows = nameLen * nameSize * 0.58 > textW * 0.98;
  const showHandle = Boolean(data.name?.trim()) && data.name!.trim().toLowerCase() !== data.login.toLowerCase();

  const hasBio = Boolean(data.bio?.trim());
  const bioLines = hasBio ? wrap(data.bio!, Math.floor(textW / (23 * 0.5)), 2) : ["No bio yet."];

  const nameY = 100;
  const handleY = nameY + 36;
  const bioY = (showHandle ? handleY : nameY) + 40;

  const bioSvg = bioLines
    .map(
      (ln, i) =>
        `<text x="${tx}" y="${bioY + i * 31}" font-family="${FONT}" font-size="23" font-style="italic" fill="${theme.subTextColor}"${hasBio ? "" : ' opacity="0.7"'}>${escapeXml(ln)}</text>`
    )
    .join("");

  const initial = escapeXml((data.login[0] ?? "?").toUpperCase());
  const avatar = data.avatarBase64
    ? `<image x="${avCx - avR}" y="${avCy - avR}" width="${avR * 2}" height="${avR * 2}" href="${data.avatarBase64}" xlink:href="${data.avatarBase64}" clip-path="url(#${id.avclip})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${avCx}" cy="${avCy}" r="${avR}" fill="${theme.badgeBg}"/>
       <text x="${avCx}" y="${avCy + 32}" text-anchor="middle" font-family="${FONT}" font-size="96" font-weight="800" fill="${theme.accentColor}">${initial}</text>`;

  const chipY = 232;
  const chipH = 58;
  const chipGap = 16;
  const langs = data.langs;
  const chipW = Math.min(232, (textW - chipGap * 2) / 3);
  const maxPct = Math.max(...langs.map((l) => l.percent), 1);

  const chips = langs
    .map((l, i) => {
      const x = tx + i * (chipW + chipGap);
      const color = langColor(l.name);
      const item = { key: l.name, kind: "language" as const };
      const logo = logos[logoId(item)];
      const icon = getTechIcon(l.name, "language");
      const tcx = x + 12 + 20;
      const tcy = chipY + chipH / 2;
      let glyph: string;
      if (logo) {
        const plate = isDarkLogo(item) ? `<rect x="${tcx - 14}" y="${tcy - 14}" width="28" height="28" rx="8" fill="#e6edf3" opacity="0.95"/>` : "";
        glyph = `${plate}<image x="${tcx - 11}" y="${tcy - 11}" width="22" height="22" href="${logo}" xlink:href="${logo}" preserveAspectRatio="xMidYMid meet"/>`;
      } else {
        const c = contrast(icon.color, theme.badgeBg) >= 2.6 ? icon.color : theme.titleColor;
        glyph = `<g transform="translate(${tcx} ${tcy}) scale(0.8)">${drawGlyph(icon, c, FONT)}</g>`;
      }
      const barX = x + 64;
      const barW = chipW - 64 - 16;
      const fill = Math.max((l.percent / maxPct) * barW, 8);
      const pct = l.percent < 0.1 ? "<0.1%" : `${l.percent.toFixed(l.percent >= 10 ? 0 : 1)}%`;
      return `<g class="rise" style="animation-delay:${(0.35 + i * 0.1).toFixed(2)}s">
      <rect x="${x}" y="${chipY}" width="${chipW}" height="${chipH}" rx="${Math.min(br + 4, 16)}" fill="${theme.badgeBg}" opacity="0.72"/>
      <rect x="${x + 0.5}" y="${chipY + 0.5}" width="${chipW - 1}" height="${chipH - 1}" rx="${Math.min(br + 4, 16)}" fill="none" stroke="${color}" stroke-opacity="0.5"/>
      <rect x="${x + 12}" y="${chipY + 11}" width="40" height="36" rx="11" fill="${color}" opacity="0.16"/>
      ${glyph}
      <text x="${barX}" y="${chipY + 25}" font-family="${FONT}" font-size="16.5" font-weight="800" fill="${theme.titleColor}">${escapeXml(truncate(l.name, 12))}</text>
      <text x="${x + chipW - 14}" y="${chipY + 25}" text-anchor="end" font-family="${MONO}" font-size="13" font-weight="700" fill="${color}">${pct}</text>
      <rect x="${barX}" y="${chipY + 36}" width="${barW}" height="6" rx="3" fill="${theme.barBackground}"/>
      <rect class="grow" x="${barX}" y="${chipY + 36}" width="${fill.toFixed(1)}" height="6" rx="3" fill="${color}" style="animation-delay:${(0.6 + i * 0.1).toFixed(2)}s"/>
    </g>`;
    })
    .join("");

  let sx = tx;
  const statDefs: Array<{ icon: string; value: number; label: string }> = [
    { icon: L.users, value: data.followers, label: "followers" },
    { icon: L.star, value: data.totalStars, label: "stars" },
    { icon: L.repo, value: data.publicRepos, label: "repos" },
  ];
  const stats = opts.hideStats
    ? ""
    : statDefs
        .map((s) => {
          const v = formatNumber(s.value);
          const w = 30 + v.length * 11 + s.label.length * 7.4 + 30;
          const out = `<svg x="${sx}" y="${317 - 16}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.icon}</svg>
        <text x="${sx + 28}" y="318" font-family="${FONT}" font-size="19" font-weight="800" fill="${theme.statValueColor}">${escapeXml(v)}<tspan font-size="14" font-weight="600" fill="${theme.subTextColor}" dx="6">${s.label}</tspan></text>`;
          sx += w;
          return out;
        })
        .join("");

  const particles = PARTICLES.map(
    ([x, y, r, d]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${theme.accentColor}" class="twinkle" style="animation-delay:${d}s"/>`
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub banner for ${escapeXml(data.login)}">
  <title>${escapeXml(displayName)} - GitHub banner</title>
  <defs>
    <linearGradient id="${id.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="${id.o1}"><stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0.42"/><stop offset="100%" stop-color="${theme.accentColor}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id.o2}"><stop offset="0%" stop-color="${theme.accentSecondary}" stop-opacity="0.38"/><stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id.o3}"><stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0.26"/><stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id.ring}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="50%" stop-color="${theme.accentSecondary}"/>
      <stop offset="100%" stop-color="${theme.accentColor}"/>
    </linearGradient>
    <linearGradient id="${id.name}" gradientUnits="userSpaceOnUse" x1="${tx}" y1="0" x2="${tx + Math.min(textW, 560)}" y2="0" spreadMethod="reflect">
      <stop offset="0%" stop-color="${theme.titleColor}"/>
      <stop offset="50%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
      ${opts.animate ? `<animateTransform attributeName="gradientTransform" type="translate" values="-260 0;260 0;-260 0" dur="9s" repeatCount="indefinite"/>` : ""}
    </linearGradient>
    <linearGradient id="${id.wave}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <pattern id="${id.dots}" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="0.9" fill="${theme.subTextColor}" opacity="0.16"/>
    </pattern>
    <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <clipPath id="${id.avclip}"><circle cx="${avCx}" cy="${avCy}" r="${avR}"/></clipPath>
    <style>
      @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes drift1 { 0% { transform: translate(0,0); } 100% { transform: translate(120px,40px); } }
      @keyframes drift2 { 0% { transform: translate(0,0); } 100% { transform: translate(-140px,-30px); } }
      @keyframes drift3 { 0% { transform: translate(0,0); } 100% { transform: translate(60px,-50px); } }
      @keyframes slide { to { transform: translateX(-1200px); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes spinr { to { transform: rotate(-360deg); } }
      @keyframes twinkle { 0%,100% { opacity: .08; } 50% { opacity: .85; } }
      @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes breathe { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      .rise { animation: rise .7s ease both; }
      .fade { animation: fade 1s ease both; }
      .o1 { animation: drift1 16s ease-in-out infinite alternate; }
      .o2 { animation: drift2 19s ease-in-out infinite alternate; }
      .o3 { animation: drift3 14s ease-in-out infinite alternate; }
      .w1 { animation: slide 14s linear infinite; }
      .w2 { animation: slide 22s linear infinite reverse; }
      .ring1 { animation: spin 18s linear infinite; }
      .ring2 { animation: spinr 26s linear infinite; }
      .twinkle { animation: twinkle 4s ease-in-out infinite; }
      .grow { transform-box: fill-box; transform-origin: left center; animation: grow 1s cubic-bezier(.2,.8,.2,1) both; }
      .breathe { animation: breathe 3.5s ease-in-out infinite; }
      ${opts.animate ? "" : "* { animation: none !important; }"}
    </style>
  </defs>

  <g clip-path="url(#${id.clip})">
    <rect width="${W}" height="${H}" fill="url(#${id.bg})"/>
    <circle class="o1" cx="180" cy="80" r="330" fill="url(#${id.o1})"/>
    <circle class="o2" cx="1020" cy="300" r="360" fill="url(#${id.o2})"/>
    <circle class="o3" cx="640" cy="40" r="260" fill="url(#${id.o3})"/>
    <rect width="${W}" height="${H}" fill="url(#${id.dots})"/>
    ${particles}
    <g class="w2" opacity="0.07"><path d="${wavePath(H - 36, 26)}" fill="url(#${id.wave})"/></g>
    <g class="w1" opacity="0.11"><path d="${wavePath(H - 18, 20)}" fill="url(#${id.wave})"/></g>
    <rect x="0" y="0" width="${W}" height="3" fill="url(#${id.ring})" opacity="0.9"/>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>

    <g class="fade">
    <circle cx="${avCx}" cy="${avCy}" r="${avR + 24}" fill="none" stroke="${theme.subTextColor}" stroke-opacity="0.35" stroke-width="1.5" stroke-dasharray="2 10" stroke-linecap="round" class="ring2" style="transform-origin:${avCx}px ${avCy}px"/>
    <circle cx="${avCx}" cy="${avCy}" r="${avR + 11}" fill="none" stroke="url(#${id.ring})" stroke-width="3" stroke-dasharray="${(2 * Math.PI * (avR + 11) * 0.72).toFixed(1)} ${(2 * Math.PI * (avR + 11) * 0.28).toFixed(1)}" stroke-linecap="round" class="ring1" style="transform-origin:${avCx}px ${avCy}px"/>
    <circle cx="${avCx}" cy="${avCy}" r="${avR + 4}" fill="${theme.background}"/>
    ${avatar}
  </g>

    <g class="rise" style="animation-delay:0.1s">
    <text x="${tx}" y="${nameY}" font-family="${FONT}" font-size="${nameSize}" font-weight="900" letter-spacing="-1" fill="url(#${id.name})"${nameOverflows ? ` textLength="${Math.floor(textW)}" lengthAdjust="spacingAndGlyphs"` : ""}>${escapeXml(displayName)}</text>
    ${showHandle ? `<text x="${tx}" y="${handleY}" font-family="${MONO}" font-size="21" font-weight="600" fill="${theme.iconColor}">@${escapeXml(data.login)}</text>` : ""}
    ${bioSvg}
  </g>

    ${chips}

    <g class="rise" style="animation-delay:0.7s">${stats}</g>
</svg>`;
}

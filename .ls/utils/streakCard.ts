import type { Theme } from "../themes/index.js";
import type { StreakData, StreakRun } from "../lib/streak.js";
import { escapeXml } from "./sanitize.js";
import { L } from "./icons.js";
import { aurora, auroraBackground, auroraDefs, flowGradient, fxCss, glowShadow, shadowBlur, shine, sparkle } from "./fx.js";

export interface StreakOptions {
  hideTitle: boolean;
  includePrivate: boolean;
  animate: boolean;
}

const W = 900;
const PAD = 36;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MILESTONES = [7, 14, 30, 60, 100, 180, 365, 500, 730, 1000, 1500, 2000, 3000];

function uid(p: string): string {
  return `${p}_${Math.random().toString(36).slice(2, 8)}`;
}

function shortDate(iso: string, withYear: boolean): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}${withYear ? ` '${String(y).slice(2)}` : ""}`;
}

function rangeText(run: StreakRun): string {
  if (run.length === 0) return "No streak yet";
  const thisYear = String(new Date().getUTCFullYear());
  const sameYear = run.start.slice(0, 4) === run.end.slice(0, 4);
  if (run.start === run.end) return shortDate(run.start, run.start.slice(0, 4) !== thisYear);
  if (sameYear) return `${shortDate(run.start, false)} – ${shortDate(run.end, false)}${run.end.slice(0, 4) !== thisYear ? `, ${run.end.slice(0, 4)}` : ""}`;
  return `${shortDate(run.start, true)} – ${shortDate(run.end, true)}`;
}

export function renderStreakCard(data: StreakData, theme: Theme, br: number, opts: StreakOptions): string {
  const { animate } = opts;
  const id = {
    bg: uid("bg"),
    clip: uid("clip"),
    edge: uid("edge"),
    ring: uid("ring"),
    line: uid("line"),
    bar: uid("bar"),
    sh: uid("sh"),
    shs: uid("shs"),
    leakA: uid("la"),
    leakB: uid("lb"),
    flow: uid("flow"),
    shine: uid("shine"),
    soft: uid("soft"),
    sc: uid("sc"),
  };
  const pal = aurora(theme.accentColor, theme.accentSecondary);
  const bg = theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;
  const fmt = (n: number): string => n.toLocaleString("en-US");

  const current = data.current.length;
  const longest = Math.max(data.longest.length, current);
  const target = MILESTONES.find((m) => m > current) ?? current;
  const p = current === 0 ? 0 : Math.min(Math.max(current / target, 0.03), 1);
  const total = data.total + (opts.includePrivate ? data.restricted : 0);

  const cx = W / 2;
  const cy = opts.hideTitle ? 166 : 236;
  const H = cy + 158;
  const R = 92;
  const SW = 15;
  const r = Math.min(br, 18);

  const header = opts.hideTitle
    ? ""
    : `<g class="dropT">
    ${sparkle(PAD + 58, 34, pal[2], 1.2, 1.1)}${sparkle(PAD + 4, 76, theme.accentColor, 2.2, 0.9)}
    <circle cx="${PAD + 24}" cy="52" r="20" fill="${theme.accentColor}" opacity="0.55" filter="url(#${id.shs})" class="gshadow"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.badgeBg}"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.accentColor}" opacity="0.14"/>
    <circle class="softping" cx="${PAD + 24}" cy="52" r="24" fill="none" stroke="${theme.accentColor}" stroke-width="1.5"/>
    <circle class="spin" cx="${PAD + 24}" cy="52" r="29" fill="none" stroke="url(#${id.line})" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="26 156" style="transform-origin:${PAD + 24}px 52px"/>
    <g class="flame"><svg x="${PAD + 12}" y="40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.flame}</svg></g>
    <text x="${PAD + 70}" y="52" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="-0.3" fill="${theme.titleColor}">Contribution Streak</text>
    <text x="${PAD + 70}" y="77" font-family="${MONO}" font-size="13" font-weight="600" fill="${theme.iconColor}">@${escapeXml(data.login)}<tspan fill="${theme.subTextColor}" font-weight="500">  ·  ${fmt(data.activeDays)} active days in the last year</tspan></text>
  </g>`;

  const litTicks = Math.round(p * 60);
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const r1 = R + 21;
    const r2 = R + (i % 5 === 0 ? 31 : 27);
    const x1 = (cx + Math.cos(a) * r1).toFixed(1);
    const y1 = (cy + Math.sin(a) * r1).toFixed(1);
    const x2 = (cx + Math.cos(a) * r2).toFixed(1);
    const y2 = (cy + Math.sin(a) * r2).toFixed(1);
    if (i < litTicks) {
      return `<line class="fade" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#${id.ring})" stroke-width="2.6" stroke-linecap="round" style="animation-delay:${(0.5 + i * 0.022).toFixed(2)}s"/>`;
    }
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${theme.subTextColor}" stroke-opacity="0.22" stroke-width="1.6" stroke-linecap="round"/>`;
  }).join("");

  const endAngle = -Math.PI / 2 + p * Math.PI * 2;
  const ex = cx + Math.cos(endAngle) * R;
  const ey = cy + Math.sin(endAngle) * R;
  const digits = String(current).length;
  const numSize = digits <= 2 ? 58 : digits === 3 ? 50 : 42;

  const ringSvg = `<g class="spinIn">
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="url(#${id.ring})" stroke-width="${SW + 18}" opacity="0.28" filter="url(#${id.sh})" class="gshadow"/>
    <circle class="spinr" cx="${cx}" cy="${cy}" r="${R + 44}" fill="none" stroke="url(#${id.ring})" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="80 46 18 46" style="transform-origin:${cx}px ${cy}px"/>
    <circle cx="${cx}" cy="${cy}" r="${R - SW / 2 - 5}" fill="${theme.badgeBg}" opacity="0.55"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${theme.barBackground}" stroke-width="${SW}"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${theme.border}" stroke-opacity="0.6" stroke-width="${SW + 2}" opacity="0.35"/>
    ${ticks}
    ${
      current > 0
        ? `<g transform="rotate(-90 ${cx} ${cy})">
      <circle class="ringarc" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="url(#${id.ring})" stroke-width="${SW + 8}" stroke-linecap="round" pathLength="1" stroke-dasharray="${p.toFixed(4)} 1" opacity="0.5" filter="url(#${id.shs})" style="--p:${p.toFixed(4)}"/>
      <circle class="ringarc" cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="url(#${id.ring})" stroke-width="${SW}" stroke-linecap="round" pathLength="1" stroke-dasharray="${p.toFixed(4)} 1" style="--p:${p.toFixed(4)}"/>
    </g>
    ${
      p < 1
        ? `<g class="fade" style="animation-delay:1.7s"><circle class="softping" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${SW / 2 + 3}" fill="${pal[1]}"/><circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${SW / 2 - 3}" fill="${theme.badgeBg}" opacity="0.85"/></g>`
        : ""
    }`
        : ""
    }
  </g>
  <g class="zoom" style="animation-delay:0.55s">
    <g class="flame" style="--bd:3"><svg x="${cx - 17}" y="${cy - 72}" width="34" height="34" viewBox="0 0 24 24" fill="${theme.accentColor}" fill-opacity="0.2" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.flame}</svg></g>
  </g>
  <g class="zoom" style="animation-delay:0.75s">
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="${FONT}" font-size="${numSize}" font-weight="800" letter-spacing="-1.5" fill="${theme.titleColor}">${fmt(current)}</text>
  </g>
  <g class="fromB" style="animation-delay:0.95s">
    <text x="${cx}" y="${cy + 35}" text-anchor="middle" font-family="${MONO}" font-size="11.5" font-weight="700" letter-spacing="3.2" fill="${theme.accentColor}">DAY STREAK</text>
    <text x="${cx}" y="${cy + 53}" text-anchor="middle" font-family="${MONO}" font-size="10" font-weight="600" letter-spacing="1.1" fill="${theme.subTextColor}">${current > 0 ? (p < 1 ? `GOAL · ${target} DAYS` : "GOAL REACHED") : "START TODAY"}</text>
  </g>
  ${sparkle(cx + R + 52, cy - R + 10, pal[2], 1.3, 1.3)}${sparkle(cx - R - 54, cy + R - 20, theme.accentColor, 2.3, 1.1)}${sparkle(cx + 18, cy - R - 38, pal[1], 3, 0.9)}`;

  const pw = 232;
  const ph = 206;
  const py = cy - ph / 2;
  const leftX = PAD;
  const rightX = W - PAD - pw;
  const pr = Math.min(r + 4, 20);

  const label = (x: number, y: number, icon: string, text: string, color: string): string =>
    `<svg x="${x}" y="${y - 12}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg><text x="${x + 24}" y="${y}" font-family="${MONO}" font-size="10.5" font-weight="700" letter-spacing="1.6" fill="${theme.subTextColor}">${text}</text>`;

  const panelBase = (x: number, k: number, colors: string[]): string => `${glowShadow({ x, y: py, w: pw, h: ph, r: pr, colors, blurId: id.sh, animate, dy: 10, inset: 10, opacity: 0.4, begin: k * 2, dur: 10 })}
    <rect x="${x}" y="${py}" width="${pw}" height="${ph}" rx="${pr}" fill="${theme.badgeBg}"/>
    <rect x="${x}" y="${py}" width="${pw}" height="${ph}" rx="${pr}" fill="${colors[0]}" opacity="0.07"/>
    <rect x="${x + 0.5}" y="${py + 0.5}" width="${pw - 1}" height="${ph - 1}" rx="${pr}" fill="none" stroke="${colors[0]}" stroke-opacity="0.3"/>
    <rect x="${x + 0.5}" y="${py + 0.5}" width="${pw - 1}" height="${ph - 1}" rx="${pr}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.75" stroke-width="1.3"/>
    <rect x="${x + 18}" y="${py + 1}" width="${pw - 36}" height="1" fill="#ffffff" opacity="0.16"/>
    ${shine(`${id.sc}_${k}`, id.soft, x, py, pw, ph, pr, 2 + k * 1.2)}
    <rect class="wipe" x="${x + 20}" y="${py + 124}" width="${pw - 40}" height="1" fill="${theme.border}" style="animation-delay:${(0.8 + k * 0.2).toFixed(2)}s"/>`;

  const leftPanel = `<g class="fromL" style="animation-delay:0.2s">
    ${panelBase(leftX, 0, [pal[0], pal[2], pal[0]])}
    ${label(leftX + 20, py + 34, L.zap, "CONTRIBUTIONS", pal[0])}
    <text x="${leftX + 20}" y="${py + 84}" font-family="${FONT}" font-size="${fmt(total).length > 6 ? 36 : 42}" font-weight="800" letter-spacing="-0.8" fill="${theme.statValueColor}">${fmt(total)}</text>
    <text x="${leftX + 20}" y="${py + 106}" font-family="${MONO}" font-size="11.5" font-weight="600" fill="${theme.subTextColor}">Last 12 months</text>
    ${label(leftX + 20, py + 150, L.calendar, "ACTIVE DAYS", pal[1])}
    <text x="${leftX + 20}" y="${py + 188}" font-family="${FONT}" font-size="30" font-weight="800" fill="${theme.titleColor}">${fmt(data.activeDays)}<tspan font-size="14" font-weight="600" fill="${theme.subTextColor}" dx="6">of ${fmt(data.windowDays)}</tspan></text>
  </g>`;

  const weekMax = Math.max(1, ...data.week.map((d) => d.count));
  const bw = 20;
  const bgap = (pw - 40 - bw * 7) / 6;
  const baseY = py + ph - 16;
  const bars = data.week
    .map((d, i) => {
      const h = d.count > 0 ? Math.max(5, (d.count / weekMax) * 30) : 4;
      const x = rightX + 20 + i * (bw + bgap);
      const isToday = i === data.week.length - 1;
      return `<rect class="wipeY" x="${x.toFixed(1)}" y="${(baseY - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4" fill="${d.count > 0 ? `url(#${id.bar})` : theme.barBackground}" ${isToday ? `stroke="${theme.accentColor}" stroke-opacity="0.8"` : ""} style="animation-delay:${(0.9 + i * 0.08).toFixed(2)}s"><title>${d.date}: ${d.count}</title></rect>`;
    })
    .join("");

  const rightPanel = `<g class="fromR" style="animation-delay:0.3s">
    ${panelBase(rightX, 1, [pal[1], pal[0], pal[1]])}
    ${label(rightX + 20, py + 34, L.trophy, "LONGEST STREAK", pal[1])}
    <text x="${rightX + 20}" y="${py + 84}" font-family="${FONT}" font-size="42" font-weight="800" letter-spacing="-0.8" fill="${theme.statValueColor}">${fmt(longest)}<tspan font-size="15" font-weight="600" fill="${theme.subTextColor}" dx="7">${longest === 1 ? "day" : "days"}</tspan></text>
    <text x="${rightX + 20}" y="${py + 106}" font-family="${MONO}" font-size="11.5" font-weight="600" fill="${theme.subTextColor}">${escapeXml(rangeText(longest === data.longest.length ? data.longest : data.current))}</text>
    ${label(rightX + 20, py + 150, L.activity, "THIS WEEK", pal[0])}
    ${bars}
  </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution streak of ${escapeXml(data.login)}: ${current} days">
  <title>${escapeXml(data.login)} - ${current} day contribution streak</title>
  <defs>
    <linearGradient id="${id.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="${id.edge}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0"/>
      <stop offset="25%" stop-color="${theme.accentColor}"/>
      <stop offset="75%" stop-color="${theme.accentSecondary}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id.line}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <linearGradient id="${id.bar}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <linearGradient id="${id.ring}" gradientUnits="userSpaceOnUse" x1="${cx - R}" y1="${cy}" x2="${cx + R}" y2="${cy}">
      <stop offset="0%" stop-color="${pal[0]}"/>
      <stop offset="50%" stop-color="${pal[1]}"/>
      <stop offset="100%" stop-color="${pal[2]}"/>
      ${animate ? `<animateTransform attributeName="gradientTransform" type="rotate" values="0 ${cx} ${cy};360 ${cx} ${cy}" dur="12s" repeatCount="indefinite"/>` : ""}
    </linearGradient>
    ${auroraDefs({ leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], shineId: id.shine, softId: id.soft })}
    ${flowGradient(id.flow, [pal[0], pal[1], pal[2]], W, animate, 8)}
    ${shadowBlur(id.sh, 13)}
    ${shadowBlur(id.shs, 6)}
    <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <style>${fxCss(animate)}
      @keyframes ringdraw { from { stroke-dashoffset: calc(var(--p) + .02); } to { stroke-dashoffset: 0; } }
      .ringarc { animation: ringdraw 1.7s cubic-bezier(.3,.7,.2,1) .35s both; }
    </style>
  </defs>

  <g clip-path="url(#${id.clip})">
    ${auroraBackground({ W, H, pad: PAD, bgId: id.bg, edgeId: id.edge, leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], leakAPos: [cx, cy], leakBPos: [W - 100, H - 40], leakR: 330, shineId: id.shine })}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.5" stroke-width="1.2"/>

  ${header}
  ${leftPanel}
  ${rightPanel}
  ${ringSvg}
</svg>`;
}

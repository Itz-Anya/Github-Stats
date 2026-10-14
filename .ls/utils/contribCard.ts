import type { Theme } from "../themes/index.js";
import type { ContribData } from "../lib/contrib.js";
import { addDays, daysBetween, summarize, weekday } from "../lib/contrib.js";
import type { LifetimeQuick } from "../lib/contrib.js";
import { escapeXml } from "./sanitize.js";
import { L } from "./icons.js";
import { aurora, auroraBackground, auroraDefs, flowGradient, fxCss, glowShadow, shadowBlur, shine, sparkle } from "./fx.js";

const W = 900;
const PAD = 36;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function uid(p: string): string {
  return `${p}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseHex(c: string): [number, number, number] | null {
  let h = c.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return t < 0.5 ? a : b;
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function fmtDate(date: string): string {
  const [, m, d] = date.split("-");
  return `${MONTHS[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

export interface ContribOptions {
  hideTitle: boolean;
  year?: number;
  includePrivate: boolean;
  animate?: boolean;
}

export function renderContribCard(
  data: ContribData,
  lifetime: LifetimeQuick | null,
  theme: Theme,
  borderRadius: number,
  opts: ContribOptions
): string {
  const br = borderRadius;
  const id = { bg: uid("bg"), clip: uid("clip"), glow: uid("glow"), area: uid("area"), line: uid("line"), blur: uid("blur"), shine: uid("shine"), scan: uid("scan"), gclip: uid("gclip"), leakA: uid("la"), leakB: uid("lb"), flow: uid("flow"), sh: uid("sh"), shs: uid("shs"), sclip: uid("sclip"), soft: uid("soft"), sc: uid("sc") };
  const pal = aurora(theme.accentColor, theme.accentSecondary);
  const animate = opts.animate !== false;
  const bg = theme.backgroundGradient?.[0] ?? theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;
  const innerW = W - PAD * 2;
  const sum = summarize(data);

  const privWindow = opts.includePrivate ? data.restricted : 0;
  const windowTotal = sum.total + privWindow;
  const lifeOk = lifetime !== null && lifetime.totalCommits + lifetime.privateContributions > 0;
  const lifePriv = lifetime && opts.includePrivate ? lifetime.privateContributions : 0;
  const lifeCommits = lifetime ? lifetime.totalCommits + lifePriv : 0;
  const longest = sum.longest;
  const current = sum.current;
  const fmt = (n: number): string => n.toLocaleString("en-US");

  const empty = mix(bg, theme.subTextColor, 0.14);
  const levels = [
    empty,
    mix(bg, theme.accentColor, 0.3),
    mix(bg, theme.accentColor, 0.62),
    theme.accentColor,
    theme.accentSecondary,
  ];

  const gridStart = addDays(data.from, -weekday(data.from));
  const weeks = Math.floor(daysBetween(gridStart, data.to) / 7) + 1;
  const labelW = 34;
  const gx0 = PAD + labelW;
  const pitch = (innerW - labelW) / weeks;
  const cell = Math.max(pitch - 3.2, 4);
  const cellR = Math.min(4, cell / 3);

  const headerH = opts.hideTitle ? 0 : 74;
  const chipsY = 34 + headerH + (opts.hideTitle ? 0 : 6);
  const chipH = 78;
  const sparkY = chipsY + chipH + 30;
  const sparkH = 60;
  const monthY = sparkY + sparkH + 26;
  const gy0 = monthY + 12;
  const gridH = 7 * pitch;
  const legendY = gy0 + gridH + 26;
  const H = legendY + 34;

  const period = opts.year ? `in ${opts.year}` : "in the last year";
  const header = opts.hideTitle
    ? ""
    : `<g class="dropT">
    ${sparkle(PAD + 56, 34, pal[2], 1.2, 1.1)}${sparkle(PAD + 4, 74, theme.accentColor, 2.1, 0.9)}
    <circle cx="${PAD + 24}" cy="52" r="20" fill="${theme.accentColor}" opacity="0.55" filter="url(#${id.shs})" class="gshadow"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.badgeBg}"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.accentColor}" opacity="0.14"/>
    <circle class="softping" cx="${PAD + 24}" cy="52" r="24" fill="none" stroke="${theme.accentColor}" stroke-width="1.5"/>
    <circle class="spin" cx="${PAD + 24}" cy="52" r="29" fill="none" stroke="url(#${id.line})" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="26 156" style="transform-origin:${PAD + 24}px 52px"/>
    <g class="beat"><svg x="${PAD + 12}" y="40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.activity}</svg></g>
    <text x="${PAD + 70}" y="52" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="-0.3" fill="${theme.titleColor}">Contribution Activity</text>
    <text x="${PAD + 70}" y="77" font-family="${MONO}" font-size="13" font-weight="600" fill="${theme.iconColor}">@${escapeXml(data.login)}<tspan fill="${theme.subTextColor}" font-weight="500">  ·  ${fmt(windowTotal)} contributions ${period}</tspan></text>
  </g>`;

  const chips = [
    lifeOk
      ? { icon: L.commit, label: lifetime?.approx ? "PUBLIC COMMITS" : "TOTAL COMMITS", value: fmt(lifeCommits), unit: "", color: theme.accentColor }
      : { icon: L.commit, label: "ACTIVE DAYS", value: fmt(sum.activeDays), unit: "days", color: theme.accentColor },
    { icon: L.activity, label: opts.year ? `IN ${opts.year}` : "PAST YEAR", value: fmt(windowTotal), unit: "", color: theme.accentSecondary },
    { icon: L.trophy, label: "LONGEST STREAK", value: String(longest), unit: longest === 1 ? "day" : "days", color: theme.accentColor },
    { icon: L.flame, label: "CURRENT STREAK", value: String(current), unit: current === 1 ? "day" : "days", color: theme.accentSecondary },
  ];
  const cgap = 14;
  const cw = (innerW - cgap * 3) / 4;
  const chipR = Math.min(br, 16);
  const chipsSvg = chips
    .map((c, i) => {
      const x = PAD + i * (cw + cgap);
      const cy = chipsY + chipH / 2;
      const d = 0.12 + i * 0.12;
      const fx = ["fromL", "dropT", "dropT", "fromR"][i % 4];
      return `<g class="${fx}" style="animation-delay:${d.toFixed(2)}s">
      ${glowShadow({ x, y: chipsY, w: cw, h: chipH, r: chipR, colors: [c.color, pal[2], c.color], blurId: id.sh, animate, dy: 8, inset: 8, begin: i * 1.4, dur: 10 })}
      <rect x="${x}" y="${chipsY}" width="${cw}" height="${chipH}" rx="${chipR}" fill="${theme.badgeBg}"/>
      <rect x="${x}" y="${chipsY}" width="${cw}" height="${chipH}" rx="${chipR}" fill="${c.color}" opacity="0.07"/>
      <rect x="${x + 0.5}" y="${chipsY + 0.5}" width="${cw - 1}" height="${chipH - 1}" rx="${chipR}" fill="none" stroke="${c.color}" stroke-opacity="0.28"/>
      <rect x="${x + 0.5}" y="${chipsY + 0.5}" width="${cw - 1}" height="${chipH - 1}" rx="${chipR}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.8" stroke-width="1.3"/>
      <rect x="${x + 16}" y="${chipsY + 1}" width="${cw - 32}" height="1" fill="#ffffff" opacity="0.16"/>
      ${shine(`${id.sc}_${i}`, id.soft, x, chipsY, cw, chipH, chipR, 1.8 + i * 0.9)}
      <g opacity="0.6"><rect class="wipe" x="${x + 14}" y="${chipsY + chipH - 4}" width="${cw - 28}" height="2" rx="1" fill="${c.color}" style="animation-delay:${(d + 0.5).toFixed(2)}s"/></g>
      <circle class="softping" cx="${x + 34}" cy="${cy - 1}" r="18" fill="none" stroke="${c.color}" stroke-width="1.5" style="animation-delay:${(1 + i * 0.6).toFixed(1)}s"/>
      <circle cx="${x + 34}" cy="${cy - 1}" r="21" fill="${c.color}" opacity="0.16"/>
      <g class="zoom" style="animation-delay:${(d + 0.25).toFixed(2)}s"><g class="${c.icon === L.flame ? "flame" : c.icon === L.trophy ? "bob" : "beat"}" style="--bd:2.5"><svg x="${x + 23}" y="${cy - 12}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${c.icon}</svg></g></g>
      <g class="revealR" style="animation-delay:${(d + 0.2).toFixed(2)}s">
      <text x="${x + 66}" y="${cy - 3}" font-family="${FONT}" font-size="25" font-weight="800" fill="${theme.statValueColor}">${escapeXml(c.value)}<tspan font-size="12" font-weight="600" fill="${theme.subTextColor}" dx="5">${escapeXml(c.unit)}</tspan></text>
      <text x="${x + 66}" y="${cy + 19}" font-family="${FONT}" font-size="10.5" font-weight="600" letter-spacing="0.9" fill="${theme.subTextColor}">${c.label}</text>
      </g>
    </g>`;
    })
    .join("");

  const weekly = new Array<number>(weeks).fill(0);
  data.days.forEach((d) => {
    weekly[Math.floor(daysBetween(gridStart, d.date) / 7)] += d.count;
  });
  const wmax = Math.max(...weekly, 1);
  const px = (i: number): number => gx0 + i * pitch + cell / 2;
  const py = (v: number): number => sparkY + sparkH - 4 - (v / wmax) * (sparkH - 14);
  let line = `M ${px(0).toFixed(1)} ${py(weekly[0]).toFixed(1)}`;
  for (let i = 1; i < weeks; i++) {
    const mx = (px(i - 1) + px(i)) / 2;
    line += ` C ${mx.toFixed(1)} ${py(weekly[i - 1]).toFixed(1)} ${mx.toFixed(1)} ${py(weekly[i]).toFixed(1)} ${px(i).toFixed(1)} ${py(weekly[i]).toFixed(1)}`;
  }
  const area = `${line} L ${px(weeks - 1).toFixed(1)} ${sparkY + sparkH} L ${px(0).toFixed(1)} ${sparkY + sparkH} Z`;
  const peakIdx = weekly.indexOf(wmax);
  const clipX = gx0 - 6;
  const clipW = weeks * pitch + 12;
  const sparkClipDef = `<clipPath id="${id.sclip}"><rect x="${clipX.toFixed(1)}" y="${sparkY - 14}" width="${clipW.toFixed(1)}" height="${sparkH + 28}">${
    animate
      ? `<animate attributeName="width" values="0;0;${clipW.toFixed(1)}" keyTimes="0;0.18;1" calcMode="spline" keySplines="0 0 1 1;.3 .7 .2 1" dur="2s" begin="0s" fill="freeze"/>`
      : ""
  }</rect></clipPath>`;
  const px0 = px(peakIdx).toFixed(1);
  const py0 = py(wmax).toFixed(1);
  const spark =
    sum.total > 0
      ? `<g>
    <g class="fromL" style="animation-delay:0.5s"><text x="${PAD}" y="${sparkY + 10}" font-family="${MONO}" font-size="10.5" font-weight="700" letter-spacing="1.6" fill="${theme.subTextColor}">WEEKLY</text></g>
    <g clip-path="url(#${id.sclip})">
      <path d="${area}" fill="url(#${id.area})"/>
      <path d="${line}" fill="none" stroke="url(#${id.line})" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" filter="url(#${id.shs})"/>
      <path d="${line}" fill="none" stroke="url(#${id.line})" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g class="fade" style="animation-delay:1.9s">
      <circle class="ping" cx="${px0}" cy="${py0}" r="5" fill="${theme.accentSecondary}"/>
      <circle cx="${px0}" cy="${py0}" r="9" fill="${theme.accentSecondary}" opacity="0.2"/>
      <circle cx="${px0}" cy="${py0}" r="3.8" fill="${theme.accentSecondary}" stroke="${bg}" stroke-width="1.5"/>
      ${sparkle(Number(px0) + 13, Number(py0) - 11, pal[2], 0.4, 1)}
    </g>
    ${
      animate
        ? `<g class="fade" style="animation-delay:2.2s"><g>
      <animateMotion path="${line}" dur="7s" begin="2.2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="7s" begin="2.2s" repeatCount="indefinite"/>
      <circle r="10" fill="${pal[2]}" opacity="0.3"/>
      <circle r="3.4" fill="#ffffff"/>
    </g></g>`
        : ""
    }
  </g>`
      : "";

  let lastLabelCol = -10;
  let monthSvg = "";
  for (let c = 0; c < weeks; c++) {
    const sunday = addDays(gridStart, c * 7);
    const day = parseInt(sunday.slice(8, 10), 10);
    const first = c === 0 || day <= 7;
    const month = parseInt(sunday.slice(5, 7), 10) - 1;
    const prevMonth = c === 0 ? -1 : parseInt(addDays(gridStart, (c - 1) * 7).slice(5, 7), 10) - 1;
    if (first && (c === 0 || month !== prevMonth) && c - lastLabelCol >= 3) {
      monthSvg += `<text x="${(gx0 + c * pitch).toFixed(1)}" y="${monthY}" font-family="${FONT}" font-size="11.5" font-weight="600" fill="${theme.subTextColor}">${MONTHS[month]}</text>`;
      lastLabelCol = c;
    }
  }
  const dayLabels = [1, 3, 5]
    .map(
      (r) =>
        `<text x="${PAD}" y="${(gy0 + r * pitch + cell * 0.78).toFixed(1)}" font-family="${FONT}" font-size="10.5" font-weight="600" fill="${theme.subTextColor}">${["Mon", "Wed", "Fri"][(r - 1) / 2]}</text>`
    )
    .join("");

  const cols: string[] = new Array(weeks).fill("");
  const glow: string[] = [];
  for (const d of data.days) {
    const off = daysBetween(gridStart, d.date);
    const c = Math.floor(off / 7);
    const r = off % 7;
    const x = (gx0 + c * pitch).toFixed(2);
    const y = (gy0 + r * pitch).toFixed(2);
    const rect = `<rect x="${x}" y="${y}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${cellR.toFixed(2)}" fill="${levels[d.level]}"${
      d.level === 0 ? ` stroke="${theme.subTextColor}" stroke-opacity="0.08"` : ""
    }><title>${d.count} contribution${d.count === 1 ? "" : "s"} · ${d.date}</title></rect>`;
    cols[c] += rect;
    if (d.level >= 3) {
      glow.push(`<rect x="${x}" y="${y}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${cellR.toFixed(2)}" fill="${levels[d.level]}"/>`);
    }
  }
  const gridSvg = cols
    .map((c, i) => `<g class="cellcol" style="animation-delay:${(0.25 + i * 0.022).toFixed(3)}s">${c}</g>`)
    .join("");

  const lgSize = 13;
  const lgW = 5 * lgSize + 4 * 4;
  const lgX = W - PAD - lgW - 34;
  const legend = `<g class="fromB" style="animation-delay:1.5s">
    <text x="${PAD}" y="${legendY + 11}" font-family="${MONO}" font-size="11.5" fill="${theme.subTextColor}">${sum.activeDays} active days${sum.bestDay ? `  ·  best ${sum.bestDay.count} on ${fmtDate(sum.bestDay.date)}` : ""}${lifePriv + privWindow > 0 ? `  ·  incl. ${fmt(Math.max(lifePriv, privWindow))} private` : ""}</text>
    <text x="${lgX - 8}" y="${legendY + 11}" text-anchor="end" font-family="${FONT}" font-size="11.5" fill="${theme.subTextColor}">Less</text>
    ${levels.map((c, i) => `<rect class="lg" x="${lgX + i * (lgSize + 4)}" y="${legendY}" width="${lgSize}" height="${lgSize}" rx="3.5" fill="${c}" style="animation-delay:${(2 + i * 0.18).toFixed(2)}s"/>`).join("")}
    <text x="${lgX + lgW + 8}" y="${legendY + 11}" font-family="${FONT}" font-size="11.5" fill="${theme.subTextColor}">More</text>
  </g>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Contribution activity of ${escapeXml(data.login)}">
  <title>${escapeXml(data.login)} - Contribution activity</title>
  <defs>
    <linearGradient id="${id.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="${id.glow}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0"/>
      <stop offset="25%" stop-color="${theme.accentColor}"/>
      <stop offset="75%" stop-color="${theme.accentSecondary}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id.line}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <linearGradient id="${id.area}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${theme.accentColor}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id.scan}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
      <stop offset="60%" stop-color="${theme.accentSecondary}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
    </linearGradient>
    ${auroraDefs({ leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], shineId: id.shine, softId: id.soft })}
    ${flowGradient(id.flow, [pal[0], pal[1], pal[2]], W, animate, 8)}
    ${sparkClipDef}
    <clipPath id="${id.gclip}"><rect x="${gx0 - 2}" y="${gy0 - 2}" width="${(weeks * pitch + 4).toFixed(1)}" height="${(gridH + 4).toFixed(1)}" rx="6"/></clipPath>
    <filter id="${id.blur}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
    ${shadowBlur(id.sh, 13)}
    ${shadowBlur(id.shs, 6)}
    <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <style>${fxCss(animate)}
      @keyframes cellin { 0% { opacity: 0; transform: translateY(-34px) scale(.4); } 65% { opacity: 1; transform: translateY(3px) scale(1.06); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes lgpulse { 0%,70%,100% { transform: scale(1); } 85% { transform: scale(1.25); } }
      .lg { transform-box: fill-box; transform-origin: center; animation: lgpulse 4s ease-in-out infinite; }
      .cellcol { transform-box: fill-box; transform-origin: center; animation: cellin .75s cubic-bezier(.22,1,.36,1) both; }
      .glowcells { animation: breathe 3.4s ease-in-out infinite; }
    </style>
  </defs>

  <g clip-path="url(#${id.clip})">
    ${auroraBackground({ W, H, pad: PAD, bgId: id.bg, edgeId: id.glow, leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], leakAPos: [120, 70], leakBPos: [W - 100, H - 40], leakR: 320, shineId: id.shine })}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.5" stroke-width="1.2"/>

  ${header}
  ${chipsSvg}
  ${spark}
  <g class="dropT" style="animation-delay:0.6s">${monthSvg}</g><g class="fromL" style="animation-delay:0.7s">${dayLabels}</g>
  <g class="glowcells"><g filter="url(#${id.blur})" opacity="0.6">${glow.join("")}</g></g>
  ${gridSvg}
  <g clip-path="url(#${id.gclip})"><rect class="shimmer" x="${gx0 - 110}" y="${gy0 - 2}" width="100" height="${(gridH + 4).toFixed(1)}" fill="url(#${id.scan})" style="--travel:${(weeks * pitch + 130).toFixed(0)}px;animation-duration:8s;animation-delay:2.6s"/></g>
  ${legend}
</svg>`;
}

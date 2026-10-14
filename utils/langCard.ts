import type { Theme } from "../themes/index.js";
import type { LangStackData } from "../lib/langstack.js";
import type { TechItem } from "../lib/profile.js";
import { escapeXml, truncate } from "./sanitize.js";
import { contrast, drawGlyph, getTechIcon } from "./techIcons.js";
import { isDarkLogo, logoId } from "./techLogos.js";
import { aurora, auroraBackground, auroraDefs, flowGradient, fxCss, glowShadow, shadowBlur, shine, sparkle } from "./fx.js";

const W = 900;
const PAD = 36;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572a5", Java: "#b07219",
  "C++": "#f34b7d", C: "#7a7a7a", "C#": "#178600", Go: "#00add8", Rust: "#dea584",
  Ruby: "#cc342d", PHP: "#8892bf", Swift: "#f05138", Kotlin: "#a97bff", Dart: "#00b4ab",
  Scala: "#c22d40", R: "#198ce7", Shell: "#89e051", PowerShell: "#3b78d8", HTML: "#e34c26",
  CSS: "#7b52c9", SCSS: "#c6538c", Less: "#4a6fa5", Vue: "#41b883", Svelte: "#ff3e00",
  Astro: "#ff5a03", MDX: "#fcb32c", Lua: "#3b5bdb", Perl: "#0298c3", Haskell: "#7a63b0",
  Elixir: "#8a5fb0", Clojure: "#db5855", Julia: "#a270ba", MATLAB: "#e16737",
  "Jupyter Notebook": "#da5b0b", "Objective-C": "#438eff", Assembly: "#b08550",
  Zig: "#ec915c", Nix: "#7e7eff", Groovy: "#4298b8", TeX: "#5a9a2a", "Vim Script": "#199f4b",
  Terraform: "#7b42bc", Solidity: "#aa6746",
};
const FALLBACK = ["#58a6ff", "#3fb950", "#d29922", "#bc8cff", "#f778ba", "#39c5cf", "#ff7b72"];

export function langColor(name: string): string {
  if (LANG_COLORS[name]) return LANG_COLORS[name];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return FALLBACK[h % FALLBACK.length];
}

const LUCIDE_CODE =
  '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>';
const LUCIDE_OTHER =
  '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>';

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function fmtPercent(p: number): string {
  if (p < 0.1) return "<0.1%";
  return `${p.toFixed(1)}%`;
}

export interface LangCardOptions {
  limit: number;
  hideTitle: boolean;
  animate?: boolean;
}

export interface Row {
  name: string;
  bytes: number;
  percent: number;
  color: string;
  item: TechItem | null;
}

export function buildLangRows(data: LangStackData, hide: Set<string>, limit: number): Row[] {
  const visible = data.languages.filter((l) => !hide.has(l.name.toLowerCase()));
  const total = visible.reduce((s, l) => s + l.bytes, 0) || 1;

  const all: Row[] = visible.map((l) => ({
    name: l.name,
    bytes: l.bytes,
    percent: (l.bytes / total) * 100,
    color: langColor(l.name),
    item: { key: l.name, name: l.name, kind: "language" as const, repos: 0 },
  }));

  const top = all.slice(0, limit);
  const rest = all.slice(limit);
  if (rest.length) {
    const bytes = rest.reduce((s, l) => s + l.bytes, 0);
    const percent = (bytes / total) * 100;
    if (percent >= 0.1) top.push({ name: `Other (${rest.length})`, bytes, percent, color: "#8b949e", item: null });
  }
  return top;
}

export function renderLangCard(
  data: LangStackData,
  rows: Row[],
  theme: Theme,
  borderRadius: number,
  logos: Record<string, string>,
  opts: LangCardOptions
): string {
  const br = borderRadius;
  const id = { bg: uid("bg"), clip: uid("clip"), glow: uid("glow"), blur: uid("blur"), core: uid("core"), mask: uid("mask"), shine: uid("shine"), leakA: uid("la"), leakB: uid("lb"), flow: uid("flow"), sh: uid("sh"), line: uid("line"), soft: uid("soft"), sc: uid("sc") };
  const pal = aurora(theme.accentColor, theme.accentSecondary);
  const animate = opts.animate !== false;
  const bg1 = theme.backgroundGradient?.[0] ?? theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;

  const headerH = opts.hideTitle ? 0 : 74;
  const top = 34 + headerH + (opts.hideTitle ? 0 : 14);
  const rowH = 52;
  const tile = 38;
  const rowsH = rows.length * rowH;
  const contentH = Math.max(rowsH, 270);
  const H = top + contentH + 36;

  const dcx = PAD + 128;
  const dcy = top + contentH / 2;
  const dr = 98;
  const dw = 26;
  const circ = 2 * Math.PI * dr;
  const GAP = 3;

  const rx0 = PAD + 292;
  const rowsTop = top + (contentH - rowsH) / 2;
  const SEGS = 24;
  const segGap = 2.5;
  const barX0 = rx0 + 214;
  const barX1 = W - PAD - 76;
  const segW = (barX1 - barX0 - segGap * (SEGS - 1)) / SEGS;
  const segH = 16;

  const header = opts.hideTitle
    ? ""
    : `<g class="dropT">
    ${sparkle(PAD + 58, 34, pal[2], 1.2, 1.1)}${sparkle(PAD + 4, 76, theme.accentColor, 2.2, 0.9)}
    <circle cx="${PAD + 24}" cy="52" r="20" fill="${theme.accentColor}" opacity="0.55" filter="url(#${id.sh})" class="gshadow"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.badgeBg}"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.accentColor}" opacity="0.14"/>
    <circle class="softping" cx="${PAD + 24}" cy="52" r="24" fill="none" stroke="${theme.accentColor}" stroke-width="1.5"/>
    <circle class="spin" cx="${PAD + 24}" cy="52" r="29" fill="none" stroke="url(#${id.line})" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="26 156" style="transform-origin:${PAD + 24}px 52px"/>
    <g class="bob" style="--bd:2.5"><svg x="${PAD + 12}" y="40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE_CODE}</svg></g>
    <text x="${PAD + 70}" y="52" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="-0.3" fill="${theme.titleColor}">Most Used Languages</text>
    <text x="${PAD + 70}" y="77" font-family="${MONO}" font-size="13" font-weight="600" fill="${theme.iconColor}">@${escapeXml(data.login)}<tspan fill="${theme.subTextColor}" font-weight="500">  ·  ${data.repoCount} repos  ·  ${data.languages.length} languages</tspan></text>
  </g>`;

  let acc = 0;
  let arcIdx = 0;
  const arcs = rows
    .map((r) => {
      const len = (r.percent / 100) * circ;
      const vis = Math.max(len - GAP, 1.2);
      const arc = `<circle cx="${dcx}" cy="${dcy}" r="${dr}" fill="none" stroke="${r.color}" stroke-width="${dw}" stroke-dasharray="${vis.toFixed(2)} ${(circ - vis).toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" transform="rotate(-90 ${dcx} ${dcy})" class="arc" style="animation-delay:${(1.9 + arcIdx++ * 0.3).toFixed(2)}s"/>`;
      acc += len;
      return arc;
    })
    .join("");

  const lead = rows[0];
  const leadColor = lead && contrast(lead.color, theme.background) >= 3.2 ? lead.color : theme.titleColor;
  const leadName = lead ? truncate(lead.name, 14) : "";
  const donut = `<g class="spinIn">
    <circle cx="${dcx}" cy="${dcy}" r="${dr}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.35" stroke-width="${dw + 22}" filter="url(#${id.sh})" class="gshadow"/>
    <circle cx="${dcx}" cy="${dcy}" r="${dr}" fill="none" stroke="${theme.barBackground}" stroke-width="${dw}"/>
    <g mask="url(#${id.mask})">
      <g filter="url(#${id.blur})" opacity="0.5">${arcs}</g>
      ${arcs}
    </g>
    <circle class="breathe" cx="${dcx}" cy="${dcy}" r="${dr - dw / 2 - 6}" fill="url(#${id.core})"/>
  </g>
  ${
    lead
      ? `${sparkle(dcx + dr + dw / 2 + 8, dcy - dr + 14, pal[2], 1.4, 1.2)}${sparkle(dcx - dr - dw / 2 - 6, dcy + dr - 16, theme.accentColor, 2.4, 1)}<g class="zoom" style="animation-delay:0.7s">
    <text x="${dcx}" y="${dcy - 26}" text-anchor="middle" font-family="${MONO}" font-size="10.5" font-weight="700" letter-spacing="2" fill="${theme.subTextColor}">TOP LANGUAGE</text>
    <text x="${dcx}" y="${dcy + 14}" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="800" letter-spacing="-1" fill="${theme.titleColor}">${escapeXml(Math.round(lead.percent).toString())}<tspan font-size="22" fill="${leadColor}">%</tspan></text>
    <text x="${dcx}" y="${dcy + 38}" text-anchor="middle" font-family="${FONT}" font-size="15" font-weight="700" fill="${leadColor}">${escapeXml(leadName)}</text>
  </g>`
      : ""
  }`;

  const rowsSvg = rows
    .map((r, i) => {
      const y = rowsTop + i * rowH;
      const cy = y + rowH / 2;
      const ty = cy - tile / 2;
      const delay = 0.15 + i * 0.07;
      const tr = Math.min(br + 2, 12);

      let glyph: string;
      if (r.item) {
        const logo = logos[logoId(r.item)];
        const icon = getTechIcon(r.item.key, "language");
        if (logo) {
          const plate = isDarkLogo(r.item)
            ? `<rect x="${rx0 + tile / 2 - 15}" y="${cy - 15}" width="30" height="30" rx="8" fill="#e6edf3" opacity="0.95"/>`
            : "";
          glyph = `${plate}<image x="${rx0 + tile / 2 - 12}" y="${cy - 12}" width="24" height="24" href="${logo}" xlink:href="${logo}" preserveAspectRatio="xMidYMid meet"/>`;
        } else {
          const c = contrast(icon.color, theme.badgeBg) >= 3.6 ? icon.color : theme.titleColor;
          glyph = `<g transform="translate(${rx0 + tile / 2} ${cy}) scale(0.85)">${drawGlyph(icon, c, FONT)}</g>`;
        }
      } else {
        glyph = `<svg x="${rx0 + tile / 2 - 11}" y="${cy - 11}" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${theme.subTextColor}" stroke-width="2.4" stroke-linecap="round">${LUCIDE_OTHER}</svg>`;
      }

      const exact = (r.percent / 100) * SEGS;
      const full = Math.floor(exact);
      const part = exact - full;
      let segs = "";
      let lit = "";
      for (let k = 0; k < SEGS; k++) {
        const x = barX0 + k * (segW + segGap);
        const base = `<rect x="${x.toFixed(2)}" y="${(cy - segH / 2).toFixed(2)}" width="${segW.toFixed(2)}" height="${segH}" rx="2.6"`;
        segs += `${base} fill="${theme.barBackground}"/>`;
        let op = 0;
        if (k < full) op = 0.5 + 0.5 * (k / Math.max(full - 1, 1));
        else if (k === full && part > 0.08) op = 0.25 + 0.5 * part;
        else if (k === 0) op = 0.5;
        if (op > 0) {
          lit += `${base} fill="${r.color}" opacity="${op.toFixed(2)}" class="seg" style="animation-delay:${(delay + k * 0.018).toFixed(3)}s,${(delay + 1.3 + k * 0.1).toFixed(2)}s"/>`;
        }
      }

      const pnlY = cy - (rowH - 6) / 2;
      return `<g class="${["fromR", "dropT", "fromB"][i % 3]}" style="animation-delay:${delay.toFixed(2)}s">
      ${glowShadow({ x: rx0 - 10, y: pnlY, w: W - PAD - rx0 + 20, h: rowH - 6, r: tr + 4, colors: [r.color, pal[2], r.color], blurId: id.sh, animate, dy: 5, inset: 8, opacity: 0.28, begin: i * 1.1, dur: 11 })}
      <rect x="${rx0 - 10}" y="${pnlY}" width="${W - PAD - rx0 + 20}" height="${rowH - 6}" rx="${tr + 4}" fill="${theme.badgeBg}" opacity="0.55"/>
      <rect x="${rx0 - 9.5}" y="${pnlY + 0.5}" width="${W - PAD - rx0 + 19}" height="${rowH - 7}" rx="${tr + 4}" fill="none" stroke="${r.color}" stroke-opacity="0.22"/>
      <rect x="${rx0 - 10}" y="${cy - 10}" width="3" height="20" rx="1.5" fill="${r.color}"/>
      ${shine(`${id.sc}_${i}`, id.soft, rx0 - 10, pnlY, W - PAD - rx0 + 20, rowH - 6, tr + 4, 2.2 + i * 0.7)}
      <rect x="${rx0}" y="${ty}" width="${tile}" height="${tile}" rx="${tr}" fill="${theme.badgeBg}"/>
      <rect x="${rx0}" y="${ty}" width="${tile}" height="${tile}" rx="${tr}" fill="${r.color}" opacity="0.14"/>
      <rect x="${rx0 + 0.5}" y="${ty + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="${tr}" fill="none" stroke="${r.color}" stroke-opacity="0.4"/>
      ${glyph}
      <text x="${rx0 + tile + 14}" y="${cy + 5.5}" font-family="${FONT}" font-size="16.5" font-weight="700" fill="${theme.titleColor}">${escapeXml(truncate(r.name, 15))}</text>
      ${segs}
      <g filter="url(#${id.blur})" opacity="0.55">${lit}</g>
      ${lit}
      <text x="${W - PAD - 2}" y="${cy + 6}" text-anchor="end" font-family="${FONT}" font-size="17" font-weight="800" fill="${theme.titleColor}">${escapeXml(fmtPercent(r.percent))}</text>
    </g>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Most used languages of ${escapeXml(data.login)}">
  <title>${escapeXml(data.login)} - Most used languages</title>
  <defs>
    <linearGradient id="${id.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="${id.glow}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0"/>
      <stop offset="25%" stop-color="${theme.accentColor}"/>
      <stop offset="75%" stop-color="${theme.accentSecondary}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id.core}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${theme.accentColor}" stop-opacity="0.02"/>
    </radialGradient>
    <filter id="${id.blur}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    <mask id="${id.mask}" maskUnits="userSpaceOnUse" x="${dcx - dr - dw - 20}" y="${dcy - dr - dw - 20}" width="${(dr + dw + 20) * 2}" height="${(dr + dw + 20) * 2}">
      <circle class="draw" pathLength="1" cx="${dcx}" cy="${dcy}" r="${dr}" fill="none" stroke="#ffffff" stroke-width="${dw + 34}" transform="rotate(-90 ${dcx} ${dcy})"/>
    </mask>
    ${auroraDefs({ leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], shineId: id.shine, softId: id.soft })}
    ${flowGradient(id.flow, [pal[0], pal[1], pal[2]], W, animate, 8)}
    <linearGradient id="${id.line}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${theme.accentColor}"/><stop offset="100%" stop-color="${theme.accentSecondary}"/></linearGradient>
    ${shadowBlur(id.sh, 9)}
    <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <style>${fxCss(animate)}
      @keyframes segin { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      .draw { stroke-dasharray: 1; animation: draw 1.5s cubic-bezier(.3,.7,.2,1) .15s both; }
      .seg { transform-box: fill-box; transform-origin: center; animation: segin .4s ease both, wave 3.4s ease-in-out infinite; }
      @keyframes arcbeat { 0%,12%,100% { stroke-width: ${dw}px; } 6% { stroke-width: ${dw + 6}px; } }
      @keyframes wave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.32); } }
      .arc { animation: arcbeat 5.4s ease-in-out infinite; }
    </style>
  </defs>

  <g clip-path="url(#${id.clip})">
    ${auroraBackground({ W, H, pad: PAD, bgId: id.bg, edgeId: id.glow, leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], leakAPos: [dcx, dcy], leakBPos: [W - 120, H - 40], leakR: 300, shineId: id.shine })}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.5" stroke-width="1.2"/>

  ${header}
  ${donut}
  ${rowsSvg}
</svg>`;
}

import type { Theme } from "../themes/index.js";
import type { PinnedData, PinnedItem } from "../lib/pinned.js";
import { escapeXml, formatNumber, truncate } from "./sanitize.js";
import { langColor } from "./langCard.js";
import { isDarkLogo, logoId } from "./techLogos.js";
import { aurora, auroraBackground, auroraDefs, flowGradient, fxCss, glowShadow, shadowBlur, sparkle } from "./fx.js";

const W = 900;
const PAD = 36;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";

const L = {
  trophy:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  repo: '<path d="M10 2v8l3-3 3 3V2"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
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

function colorOf(it: PinnedItem, theme: Theme): string {
  if (it.languageColor && /^#[0-9a-fA-F]{3,8}$/.test(it.languageColor)) return it.languageColor;
  return it.language ? langColor(it.language) : theme.accentColor;
}

export function renderPinnedCard(
  data: PinnedData,
  theme: Theme,
  borderRadius: number,
  logos: Record<string, string>,
  opts: { hideTitle: boolean; animate?: boolean }
): string {
  const br = borderRadius;
  const id = { bg: uid("bg"), clip: uid("clip"), glow: uid("glow"), blur: uid("blur"), shineBar: uid("shinebar"), cc: uid("cc"), leakA: uid("la"), leakB: uid("lb"), flow: uid("flow"), sh: uid("sh"), shs: uid("shs"), line: uid("line"), soft: uid("soft") };
  const pal = aurora(theme.accentColor, theme.accentSecondary);
  const animate = opts.animate !== false;
  const clipDefs: string[] = [];
  const bg1 = theme.backgroundGradient?.[0] ?? theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;
  const innerW = W - PAD * 2;

  const items = data.items;
  const totalStars = items.reduce((s, i) => s + i.stars, 0);
  const maxStars = Math.max(...items.map((i) => i.stars), 1);

  const headerH = opts.hideTitle ? 0 : 74;
  const top = 34 + headerH + (opts.hideTitle ? 0 : 10);
  const gap = 16;
  const cardH = 170;
  const rows = Math.max(1, Math.ceil(items.length / 2));
  const H = top + rows * cardH + (rows - 1) * gap + 36;

  const header = opts.hideTitle
    ? ""
    : `<g class="dropT">
    ${sparkle(PAD + 58, 34, pal[2], 1.2, 1.1)}${sparkle(PAD + 4, 76, theme.accentColor, 2.2, 0.9)}
    <circle cx="${PAD + 24}" cy="52" r="20" fill="${theme.accentColor}" opacity="0.55" filter="url(#${id.shs})" class="gshadow"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.badgeBg}"/>
    <circle cx="${PAD + 24}" cy="52" r="24" fill="${theme.accentColor}" opacity="0.14"/>
    <circle class="softping" cx="${PAD + 24}" cy="52" r="24" fill="none" stroke="${theme.accentColor}" stroke-width="1.5"/>
    <circle class="spin" cx="${PAD + 24}" cy="52" r="29" fill="none" stroke="url(#${id.line})" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="26 156" style="transform-origin:${PAD + 24}px 52px"/>
    <g class="bob" style="--bd:2.5"><svg x="${PAD + 12}" y="40" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.trophy}</svg></g>
    <text x="${PAD + 70}" y="52" font-family="${FONT}" font-size="26" font-weight="800" letter-spacing="-0.3" fill="${theme.titleColor}">Top Repos</text>
    <text x="${PAD + 70}" y="77" font-family="${MONO}" font-size="13" font-weight="600" fill="${theme.iconColor}">@${escapeXml(data.login)}<tspan fill="${theme.subTextColor}" font-weight="500">  ·  ${items.length} ${items.length === 1 ? "repo" : "repos"}  ·  ${escapeXml(formatNumber(totalStars))} stars</tspan></text>
  </g>`;

  const cardR = Math.min(br + 4, 18);
  const tile = 48;

  const cards = items
    .map((it, i) => {
      const alone = items.length % 2 === 1 && i === items.length - 1 && items.length > 1;
      const cw = alone ? innerW : (innerW - gap) / 2;
      const col = alone ? 0 : i % 2;
      const row = Math.floor(i / 2);
      const x = PAD + col * (cw + gap);
      const y = top + row * (cardH + gap);
      const color = colorOf(it, theme);
      const tx = x + 22;
      const maxChars = Math.floor((cw - 44) / 7.1);
      const noDesc = !it.description?.trim();
      const desc = noDesc ? ["No description provided."] : wrap(it.description as string, maxChars, 2);
      const delay = (0.1 + i * 0.08).toFixed(2);
      clipDefs.push(`<clipPath id="${id.cc}_${i}"><rect x="${x}" y="${y}" width="${cw}" height="${cardH}" rx="${cardR}"/></clipPath>`);

      const logo = it.language ? logos[logoId({ key: it.language, kind: "language" })] : undefined;
      const tcx = tx + tile / 2;
      const tcy = y + 22 + tile / 2;
      let tileGlyph: string;
      if (logo && it.language) {
        const plate = isDarkLogo({ key: it.language, kind: "language" })
          ? `<rect x="${tcx - 17}" y="${tcy - 17}" width="34" height="34" rx="9" fill="#e6edf3" opacity="0.95"/>`
          : "";
        tileGlyph = `${plate}<image x="${tcx - 14}" y="${tcy - 14}" width="28" height="28" href="${logo}" xlink:href="${logo}" preserveAspectRatio="xMidYMid meet"/>`;
      } else {
        tileGlyph = `<svg x="${tcx - 12}" y="${tcy - 12}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${L.repo}</svg>`;
      }

      const descSvg = desc
        .map((ln, k) => `<text x="${tx}" y="${y + 96 + k * 19}" font-family="${FONT}" font-size="13.5" fill="${theme.subTextColor}"${noDesc ? ' font-style="italic" opacity="0.7"' : ""}>${escapeXml(ln)}</text>`)
        .join("");

      const py = y + 126;
      const ph = 26;
      let px = tx;
      let pills = "";
      if (it.language) {
        const lw = 36 + Math.min(it.language.length, 16) * 7.2;
        pills += `<rect x="${px}" y="${py}" width="${lw.toFixed(1)}" height="${ph}" rx="13" fill="${color}" opacity="0.14"/>
        <rect x="${px + 0.5}" y="${py + 0.5}" width="${(lw - 1).toFixed(1)}" height="${ph - 1}" rx="13" fill="none" stroke="${color}" stroke-opacity="0.45"/>
        <circle cx="${px + 15}" cy="${py + ph / 2}" r="8" fill="${color}" opacity="0.25"/><circle class="ping" cx="${px + 15}" cy="${py + ph / 2}" r="4.5" fill="${color}" style="animation-delay:${(i * 0.45).toFixed(2)}s"/><circle cx="${px + 15}" cy="${py + ph / 2}" r="4.5" fill="${color}"/>
        <text x="${px + 28}" y="${py + 17.5}" font-family="${FONT}" font-size="12.5" font-weight="700" fill="${theme.titleColor}">${escapeXml(truncate(it.language, 16))}</text>`;
        px += lw + 8;
      }
      const pill = (icon: string, n: number, c: string): string => {
        const label = formatNumber(n);
        const w = 40 + label.length * 7.6;
        const out = `<rect x="${px}" y="${py}" width="${w.toFixed(1)}" height="${ph}" rx="13" fill="${theme.barBackground}" opacity="0.9"/>
        <rect x="${px + 0.5}" y="${py + 0.5}" width="${(w - 1).toFixed(1)}" height="${ph - 1}" rx="13" fill="none" stroke="${c}" stroke-opacity="0.35"/>
        <g class="${icon === L.star ? "starbeat" : ""}" style="animation-delay:${(i * 0.7 + 1.5).toFixed(1)}s"><svg x="${px + 10}" y="${py + 5.5}" width="15" height="15" viewBox="0 0 24 24" fill="${icon === L.star ? c : "none"}" fill-opacity="0.25" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></g>
        <text x="${px + 30}" y="${py + 17.5}" font-family="${FONT}" font-size="12.5" font-weight="700" fill="${theme.titleColor}">${escapeXml(label)}</text>`;
        px += w + 8;
        return out;
      };
      pills += pill(L.star, it.stars, theme.accentSecondary);
      pills += pill(L.fork, it.forks, theme.accentColor);

      const meterW = cw - 44;
      const meterFill = Math.max((it.stars / maxStars) * meterW, 6);

      return `<g class="${alone ? "fromB" : col === 0 ? (row % 2 === 0 ? "fromL" : "dropT") : row % 2 === 0 ? "dropT" : "fromR"}" style="animation-delay:${delay}s"><g class="bob" style="--bd:2.5;animation-duration:${(4.2 + (i % 3) * 0.5).toFixed(1)}s;animation-delay:${(1.2 + i * 0.6).toFixed(1)}s">
      ${glowShadow({ x, y, w: cw, h: cardH, r: cardR, colors: [color, pal[2], color], blurId: id.sh, animate, dy: 10, inset: 10, opacity: 0.4, begin: i * 1.7, dur: 10 })}
      <rect x="${x}" y="${y}" width="${cw}" height="${cardH}" rx="${cardR}" fill="${theme.badgeBg}"/>
      <rect x="${x}" y="${y}" width="${cw}" height="${cardH}" rx="${cardR}" fill="url(#${id.glow}_${i})"/>
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${cardH - 1}" rx="${cardR}" fill="none" stroke="${color}" stroke-opacity="0.32"/>
      <rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${cardH - 1}" rx="${cardR}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.55" stroke-width="1.2"/>
      <rect x="${x + 18}" y="${y + 1}" width="${cw - 36}" height="1" fill="#ffffff" opacity="0.14"/>
      <rect class="trace" pathLength="100" x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${cardH - 1}" rx="${cardR}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" style="animation-duration:${(6 + (i % 3)).toFixed(0)}s;animation-delay:${(i * 0.8).toFixed(1)}s"/>
      <g clip-path="url(#${id.cc}_${i})"><rect class="shimmer" x="${x - 70}" y="${y - 10}" width="60" height="${cardH + 20}" fill="url(#${id.soft})" style="--travel:${(cw + 150).toFixed(0)}px;animation-delay:${(1.5 + i * 0.9).toFixed(1)}s"/></g>
      <rect x="${x + 22}" y="${y}" width="${Math.min(84, cw - 44)}" height="3" rx="1.5" fill="${color}"/>
      <rect x="${tx}" y="${y + 22}" width="${tile}" height="${tile}" rx="14" fill="${theme.background}" opacity="0.55"/>
      <rect x="${tx}" y="${y + 22}" width="${tile}" height="${tile}" rx="14" fill="${color}" opacity="0.14"/>
      <rect x="${tx + 0.5}" y="${y + 22.5}" width="${tile - 1}" height="${tile - 1}" rx="14" fill="none" stroke="${color}" stroke-opacity="0.45"/>
      ${tileGlyph}
      <text x="${tx + tile + 14}" y="${y + 42}" font-family="${FONT}" font-size="19" font-weight="800" fill="${theme.iconColor}">${escapeXml(truncate(it.name, Math.floor((cw - 150) / 10.6)))}</text>
      <text x="${tx + tile + 14}" y="${y + 61}" font-family="${MONO}" font-size="11.5" fill="${theme.subTextColor}">${escapeXml(truncate(`${it.owner}/${it.name}`, Math.floor((cw - 150) / 7)))}</text>
      ${descSvg}
      ${pills}
      <rect x="${tx}" y="${y + cardH - 12}" width="${meterW}" height="3" rx="1.5" fill="${theme.barBackground}"/>
      <rect class="wipe" x="${tx}" y="${y + cardH - 12}" width="${meterFill.toFixed(1)}" height="3" rx="1.5" fill="${color}" opacity="0.9" style="animation-delay:${(0.5 + i * 0.1).toFixed(2)}s;animation-duration:1.3s"/>
    </g></g>`;
    })
    .join("");

  const glows = items
    .map((it, i) => {
      const color = colorOf(it, theme);
      return `<linearGradient id="${id.glow}_${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.16"/>
      <stop offset="65%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Top repos of ${escapeXml(data.login)}">
  <title>${escapeXml(data.login)} - Top Repos</title>
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
    ${glows}
    ${clipDefs.join("\n    ")}
    ${auroraDefs({ leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], shineId: id.shineBar, softId: id.soft })}
    ${flowGradient(id.flow, [pal[0], pal[1], pal[2]], W, animate, 8)}
    <linearGradient id="${id.line}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${theme.accentColor}"/><stop offset="100%" stop-color="${theme.accentSecondary}"/></linearGradient>
    ${shadowBlur(id.sh, 13)}
    ${shadowBlur(id.shs, 6)}
    <clipPath id="${id.clip}"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <style>${fxCss(animate)}
      @keyframes starbeat { 0%,60%,100% { transform: scale(1) rotate(0); } 70% { transform: scale(1.35) rotate(12deg); } 82% { transform: scale(1) rotate(0); } }
      .starbeat { transform-box: fill-box; transform-origin: center; animation: starbeat 4.5s ease-in-out infinite; }
    </style>
  </defs>

  <g clip-path="url(#${id.clip})">
    ${auroraBackground({ W, H, pad: PAD, bgId: id.bg, edgeId: id.glow, leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], leakAPos: [140, 90], leakBPos: [W - 120, H - 60], leakR: 320, shineId: id.shineBar })}
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.5" stroke-width="1.2"/>

  ${header}
  ${cards}
</svg>`;
}

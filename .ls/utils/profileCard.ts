import type { Theme } from "../themes/index.js";
import type { ProfileData } from "../lib/profile.js";
import { escapeXml, formatNumber, truncate } from "./sanitize.js";
import { contrast, drawGlyph, getTechIcon } from "./techIcons.js";
import { isDarkLogo, logoId } from "./techLogos.js";
import { aurora, auroraBackground, auroraDefs, flowGradient, fxCss, glowShadow, shadowBlur, shine, sparkle } from "./fx.js";

const W = 900;
const PAD = 40;
const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'SF Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace";

const LUCIDE: Record<string, string> = {
  followers:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  star:
    '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  fork:
    '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  repo:
    '<path d="M10 2v8l3-3 3 3V2"/><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
};

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const lines: string[] = [];
  let line = "";
  let consumed = 0;

  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) {
      line = next;
      continue;
    }
    if (line) {
      lines.push(line);
      consumed += line.length + 1;
      if (lines.length === maxLines) {
        line = "";
        break;
      }
    }
    line = word.length > maxChars ? word.slice(0, maxChars - 1) + "…" : word;
  }
  if (line && lines.length < maxLines) {
    lines.push(line);
    consumed += line.length + 1;
  }

  if (consumed < clean.length && lines.length) {
    const last = lines[lines.length - 1].replace(/[\s.,;:!-]+$/, "");
    lines[lines.length - 1] = (last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last) + "…";
  }
  return lines.slice(0, maxLines);
}

export function renderProfileCard(
  data: ProfileData,
  theme: Theme,
  borderRadius: number,
  logos: Record<string, string> = {},
  opts: { animate: boolean } = { animate: true }
): string {
  const br = borderRadius;
  const id = {
    comet: uid("comet"),
    bg: uid("bg"),
    ring: uid("ring"),
    clip: uid("clip"),
    glow: uid("glow"),
    bar: uid("bar"),
    leakA: uid("la"),
    leakB: uid("lb"),
    flow: uid("flow"),
    sh: uid("sh"),
    shs: uid("shs"),
    shineBar: uid("shb"),
    soft: uid("soft"),
    sc: uid("sc"),
  };
  const pal = aurora(theme.accentColor, theme.accentSecondary);

  const bg1 = theme.backgroundGradient?.[0] ?? theme.background;
  const bg2 = theme.backgroundGradient?.[1] ?? theme.background;
  const innerW = W - PAD * 2;

  const avatarR = 104;
  const avatarCx = W - PAD - avatarR - 10;
  const avatarCy = 40 + avatarR + 10;
  const textMaxX = avatarCx - avatarR - 40;
  const textW = textMaxX - PAD;

  const displayName = truncate(data.name?.trim() || data.login, 40);
  const nameLen = Math.max(displayName.length, 1);
  const nameSize = Math.max(34, Math.min(60, Math.floor(textW / (nameLen * 0.6))));
  const nameOverflows = nameLen * nameSize * 0.6 > textW * 0.98;

  const showHandle =
    Boolean(data.name?.trim()) && data.name!.trim().toLowerCase() !== data.login.toLowerCase();
  const handleText = `@${data.login}`;
  const handleSize = 19;

  const bioSize = 20;
  const bioLineH = 29;
  const bioChars = Math.floor(textW / (bioSize * 0.5));
  const hasBio = Boolean(data.bio?.trim());
  const bioLines = hasBio ? wrapText(data.bio!, bioChars, 4) : ["No bio added yet."];

  const blockH = nameSize + (showHandle ? 14 + handleSize : 0) + 18 + bioLines.length * bioLineH;
  const blockTop = Math.max(34, avatarCy - blockH / 2);
  const nameY = blockTop + nameSize * 0.85;
  const handleY = nameY + 14 + handleSize;
  const bioStartY = (showHandle ? handleY : nameY) + 18 + bioSize;

  const bioSvg = bioLines
    .map(
      (ln, i) =>
        `<text x="${PAD}" y="${bioStartY + i * bioLineH}" font-family="${FONT}" font-size="${bioSize}" font-style="italic" fill="${theme.subTextColor}"${
          hasBio ? "" : ' opacity="0.7"'
        }>${escapeXml(ln)}</text>`
    )
    .join("");

  const initial = escapeXml((data.login[0] ?? "?").toUpperCase());
  const avatarSvg = data.avatarBase64
    ? `<image x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR * 2}" height="${avatarR * 2}" href="${data.avatarBase64}" xlink:href="${data.avatarBase64}" clip-path="url(#${id.clip})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="${theme.badgeBg}"/>
       <text x="${avatarCx}" y="${avatarCy + 28}" text-anchor="middle" font-family="${FONT}" font-size="84" font-weight="800" fill="${theme.accentColor}">${initial}</text>`;

  const row2Y = avatarCy + avatarR + 34;
  const boxH = 104;
  const gap = 16;
  const boxW = (innerW - gap * 3) / 4;

  const stats: Array<{ label: string; value: number; icon: string; color: string }> = [
    { label: "Followers", value: data.followers, icon: "followers", color: theme.accentColor },
    { label: "Total Stars", value: data.totalStars, icon: "star", color: theme.accentSecondary },
    { label: "Total Forks", value: data.totalForks, icon: "fork", color: theme.accentColor },
    { label: "Repositories", value: data.publicRepos, icon: "repo", color: theme.accentSecondary },
  ];

  const boxR = Math.min(br, 16);
  const boxesSvg = stats
    .map((s, i) => {
      const x = PAD + i * (boxW + gap);
      const cx = x + 38;
      const cy = row2Y + boxH / 2;
      return `<g class="${["dropT", "dropT", "dropT", "dropT"][i % 4]}" style="animation-delay:${(0.25 + i * 0.13).toFixed(2)}s">
        ${glowShadow({ x, y: row2Y, w: boxW, h: boxH, r: boxR, colors: [s.color, pal[2], s.color], blurId: id.sh, animate: opts.animate, dy: 9, inset: 9, opacity: 0.4, begin: i * 1.5, dur: 10 })}
        <rect x="${x}" y="${row2Y}" width="${boxW}" height="${boxH}" rx="${boxR}" fill="${theme.badgeBg}"/>
        <rect x="${x}" y="${row2Y}" width="${boxW}" height="${boxH}" rx="${boxR}" fill="${s.color}" opacity="0.06"/>
        <rect x="${x + 0.5}" y="${row2Y + 0.5}" width="${boxW - 1}" height="${boxH - 1}" rx="${boxR}" fill="none" stroke="${s.color}" stroke-opacity="0.3"/>
        <rect x="${x + 0.5}" y="${row2Y + 0.5}" width="${boxW - 1}" height="${boxH - 1}" rx="${boxR}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.75" stroke-width="1.3"/>
        <rect x="${x + 16}" y="${row2Y + 1}" width="${boxW - 32}" height="1" fill="#ffffff" opacity="0.16"/>
        <g opacity="0.55"><rect class="wipe" x="${x + 14}" y="${row2Y + boxH - 3}" width="${boxW - 28}" height="2" rx="1" fill="${s.color}" style="animation-delay:${(0.5 + i * 0.1).toFixed(2)}s"/></g>
        <circle class="softping" cx="${cx}" cy="${cy - 1}" r="22" fill="none" stroke="${s.color}" stroke-width="1.5" style="animation-delay:${(1 + i * 0.6).toFixed(1)}s"/>
        <g class="bob" style="--bd:3;animation-delay:${(1.2 + i * 0.5).toFixed(1)}s;animation-duration:${(3.6 + i * 0.3).toFixed(1)}s">
          <circle cx="${cx}" cy="${cy - 1}" r="26" fill="${s.color}" opacity="0.16"/>
          <svg x="${cx - 15}" y="${cy - 16}" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${LUCIDE[s.icon] ?? ""}</svg>
        </g>
        ${shine(`${id.sc}_${i}`, id.soft, x, row2Y, boxW, boxH, boxR, 2 + i * 0.9)}
        <g class="fromR" style="animation-delay:${(0.5 + i * 0.13).toFixed(2)}s"><text x="${x + 76}" y="${cy + 6}" font-family="${FONT}" font-size="34" font-weight="800" fill="${theme.statValueColor}">${escapeXml(formatNumber(s.value))}</text>
        <text x="${x + 76}" y="${cy + 28}" font-family="${FONT}" font-size="11.5" font-weight="600" letter-spacing="0.8" fill="${theme.subTextColor}">${escapeXml(s.label.toUpperCase())}</text></g>
      </g>`;
    })
    .join("");

  const tech = data.tech;
  const row3Y = row2Y + boxH + 46;
  const tileSize = 76;
  const logoSize = 46;
  const perRow = 6;
  const slotW = innerW / perRow;
  const pitch = tileSize + 42;
  const tilesY0 = row3Y + 26;
  const rows = Math.max(1, Math.ceil(tech.length / perRow));
  const tileR = Math.min(br + 6, 20);

  const tilesSvg = tech.length
    ? tech
        .map((t, i) => {
          const r = Math.floor(i / perRow);
          const inRow = Math.min(perRow, tech.length - r * perRow);
          const col = i - r * perRow;
          const cx = PAD + ((perRow - inRow) * slotW) / 2 + col * slotW + slotW / 2;
          const x = cx - tileSize / 2;
          const y = tilesY0 + r * pitch;
          const cy = y + tileSize / 2;

          const icon = getTechIcon(t.key, t.kind);
          const logo = logos[logoId(t)];
          const label = truncate(t.name, 14);

          let glyph: string;
          if (logo) {
            const plate = isDarkLogo(t)
              ? `<rect x="${cx - logoSize / 2 - 5}" y="${cy - logoSize / 2 - 5}" width="${logoSize + 10}" height="${logoSize + 10}" rx="12" fill="#e6edf3" opacity="0.95"/>`
              : "";
            glyph = `${plate}<image x="${cx - logoSize / 2}" y="${cy - logoSize / 2}" width="${logoSize}" height="${logoSize}" href="${logo}" xlink:href="${logo}" preserveAspectRatio="xMidYMid meet"/>`;
          } else {
            const iconColor = contrast(icon.color, theme.badgeBg) >= 3.6 ? icon.color : theme.titleColor;
            glyph = `<g transform="translate(${cx} ${cy}) scale(1.4)">${drawGlyph(icon, iconColor, FONT)}</g>`;
          }

          const dist = Math.abs(col - (inRow - 1) / 2) + r * 0.7;
          return `<g class="${["fromR", "fromB", "dropT", "fromL"][(col + r) % 4]}" style="animation-delay:${(0.7 + dist * 0.1 + r * 0.12).toFixed(2)}s">
            <g class="bob" style="--bd:3;animation-delay:${(1.5 + ((i * 0.37) % 4)).toFixed(2)}s;animation-duration:${(3.6 + (i % 3) * 0.5).toFixed(1)}s">
            ${glowShadow({ x, y, w: tileSize, h: tileSize, r: tileR, colors: [icon.color, pal[2], icon.color], blurId: id.shs, animate: opts.animate, dy: 6, inset: 6, opacity: 0.45, begin: i * 0.9, dur: 9 })}
            <rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="${tileR}" fill="${theme.badgeBg}"/>
            <rect x="${x}" y="${y}" width="${tileSize}" height="${tileSize}" rx="${tileR}" fill="${icon.color}" opacity="0.1"/>
            <rect x="${x + 0.5}" y="${y + 0.5}" width="${tileSize - 1}" height="${tileSize - 1}" rx="${tileR}" fill="none" stroke="${theme.accentColor}" stroke-opacity="0.3"/>
            ${glyph}
            <text x="${cx}" y="${y + tileSize + 22}" text-anchor="middle" font-family="${FONT}" font-size="13.5" font-weight="600" fill="${theme.textColor}" opacity="0.9">${escapeXml(label)}</text>
            </g>
          </g>`;
        })
        .join("")
    : `<text x="${PAD}" y="${tilesY0 + 36}" font-family="${FONT}" font-size="16" font-style="italic" fill="${theme.subTextColor}" opacity="0.7">No public repositories with a detected language yet.</text>`;

  const H = tilesY0 + (rows - 1) * pitch + tileSize + 22 + 30;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub profile card for ${escapeXml(data.login)}">
  <title>${escapeXml(displayName)} - GitHub Profile</title>
  <defs>
    <linearGradient id="${id.bg}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="${id.ring}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${theme.accentColor}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <linearGradient id="${id.bar}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0"/>
      <stop offset="25%" stop-color="${theme.accentColor}"/>
      <stop offset="75%" stop-color="${theme.accentSecondary}"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="${id.glow}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${theme.accentColor}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${theme.accentColor}" stop-opacity="0"/>
    </radialGradient>
    ${auroraDefs({ leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], shineId: id.shineBar, softId: id.soft })}
    ${flowGradient(id.flow, [pal[0], pal[1], pal[2]], W, opts.animate, 8)}
    ${shadowBlur(id.sh, 13)}
    ${shadowBlur(id.shs, 8)}
    <clipPath id="${id.clip}"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}"/></clipPath>
    <clipPath id="${id.clip}_card"><rect width="${W}" height="${H}" rx="${br}"/></clipPath>
    <linearGradient id="${id.comet}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${theme.accentSecondary}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}"/>
    </linearGradient>
    <style>${fxCss(opts.animate)}
      .ring { animation: breathe 3.2s ease-in-out infinite; }
      .avping { transform-box: fill-box; transform-origin: center; animation: avping 3.4s ease-out infinite; }
      @keyframes avping { 0% { transform: scale(1); opacity: .6; } 75%,100% { transform: scale(1.2); opacity: 0; } }
      .orbit { animation: spin 9s linear infinite; }
      .orbit2 { animation: spin 6s linear infinite; }
      .glowpulse { transform-box: fill-box; transform-origin: center; animation: glowpulse 5s ease-in-out infinite; }
      @keyframes glowpulse { 0%,100% { transform: scale(.92); opacity: .75; } 50% { transform: scale(1.08); opacity: 1; } }
    </style>
  </defs>

  <g clip-path="url(#${id.clip}_card)">
    ${auroraBackground({ W, H, pad: PAD, bgId: id.bg, edgeId: id.bar, leakA: id.leakA, leakB: id.leakB, colorA: pal[0], colorB: pal[1], leakAPos: [PAD + 60, H - 120], leakBPos: [W - 80, 60], leakR: 320, shineId: id.shineBar })}
    <circle class="glowpulse" cx="${avatarCx}" cy="${avatarCy}" r="260" fill="url(#${id.glow})"/>
  </g>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="${theme.border}" stroke-width="1.2"/>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${br}" fill="none" stroke="url(#${id.flow})" stroke-opacity="0.5" stroke-width="1.2"/>

  <g class="fromL" style="animation-delay:0.1s">
    <text x="${PAD}" y="${nameY}" font-family="${FONT}" font-size="${nameSize}" font-weight="800" letter-spacing="-0.5" fill="${theme.titleColor}"${
      nameOverflows ? ` textLength="${Math.floor(textW)}" lengthAdjust="spacingAndGlyphs"` : ""
    }>${escapeXml(displayName)}</text>
  </g>
  <g class="dropT" style="animation-delay:0.35s">
    ${
      showHandle
        ? `<text x="${PAD}" y="${handleY}" font-family="${MONO}" font-size="${handleSize}" font-weight="600" fill="${theme.iconColor}">${escapeXml(handleText)}</text>`
        : ""
    }
  </g>
  <g class="fromB" style="animation-delay:0.5s">
    ${bioSvg}
  </g>
  <g class="fromR" style="animation-delay:0.2s">
    ${sparkle(avatarCx - avatarR - 18, avatarCy - avatarR + 6, pal[2], 1.1, 1.2)}${sparkle(avatarCx + avatarR + 20, avatarCy + avatarR - 10, theme.accentColor, 2, 1)}
    <circle class="avping" cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 9}" fill="none" stroke="${theme.accentColor}" stroke-width="2"/>
    <circle class="spinr" cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 22}" fill="none" stroke="${theme.subTextColor}" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="2 10" stroke-linecap="round" style="transform-origin:${avatarCx}px ${avatarCy}px"/>
    <circle class="ring" cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 9}" fill="none" stroke="url(#${id.ring})" stroke-width="4"/>
    <g class="orbit" style="transform-origin:${avatarCx}px ${avatarCy}px">
      <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 9}" fill="none" stroke="url(#${id.comet})" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(2 * Math.PI * (avatarR + 9) * 0.18).toFixed(1)} ${(2 * Math.PI * (avatarR + 9) * 0.82).toFixed(1)}"/>
    </g>
    <g class="orbit2" style="transform-origin:${avatarCx}px ${avatarCy}px">
      <circle cx="${avatarCx + avatarR + 22}" cy="${avatarCy}" r="4.5" fill="${theme.accentSecondary}"/>
      <circle cx="${avatarCx + avatarR + 22}" cy="${avatarCy}" r="9" fill="${theme.accentSecondary}" opacity="0.25"/>
    </g>
    <circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR + 3}" fill="${theme.background}"/>
    ${avatarSvg}
  </g>

  ${boxesSvg}

  <g class="fromL" style="animation-delay:0.5s">
    <text x="${PAD}" y="${row3Y}" font-family="${MONO}" font-size="14" font-weight="700" letter-spacing="2.6" fill="${theme.titleColor}">TECH STACK</text>
    <rect class="wipe" x="${PAD + 128}" y="${row3Y - 5.6}" width="${innerW - 128}" height="1.2" fill="${theme.border}" style="animation-delay:0.6s;animation-duration:1.4s"/>
    <circle class="ping" cx="${PAD + 128}" cy="${row3Y - 5}" r="3" fill="${theme.accentColor}"/>
    <circle cx="${PAD + 128}" cy="${row3Y - 5}" r="3" fill="${theme.accentColor}"/>
  </g>
  ${tilesSvg}
</svg>`;
}

export function renderProfileError(message: string, theme: Theme, br: number): string {
  const Wd = 600;
  const Hd = 120;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}" viewBox="0 0 ${Wd} ${Hd}">
  <rect x="0.5" y="0.5" width="${Wd - 1}" height="${Hd - 1}" rx="${br}" fill="${theme.background}" stroke="#f85149" stroke-width="1.2"/>
  <rect x="0" y="0" width="5" height="${Hd}" fill="#f85149"/>
  <circle cx="38" cy="40" r="15" fill="none" stroke="#f85149" stroke-width="2"/>
  <rect x="36.8" y="31" width="2.4" height="11" rx="1.2" fill="#f85149"/>
  <circle cx="38" cy="47" r="1.6" fill="#f85149"/>
  <text x="66" y="45" font-family="${FONT}" font-size="16" font-weight="800" fill="#f85149">Profile card error</text>
  <text x="26" y="82" font-family="${FONT}" font-size="13" fill="${theme.subTextColor}">${escapeXml(truncate(message, 80))}</text>
</svg>`;
}

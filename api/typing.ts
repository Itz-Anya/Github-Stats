import type { VercelRequest, VercelResponse } from "@vercel/node";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function vlen(s: string): number {
  let n = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp === 0xfe0f || cp === 0x200d) continue;
    n += cp >= 0x1f000 || (cp >= 0x2600 && cp <= 0x27bf) || cp >= 0x3000 ? 2 : 1;
  }
  return n;
}

interface FontDef {
  name: string;
  generic: string;
  mono: boolean;
  cw: number;
  google: boolean;
  bold: boolean;
}

const f = (name: string, generic: string, mono: boolean, cw: number, google = true, bold = false): FontDef => ({ name, generic, mono, cw, google, bold });

const FONT_LIST: FontDef[] = [
  f("JetBrains Mono", "monospace", true, 0.6, true, true),
  f("Geist Mono", "monospace", true, 0.6, true, true),
  f("Fira Code", "monospace", true, 0.6, true, true),
  f("Space Mono", "monospace", true, 0.612, true, true),
  f("Red Hat Mono", "monospace", true, 0.6, true, true),
  f("Victor Mono", "monospace", true, 0.6, true, true),
  f("Source Code Pro", "monospace", true, 0.6, true, true),
  f("IBM Plex Mono", "monospace", true, 0.6, true, true),
  f("Roboto Mono", "monospace", true, 0.6, true, true),
  f("Ubuntu Mono", "monospace", true, 0.5, true, true),
  f("Inconsolata", "monospace", true, 0.5, true, true),
  f("Courier Prime", "monospace", true, 0.6, true, true),
  f("Press Start 2P", "monospace", true, 1),
  f("Space Grotesk", "sans-serif", false, 0.62, true, true),
  f("Syne", "sans-serif", false, 0.68, true, true),
  f("Unbounded", "sans-serif", false, 0.8, true, true),
  f("Sora", "sans-serif", false, 0.64, true, true),
  f("Outfit", "sans-serif", false, 0.6, true, true),
  f("Bricolage Grotesque", "sans-serif", false, 0.62, true, true),
  f("Lexend", "sans-serif", false, 0.66, true, true),
  f("Fredoka", "sans-serif", false, 0.62, true, true),
  f("Chakra Petch", "sans-serif", false, 0.62, true, true),
  f("Oxanium", "sans-serif", false, 0.66, true, true),
  f("Michroma", "sans-serif", false, 0.86),
  f("Silkscreen", "sans-serif", false, 0.8, true, true),
  f("Pixelify Sans", "sans-serif", false, 0.6, true, true),
  f("Rubik Glitch", "sans-serif", false, 0.74),
  f("Monoton", "sans-serif", false, 0.95),
  f("Rubik Mono One", "sans-serif", false, 0.95),
  f("Climate Crisis", "sans-serif", false, 1),
  f("Special Elite", "monospace", false, 0.62),
  f("Gloock", "serif", false, 0.62),
  f("Instrument Serif", "serif", false, 0.5),
  f("Fraunces", "serif", false, 0.62, true, true),
  f("Caveat", "cursive", false, 0.46, true, true),
  f("Kalam", "cursive", false, 0.5, true, true),
  f("Gochi Hand", "cursive", false, 0.5),
  f("Shadows Into Light", "cursive", false, 0.48),
];

const keyOf = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const FONTS = new Map(FONT_LIST.map((x) => [keyOf(x.name), x]));
const DEFAULT_TYPING = "Hi there, I'm a developer; I love building things; Welcome to my profile";
const MAX_CHARS = 400;
const PADX = 20;

interface TypingOpts {
  text: string;
  font: string;
  colors: string[];
  size: number;
  speed: number;
  pause: number;
  width?: number;
  height?: number;
  center: boolean;
  cursor: boolean;
  erase: boolean;
  bold: boolean;
  bg: string | null;
}

function parseHex(raw: string): string | null {
  const h = raw.trim().replace(/^#/, "");
  return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h) ? `#${h.toLowerCase()}` : null;
}

function phrases(text: string): string[][] {
  const out: string[][] = [];
  let used = 0;
  for (const part of text.split(";")) {
    const chars = Array.from(part.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim()).slice(0, 100);
    if (!chars.length) continue;
    const room = MAX_CHARS - used;
    if (room <= 0 || out.length >= 10) break;
    const cut = chars.slice(0, room);
    out.push(cut);
    used += cut.length;
  }
  return out.length ? out : [Array.from("Hello")];
}

const n4 = (x: number): string => x.toFixed(4).replace(/\.?0+$/, "") || "0";
const t2 = (x: number): string => x.toFixed(3);

function renderTyping(o: TypingOpts): string {
  const font = FONTS.get(keyOf(o.font)) ?? FONT_LIST[0];
  const list = phrases(o.text);
  const size = o.size;
  const s = o.speed / 1000;
  const e = s * 0.4;
  const lead = 0.4;
  const trail = 0.3;
  const hold = o.pause / 1000;
  const bold = o.bold && font.bold;

  const px = (chars: string[]): number => chars.reduce((a, ch) => a + vlen(ch) * font.cw * size, 0);
  const widest = Math.max(...list.map(px));
  const W = Math.round(o.width ?? Math.min(1600, Math.max(160, Math.ceil(widest + PADX * 2 + size * 0.6))));
  const H = Math.round(o.height ?? Math.ceil(size * 1.9));
  const baseY = (H / 2 + size * 0.34).toFixed(1);

  let t = 0;
  const spans = list.map((chars) => {
    const n = chars.length;
    const start = t;
    const typeStart = start + lead;
    const typeEnd = typeStart + n * s;
    const holdEnd = typeEnd + hold;
    const eraseEnd = o.erase ? holdEnd + n * e : holdEnd + 0.2;
    const end = eraseEnd + trail;
    t = end;
    return { chars, n, start, typeStart, typeEnd, holdEnd, eraseEnd, end };
  });
  const T = t;

  const fill = o.colors.length > 1 ? "url(#tg)" : o.colors[0];
  const grad =
    o.colors.length > 1
      ? `<defs><linearGradient id="tg" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${W}" y2="0">${o.colors
          .map((c, i) => `<stop offset="${((i / (o.colors.length - 1)) * 100).toFixed(1)}%" stop-color="${c}"/>`)
          .join("")}</linearGradient></defs>`
      : "";

  const family = `'${font.name}', ${font.generic}`;
  const imp = font.google
    ? `@import url('https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, "+")}${font.bold ? ":wght@400;700" : ""}&amp;display=swap');`
    : "";

  const charAnim = (a: number, d: number): string => {
    const kt = [0, a / T, d / T, 1].map(n4).join(";");
    return `<animate attributeName="fill-opacity" calcMode="discrete" dur="${t2(T)}s" repeatCount="indefinite" keyTimes="${kt}" values="0;1;0;0"/>`;
  };

  const texts: string[] = [];
  const cursorEvents: Array<[number, number]> = [];
  const curW = Math.max(2, size * 0.1);

  spans.forEach(({ chars, n, typeStart, holdEnd }) => {
    const appear = (i: number): number => typeStart + i * s;
    const vanish = (i: number): number => (o.erase ? holdEnd + (n - i) * e : holdEnd);
    if (font.mono) {
      const lineW = px(chars);
      const x0 = o.center ? (W - lineW) / 2 : PADX;
      let x = x0;
      const parts: string[] = [];
      const xs: number[] = [x0];
      chars.forEach((ch, i) => {
        const adv = vlen(ch) * font.cw * size;
        if (ch !== " ") {
          parts.push(`<tspan x="${x.toFixed(2)}" fill-opacity="0">${escapeXml(ch)}${charAnim(appear(i), vanish(i))}</tspan>`);
        }
        x += adv;
        xs.push(x);
      });
      texts.push(`<text y="${baseY}" font-family="${family}" font-size="${size}" font-weight="${bold ? 700 : 400}" fill="${fill}" xml:space="preserve">${parts.join("")}</text>`);
      cursorEvents.push([spans[texts.length - 1].start, x0]);
      chars.forEach((_, i) => cursorEvents.push([appear(i), xs[i + 1]]));
      if (o.erase) for (let i = n - 1; i >= 0; i--) cursorEvents.push([holdEnd + (n - i) * e, xs[i]]);
      else cursorEvents.push([holdEnd, x0]);
    } else {
      const parts = chars.map((ch, i) => `<tspan fill-opacity="0">${escapeXml(ch)}${charAnim(appear(i), vanish(i))}</tspan>`).join("");
      const ax = o.center ? W / 2 : PADX;
      texts.push(`<text x="${ax}" y="${baseY}" text-anchor="${o.center ? "middle" : "start"}" font-family="${family}" font-size="${size}" font-weight="${bold ? 700 : 400}" fill="${fill}" xml:space="preserve">${parts}</text>`);
    }
  });

  let cursor = "";
  if (o.cursor && font.mono) {
    const evs = cursorEvents.filter((ev, i, arr) => i === 0 || ev[0] >= arr[i - 1][0]);
    const kt = [...evs.map((ev) => n4(ev[0] / T)), "1"];
    kt[0] = "0";
    const xv = [...evs.map((ev) => ev[1].toFixed(2)), evs[evs.length - 1][1].toFixed(2)];
    cursor = `<rect y="${(H / 2 - size * 0.62).toFixed(1)}" width="${curW.toFixed(1)}" height="${(size * 1.15).toFixed(1)}" rx="${(curW / 3).toFixed(1)}" fill="${fill}"><animate attributeName="x" calcMode="discrete" dur="${t2(T)}s" repeatCount="indefinite" keyTimes="${kt.join(";")}" values="${xv.join(";")}"/><animate attributeName="opacity" calcMode="discrete" dur="1.06s" repeatCount="indefinite" keyTimes="0;0.5" values="1;0"/></rect>`;
  }

  const label = escapeXml(list.map((c) => c.join("")).join(". "));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
<title>${label}</title>
<style>${imp}</style>${grad}
${o.bg ? `<rect width="${W}" height="${H}" fill="${o.bg}"/>` : ""}
${texts.join("\n")}
${cursor}
</svg>`;
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  const q = (key: string): string => {
    const v = req.query[key];
    if (Array.isArray(v)) return v[0] ?? "";
    return typeof v === "string" ? v : "";
  };
  const num = (key: string, def: number, min: number, max: number): number => {
    const n = parseFloat(q(key));
    return Number.isFinite(n) ? clamp(n, min, max) : def;
  };
  const opt = (key: string, min: number, max: number): number | undefined => {
    const n = parseFloat(q(key));
    return Number.isFinite(n) ? clamp(Math.round(n), min, max) : undefined;
  };

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400");

  const colors = q("color")
    .split(",")
    .map(parseHex)
    .filter((c): c is string => c !== null)
    .slice(0, 5);

  res.status(200).send(
    renderTyping({
      text: (q("text") || q("lines")).trim() || DEFAULT_TYPING,
      font: q("font"),
      colors: colors.length ? colors : ["#36bcf7"],
      size: Math.round(num("size", 28, 10, 80)),
      speed: Math.round(num("speed", 80, 20, 400)),
      pause: Math.round(num("pause", 1200, 0, 10000)),
      width: opt("width", 100, 1600),
      height: opt("height", 30, 400),
      center: q("center") === "true" || q("align") === "center",
      cursor: q("cursor") !== "false",
      erase: q("erase") !== "false",
      bold: q("weight") === "700" || q("weight") === "bold" || q("bold") === "true",
      bg: parseHex(q("bg")),
    })
  );
}

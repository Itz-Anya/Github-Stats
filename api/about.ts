import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTheme, THEME_NAMES } from "../themes/index.js";
import type { Theme } from "../themes/index.js";

function sanitizeTheme(raw: string): string {
  return raw.replace(/[^a-z0-9_]/gi, "").slice(0, 32).toLowerCase();
}

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

function parseHex(c: string): [number, number, number] | null {
  let h = c.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return null;
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
}

function shiftHue(color: string, deg: number): string {
  const rgb = parseHex(color);
  if (!rgb) return color;
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d > 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  h = (h + deg + 360) % 360;
  s = Math.max(s, 0.55);
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r1, g1, b1] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

function aurora(a: string, b: string): [string, string, string] {
  return [a, b, shiftHue(a, 70)];
}

function flowGradient(id: string, colors: string[], w: number, animate: boolean, dur = 7, x0 = 0): string {
  const n = colors.length;
  const stops = [...colors, colors[0]]
    .map((c, i) => `<stop offset="${((i / n) * 100).toFixed(1)}%" stop-color="${c}"/>`)
    .join("");
  const anim = animate
    ? `<animateTransform attributeName="gradientTransform" type="translate" values="0 0;${w} 0" dur="${dur}s" repeatCount="indefinite"/>`
    : "";
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x0 + w}" y2="0" spreadMethod="repeat">${stops}${anim}</linearGradient>`;
}

function fxCss(animate: boolean): string {
  return `
      @keyframes reveal { 0% { opacity: 0; transform: translateY(16px) scale(.965); } 60% { opacity: 1; } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes revealL { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes revealR { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes zoom { 0% { opacity: 0; transform: scale(.55); } 65% { opacity: 1; transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes wipe { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes wipeY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
      @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(calc(var(--bd, 3) * -1px)); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes spinr { to { transform: rotate(-360deg); } }
      @keyframes pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      @keyframes breathe { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
      @keyframes twinkle { 0%,100% { opacity: .15; transform: scale(.6); } 50% { opacity: 1; transform: scale(1.1); } }
      @keyframes ping { 0% { transform: scale(1); opacity: .55; } 80%,100% { transform: scale(2.4); opacity: 0; } }
      @keyframes softping { 0% { transform: scale(1); opacity: .5; } 80%,100% { transform: scale(1.5); opacity: 0; } }
      @keyframes trace { to { stroke-dashoffset: -100; } }
      @keyframes flicker { 0%,100% { transform: scale(1) rotate(0); } 25% { transform: scale(1.1) rotate(-4deg); } 55% { transform: scale(.95) rotate(3deg); } 80% { transform: scale(1.06) rotate(-2deg); } }
      @keyframes beat { 0%,100% { transform: scale(1); } 14% { transform: scale(1.18); } 28% { transform: scale(1); } 42% { transform: scale(1.1); } 56% { transform: scale(1); } }
      @keyframes lightleak { 0%,100% { transform: translate(0,0) scale(1); opacity: .8; } 50% { transform: translate(var(--lx, 40px), var(--ly, 16px)) scale(1.12); opacity: 1; } }
      @keyframes dropT { 0% { opacity: 0; transform: translateY(-70px); } 55% { opacity: 1; transform: translateY(7px); } 78% { transform: translateY(-3px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes fromR { 0% { opacity: 0; transform: translateX(90px); } 60% { opacity: 1; transform: translateX(-6px); } 100% { opacity: 1; transform: translateX(0); } }
      @keyframes fromL { 0% { opacity: 0; transform: translateX(-90px); } 60% { opacity: 1; transform: translateX(6px); } 100% { opacity: 1; transform: translateX(0); } }
      @keyframes fromB { 0% { opacity: 0; transform: translateY(60px); } 60% { opacity: 1; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); } }
      @keyframes spinIn { 0% { opacity: 0; transform: rotate(-120deg) scale(.4); } 100% { opacity: 1; transform: rotate(0) scale(1); } }
      .dropT   { animation: dropT 1.05s cubic-bezier(.22,1,.36,1) both; }
      .fromR   { animation: fromR 1s cubic-bezier(.22,1,.36,1) both; }
      .fromL   { animation: fromL 1s cubic-bezier(.22,1,.36,1) both; }
      .fromB   { animation: fromB 1s cubic-bezier(.22,1,.36,1) both; }
      .spinIn  { transform-box: fill-box; transform-origin: center; animation: spinIn 1.1s cubic-bezier(.2,.9,.3,1.1) both; }
      .reveal  { transform-box: fill-box; transform-origin: 50% 60%; animation: reveal 1s cubic-bezier(.16,1,.3,1) both; }
      .revealL { animation: revealL .9s cubic-bezier(.16,1,.3,1) both; }
      .revealR { animation: revealR .9s cubic-bezier(.16,1,.3,1) both; }
      .zoom    { transform-box: fill-box; transform-origin: center; animation: zoom .85s cubic-bezier(.2,.9,.3,1.15) both; }
      .fade    { animation: fade .9s ease both; }
      .wipe    { transform-box: fill-box; transform-origin: left center; animation: wipe 1.1s cubic-bezier(.2,.8,.2,1) both; }
      .wipeY   { transform-box: fill-box; transform-origin: center bottom; animation: wipeY .8s cubic-bezier(.2,.8,.2,1) both; }
      .drawS   { stroke-dasharray: 1; animation: draw 1.4s cubic-bezier(.3,.7,.2,1) both; }
      .bob     { animation: bob 4.4s ease-in-out infinite; }
      .spin    { animation: spin 14s linear infinite; }
      .spinr   { animation: spinr 22s linear infinite; }
      .pulse   { animation: pulse 3.2s ease-in-out infinite; }
      .breathe { animation: breathe 3.6s ease-in-out infinite; }
      .twinkle { transform-box: fill-box; transform-origin: center; animation: twinkle 3.2s ease-in-out infinite; }
      .ping    { transform-box: fill-box; transform-origin: center; animation: ping 2.6s ease-out infinite; }
      .softping{ transform-box: fill-box; transform-origin: center; animation: softping 3s ease-out infinite; }
      .trace   { stroke-dasharray: 16 84; animation: trace 7s linear infinite; }
      .beat    { transform-box: fill-box; transform-origin: center; animation: beat 2.6s ease-in-out infinite; }
      .flame   { transform-box: fill-box; transform-origin: 50% 90%; animation: flicker 1.8s ease-in-out infinite; }
      .leak    { animation: lightleak 12s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      ${animate ? "" : "* { animation: none !important; }"}`;
}

function auroraBackground(opts: {
  W: number;
  H: number;
  pad: number;
  bgId: string;
  edgeId: string;
  leakA: string;
  leakB: string;
  colorA: string;
  colorB: string;
  leakAPos: [number, number];
  leakBPos: [number, number];
  leakR?: number;
  shineId: string;
}): string {
  const { W, H, pad, bgId, edgeId, shineId } = opts;
  const r = opts.leakR ?? 300;
  const inner = W - pad * 2;
  return `<rect width="${W}" height="${H}" fill="url(#${bgId})"/>
    <circle class="leak" cx="${opts.leakAPos[0]}" cy="${opts.leakAPos[1]}" r="${r}" fill="url(#${opts.leakA})" style="--lx:46px;--ly:18px"/>
    <circle class="leak" cx="${opts.leakBPos[0]}" cy="${opts.leakBPos[1]}" r="${r}" fill="url(#${opts.leakB})" style="--lx:-52px;--ly:-14px;animation-delay:-5s"/>
    <rect x="${pad}" y="0" width="${inner}" height="3" fill="url(#${edgeId})"/>
    <rect class="shimmer" x="${pad}" y="0" width="150" height="3" fill="url(#${shineId})" style="--travel:${inner - 150}px;animation-delay:1.4s"/>
    <rect x="${pad}" y="${H - 3}" width="${inner}" height="3" fill="url(#${edgeId})" opacity="0.85"/>`;
}

function auroraDefs(opts: { leakA: string; leakB: string; colorA: string; colorB: string; shineId: string; softId?: string }): string {
  const soft = opts.softId
    ? `<linearGradient id="${opts.softId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity="0"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.17"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
    : "";
  return `${soft}
    <radialGradient id="${opts.leakA}"><stop offset="0%" stop-color="${opts.colorA}" stop-opacity="0.22"/><stop offset="100%" stop-color="${opts.colorA}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${opts.leakB}"><stop offset="0%" stop-color="${opts.colorB}" stop-opacity="0.2"/><stop offset="100%" stop-color="${opts.colorB}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${opts.shineId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity="0"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`;
}

const SPARK = "M0 -5.5 L1.5 -1.5 L5.5 0 L1.5 1.5 L0 5.5 L-1.5 1.5 L-5.5 0 L-1.5 -1.5Z";

function sparkle(cx: number, cy: number, color: string, delay: number, scale = 1): string {
  return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${scale})"><path class="twinkle" d="${SPARK}" fill="${color}" style="animation-delay:${delay.toFixed(2)}s"/></g>`;
}

const MEMO = new Map<string, { v: unknown; exp: number }>();
function memoGet<T>(k: string): T | undefined {
  const e = MEMO.get(k);
  if (!e) return undefined;
  if (Date.now() > e.exp) {
    MEMO.delete(k);
    return undefined;
  }
  return e.v as T;
}
function memoSet(k: string, v: unknown, ttlSec: number): void {
  if (MEMO.size > 150) {
    const first = MEMO.keys().next().value;
    if (first !== undefined) MEMO.delete(first);
  }
  MEMO.set(k, { v, exp: Date.now() + ttlSec * 1000 });
}

async function fetchT(url: string, ms: number, headers: Record<string, string> = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { headers: { "User-Agent": "github-stats-service/2.0", ...headers }, signal: ctl.signal, redirect: "follow" });
  } finally {
    clearTimeout(timer);
  }
}

async function toDataUri(url: string, ms: number, maxBytes: number): Promise<string | null> {
  try {
    const res = await fetchT(url, ms);
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (!["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length || buf.length > maxBytes) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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

function isLight(hex: string): boolean {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  const n = parseInt(h, 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6;
}

interface FontDef {
  name: string;
  generic: string;
  cw: number;
  bold: boolean;
  med: boolean;
  google: boolean;
}

const fd = (name: string, generic: string, cw: number, bold = true, med = false, google = true): FontDef => ({ name, generic, cw, bold, med, google });

const FONT_LIST: FontDef[] = [
  fd("Outfit", "sans-serif", 0.5, true, true),
  fd("Sora", "sans-serif", 0.58, true, true),
  fd("Space Grotesk", "sans-serif", 0.54, true, true),
  fd("Bricolage Grotesque", "sans-serif", 0.52, true, true),
  fd("Plus Jakarta Sans", "sans-serif", 0.54, true, true),
  fd("DM Sans", "sans-serif", 0.52, true, true),
  fd("Manrope", "sans-serif", 0.54, true, true),
  fd("Poppins", "sans-serif", 0.56, true, true),
  fd("Lexend", "sans-serif", 0.6, true, true),
  fd("Nunito", "sans-serif", 0.5, true, true),
  fd("Quicksand", "sans-serif", 0.5, true, true),
  fd("Comfortaa", "sans-serif", 0.58, true, true),
  fd("Fredoka", "sans-serif", 0.52, true, true),
  fd("Baloo 2", "sans-serif", 0.52, true, true),
  fd("Syne", "sans-serif", 0.58, true, true),
  fd("Unbounded", "sans-serif", 0.7, true, true),
  fd("Chakra Petch", "sans-serif", 0.52, true, true),
  fd("Oxanium", "sans-serif", 0.54, true, true),
  fd("Righteous", "sans-serif", 0.54, false),
  fd("Pixelify Sans", "sans-serif", 0.52, true, true),
  fd("Silkscreen", "sans-serif", 0.75, true),
  fd("Special Elite", "monospace", 0.56, false),
  fd("Fraunces", "serif", 0.52, true, true),
  fd("Playfair Display", "serif", 0.52, true, true),
  fd("Instrument Serif", "serif", 0.42, false),
  fd("Gloock", "serif", 0.52, false),
  fd("Caveat", "cursive", 0.38, true, true),
  fd("Kalam", "cursive", 0.44, true),
  fd("Patrick Hand", "cursive", 0.42, false),
  fd("Indie Flower", "cursive", 0.46, false),
  fd("Gochi Hand", "cursive", 0.44, false),
  fd("Shadows Into Light", "cursive", 0.4, false),
  fd("JetBrains Mono", "monospace", 0.6, true, true),
  fd("Geist Mono", "monospace", 0.6, true, true),
  fd("Space Mono", "monospace", 0.612, true),
  fd("Fira Code", "monospace", 0.6, true, true),
  fd("Victor Mono", "monospace", 0.6, true, true),
];

const fkey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const FONT_MAP = new Map(FONT_LIST.map((x) => [fkey(x.name), x]));

function pickFont(raw: string, def = "Outfit"): FontDef {
  return FONT_MAP.get(fkey(raw)) ?? (FONT_MAP.get(fkey(def)) as FontDef);
}

function fontImport(f: FontDef): string {
  if (!f.google) return "";
  const axis = f.med ? ":wght@400;500;700" : f.bold ? ":wght@400;700" : "";
  return `@import url('https://fonts.googleapis.com/css2?family=${f.name.replace(/ /g, "+")}${axis}&amp;display=swap');`;
}

const fontStack = (f: FontDef): string => `'${f.name}', ${f.generic}, 'Segoe UI', system-ui, 'Noto Color Emoji'`;

type Motif = "petals" | "stars" | "neon" | "terminal" | "waves" | "leaves" | "embers" | "dots";

const MOTIF_THEMES: Record<Exclude<Motif, "dots">, string[]> = {
  petals: ["sakura", "cherry_blossom", "cotton_candy", "bubblegum", "rose_gold", "peach_blossom", "pastel_rainbow", "lavender"],
  stars: ["galaxy", "cosmic", "starlight", "midnight", "black_ice", "tokyonight", "rainbow_dark", "velvet", "aurora", "obsidian", "pitch_dark", "dracula"],
  neon: ["cyberpunk", "vaporwave", "outrun", "neon_dreams", "neon_pink", "neon_blue", "neon_purple"],
  terminal: ["retro_terminal", "amber_crt", "neon_green"],
  waves: ["ocean_dark", "ocean_breeze", "deep_sea", "arctic", "sapphire", "electric", "nord"],
  leaves: ["forest", "emerald", "tropical", "mint_fresh", "lime_burst"],
  embers: ["sunset", "amber_glow", "golden_hour", "desert", "sunshine", "solar_flare", "neon_orange", "neon_red", "ruby"],
};

function motifOf(name: string): Motif {
  for (const [m, list] of Object.entries(MOTIF_THEMES)) if (list.includes(name)) return m as Motif;
  return "dots";
}

function resolveTheme(raw: string): string {
  const requested = sanitizeTheme(raw || "dark");
  return requested === "random"
    ? THEME_NAMES[Math.floor(Math.random() * THEME_NAMES.length)]
    : THEME_NAMES.includes(requested)
      ? requested
      : "dark";
}

function wave(y: number, amp: number, H: number): string {
  let d = `M0 ${y} Q150 ${y - amp} 300 ${y}`;
  for (let x = 600; x <= 2400; x += 300) d += ` T${x} ${y}`;
  return `${d} V${H + 10} H0 Z`;
}

const MOTION_CSS = `
      @keyframes fall { 0% { transform: translate(0,-40px) rotate(0); opacity: 0; } 10% { opacity: .9; } 90% { opacity: .9; } 100% { transform: translate(var(--dx),var(--h)) rotate(var(--rot)); opacity: 0; } }
      @keyframes rise { 0% { transform: translate(0,0) scale(.6); opacity: 0; } 12% { opacity: .9; } 85% { opacity: .6; } 100% { transform: translate(var(--dx),calc(var(--h) * -1)) scale(1.1); opacity: 0; } }
      @keyframes drift { 0%,100% { transform: translate(0,0); } 50% { transform: translate(var(--dx),var(--dy)); } }
      @keyframes shoot { 0% { transform: translateX(-120px); opacity: 0; } 5% { opacity: 1; } 26% { transform: translateX(620px); opacity: 0; } 100% { transform: translateX(620px); opacity: 0; } }
      @keyframes scan { from { transform: translateY(-6px); } to { transform: translateY(var(--h)); } }
      @keyframes glitch { 0%,90%,100% { transform: translate(0,0); opacity: 0; } 92% { transform: translate(-4px,1px); opacity: .75; } 94% { transform: translate(4px,-1px); opacity: .75; } 96% { transform: translate(-2px,0); opacity: .6; } }
      @keyframes wv { to { transform: translateX(-600px); } }
      @keyframes wvr { from { transform: translateX(-600px); } to { transform: translateX(0); } }
      @keyframes lineIn { from { opacity: 0; transform: translate(-16px,10px); filter: blur(8px); } to { opacity: 1; transform: translate(0,0); filter: blur(0); } }
      .fall { animation: fall linear infinite; }
      .rise { animation: rise linear infinite; }
      .drift { animation: drift ease-in-out infinite; }
      .shoot { animation: shoot 9s ease-in infinite; }
      .scan { animation: scan 5.5s linear infinite; }
      .glitch { animation: glitch 6s steps(1,end) infinite; }
      .wv { animation: wv 9s linear infinite; }
      .wvr { animation: wvr 13s linear infinite; }
      .lineIn { animation: lineIn 1.1s cubic-bezier(.16,1,.3,1) both; }`;

function particles(m: Motif, r: () => number, H: number, th: Theme, uidp: string, W: number, density = 1): string {
  const cols = [th.accentColor, th.accentSecondary, th.iconColor];
  const out: string[] = [];
  const pick = () => cols[Math.floor(r() * cols.length)];
  const n = (base: number): number => Math.max(3, Math.round(base * density * (W / 1000)));
  const mk = (cls: string, x: number, y: number, inner: string, dur: number, vars: string) =>
    `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="${cls}" style="${vars};animation-duration:${dur.toFixed(1)}s;animation-delay:${(-r() * dur).toFixed(1)}s">${inner}</g></g>`;

  if (m === "petals") {
    for (let i = 0; i < n(18); i++) {
      const s = 0.7 + r() * 1;
      out.push(mk("fall", r() * W, 0,
        `<path d="M0 -6 C5 -6 7 0 0 8 C-7 0 -5 -6 0 -6Z" transform="scale(${s.toFixed(2)})" fill="${pick()}" opacity="${(0.45 + r() * 0.4).toFixed(2)}"/>`,
        9 + r() * 8, `--dx:${Math.round((r() - 0.5) * 220)}px;--h:${H + 60}px;--rot:${Math.round(180 + r() * 400)}deg`));
    }
  } else if (m === "leaves") {
    for (let i = 0; i < n(14); i++) {
      const s = 0.7 + r() * 0.9;
      out.push(mk("fall", r() * W, 0,
        `<path d="M0 -9 C7 -6 8 4 0 9 C-8 4 -7 -6 0 -9Z" transform="scale(${s.toFixed(2)})" fill="${pick()}" opacity="${(0.4 + r() * 0.4).toFixed(2)}"/>`,
        10 + r() * 8, `--dx:${Math.round((r() - 0.5) * 300)}px;--h:${H + 60}px;--rot:${Math.round((r() - 0.5) * 700)}deg`));
    }
    for (let i = 0; i < n(12); i++) {
      out.push(mk("drift", r() * W, r() * H,
        `<circle r="${(1.4 + r() * 1.6).toFixed(1)}" fill="${th.accentSecondary}" class="twinkle" style="animation-delay:${(r() * 3).toFixed(1)}s"/>`,
        6 + r() * 5, `--dx:${Math.round((r() - 0.5) * 60)}px;--dy:${Math.round((r() - 0.5) * 40)}px`));
    }
  } else if (m === "embers") {
    out.push(`<rect y="${H - 120}" width="${W}" height="120" fill="url(#${uidp}heat)"/>`);
    for (let i = 0; i < n(26); i++) {
      out.push(mk("rise", r() * W, H + 10,
        `<circle r="${(1.2 + r() * 2.4).toFixed(1)}" fill="${pick()}"/>`,
        5 + r() * 7, `--dx:${Math.round((r() - 0.5) * 110)}px;--h:${H + 30}px`));
    }
  } else if (m === "waves") {
    out.push(`<g class="wv"><path d="${wave(H - 46, 16, H)}" fill="${th.accentColor}" opacity=".16"/></g>`);
    out.push(`<g class="wvr"><path d="${wave(H - 28, 12, H)}" fill="${th.accentSecondary}" opacity=".18"/></g>`);
    for (let i = 0; i < n(14); i++) {
      out.push(mk("rise", r() * W, H + 8,
        `<circle r="${(2 + r() * 4).toFixed(1)}" fill="none" stroke="${pick()}" stroke-width="1.2"/>`,
        6 + r() * 6, `--dx:${Math.round((r() - 0.5) * 50)}px;--h:${H + 20}px`));
    }
  } else if (m === "stars") {
    for (let i = 0; i < n(30); i++) {
      out.push(`<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${(0.8 + r() * 1.5).toFixed(1)}" fill="${r() > 0.5 ? th.textColor : pick()}" class="twinkle" style="animation-delay:${(r() * 4).toFixed(2)}s;animation-duration:${(2 + r() * 3).toFixed(1)}s"/>`);
    }
    for (let i = 0; i < n(6); i++) out.push(sparkle(r() * W, r() * H, pick(), r() * 3, 0.8 + r() * 0.9));
    for (let i = 0; i < 2; i++) {
      out.push(`<g transform="translate(${(80 + r() * 300).toFixed(0)} ${(20 + r() * H * 0.3).toFixed(0)}) rotate(24)"><g class="shoot" style="animation-delay:${(i * 4.6 + r() * 2).toFixed(1)}s"><rect x="-100" y="-1" width="100" height="2" fill="url(#${uidp}trail)"/><circle r="2.4" fill="${th.textColor}"/></g></g>`);
    }
  } else if (m === "neon") {
    out.push(`<rect x="0" y="${(H * 0.4).toFixed(0)}" width="${W}" height="${(H * 0.7).toFixed(0)}" fill="url(#${uidp}grid)" opacity=".5"><animateTransform attributeName="transform" type="translate" values="0 0;0 40" dur="2.2s" repeatCount="indefinite"/></rect>`);
    out.push(`<rect y="${(H * 0.4).toFixed(0)}" width="${W}" height="${(H * 0.6).toFixed(0)}" fill="url(#${uidp}fade)"/>`);
    out.push(`<g class="scan" style="--h:${H}px"><rect width="${W}" height="2" fill="${th.accentSecondary}" opacity=".35"/><rect y="-8" width="${W}" height="18" fill="${th.accentColor}" opacity=".06"/></g>`);
    for (let i = 0; i < n(10); i++) {
      out.push(`<rect x="${(r() * W).toFixed(0)}" y="${(r() * H).toFixed(0)}" width="${(18 + r() * 60).toFixed(0)}" height="2" fill="${pick()}" opacity=".4" class="pulse" style="animation-delay:${(r() * 3).toFixed(1)}s"/>`);
    }
  } else if (m === "terminal") {
    out.push(`<rect width="${W}" height="${H}" fill="url(#${uidp}scanl)"/>`);
    for (let i = 0; i < n(16); i++) {
      const len = 6 + Math.floor(r() * 6);
      let t = "";
      for (let k = 0; k < len; k++) t += `<tspan x="0" dy="16">${r() > 0.5 ? 1 : 0}</tspan>`;
      out.push(mk("fall", r() * W, 0,
        `<text font-family="monospace" font-size="14" fill="${th.accentSecondary}" opacity=".3">${t}</text>`,
        7 + r() * 7, `--dx:0px;--h:${H + 120}px;--rot:0deg`));
    }
  } else {
    for (let i = 0; i < n(14); i++) {
      const rad = 5 + r() * 18;
      out.push(mk("drift", r() * W, r() * H,
        `<circle r="${rad.toFixed(1)}" fill="${pick()}" opacity="${(0.08 + r() * 0.1).toFixed(2)}"/>`,
        7 + r() * 7, `--dx:${Math.round((r() - 0.5) * 70)}px;--dy:${Math.round((r() - 0.5) * 50)}px`));
    }
    for (let i = 0; i < n(16); i++) {
      out.push(`<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${(1 + r() * 1.5).toFixed(1)}" fill="${pick()}" class="twinkle" style="animation-delay:${(r() * 4).toFixed(2)}s"/>`);
    }
  }
  return out.join("");
}

function sharedDefs(u: string, th: Theme, bg1: string, c1: string, W: number, H: number): string {
  return `
    <linearGradient id="${u}trail" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${th.textColor}" stop-opacity="0"/><stop offset="100%" stop-color="${th.textColor}" stop-opacity="0.9"/></linearGradient>
    <linearGradient id="${u}heat" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${c1}" stop-opacity="0"/><stop offset="100%" stop-color="${c1}" stop-opacity="0.28"/></linearGradient>
    <linearGradient id="${u}fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bg1}" stop-opacity="1"/><stop offset="100%" stop-color="${bg1}" stop-opacity="0"/></linearGradient>
    <pattern id="${u}grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${c1}" stroke-width="1"/></pattern>
    <pattern id="${u}scanl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${c1}" opacity="0.08"/></pattern>
    <pattern id="${u}dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${th.textColor}"/></pattern>
    <filter id="${u}glow" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="${u}clip"><rect width="${W}" height="${H}" rx="${th.borderRadius}"/></clipPath>`;
}

type Item = { t: "heading"; text: string } | { t: "rule" } | { t: "gap" } | { t: "line"; text: string; key: string };

const RULE = /^[-=_~*.\u00b7\u2500\u2501\u2550]{3,}$/;
const KEY = /^([^:\uff1a]{1,28}?)\s*[:\uff1a]\s*(.*)$/u;

function parseAbout(raw: string): { items: Item[]; chars: number; rows: number } {
  const lines = raw
    .replace(/\r\n?/g, "\n")
    .replace(/\\n/g, "\n")
    .slice(0, 5000)
    .split("\n")
    .map((l) => l.replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim());
  const items: Item[] = [];
  let budget = MAX_CHARS;
  let rows = 0;
  let chars = 0;
  for (let i = 0; i < lines.length && rows < MAX_LINES && budget > 0; i++) {
    let l = lines[i];
    if (!l) {
      if (items.length && items[items.length - 1].t !== "gap") items.push({ t: "gap" });
      continue;
    }
    if (RULE.test(l)) {
      items.push({ t: "rule" });
      continue;
    }
    const cut = Array.from(l);
    if (cut.length > budget) l = cut.slice(0, budget).join("");
    const len = Array.from(l).length;
    budget -= len;
    chars += len;
    rows++;
    if (lines[i + 1] && RULE.test(lines[i + 1])) {
      items.push({ t: "heading", text: l });
      items.push({ t: "rule" });
      i++;
      continue;
    }
    const m = KEY.exec(l);
    if (m && /\p{L}/u.test(m[1]) && !m[2].startsWith("//")) {
      items.push({ t: "line", text: m[2] ? `${m[1]}: ${m[2]}` : `${m[1]}:`, key: `${m[1]}:` });
    } else {
      items.push({ t: "line", text: l, key: "" });
    }
  }
  while (items.length && items[items.length - 1].t === "gap") items.pop();
  return { items, chars, rows };
}

const DEFAULT_ABOUT = "hi there, im a software developer...";
const MAX_CHARS = 1200;
const MAX_LINES = 40;
const W = 1000;
const PAD = 56;
const R = 88;
const RING = R + 22;
const ZONE_CY = 178;

interface Row {
  kind: "heading" | "rule" | "line";
  y: number;
  idx: number;
  size: number;
  text: string;
  key: string;
  bullet: boolean;
  w: number;
}

interface AboutOpts {
  animate: boolean;
  loop: boolean;
  font: FontDef;
  size?: number;
  username: string;
  avatarSrc: string | null;
  zone: boolean;
}

function renderAbout(rawQuery: string, themeName: string, th: Theme, o: AboutOpts): string {
  let parsed = parseAbout(rawQuery);
  if (!parsed.rows) parsed = parseAbout(DEFAULT_ABOUT);
  const { items, chars } = parsed;
  const motif = motifOf(themeName);
  const glow = motif === "terminal" || motif === "neon";
  const animate = o.animate;
  const loop = animate && o.loop;
  const f = o.font;
  const seed = hash(`${themeName}|${rawQuery}|${o.username}`);
  const r = rng(seed);
  const u = `a${seed.toString(36)}_`;
  const br = th.borderRadius;

  const single = parsed.rows === 1 && items.length === 1 && items[0].t === "line";
  const fs =
    o.size ??
    (single
      ? chars <= 50 ? 54 : chars <= 100 ? 46 : chars <= 180 ? 40 : chars <= 300 ? 34 : 30
      : chars <= 250 ? 32 : chars <= 450 ? 29 : chars <= 750 ? 26 : 23);
  const hs = single ? fs : Math.round(fs * 1.5);
  const lh = Math.round(fs * (single ? 1.32 : 1.5));
  const cwEff = f.cw * 1.05;
  const zone = o.zone;

  const cx = W - PAD - RING;
  const cy = ZONE_CY;
  const bandTop = cy - RING - 8;
  const bandBottom = cy + RING + (o.username ? 52 : 8);
  const textX = single ? PAD : PAD + 34;
  const fullW = W - PAD - textX;
  const narrowW = cx - RING - 36 - textX;
  const widthAt = (top: number, bottom: number): number => (zone && bottom > bandTop && top < bandBottom ? narrowW : fullW);

  const flow = (text: string, size: number, step: number, y: number): string[] => {
    const out: string[] = [];
    let line = "";
    const maxAt = (yy: number): number => Math.max(6, Math.floor(widthAt(yy, yy + step) / (size * cwEff)));
    let max = maxAt(y);
    const push = (): void => {
      out.push(line);
      line = "";
      max = maxAt(y + out.length * step);
    };
    for (let word of text.split(" ")) {
      while (vlen(word) > max) {
        let cut = "";
        for (const ch of word) {
          if (vlen(cut + ch) > max) break;
          cut += ch;
        }
        if (!cut) cut = Array.from(word)[0];
        if (line) push();
        line = cut;
        push();
        word = word.slice(cut.length);
      }
      const next = line ? `${line} ${word}` : word;
      if (vlen(next) <= max) line = next;
      else {
        push();
        line = word;
      }
    }
    if (line) out.push(line);
    return out;
  };

  const layout = (y0: number): { rows: Row[]; endY: number } => {
    const rows: Row[] = [];
    let y = y0;
    let idx = 0;
    for (const it of items) {
      if (it.t === "gap") { y += lh * 0.45; continue; }
      if (it.t === "rule") {
        rows.push({ kind: "rule", y: y + fs * 0.1, idx: idx++, size: fs, text: "", key: "", bullet: false, w: widthAt(y, y + fs) });
        y += fs * 0.8;
        continue;
      }
      const size = it.t === "heading" ? hs : fs;
      const step = it.t === "heading" ? Math.round(size * 1.25) : lh;
      const parts = flow(it.text, size, step, y);
      parts.forEach((text, j) => {
        rows.push({ kind: it.t, y: y + size, idx: idx++, size, text, key: j === 0 && it.t === "line" ? it.key : "", bullet: j === 0 && it.t === "line" && !single, w: 0 });
        y += step;
      });
    }
    return { rows, endY: y };
  };

  const minH = zone ? 372 : single ? 240 : 200;
  const top = single ? 56 : 54;
  let laid = layout(top);
  const contentH = laid.endY - top;
  if (contentH < minH - 2 * top) laid = layout((minH - contentH) / 2 + 4);
  const rows = laid.rows;
  const H = Math.max(minH, Math.round(laid.endY + 48));

  const bg1 = th.backgroundGradient?.[0] ?? th.background;
  const bg2 = th.backgroundGradient?.[1] ?? th.background;
  const [c1, c2, c3] = aurora(th.accentColor, th.accentSecondary);
  const hl = isLight(bg1) ? [th.accentColor, th.accentSecondary, th.accentColor] : [c1, c2, c3];
  const family = fontStack(f);
  const body = f.med ? 500 : 400;
  const strong = f.bold ? 700 : body;

  const count = rows.length;
  const step = Math.min(0.32, 5 / Math.max(1, count));
  const delayOf = (i: number): number => 0.3 + i * step;
  const D = delayOf(count - 1) + 1.1 + 3.6 + 1.2;
  const loopCss = loop
    ? rows
        .map((row) => {
          const s = ((delayOf(row.idx) / D) * 100).toFixed(2);
          const e = (((delayOf(row.idx) + 1.1) / D) * 100).toFixed(2);
          const h = (((D - 1.2) / D) * 100).toFixed(2);
          const fo = (((D - 0.4) / D) * 100).toFixed(2);
          return `
      @keyframes li${row.idx} { 0%,${s}% { opacity: 0; transform: translate(-16px,10px); filter: blur(8px); } ${e}%,${h}% { opacity: 1; transform: translate(0,0); filter: blur(0); } ${fo}%,100% { opacity: 0; transform: translate(0,0); filter: blur(0); } }`;
        })
        .join("")
    : "";
  const cls = loop ? "" : ' class="lineIn"';
  const sty = (i: number): string =>
    loop ? `animation:li${i} ${D.toFixed(2)}s cubic-bezier(.16,1,.3,1) infinite` : `animation-delay:${delayOf(i).toFixed(2)}s`;

  const defs = `
    <linearGradient id="${u}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient>
    ${auroraDefs({ leakA: `${u}la`, leakB: `${u}lb`, colorA: c1, colorB: c2, shineId: `${u}sh` })}
    ${flowGradient(`${u}edge`, [c1, c2, c3], W, animate, 7)}
    ${flowGradient(`${u}hl`, hl, 460, animate, 5, textX)}
    <linearGradient id="${u}core" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>
    <linearGradient id="${u}ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="50%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/></linearGradient>
    <radialGradient id="${u}orb"><stop offset="0%" stop-color="${c1}" stop-opacity="0.38"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/></radialGradient>
    ${sharedDefs(u, th, bg1, c1, W, H)}
    <clipPath id="${u}av"><circle r="${R}"/></clipPath>`;

  const bgLayer = auroraBackground({
    W, H, pad: 0, bgId: `${u}bg`, edgeId: `${u}edge`, leakA: `${u}la`, leakB: `${u}lb`,
    colorA: c1, colorB: c2, leakAPos: [180, 60], leakBPos: [W - 180, Math.min(H - 40, 420)], leakR: 320, shineId: `${u}sh`,
  });

  const fx = animate ? particles(motif, r, H, th, u, W) : "";

  const body_ = rows
    .map((row) => {
      const sx = sty(row.idx);
      if (row.kind === "rule") {
        return `<rect${cls} x="${textX}" y="${row.y.toFixed(1)}" width="${row.w}" height="3" rx="1.5" fill="url(#${u}edge)" opacity="0.8" style="${sx}"/>`;
      }
      const isHead = row.kind === "heading";
      let inner: string;
      if (isHead) inner = `<tspan fill="url(#${u}hl)">${escapeXml(row.text)}</tspan>`;
      else if (row.key && row.text.startsWith(row.key)) {
        inner = `<tspan font-weight="${strong}" fill="url(#${u}hl)">${escapeXml(row.key)}</tspan><tspan>${escapeXml(row.text.slice(row.key.length))}</tspan>`;
      } else if (single && row.idx === 0) {
        const m = /^\S+(?:\s+\S+)?/.exec(row.text);
        const head = m ? m[0] : "";
        inner = head
          ? `<tspan fill="url(#${u}hl)">${escapeXml(head)}</tspan><tspan>${escapeXml(row.text.slice(head.length))}</tspan>`
          : escapeXml(row.text);
      } else inner = escapeXml(row.text);
      const ghost =
        motif === "neon" && animate
          ? `<text x="${textX}" y="${row.y.toFixed(1)}" font-family="${family}" font-size="${row.size}" font-weight="${strong}" fill="${th.accentSecondary}" opacity="0" class="glitch" style="animation-delay:${(row.idx * 0.12).toFixed(2)}s">${escapeXml(row.text)}</text>`
          : "";
      const weight = isHead || single ? strong : body;
      const dot = row.bullet
        ? `<circle cx="${PAD + 10}" cy="${(row.y - row.size * 0.32).toFixed(1)}" r="5.5" fill="url(#${u}core)"/><circle class="ping" style="animation-delay:${((row.idx * 0.45) % 2.6).toFixed(2)}s" cx="${PAD + 10}" cy="${(row.y - row.size * 0.32).toFixed(1)}" r="5.5" fill="${c1}"/>`
        : "";
      return `${ghost}<g${cls} style="${sx}">${dot}<text x="${textX}" y="${row.y.toFixed(1)}" font-family="${family}" font-size="${row.size}" font-weight="${weight}" fill="${th.textColor}"${glow ? ` filter="url(#${u}glow)"` : ""}>${inner}</text></g>`;
    })
    .join("");

  const initial = (o.username.replace(/[^a-z0-9]/gi, "")[0] ?? "?").toUpperCase();
  const arc = Math.round(2 * Math.PI * (R + 12));
  const pillW = Math.round((vlen(o.username) + 1) * 16 * f.cw + 50);
  const avatar = !zone
    ? ""
    : `<g transform="translate(${cx} ${cy})">
    <g class="zoom" style="animation-delay:.25s">
      <circle r="170" fill="url(#${u}orb)" class="pulse"/>
      <g class="spin"><circle r="${RING}" fill="none" stroke="${c1}" stroke-width="1.6" stroke-dasharray="3 10" opacity="0.7"/>
        <circle cx="${RING}" cy="0" r="6" fill="${c1}"/><circle cx="${(-RING / 2).toFixed(1)}" cy="${(RING * 0.866).toFixed(1)}" r="4.5" fill="${c2}"/><circle cx="${(-RING / 2).toFixed(1)}" cy="${(-RING * 0.866).toFixed(1)}" r="3.5" fill="${c3}"/></g>
      <g class="spinr"><circle r="${R + 12}" fill="none" stroke="url(#${u}ring)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${Math.round(arc * 0.62)} ${arc}"/></g>
      <circle class="softping" r="${R}" fill="none" stroke="${c1}" stroke-width="2"/>
      <g class="bob" style="--bd:5">
        <circle r="${R + 5}" fill="${bg1}"/>
        ${
          o.avatarSrc
            ? `<image x="${-R}" y="${-R}" width="${R * 2}" height="${R * 2}" href="${o.avatarSrc}" xlink:href="${o.avatarSrc}" clip-path="url(#${u}av)" preserveAspectRatio="xMidYMid slice"/>`
            : `<circle r="${R}" fill="url(#${u}core)"/><text y="${Math.round(R * 0.36)}" text-anchor="middle" font-family="${family}" font-size="${Math.round(R * 1.05)}" font-weight="${strong}" fill="${th.background}">${escapeXml(initial)}</text>`
        }
        <circle r="${R}" fill="none" stroke="url(#${u}ring)" stroke-width="2.5" opacity="0.9"/>
      </g>
      ${sparkle(-RING + 8, -RING + 30, c2, 0.4, 1.4)}${sparkle(RING - 4, RING - 40, c1, 1.6, 1.1)}${sparkle(RING - 20, -RING + 40, c3, 2.4, 0.9)}
      ${
        o.username
          ? `<g class="reveal" style="animation-delay:.9s"><rect x="${-pillW / 2}" y="${RING + 10}" width="${pillW}" height="34" rx="17" fill="${th.badgeBg}" stroke="${th.border}"/>
        <circle cx="${-pillW / 2 + 20}" cy="${RING + 27}" r="4.5" fill="${c1}"/><circle class="ping" cx="${-pillW / 2 + 20}" cy="${RING + 27}" r="4.5" fill="${c1}"/>
        <text x="${14}" y="${RING + 32}" text-anchor="middle" font-family="${family}" font-size="16" font-weight="${strong}" fill="${th.accentColor}">@${escapeXml(o.username)}</text></g>`
          : ""
      }
    </g>
  </g>`;

  const aria = rows.filter((x) => x.kind !== "rule").map((x) => x.text).join(" ");
  const label2 = escapeXml(aria.length > 200 ? `${Array.from(aria).slice(0, 197).join("")}...` : aria);

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label2}">
  <title>About</title>
  <defs>${defs}</defs>
  <style>${fontImport(f)}
    text { text-rendering: optimizeLegibility; }${fxCss(animate)}${MOTION_CSS}${loopCss}
  </style>
  <g clip-path="url(#${u}clip)">
    ${bgLayer}
    <rect width="${W}" height="${H}" fill="url(#${u}dots)" opacity="0.05"/>
    ${fx}
    ${body_}
    ${avatar}
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${br}" fill="none" stroke="${th.border}" stroke-width="2"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${br}" fill="none" stroke="url(#${u}edge)" stroke-width="2" opacity="0.55"/>
</svg>`;
}

const USER_RE = /^[a-z0-9](?:[a-z0-9-]{0,38})$/i;

async function fetchGithubAvatar(user: string): Promise<string | null> {
  const key = `av:${user.toLowerCase()}`;
  const hit = memoGet<string>(key);
  if (hit) return hit;
  const uri = await toDataUri(`https://github.com/${encodeURIComponent(user)}.png?size=360`, 4500, 900_000);
  if (uri) memoSet(key, uri, 3600);
  return uri;
}

async function fetchNekoAvatar(): Promise<string | null> {
  const chain = async (): Promise<string | null> => {
    try {
      const res = await fetchT("https://nekos.best/api/v2/neko", 3000, { Accept: "application/json" });
      if (!res.ok) return null;
      const json = (await res.json()) as { results?: Array<{ url?: string }> };
      const url = json.results?.[0]?.url;
      if (!url || !/^https:\/\//.test(url)) return null;
      const small = await toDataUri(`https://wsrv.nl/?url=${encodeURIComponent(url)}&w=420&h=420&fit=cover&a=attention&output=jpg&q=82`, 4000, 700_000);
      return small ?? (await toDataUri(url, 4000, 900_000));
    } catch {
      return null;
    }
  };
  return new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => resolve(null), 7000);
    chain().then((v) => {
      clearTimeout(timer);
      resolve(v);
    });
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const themeName = resolveTheme(q("theme"));
  const randomPfp = q("randompfp") === "true" || q("randompfp") === "1";
  const randomTheme = sanitizeTheme(q("theme") || "dark") === "random";

  if (randomTheme || randomPfp) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  } else {
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400");
  }

  const brRaw = q("border_radius");
  const theme = getTheme(themeName, brRaw !== "" ? clamp(parseInt(brRaw, 10) || 10, 0, 28) : undefined);

  const rawUser = q("username").trim();
  const username = USER_RE.test(rawUser) ? rawUser : "";
  const wantAvatar = q("avatar") !== "false" && q("avatar") !== "0";
  const zone = wantAvatar && (!!username || randomPfp);

  let avatarSrc: string | null = null;
  if (zone) {
    const [neko, gh] = await Promise.all([
      randomPfp ? fetchNekoAvatar() : Promise.resolve(null),
      username ? fetchGithubAvatar(username) : Promise.resolve(null),
    ]);
    avatarSrc = neko ?? gh;
  }

  const sizeRaw = parseInt(q("size"), 10);
  const query = (q("query") || q("text")).trim() || DEFAULT_ABOUT;

  res.status(200).send(
    renderAbout(query, themeName, theme, {
      animate: q("animate") !== "false",
      loop: q("loop") === "true",
      font: pickFont(q("font")),
      size: Number.isFinite(sizeRaw) ? clamp(sizeRaw, 14, 72) : undefined,
      username,
      avatarSrc,
      zone,
    })
  );
}

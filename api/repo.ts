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

function errorCard(msg: string, th: Theme, br: number): string {
  const text = escapeXml(msg.length > 90 ? `${msg.slice(0, 87)}...` : msg);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="120" viewBox="0 0 640 120" role="img" aria-label="${text}">
  <rect x="1" y="1" width="638" height="118" rx="${br}" fill="${th.background}" stroke="${th.border}"/>
  <text x="32" y="52" font-family="system-ui,'Segoe UI',sans-serif" font-size="20" font-weight="700" fill="${th.accentColor}">Something went wrong</text>
  <text x="32" y="84" font-family="system-ui,'Segoe UI',sans-serif" font-size="15" fill="${th.subTextColor}">${text}</text>
</svg>`;
}

const GH = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", "C++": "#f34b7d", C: "#555555",
  "C#": "#178600", Ruby: "#701516", Go: "#00ADD8", Rust: "#dea584", PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF",
  Dart: "#00B4AB", Scala: "#c22d40", R: "#198CE7", Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c", SCSS: "#c6538c",
  Vue: "#41b883", Svelte: "#ff3e00", Lua: "#000080", Perl: "#0298c3", Haskell: "#5e5086", Elixir: "#6e4a7e",
  Jupyter: "#DA5B0B", "Jupyter Notebook": "#DA5B0B", Dockerfile: "#384d54", Makefile: "#427819", PowerShell: "#012456",
  Batchfile: "#C1F12E", Objective: "#438eff", "Objective-C": "#438eff", Assembly: "#6E4C13", Zig: "#ec915c", Nix: "#7e7eff",
  MDX: "#fcb32c", Astro: "#ff5a03", EJS: "#a91e50", Handlebars: "#f7931e", Less: "#1d365d", Sass: "#a53b70",
};

const ICON: Record<string, string> = {
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
  fork: '<circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><path d="M12 12v3"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  issue: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/>',
  pr: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/>',
  commit: '<circle cx="12" cy="12" r="3"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
  branch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  law: '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
};

function ic(name: string, x: number, y: number, size: number, color: string, sw = 2): string {
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(size / 24).toFixed(3)})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICON[name] ?? ""}</g>`;
}

interface RepoData {
  owner: string;
  name: string;
  fullName: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  prs: number | null;
  commits: number | null;
  contributors: number | null;
  releases: number | null;
  branches: number | null;
  sizeKb: number;
  created: string;
  pushed: string;
  defaultBranch: string;
  license: string | null;
  topics: string[];
  archived: boolean;
  fork: boolean;
  parent: string | null;
  template: boolean;
  isPrivate: boolean;
  avatar: string | null;
  languages: Array<{ name: string; bytes: number }>;
  lastCommit: { msg: string; author: string; date: string; sha: string } | null;
  latestRelease: { tag: string; name: string; date: string } | null;
}

interface RepoOpts {
  animate: boolean;
  font: FontDef;
  W: number;
  hide: Set<string>;
  title: string;
  description: string;
  maxTopics: number;
  maxLangs: number;
  columns: number;
  showOwner: boolean;
}

const HIDE_ALIAS: Record<string, string> = {
  star: "stars", fork: "forks", watch: "watchers", watcher: "watchers", issue: "issues", pr: "prs", prs: "prs",
  pulls: "prs", contributor: "contributors", branch: "branch", lang: "language", langs: "languages", desc: "description",
  topic: "topics", tag: "topics", tags: "topics", releases: "releases", release: "release", commit: "commit",
  commits: "commits", owner: "avatar", logo: "avatar", pic: "avatar", badge: "badges",
};

function parseHide(raw: string): Set<string> {
  const out = new Set<string>();
  for (const part of raw.toLowerCase().split(",")) {
    const k = part.trim();
    if (k) out.add(HIDE_ALIAS[k] ?? k);
  }
  return out;
}

function parseRepoInput(raw: string, fallbackUser: string): { owner: string; name: string } | null {
  let s = raw.trim();
  if (!s) return null;
  s = s.replace(/^git@github\.com:/i, "").replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/^www\./i, "").replace(/^github\.com[/:]/i, "");
  s = s.split(/[?#]/)[0].replace(/^\/+/, "");
  const parts = s.split("/").filter(Boolean);
  let owner = "";
  let name = "";
  if (parts.length >= 2) {
    owner = parts[0];
    name = parts[1];
  } else if (parts.length === 1 && fallbackUser) {
    owner = fallbackUser;
    name = parts[0];
  }
  name = name.replace(/\.git$/i, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner)) return null;
  if (!/^[A-Za-z0-9._-]{1,100}$/.test(name) || name === "." || name === "..") return null;
  return { owner, name };
}

interface GhRes {
  ok: boolean;
  status: number;
  json: unknown;
  link: string;
}

async function gh(path: string): Promise<GhRes> {
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
    const res = await fetchT(`${GH}${path}`, 7000, headers);
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { ok: res.ok, status: res.status, json, link: res.headers.get("link") ?? "" };
  } catch {
    return { ok: false, status: 0, json: null, link: "" };
  }
}

function countOf(r: GhRes): number | null {
  if (!r.ok) return null;
  const m = /[?&]page=(\d+)>;\s*rel="last"/.exec(r.link);
  if (m) return parseInt(m[1], 10);
  return Array.isArray(r.json) ? r.json.length : null;
}

interface ApiRepo {
  name: string;
  full_name: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  subscribers_count?: number;
  watchers_count: number;
  open_issues_count: number;
  size: number;
  created_at: string;
  pushed_at: string;
  default_branch: string;
  license: { spdx_id: string | null; name: string } | null;
  topics?: string[];
  archived: boolean;
  fork: boolean;
  parent?: { full_name: string };
  is_template?: boolean;
  private?: boolean;
  visibility?: string;
  owner: { login: string; avatar_url: string };
}

interface ApiCommit {
  sha: string;
  commit: { message: string; author?: { name?: string; date?: string } };
  author?: { login?: string } | null;
}

interface ApiRelease {
  tag_name: string;
  name: string | null;
  published_at: string | null;
  created_at: string;
}

async function fetchRepo(owner: string, name: string, hide: Set<string>): Promise<RepoData> {
  const need = (k: string): boolean => !hide.has(k);
  const showCommitBox = need("commit");
  const showReleaseBox = need("release");
  const wantLangs = need("languages");
  const wantCommits = need("commits") || showCommitBox;
  const wantContrib = need("contributors");
  const wantPulls = need("prs") || need("issues");
  const wantReleases = need("releases") || showReleaseBox;
  const wantBranches = need("branches");
  const wantAvatar = need("avatar");

  const cacheKey = `repo:${owner}/${name}:${[wantLangs, wantCommits, wantContrib, wantPulls, wantReleases, wantBranches, wantAvatar].map((b) => (b ? 1 : 0)).join("")}`.toLowerCase();
  const hit = memoGet<RepoData>(cacheKey);
  if (hit) return hit;

  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const repoRes = await gh(base);
  if (repoRes.status === 404) throw new Error("NOT_FOUND");
  if (repoRes.status === 403 || repoRes.status === 429) throw new Error("RATE_LIMITED");
  if (!repoRes.ok || !repoRes.json) throw new Error(`API_ERROR:${repoRes.status}`);
  const rp = repoRes.json as ApiRepo;

  const skip = Promise.resolve<GhRes | null>(null);
  const [langs, commits, contribs, pulls, releases, branches, avatar] = await Promise.all([
    wantLangs ? gh(`${base}/languages`) : skip,
    wantCommits ? gh(`${base}/commits?per_page=1`) : skip,
    wantContrib ? gh(`${base}/contributors?per_page=1&anon=true`) : skip,
    wantPulls ? gh(`${base}/pulls?state=open&per_page=1`) : skip,
    wantReleases ? gh(`${base}/releases?per_page=1`) : skip,
    wantBranches ? gh(`${base}/branches?per_page=1`) : skip,
    wantAvatar && rp.owner?.avatar_url ? toDataUri(`${rp.owner.avatar_url}${rp.owner.avatar_url.includes("?") ? "&" : "?"}s=160`, 4500, 600_000) : Promise.resolve(null),
  ]);

  const prs = pulls ? countOf(pulls) : null;
  const firstCommit = commits?.ok && Array.isArray(commits.json) ? (commits.json[0] as ApiCommit | undefined) : undefined;
  const firstRelease = releases?.ok && Array.isArray(releases.json) ? (releases.json[0] as ApiRelease | undefined) : undefined;
  const langObj = langs?.ok && langs.json && typeof langs.json === "object" ? (langs.json as Record<string, number>) : {};

  const data: RepoData = {
    owner: rp.owner?.login ?? owner,
    name: rp.name,
    fullName: rp.full_name,
    description: rp.description,
    homepage: rp.homepage || null,
    language: rp.language,
    stars: rp.stargazers_count,
    forks: rp.forks_count,
    watchers: rp.subscribers_count ?? rp.watchers_count,
    openIssues: prs !== null ? Math.max(0, rp.open_issues_count - prs) : rp.open_issues_count,
    prs,
    commits: commits ? countOf(commits) : null,
    contributors: contribs ? countOf(contribs) : null,
    releases: releases ? countOf(releases) : null,
    branches: branches ? countOf(branches) : null,
    sizeKb: rp.size,
    created: rp.created_at,
    pushed: rp.pushed_at,
    defaultBranch: rp.default_branch,
    license: rp.license ? (rp.license.spdx_id && rp.license.spdx_id !== "NOASSERTION" ? rp.license.spdx_id : rp.license.name) : null,
    topics: rp.topics ?? [],
    archived: rp.archived,
    fork: rp.fork,
    parent: rp.parent?.full_name ?? null,
    template: !!rp.is_template,
    isPrivate: rp.private === true || rp.visibility === "private",
    avatar,
    languages: Object.entries(langObj).map(([n, b]) => ({ name: n, bytes: b })).sort((a, b) => b.bytes - a.bytes),
    lastCommit: firstCommit
      ? {
          msg: (firstCommit.commit.message ?? "").split("\n")[0],
          author: firstCommit.author?.login ?? firstCommit.commit.author?.name ?? "unknown",
          date: firstCommit.commit.author?.date ?? "",
          sha: (firstCommit.sha ?? "").slice(0, 7),
        }
      : null,
    latestRelease: firstRelease
      ? { tag: firstRelease.tag_name, name: firstRelease.name ?? "", date: firstRelease.published_at ?? firstRelease.created_at }
      : null,
  };
  memoSet(cacheKey, data, 1800);
  return data;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

function fmtSize(kb: number): string {
  if (kb >= 1024 * 1024) return `${(kb / 1024 / 1024).toFixed(1)} GB`;
  if (kb >= 1024) return `${(kb / 1024).toFixed(kb >= 10240 ? 0 : 1)} MB`;
  return `${kb} KB`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function ago(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "-";
  const s = Math.max(0, (Date.now() - t) / 1000);
  const units: Array<[number, string]> = [[31536000, "year"], [2592000, "month"], [604800, "week"], [86400, "day"], [3600, "hour"], [60, "minute"]];
  for (const [secs, label] of units) {
    if (s >= secs) {
      const n = Math.floor(s / secs);
      return `${n} ${label}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

function langColor(name: string, th: Theme): string {
  if (LANG_COLORS[name]) return LANG_COLORS[name];
  const h = hash(name) % 360;
  return `hsl(${h} 62% ${isLight(th.background) ? 42 : 62}%)`;
}

function clip(text: string, maxV: number): string {
  if (vlen(text) <= maxV) return text;
  let out = "";
  for (const ch of text) {
    if (vlen(out + ch) > maxV - 1) break;
    out += ch;
  }
  return `${out.trimEnd()}…`;
}

function wrapLines(text: string, maxV: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  const words = text.split(/\s+/).filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = line ? `${line} ${w}` : w;
    if (vlen(next) <= maxV) line = next;
    else {
      if (line) lines.push(line);
      line = vlen(w) > maxV ? clip(w, maxV) : w;
      if (lines.length === maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  const total = words.join(" ");
  if (lines.length === maxLines && lines.join(" ").length < total.length) {
    lines[maxLines - 1] = clip(`${lines[maxLines - 1]} ${total.slice(lines.join(" ").length).trim()}`, maxV);
  }
  return lines.slice(0, maxLines);
}

function renderRepo(d: RepoData, themeName: string, th: Theme, o: RepoOpts): string {
  const { animate, font: f, W, hide } = o;
  const PADX = 44;
  const inner = W - PADX * 2;
  const seed = hash(`${themeName}|${d.fullName}`);
  const r = rng(seed);
  const u = `r${seed.toString(36)}_`;
  const br = th.borderRadius;
  const motif = motifOf(themeName);
  const glow = motif === "terminal" || motif === "neon";
  const family = fontStack(f);
  const cw = f.cw * 1.04;
  const body = f.med ? 500 : 400;
  const strong = f.bold ? 700 : body;

  const bg1 = th.backgroundGradient?.[0] ?? th.background;
  const bg2 = th.backgroundGradient?.[1] ?? th.background;
  const [c1, c2, c3] = aurora(th.accentColor, th.accentSecondary);
  const hlc = isLight(bg1) ? [th.accentColor, th.accentSecondary, th.accentColor] : [c1, c2, c3];

  let delay = 0.15;
  const nextDelay = (): number => {
    delay += 0.07;
    return delay;
  };
  const rv = (inner_: string, d_ = nextDelay()): string => `<g class="reveal" style="animation-delay:${d_.toFixed(2)}s">${inner_}</g>`;

  const parts: string[] = [];
  let y = PADX;

  const showAv = !hide.has("avatar");
  const AVR = 38;
  const hx = PADX + (showAv ? AVR * 2 + 22 : 0);
  const headStats: Array<{ icon: string; label: string; value: number }> = [];
  if (!hide.has("stars")) headStats.push({ icon: "star", label: "STARS", value: d.stars });
  if (!hide.has("forks")) headStats.push({ icon: "fork", label: "FORKS", value: d.forks });
  const hsW = 150;
  const headRight = headStats.length * (hsW + 10);
  const titleAvail = Math.max(120, W - hx - PADX - headRight - 16);
  const titleText = `${o.showOwner ? `${d.owner} / ` : ""}${o.title || d.name}`;
  const titleFs = Math.max(22, Math.min(42, Math.floor(titleAvail / (Math.max(8, vlen(titleText)) * cw * 1.08))));
  const titleBase = y + titleFs;

  if (showAv) {
    const acx = PADX + AVR;
    const acy = y + AVR + 2;
    parts.push(rv(`
      <circle cx="${acx}" cy="${acy}" r="${AVR + 12}" fill="url(#${u}orb)" class="pulse"/>
      <g class="spin"><circle cx="${acx}" cy="${acy}" r="${AVR + 8}" fill="none" stroke="${c1}" stroke-width="1.5" stroke-dasharray="3 8" opacity="0.8"/><circle cx="${acx + AVR + 8}" cy="${acy}" r="3.5" fill="${c2}"/></g>
      ${
        d.avatar
          ? `<clipPath id="${u}avc"><circle cx="${acx}" cy="${acy}" r="${AVR}"/></clipPath><image x="${acx - AVR}" y="${acy - AVR}" width="${AVR * 2}" height="${AVR * 2}" href="${d.avatar}" xlink:href="${d.avatar}" clip-path="url(#${u}avc)" preserveAspectRatio="xMidYMid slice"/>`
          : `<circle cx="${acx}" cy="${acy}" r="${AVR}" fill="url(#${u}core)"/><text x="${acx}" y="${acy + 14}" text-anchor="middle" font-family="${family}" font-size="40" font-weight="${strong}" fill="${th.background}">${escapeXml((d.owner[0] ?? "?").toUpperCase())}</text>`
      }
      <circle cx="${acx}" cy="${acy}" r="${AVR}" fill="none" stroke="url(#${u}core)" stroke-width="3"/>`, 0.1));
  }

  parts.push(rv(`<text x="${hx}" y="${titleBase}" font-family="${family}" font-size="${titleFs}" font-weight="${strong}" fill="${th.textColor}"${glow ? ` filter="url(#${u}glow)"` : ""}>${
    o.showOwner ? `<tspan fill="${th.subTextColor}" font-weight="${body}">${escapeXml(d.owner)} / </tspan>` : ""
  }<tspan fill="url(#${u}hl)">${escapeXml(o.title || d.name)}</tspan></text>`, 0.16));

  type Chip = { icon?: string; dot?: string; text: string; color?: string };
  const chips: Chip[] = [];
  if (!hide.has("badges")) {
    chips.push(d.isPrivate ? { icon: "lock", text: "Private" } : { icon: "globe", text: "Public" });
    if (d.fork) chips.push({ icon: "fork", text: d.parent ? `Fork of ${d.parent}` : "Fork" });
    if (d.archived) chips.push({ icon: "archive", text: "Archived", color: th.accentSecondary });
    if (d.template) chips.push({ icon: "copy", text: "Template" });
    if (d.license && !hide.has("license")) chips.push({ icon: "law", text: d.license });
    if (!hide.has("branch")) chips.push({ icon: "branch", text: d.defaultBranch });
    if (d.language && !hide.has("language")) chips.push({ dot: langColor(d.language, th), text: d.language });
  }
  const chipFs = 14;
  const chipAvail = Math.max(160, W - hx - PADX - headRight - 8);
  let chipX = hx;
  let chipY = titleBase + 16;
  const chipSvg: string[] = [];
  chips.forEach((c) => {
    const w = Math.round(vlen(c.text) * chipFs * cw + 40);
    if (chipX + w > hx + chipAvail && chipX > hx) {
      chipX = hx;
      chipY += 36;
    }
    const col = c.color ?? th.accentColor;
    chipSvg.push(`<rect x="${chipX}" y="${chipY}" width="${w}" height="28" rx="14" fill="${th.badgeBg}" stroke="${th.border}"/>${
      c.dot ? `<circle cx="${chipX + 17}" cy="${chipY + 14}" r="5" fill="${c.dot}"/>` : ic(c.icon ?? "tag", chipX + 10, chipY + 6, 16, col, 2.2)
    }<text x="${chipX + 32}" y="${chipY + 19}" font-family="${family}" font-size="${chipFs}" font-weight="${body}" fill="${th.textColor}">${escapeXml(c.text)}</text>`);
    chipX += w + 8;
  });
  if (chipSvg.length) parts.push(rv(chipSvg.join(""), 0.24));
  const chipsBottom = chips.length ? chipY + 28 : titleBase + 6;

  headStats.forEach((s, i) => {
    const bx = W - PADX - (headStats.length - i) * (hsW + 10) + 10;
    parts.push(rv(`
      <rect x="${bx}" y="${y}" width="${hsW}" height="86" rx="18" fill="${th.badgeBg}" stroke="${th.border}"/>
      <g class="beat" style="animation-delay:${(i * 0.7).toFixed(1)}s">${ic(s.icon, bx + 16, y + 14, 22, c1, 2.2)}</g>
      <text x="${bx + 48}" y="${y + 31}" font-family="${family}" font-size="12.5" font-weight="${strong}" letter-spacing="2.4" fill="${th.subTextColor}">${s.label}</text>
      <text x="${bx + 16}" y="${y + 70}" font-family="${family}" font-size="34" font-weight="${strong}" fill="url(#${u}hl)">${fmtNum(s.value)}</text>`, 0.2 + i * 0.08));
  });

  y = Math.max(y + (headStats.length ? 86 : 0), showAv ? y + AVR * 2 + 6 : 0, chipsBottom) + 26;

  if (!hide.has("description")) {
    const text = o.description || d.description || "No description provided.";
    const dim = !o.description && !d.description;
    const dfs = 20;
    const lines = wrapLines(text, Math.floor(inner / (dfs * cw)), 3);
    lines.forEach((ln, i) => {
      parts.push(rv(`<text x="${PADX}" y="${y + dfs + i * 30}" font-family="${family}" font-size="${dfs}" font-weight="${body}" fill="${th.subTextColor}"${dim ? ' font-style="italic" opacity="0.7"' : ""}>${escapeXml(ln)}</text>`, 0.3 + i * 0.06));
    });
    y += lines.length * 30 + 14;
  }

  if (!hide.has("topics") && d.topics.length && o.maxTopics > 0) {
    const tfs = 14;
    let tx = PADX;
    let ty = y;
    let rows = 1;
    const ts: string[] = [];
    for (const t of d.topics.slice(0, o.maxTopics)) {
      const w = Math.round(vlen(t) * tfs * cw + 28);
      if (tx + w > W - PADX) {
        if (rows >= 2) break;
        rows++;
        tx = PADX;
        ty += 38;
      }
      ts.push(`<rect x="${tx}" y="${ty}" width="${w}" height="30" rx="15" fill="${c1}" fill-opacity="0.13" stroke="${c1}" stroke-opacity="0.35"/><text x="${tx + w / 2}" y="${ty + 20}" text-anchor="middle" font-family="${family}" font-size="${tfs}" font-weight="${body}" fill="${th.accentColor}">${escapeXml(t)}</text>`);
      tx += w + 10;
    }
    if (ts.length) {
      parts.push(rv(ts.join(""), 0.4));
      y = ty + 30 + 22;
    }
  }

  const divider = (yy: number, dl: number): string => `<rect class="wipe" x="${PADX}" y="${yy}" width="${inner}" height="2" rx="1" fill="url(#${u}edge)" opacity="0.65" style="animation-delay:${dl.toFixed(2)}s"/>`;

  type Tile = { icon: string; label: string; value: string; small?: boolean };
  const tiles: Tile[] = [];
  const maybe = (key: string, icon: string, label: string, v: number | null, fmt: (n: number) => string = fmtNum): void => {
    if (!hide.has(key) && v !== null) tiles.push({ icon, label, value: fmt(v) });
  };
  if (!hide.has("stats")) {
    maybe("watchers", "eye", "WATCHERS", d.watchers);
    maybe("issues", "issue", "OPEN ISSUES", d.openIssues);
    maybe("prs", "pr", "OPEN PRS", d.prs);
    maybe("commits", "commit", "COMMITS", d.commits);
    maybe("contributors", "users", "CONTRIBUTORS", d.contributors);
    maybe("releases", "tag", "RELEASES", d.releases);
    maybe("branches", "branch", "BRANCHES", d.branches);
    if (!hide.has("size")) tiles.push({ icon: "db", label: "SIZE", value: fmtSize(d.sizeKb) });
    if (!hide.has("created")) tiles.push({ icon: "cal", label: "CREATED", value: fmtDate(d.created), small: true });
    if (!hide.has("updated")) tiles.push({ icon: "clock", label: "LAST PUSH", value: ago(d.pushed), small: true });
  }
  if (tiles.length) {
    parts.push(divider(y - 8, 0.45));
    const cols = Math.max(2, Math.min(6, o.columns));
    const gap = 12;
    const tw = (inner - gap * (cols - 1)) / cols;
    const th_ = 90;
    tiles.forEach((t, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = PADX + col * (tw + gap);
      const ty = y + 8 + row * (th_ + gap);
      const vfs = t.small ? Math.min(22, Math.floor((tw - 28) / (vlen(t.value) * cw * 1.02))) : Math.min(30, Math.floor((tw - 28) / (Math.max(3, vlen(t.value)) * cw * 1.05)));
      const lfs = Math.max(8.5, Math.min(11.5, (tw - 66) / (t.label.length * 0.8)));
      parts.push(rv(`
        <rect x="${tx.toFixed(1)}" y="${ty}" width="${tw.toFixed(1)}" height="${th_}" rx="16" fill="${th.badgeBg}" stroke="${th.border}"/>
        <rect x="${(tx + 14).toFixed(1)}" y="${ty + 14}" width="30" height="30" rx="10" fill="${c1}" fill-opacity="0.14"/>
        <g class="bob" style="--bd:2;animation-delay:${(i * 0.3).toFixed(1)}s">${ic(t.icon, tx + 20, ty + 20, 18, c1, 2.2)}</g>
        <text x="${(tx + 54).toFixed(1)}" y="${ty + 34}" font-family="${family}" font-size="${lfs.toFixed(1)}" font-weight="${strong}" letter-spacing="${(lfs * 0.14).toFixed(2)}" fill="${th.subTextColor}">${t.label}</text>
        <text x="${(tx + 16).toFixed(1)}" y="${ty + 76}" font-family="${family}" font-size="${Math.max(14, vfs)}" font-weight="${strong}" fill="${th.titleColor}">${escapeXml(t.value)}</text>`, 0.5 + i * 0.06));
    });
    y += 8 + Math.ceil(tiles.length / cols) * (th_ + gap) + 10;
  }

  const total = d.languages.reduce((a, b) => a + b.bytes, 0);
  if (!hide.has("languages") && total > 0 && o.maxLangs > 0) {
    const top = d.languages.slice(0, o.maxLangs).map((l) => ({ name: l.name, pct: (l.bytes / total) * 100 }));
    const rest = 100 - top.reduce((a, b) => a + b.pct, 0);
    if (rest > 1.5) top.push({ name: "Other", pct: rest });
    parts.push(divider(y, 0.8));
    parts.push(rv(`<text x="${PADX}" y="${y + 32}" font-family="${family}" font-size="12.5" font-weight="${strong}" letter-spacing="3" fill="${th.accentColor}">LANGUAGES</text>`, 0.85));
    const by = y + 46;
    let bx = 0;
    const segs = top.map((l) => {
      const w = Math.max(4, (l.pct / 100) * inner);
      const seg = `<rect x="${(PADX + bx).toFixed(1)}" y="${by}" width="${w.toFixed(1)}" height="16" fill="${l.name === "Other" ? th.barBackground : langColor(l.name, th)}"/>`;
      bx += w;
      return seg;
    });
    parts.push(`<clipPath id="${u}lb"><rect x="${PADX}" y="${by}" width="${inner}" height="16" rx="8"/></clipPath>
      <g clip-path="url(#${u}lb)"><rect x="${PADX}" y="${by}" width="${inner}" height="16" fill="${th.barBackground}" opacity="0.6"/><g class="wipe" style="animation-delay:0.95s">${segs.join("")}</g>${
        animate ? `<rect x="${PADX - 90}" y="${by}" width="90" height="16" fill="url(#${u}shine)"><animate attributeName="x" from="${PADX - 90}" to="${PADX + inner}" dur="3.2s" begin="1.8s" repeatCount="indefinite"/></rect>` : ""
      }</g>`);
    const lcols = Math.max(2, Math.min(5, Math.floor(inner / 190)));
    const lw = inner / lcols;
    top.forEach((l, i) => {
      const lx = PADX + (i % lcols) * lw;
      const ly = by + 36 + Math.floor(i / lcols) * 28;
      parts.push(rv(`<circle cx="${lx + 7}" cy="${ly - 5}" r="6" fill="${l.name === "Other" ? th.barBackground : langColor(l.name, th)}"/><text x="${lx + 20}" y="${ly}" font-family="${family}" font-size="15" font-weight="${body}" fill="${th.textColor}">${escapeXml(clip(l.name, 14))} <tspan font-weight="${strong}" fill="${th.accentColor}">${l.pct.toFixed(1)}%</tspan></text>`, 1 + i * 0.05));
    });
    y = by + 36 + Math.ceil(top.length / lcols) * 28 + 6;
  }

  const boxes: Array<{ icon: string; label: string; main: string; sub: string; big?: boolean }> = [];
  if (!hide.has("commit") && d.lastCommit) {
    boxes.push({ icon: "commit", label: "LATEST COMMIT", main: d.lastCommit.msg || "(no message)", sub: `${d.lastCommit.author}  ·  ${d.lastCommit.date ? ago(d.lastCommit.date) : ""}  ·  ${d.lastCommit.sha}` });
  }
  if (!hide.has("release") && d.latestRelease) {
    boxes.push({ icon: "tag", label: "LATEST RELEASE", main: d.latestRelease.tag, sub: `${d.latestRelease.name && d.latestRelease.name !== d.latestRelease.tag ? `${d.latestRelease.name}  ·  ` : ""}${ago(d.latestRelease.date)}`, big: true });
  }
  if (boxes.length) {
    parts.push(divider(y, 1.1));
    y += 16;
    const gapB = 14;
    const widths = boxes.length === 2 ? [Math.round((inner - gapB) * 0.64), Math.round((inner - gapB) * 0.36)] : [inner];
    let bx = PADX;
    boxes.forEach((b, i) => {
      const w = widths[i];
      const maxV = Math.floor((w - 96) / ((b.big ? 20 : 17) * cw));
      parts.push(rv(`
        <rect x="${bx}" y="${y}" width="${w}" height="82" rx="18" fill="${th.badgeBg}" stroke="${th.border}"/>
        <circle cx="${bx + 40}" cy="${y + 41}" r="22" fill="${c1}" fill-opacity="0.14"/><circle class="softping" cx="${bx + 40}" cy="${y + 41}" r="22" fill="none" stroke="${c1}" stroke-width="1.5"/>
        ${ic(b.icon, bx + 28, y + 29, 24, c1, 2.2)}
        <text x="${bx + 78}" y="${y + 24}" font-family="${family}" font-size="11.5" font-weight="${strong}" letter-spacing="2" fill="${th.subTextColor}">${b.label}</text>
        <text x="${bx + 78}" y="${y + 50}" font-family="${family}" font-size="${b.big ? 22 : 17}" font-weight="${strong}" fill="${b.big ? `url(#${u}hl)` : th.textColor}">${escapeXml(clip(b.main, maxV))}</text>
        <text x="${bx + 78}" y="${y + 70}" font-family="${family}" font-size="13" font-weight="${body}" fill="${th.subTextColor}">${escapeXml(clip(b.sub, Math.floor((w - 96) / (13 * cw))))}</text>`, 1.15 + i * 0.1));
      bx += w + gapB;
    });
    y += 82 + 6;
  }

  if (!hide.has("footer")) {
    y += 22;
    parts.push(rv(`<g>${ic("link", PADX, y - 15, 17, c2, 2.2)}<text x="${PADX + 26}" y="${y - 1}" font-family="${family}" font-size="15" font-weight="${body}" fill="${th.subTextColor}">github.com/${escapeXml(d.fullName)}</text></g>${
      d.homepage
        ? `<text x="${W - PADX}" y="${y - 1}" text-anchor="end" font-family="${family}" font-size="15" font-weight="${body}" fill="${th.accentColor}">${escapeXml(clip(d.homepage.replace(/^https?:\/\//, "").replace(/\/$/, ""), 40))}</text>`
        : ""
    }`, 1.3));
    y += 10;
  }

  const H = Math.round(y + PADX * 0.6);

  const defs = `
    <linearGradient id="${u}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient>
    ${auroraDefs({ leakA: `${u}la`, leakB: `${u}lb`, colorA: c1, colorB: c2, shineId: `${u}sh` })}
    ${flowGradient(`${u}edge`, [c1, c2, c3], W, animate, 7)}
    ${flowGradient(`${u}hl`, hlc, 420, animate, 5, PADX)}
    <linearGradient id="${u}core" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient>
    <radialGradient id="${u}orb"><stop offset="0%" stop-color="${c1}" stop-opacity="0.4"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${u}shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity="0"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient>
    ${sharedDefs(u, th, bg1, c1, W, H)}`;

  const bgLayer = auroraBackground({
    W, H, pad: 0, bgId: `${u}bg`, edgeId: `${u}edge`, leakA: `${u}la`, leakB: `${u}lb`,
    colorA: c1, colorB: c2, leakAPos: [W * 0.18, 80], leakBPos: [W * 0.85, Math.min(H - 60, 520)], leakR: 340, shineId: `${u}sh`,
  });
  const fx = animate ? particles(motif, r, H, th, u, W, 0.6) : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="GitHub repository ${escapeXml(d.fullName)}">
  <title>${escapeXml(d.fullName)}</title>
  <defs>${defs}</defs>
  <style>${fontImport(f)}
    text { text-rendering: optimizeLegibility; }${fxCss(animate)}${MOTION_CSS}
  </style>
  <g clip-path="url(#${u}clip)">
    ${bgLayer}
    <rect width="${W}" height="${H}" fill="url(#${u}dots)" opacity="0.045"/>
    ${fx}
    ${parts.join("\n    ")}
  </g>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${br}" fill="none" stroke="${th.border}" stroke-width="2"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${br}" fill="none" stroke="url(#${u}edge)" stroke-width="2" opacity="0.5"/>
</svg>`;
}

function cleanText(s: string, max: number): string {
  return Array.from(s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim()).slice(0, max).join("");
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
  const randomTheme = sanitizeTheme(q("theme") || "dark") === "random";
  if (randomTheme) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  } else {
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400");
  }
  const brRaw = q("border_radius");
  const theme = getTheme(themeName, brRaw !== "" ? clamp(parseInt(brRaw, 10) || 10, 0, 28) : undefined);
  const br = theme.borderRadius;

  const fail = (msg: string): void => {
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(errorCard(msg, theme, br));
  };

  const target = parseRepoInput(q("repo") || q("url") || q("r"), q("username").trim());
  if (!target) {
    fail("Missing or invalid ?repo= (use owner/name or a full GitHub repo URL)");
    return;
  }

  const num = (key: string, def: number, min: number, max: number): number => {
    const n = parseInt(q(key), 10);
    return Number.isFinite(n) ? clamp(n, min, max) : def;
  };
  const hide = parseHide(q("hide"));

  try {
    const data = await fetchRepo(target.owner, target.name, hide);
    res.status(200).send(
      renderRepo(data, themeName, theme, {
        animate: q("animate") !== "false",
        font: pickFont(q("font")),
        W: num("width", 1000, 640, 1400),
        hide,
        title: cleanText(q("title"), 60),
        description: cleanText(q("description"), 300),
        maxTopics: num("max_topics", 8, 0, 20),
        maxLangs: num("max_langs", 6, 0, 10),
        columns: num("columns", 5, 2, 6),
        showOwner: q("show_owner") !== "false",
      })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "NOT_FOUND") fail(`Repository "${target.owner}/${target.name}" not found (or private).`);
    else if (msg === "RATE_LIMITED") fail("GitHub API rate limit reached. Set GITHUB_TOKEN env var.");
    else {
      console.error("[repo-card] error:", msg);
      fail("Unexpected error fetching repository data. Try again shortly.");
    }
  }
}

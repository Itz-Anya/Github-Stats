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

export function shiftHue(color: string, deg: number): string {
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

export function aurora(a: string, b: string): [string, string, string] {
  return [a, b, shiftHue(a, 70)];
}

function colorCycle(attr: "fill" | "stroke" | "stop-color", colors: string[], dur: number, begin = 0): string {
  const vals = [...colors, colors[0]].join(";");
  return `<animate attributeName="${attr}" values="${vals}" dur="${dur}s" begin="${begin}s" repeatCount="indefinite" calcMode="linear"/>`;
}

export function glowShadow(opts: {
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  colors: string[];
  blurId: string;
  animate: boolean;
  opacity?: number;
  dy?: number;
  inset?: number;
  dur?: number;
  begin?: number;
}): string {
  const { x, y, w, h, r, colors, blurId, animate } = opts;
  const dy = opts.dy ?? 9;
  const inset = opts.inset ?? 6;
  const op = opts.opacity ?? 0.38;
  const cycle = animate && colors.length > 1 ? colorCycle("fill", colors, opts.dur ?? 9, opts.begin ?? 0) : "";
  return `<g class="gshadow" style="animation-delay:${((opts.begin ?? 0) % 3).toFixed(2)}s"><rect x="${(x + inset).toFixed(1)}" y="${(y + inset + dy).toFixed(1)}" width="${Math.max(w - inset * 2, 1).toFixed(1)}" height="${Math.max(h - inset * 2, 1).toFixed(1)}" rx="${r}" fill="${colors[0]}" opacity="${op}" filter="url(#${blurId})">${cycle}</rect></g>`;
}

export function shadowBlur(id: string, std = 13): string {
  return `<filter id="${id}" x="-40%" y="-60%" width="180%" height="220%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${std}"/></filter>`;
}

export function flowGradient(id: string, colors: string[], w: number, animate: boolean, dur = 7, x0 = 0): string {
  const n = colors.length;
  const stops = [...colors, colors[0]]
    .map((c, i) => `<stop offset="${((i / n) * 100).toFixed(1)}%" stop-color="${c}"/>`)
    .join("");
  const anim = animate
    ? `<animateTransform attributeName="gradientTransform" type="translate" values="0 0;${w} 0" dur="${dur}s" repeatCount="indefinite"/>`
    : "";
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x0 + w}" y2="0" spreadMethod="repeat">${stops}${anim}</linearGradient>`;
}

export function fxCss(animate: boolean): string {
  return `
      @keyframes reveal { 0% { opacity: 0; transform: translateY(16px) scale(.965); } 60% { opacity: 1; } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes revealL { from { opacity: 0; transform: translateX(-22px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes revealR { from { opacity: 0; transform: translateX(22px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes zoom { 0% { opacity: 0; transform: scale(.55); } 65% { opacity: 1; transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes wipe { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes wipeY { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
      @keyframes gshadow { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
      @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(calc(var(--bd, 3) * -1px)); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes spinr { to { transform: rotate(-360deg); } }
      @keyframes pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
      @keyframes breathe { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
      @keyframes twinkle { 0%,100% { opacity: .15; transform: scale(.6); } 50% { opacity: 1; transform: scale(1.1); } }
      @keyframes ping { 0% { transform: scale(1); opacity: .55; } 80%,100% { transform: scale(2.4); opacity: 0; } }
      @keyframes softping { 0% { transform: scale(1); opacity: .5; } 80%,100% { transform: scale(1.5); opacity: 0; } }
      @keyframes trace { to { stroke-dashoffset: -100; } }
      @keyframes shimmer { 0%,58% { transform: translateX(0); opacity: 0; } 62% { opacity: 1; } 92%,100% { transform: translateX(var(--travel, 900px)); opacity: 0; } }
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
      .gshadow { animation: gshadow 4.2s ease-in-out infinite; }
      .bob     { animation: bob 4.4s ease-in-out infinite; }
      .shimmer { animation: shimmer 7s ease-in-out infinite; }
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

export function auroraBackground(opts: {
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

export function auroraDefs(opts: { leakA: string; leakB: string; colorA: string; colorB: string; shineId: string; softId?: string }): string {
  const soft = opts.softId
    ? `<linearGradient id="${opts.softId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity="0"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.17"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`
    : "";
  return `${soft}
    <radialGradient id="${opts.leakA}"><stop offset="0%" stop-color="${opts.colorA}" stop-opacity="0.22"/><stop offset="100%" stop-color="${opts.colorA}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${opts.leakB}"><stop offset="0%" stop-color="${opts.colorB}" stop-opacity="0.2"/><stop offset="100%" stop-color="${opts.colorB}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${opts.shineId}" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ffffff" stop-opacity="0"/><stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></linearGradient>`;
}

const SPARK = "M0 -5.5 L1.5 -1.5 L5.5 0 L1.5 1.5 L0 5.5 L-1.5 1.5 L-5.5 0 L-1.5 -1.5Z";

export function sparkle(cx: number, cy: number, color: string, delay: number, scale = 1): string {
  return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${scale})"><path class="twinkle" d="${SPARK}" fill="${color}" style="animation-delay:${delay.toFixed(2)}s"/></g>`;
}

export function shine(clipId: string, softId: string, x: number, y: number, w: number, h: number, r: number, delay: number): string {
  return `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#${clipId})"><rect class="shimmer" x="${x - 70}" y="${y - 8}" width="56" height="${h + 16}" fill="url(#${softId})" style="--travel:${(w + 140).toFixed(0)}px;animation-delay:${delay.toFixed(2)}s"/></g>`;
}

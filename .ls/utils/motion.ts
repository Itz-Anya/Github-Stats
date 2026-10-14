/* Shared motion helpers for the SVG cards.
 *
 * Rules that keep these animations safe inside <img> / GitHub README embeds:
 *  - pure CSS animation (no scripts, no external files)
 *  - the resting state of every element is the FINAL, fully visible state;
 *    the hidden "from" state only exists inside @keyframes. So with
 *    ?animate=false (or prefers-reduced-motion) the card is simply static.
 *  - animations never animate `opacity` on elements that carry an opacity
 *    attribute (an animation would override it), wrap them in a <g> instead.
 */

/* Small deterministic PRNG so a card renders identically for the same seed
 * (keeps CDN caching stable and avoids "jumping" decorations between loads). */
export function seeded(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Soft floating dots for card backgrounds. */
export function particles(
  w: number,
  h: number,
  count: number,
  color: string,
  seed: string,
  avoid?: { x: number; y: number; w: number; h: number }
): string {
  const rnd = seeded(seed);
  let out = "";
  for (let i = 0; i < count; i++) {
    const x = 12 + rnd() * (w - 24);
    const y = 10 + rnd() * (h - 20);
    const r = 1 + rnd() * 1.8;
    const d = (rnd() * 6).toFixed(2);
    const dur = (3.5 + rnd() * 4).toFixed(2);
    if (avoid && x > avoid.x && x < avoid.x + avoid.w && y > avoid.y && y < avoid.y + avoid.h) continue;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" class="twinkle" style="animation-duration:${dur}s;animation-delay:${d}s"/>`;
  }
  return out;
}

/* Common keyframes + utility classes. Cards append their own rules after it. */
export function motionCss(animate: boolean): string {
  return `
      @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pop { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
      @keyframes dropin { from { opacity: 0; transform: translateY(-7px) scale(.6); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes breathe { 0%,100% { opacity: .5; } 50% { opacity: 1; } }
      @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes spinr { to { transform: rotate(-360deg); } }
      @keyframes twinkle { 0%,100% { opacity: .06; } 50% { opacity: .8; } }
      @keyframes ping { 0% { transform: scale(1); opacity: .55; } 80%,100% { transform: scale(2.6); opacity: 0; } }
      @keyframes softping { 0% { transform: scale(1); opacity: .5; } 80%,100% { transform: scale(1.5); opacity: 0; } }
      @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
      @keyframes trace { to { stroke-dashoffset: -100; } }
      @keyframes sweep { 0%,60% { transform: translateX(0); opacity: 0; } 64% { opacity: 1; } 92%,100% { transform: translateX(var(--travel, 900px)); opacity: 0; } }
      @keyframes wave { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(1.32); } }
      @keyframes flicker { 0%,100% { transform: scale(1) rotate(0); } 25% { transform: scale(1.1) rotate(-4deg); } 55% { transform: scale(.95) rotate(3deg); } 80% { transform: scale(1.06) rotate(-2deg); } }
      .rise { animation: rise .6s ease both; }
      .fade { animation: fade .8s ease both; }
      .pop { transform-box: fill-box; transform-origin: center; animation: pop .7s cubic-bezier(.2,.9,.3,1.2) both; }
      .grow { transform-box: fill-box; transform-origin: left center; animation: grow 1s cubic-bezier(.2,.8,.2,1) both; }
      .breathe { animation: breathe 3.6s ease-in-out infinite; }
      .float { animation: float 4s ease-in-out infinite; }
      .twinkle { animation: twinkle 4s ease-in-out infinite; }
      .ping { transform-box: fill-box; transform-origin: center; animation: ping 2.6s ease-out infinite; }
      .softping { transform-box: fill-box; transform-origin: center; animation: softping 3s ease-out infinite; }
      .spin { animation: spin 14s linear infinite; }
      .spinr { animation: spinr 22s linear infinite; }
      .trace { stroke-dasharray: 16 84; animation: trace 7s linear infinite; }
      .sweep { animation: sweep 7s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      ${animate ? "" : "* { animation: none !important; }"}`;
}

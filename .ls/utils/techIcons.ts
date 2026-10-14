export interface TechIcon {
  mono: string;
  color: string;
  glyph?: "react" | "html" | "shell" | "braces";
  path?: string;
}

const LANGUAGES: Record<string, TechIcon> = {
  JavaScript: { mono: "JS", color: "#f7df1e" },
  TypeScript: { mono: "TS", color: "#3178c6" },
  Python: { mono: "Py", color: "#4b8bbe" },
  Java: { mono: "Jv", color: "#ed8b00" },
  "C++": { mono: "C++", color: "#00a3e0" },
  C: { mono: "C", color: "#a8b9cc" },
  "C#": { mono: "C#", color: "#9b4f96" },
  Go: { mono: "Go", color: "#00add8" },
  Rust: { mono: "Rs", color: "#ce422b" },
  Ruby: { mono: "Rb", color: "#cc342d" },
  PHP: { mono: "php", color: "#777bb4" },
  Swift: { mono: "Sw", color: "#f05138" },
  Kotlin: { mono: "Kt", color: "#7f52ff" },
  Dart: { mono: "Dt", color: "#0175c2" },
  Scala: { mono: "Sc", color: "#dc322f" },
  R: { mono: "R", color: "#276dc3" },
  Shell: { mono: "", color: "#4eaa25", glyph: "shell" },
  PowerShell: { mono: "PS", color: "#5391fe" },
  HTML: { mono: "", color: "#e34f26", glyph: "html" },
  CSS: { mono: "CSS", color: "#2965f1" },
  SCSS: { mono: "Sass", color: "#cc6699" },
  Vue: { mono: "V", color: "#4fc08d" },
  Svelte: { mono: "Sv", color: "#ff3e00" },
  Lua: { mono: "Lua", color: "#4f6fd9" },
  Perl: { mono: "Pl", color: "#39457e" },
  Haskell: { mono: "Hs", color: "#8f6fd6" },
  Elixir: { mono: "Ex", color: "#9a6fc7" },
  Clojure: { mono: "Clj", color: "#5881d8" },
  Julia: { mono: "Jl", color: "#9558b2" },
  MATLAB: { mono: "M", color: "#e16737" },
  "Jupyter Notebook": { mono: "Jn", color: "#f37626" },
  "Objective-C": { mono: "Oc", color: "#438eff" },
  Assembly: { mono: "Asm", color: "#8a6d3b" },
  Zig: { mono: "Zig", color: "#ec915c" },
  Nix: { mono: "Nix", color: "#7eb7e6" },
  Groovy: { mono: "Gv", color: "#4298b8" },
  TeX: { mono: "TeX", color: "#3d6117" },
  "Vim Script": { mono: "Vim", color: "#199f4b" },
  Terraform: { mono: "Tf", color: "#7b42bc" },
  Solidity: { mono: "Sol", color: "#7d8a9c" },
};

const FRAMEWORKS: Record<string, TechIcon> = {
  react: { mono: "", color: "#61dafb", glyph: "react" },
  nextjs: { mono: "Nx", color: "#e5e7eb" },
  vue: { mono: "V", color: "#4fc08d" },
  nuxt: { mono: "Nu", color: "#00dc82" },
  angular: { mono: "Ng", color: "#dd0031" },
  svelte: { mono: "Sv", color: "#ff3e00" },
  nodejs: { mono: "Nd", color: "#5fa04e" },
  express: { mono: "Ex", color: "#9ca3af" },
  django: { mono: "Dj", color: "#0c9e6a" },
  flask: { mono: "Fl", color: "#9ca3af" },
  fastapi: { mono: "FA", color: "#009688" },
  spring: { mono: "Sp", color: "#6db33f" },
  laravel: { mono: "Lv", color: "#ff2d20" },
  rails: { mono: "Ra", color: "#cc0000" },
  tailwind: { mono: "Tw", color: "#38bdf8" },
  bootstrap: { mono: "Bs", color: "#7952b3" },
  docker: { mono: "Dk", color: "#2496ed" },
  kubernetes: { mono: "K8", color: "#326ce5" },
  mongodb: { mono: "Mg", color: "#47a248" },
  postgres: { mono: "Pg", color: "#4f8fc9" },
  mysql: { mono: "My", color: "#00758f" },
  redis: { mono: "Rd", color: "#dc382d" },
  sqlite: { mono: "SQ", color: "#4a9cd6" },
  graphql: { mono: "Gq", color: "#e535ab" },
  firebase: { mono: "Fb", color: "#ffca28" },
  supabase: { mono: "Sb", color: "#3ecf8e" },
  flutter: { mono: "Ft", color: "#02a8ef" },
  tensorflow: { mono: "TF", color: "#ff6f00" },
  pytorch: { mono: "PT", color: "#ee4c2c" },
};

const FALLBACK_COLORS = ["#8b949e", "#a78bfa", "#34d399", "#f59e0b", "#60a5fa"];

export function getTechIcon(key: string, kind: "language" | "framework"): TechIcon {
  const found = kind === "framework" ? FRAMEWORKS[key] : LANGUAGES[key];
  if (found) return found;

  const clean = key.replace(/[^A-Za-z0-9+#]/g, "");
  const mono = clean.length <= 2 ? clean : clean[0].toUpperCase() + clean[1].toLowerCase();
  const color = FALLBACK_COLORS[key.length % FALLBACK_COLORS.length];
  return { mono: mono || "{}", color, glyph: mono ? undefined : "braces" };
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export function drawGlyph(
  icon: TechIcon,
  color: string,
  fontFamily: string
): string {
  if (icon.path) {
    return `<path transform="translate(-14 -14) scale(1.1667)" d="${icon.path}" fill="${color}"/>`;
  }

  switch (icon.glyph) {
    case "react":
      return `<g fill="none" stroke="${color}" stroke-width="1.7">
        <ellipse rx="13" ry="5.2"/>
        <ellipse rx="13" ry="5.2" transform="rotate(60)"/>
        <ellipse rx="13" ry="5.2" transform="rotate(120)"/>
        <circle r="2.4" fill="${color}" stroke="none"/>
      </g>`;
    case "html":
      return `<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-6 -8 L-14 0 L-6 8"/>
        <path d="M6 -8 L14 0 L6 8"/>
        <path d="M2.5 -10 L-2.5 10" stroke-width="2.4"/>
      </g>`;
    case "shell":
      return `<g fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-12 -7 L-4 0 L-12 7"/>
        <path d="M1 8 L12 8"/>
      </g>`;
    case "braces":
      return `<g fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-4 -11 Q-9 -11 -9 -6 L-9 -2 Q-9 0 -12 0 Q-9 0 -9 2 L-9 6 Q-9 11 -4 11"/>
        <path d="M4 -11 Q9 -11 9 -6 L9 -2 Q9 0 12 0 Q9 0 9 2 L9 6 Q9 11 4 11"/>
      </g>`;
    default: {
      const len = icon.mono.length;
      const size = len <= 1 ? 26 : len === 2 ? 22 : len === 3 ? 16 : 13;
      return `<text x="0" y="${size * 0.35}" text-anchor="middle" font-family="${fontFamily}" font-size="${size}" font-weight="800" letter-spacing="-0.5" fill="${color}">${icon.mono}</text>`;
    }
  }
}

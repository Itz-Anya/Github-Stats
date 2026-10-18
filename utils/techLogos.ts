import { cache } from "../lib/cache.js";
import type { TechItem } from "../lib/profile.js";

const DEVICON_BASE = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons";
const VARIANTS = ["original", "plain"];
const TIMEOUT_MS = 3000;
const TTL_SECONDS = 24 * 3600;

const LANGUAGE_SLUGS: Record<string, string> = {
  JavaScript: "javascript", TypeScript: "typescript", Python: "python", Java: "java",
  "C++": "cplusplus", C: "c", "C#": "csharp", Go: "go", Rust: "rust", Ruby: "ruby",
  PHP: "php", Swift: "swift", Kotlin: "kotlin", Dart: "dart", Scala: "scala", R: "r",
  Shell: "bash", PowerShell: "powershell", HTML: "html5", CSS: "css3", SCSS: "sass",
  Vue: "vuejs", Svelte: "svelte", Lua: "lua", Perl: "perl", Haskell: "haskell",
  Elixir: "elixir", Clojure: "clojure", Julia: "julia", MATLAB: "matlab",
  "Jupyter Notebook": "jupyter", "Objective-C": "objectivec", Zig: "zig", Nix: "nixos",
  Groovy: "groovy", TeX: "latex", "Vim Script": "vim", Terraform: "terraform",
  Solidity: "solidity",
};

const FRAMEWORK_SLUGS: Record<string, string> = {
  react: "react", nextjs: "nextjs", vue: "vuejs", nuxt: "nuxtjs", angular: "angularjs",
  svelte: "svelte", nodejs: "nodejs", express: "express", django: "django", flask: "flask",
  fastapi: "fastapi", spring: "spring", laravel: "laravel", rails: "rails",
  tailwind: "tailwindcss", bootstrap: "bootstrap", docker: "docker", kubernetes: "kubernetes",
  mongodb: "mongodb", postgres: "postgresql", mysql: "mysql", redis: "redis",
  sqlite: "sqlite", graphql: "graphql", firebase: "firebase", supabase: "supabase",
  flutter: "flutter", tensorflow: "tensorflow", pytorch: "pytorch",
};

const DARK_LOGO_SLUGS = new Set(["nextjs", "express", "flask", "rust", "django", "bash", "zig"]);

function logoSlug(item: Pick<TechItem, "key" | "kind">): string | undefined {
  return item.kind === "framework" ? FRAMEWORK_SLUGS[item.key] : LANGUAGE_SLUGS[item.key];
}

export function isDarkLogo(item: Pick<TechItem, "key" | "kind">): boolean {
  const slug = logoSlug(item);
  return slug ? DARK_LOGO_SLUGS.has(slug) : false;
}

export function logoId(item: Pick<TechItem, "key" | "kind">): string {
  return `${item.kind}:${item.key}`;
}

async function fetchWithTimeout(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const text = await res.text();
    return text.includes("<svg") ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLogo(slug: string): Promise<string | null> {
  const cacheKey = `tech-logo:${slug}`;
  const hit = cache.get<string>(cacheKey);
  if (hit) return hit.data || null;

  for (const variant of VARIANTS) {
    let svg = await fetchWithTimeout(`${DEVICON_BASE}/${slug}/${slug}-${variant}.svg`);
    if (!svg) continue;

    if (!/xmlns\s*=/.test(svg)) svg = svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const uri = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
    cache.set(cacheKey, uri, TTL_SECONDS);
    return uri;
  }

  cache.set(cacheKey, "", 600);
  return null;
}

export async function fetchTechLogos(tech: TechItem[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    tech.map(async (t) => {
      const slug = logoSlug(t);
      if (!slug) return;
      const uri = await fetchLogo(slug);
      if (uri) out[logoId(t)] = uri;
    })
  );
  return out;
}

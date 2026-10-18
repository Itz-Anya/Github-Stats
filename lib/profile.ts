import { cache } from "./cache.js";

export interface TechItem {
  key: string;
  name: string;
  kind: "language" | "framework";
  repos: number;
}

export interface ProfileData {
  login: string;
  name: string | null;
  bio: string | null;
  avatarBase64: string | null;
  followers: number;
  totalStars: number;
  totalForks: number;
  publicRepos: number;
  tech: TechItem[];
}

export interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  public_repos: number;
  created_at?: string;
}

export interface RestRepo {
  name: string;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  size: number;
  topics?: string[];
  description?: string | null;
}

export const GITHUB_API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN ?? "";
const MAX_TECH = 12;
const MAX_FRAMEWORKS = 4;
const MAX_LANG_REPOS = 30;

export function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "github-stats-service/2.0",
  };
  if (TOKEN) h["Authorization"] = `Bearer ${TOKEN}`;
  return h;
}

const TOPIC_TO_TECH: Record<string, string> = {
  react: "react", reactjs: "react", "react-native": "react", "react-js": "react",
  nextjs: "nextjs", "next-js": "nextjs", next: "nextjs",
  vue: "vue", vuejs: "vue", "vue-js": "vue", nuxt: "nuxt", nuxtjs: "nuxt",
  angular: "angular", angularjs: "angular",
  svelte: "svelte", sveltekit: "svelte",
  nodejs: "nodejs", "node-js": "nodejs", node: "nodejs",
  express: "express", expressjs: "express",
  django: "django", flask: "flask", fastapi: "fastapi",
  "spring-boot": "spring", springboot: "spring", spring: "spring",
  laravel: "laravel", rails: "rails", "ruby-on-rails": "rails",
  tailwindcss: "tailwind", tailwind: "tailwind",
  bootstrap: "bootstrap",
  docker: "docker", kubernetes: "kubernetes", k8s: "kubernetes",
  mongodb: "mongodb", mongo: "mongodb",
  postgresql: "postgres", postgres: "postgres",
  mysql: "mysql", redis: "redis", sqlite: "sqlite",
  graphql: "graphql", firebase: "firebase", supabase: "supabase",
  flutter: "flutter",
  tensorflow: "tensorflow", pytorch: "pytorch",
  discordjs: "nodejs",
};

const FRAMEWORK_NAMES: Record<string, string> = {
  react: "React", nextjs: "Next.js", vue: "Vue", nuxt: "Nuxt", angular: "Angular",
  svelte: "Svelte", nodejs: "Node.js", express: "Express", django: "Django",
  flask: "Flask", fastapi: "FastAPI", spring: "Spring", laravel: "Laravel",
  rails: "Rails", tailwind: "Tailwind", bootstrap: "Bootstrap", docker: "Docker",
  kubernetes: "Kubernetes", mongodb: "MongoDB", postgres: "PostgreSQL",
  mysql: "MySQL", redis: "Redis", sqlite: "SQLite", graphql: "GraphQL",
  firebase: "Firebase", supabase: "Supabase", flutter: "Flutter",
  tensorflow: "TensorFlow", pytorch: "PyTorch",
};

const SKIP_LANGUAGES = new Set(["Dockerfile", "Makefile", "Batchfile", "CMake", "Roff"]);

export async function fetchAvatar(url: string): Promise<string | null> {
  const cacheKey = `profile-avatar:${url}`;
  const hit = cache.get<string>(cacheKey);
  if (hit) return hit.data;

  try {
    const sized = url.includes("?") ? `${url}&s=400` : `${url}?s=400`;
    const res = await fetch(sized, { headers: { "User-Agent": "github-stats-service/2.0" } });
    if (!res.ok) return null;

    const type = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim();
    if (!["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"].includes(type)) {
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const uri = `data:${type};base64,${buf.toString("base64")}`;
    cache.set(cacheKey, uri, 3600);
    return uri;
  } catch {
    return null;
  }
}

export async function fetchUser(username: string): Promise<RestUser> {
  const cacheKey = `profile-user:${username.toLowerCase()}`;
  const hit = cache.get<RestUser>(cacheKey);
  if (hit) return hit.data;

  const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`, {
    headers: headers(),
  });
  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (res.status === 403 || res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`GITHUB_API_ERROR:${res.status}`);

  const data = (await res.json()) as RestUser;
  cache.set(cacheKey, data, 1800);
  return data;
}

export async function fetchRepos(username: string): Promise<RestRepo[]> {
  const cacheKey = `profile-repos:${username.toLowerCase()}`;
  const hit = cache.get<RestRepo[]>(cacheKey);
  if (hit) return hit.data;

  const all: RestRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
      { headers: headers() }
    );
    if (!res.ok) break;
    const data = (await res.json()) as RestRepo[];
    all.push(...data);
    if (data.length < 100) break;
  }

  cache.set(cacheKey, all, 1800);
  return all;
}

type LangBytes = Record<string, number>;

async function fetchLanguageBreakdown(
  username: string,
  repos: RestRepo[]
): Promise<Map<string, LangBytes> | null> {
  const cacheKey = `profile-langs:${username.toLowerCase()}`;
  const hit = cache.get<Array<[string, LangBytes]>>(cacheKey);
  if (hit) return new Map(hit.data);

  const targets = repos.filter((r) => !r.fork).slice(0, MAX_LANG_REPOS);
  let blocked = false;

  const results = await Promise.all(
    targets.map(async (r): Promise<[string, LangBytes] | null> => {
      try {
        const res = await fetch(
          `${GITHUB_API}/repos/${encodeURIComponent(username)}/${encodeURIComponent(r.name)}/languages`,
          { headers: headers() }
        );
        if (res.status === 403 || res.status === 429) blocked = true;
        if (!res.ok) return null;
        return [r.name, (await res.json()) as LangBytes];
      } catch {
        return null;
      }
    })
  );

  const ok = results.filter((x): x is [string, LangBytes] => x !== null);
  if (blocked || ok.length === 0) return null;

  cache.set(cacheKey, ok, 1800);
  return new Map(ok);
}

function buildTech(repos: RestRepo[], breakdown: Map<string, LangBytes> | null): TechItem[] {
  const own = repos.filter((r) => !r.fork);

  const langs = new Map<string, { repos: number; size: number }>();
  const fws = new Map<string, number>();

  for (const r of own) {
    const detail = breakdown?.get(r.name);
    const detailTotal = detail ? Object.values(detail).reduce((a, b) => a + b, 0) : 0;

    if (detail && detailTotal > 0) {
      for (const [lang, bytes] of Object.entries(detail)) {
        if (SKIP_LANGUAGES.has(lang)) continue;
        const share = bytes / detailTotal;
        const cur = langs.get(lang) ?? { repos: 0, size: 0 };
        if (share >= 0.05) cur.repos += 1;
        cur.size += bytes;
        langs.set(lang, cur);
      }
    } else if (r.language && !SKIP_LANGUAGES.has(r.language)) {
      const cur = langs.get(r.language) ?? { repos: 0, size: 0 };
      cur.repos += 1;
      cur.size += Math.max(r.size, 1) * 1024;
      langs.set(r.language, cur);
    }

    const seen = new Set<string>();
    for (const topic of r.topics ?? []) {
      const key = TOPIC_TO_TECH[topic.toLowerCase()];
      if (key && !seen.has(key)) {
        seen.add(key);
        fws.set(key, (fws.get(key) ?? 0) + 1);
      }
    }
  }

  const totalRepos = [...langs.values()].reduce((s, v) => s + v.repos, 0) || 1;
  const totalSize = [...langs.values()].reduce((s, v) => s + v.size, 0) || 1;

  const rankedLangs: TechItem[] = [...langs.entries()]
    .map(([name, v]) => ({
      key: name,
      name,
      kind: "language" as const,
      repos: v.repos,
      score: 0.5 * (v.repos / totalRepos) + 0.5 * (v.size / totalSize),
    }))
    .filter((l) => l.score >= 0.01 && l.repos > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ score: _score, ...item }) => item);

  const rankedFws: TechItem[] = [...fws.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({
      key,
      name: FRAMEWORK_NAMES[key] ?? key,
      kind: "framework" as const,
      repos: count,
    }));

  const langNames = new Set(rankedLangs.map((l) => l.name.toLowerCase()));
  const fwPicked = rankedFws
    .filter((f) => !langNames.has(f.name.toLowerCase()))
    .slice(0, MAX_FRAMEWORKS);
  const langPicked = rankedLangs.slice(0, MAX_TECH - fwPicked.length);

  return [...langPicked, ...fwPicked];
}

export async function fetchProfile(username: string): Promise<ProfileData> {
  const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username)]);
  const [avatarBase64, breakdown] = await Promise.all([
    fetchAvatar(user.avatar_url),
    fetchLanguageBreakdown(username, repos),
  ]);

  const own = repos.filter((r) => !r.fork);

  return {
    login: user.login,
    name: user.name,
    bio: user.bio,
    avatarBase64,
    followers: user.followers,
    totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
    totalForks: own.reduce((s, r) => s + r.forks_count, 0),
    publicRepos: user.public_repos,
    tech: buildTech(repos, breakdown),
  };
}

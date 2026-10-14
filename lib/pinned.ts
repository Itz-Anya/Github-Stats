import { cache } from "./cache.js";
import { fetchRepos, fetchUser } from "./profile.js";

export interface PinnedItem {
  owner: string;
  name: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
}

export interface PinnedData {
  login: string;
  source: "pinned" | "top";
  items: PinnedItem[];
}

const TOKEN = process.env.GITHUB_TOKEN ?? "";

async function viaGraphQL(username: string): Promise<PinnedItem[] | null> {
  if (!TOKEN) return null;
  const query = `query($login:String!){ user(login:$login){ pinnedItems(first:6,types:[REPOSITORY]){ nodes{ ... on Repository{
    name description stargazerCount forkCount owner{login} primaryLanguage{name color} } } } } }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": "github-stats-service/2.0" },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    data?: { user: null | { pinnedItems: { nodes: Array<null | {
      name: string; description: string | null; stargazerCount: number; forkCount: number;
      owner: { login: string }; primaryLanguage: null | { name: string; color: string | null };
    }> } } };
  };
  const nodes = json.data?.user?.pinnedItems.nodes;
  if (!nodes) return null;
  return nodes
    .filter((n): n is NonNullable<typeof n> => n !== null)
    .map((n) => ({
      owner: n.owner.login, name: n.name, description: n.description,
      language: n.primaryLanguage?.name ?? null, languageColor: n.primaryLanguage?.color ?? null,
      stars: n.stargazerCount, forks: n.forkCount,
    }));
}

function decode(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ").trim();
}

function parseCount(s: string): number {
  const t = decode(s).toLowerCase().replace(/,/g, "");
  const m = /([\d.]+)\s*(k|m)?/.exec(t);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return Math.round(m[2] === "k" ? n * 1000 : m[2] === "m" ? n * 1_000_000 : n);
}

async function viaHtml(username: string): Promise<PinnedItem[] | null> {
  const res = await fetch(`https://github.com/${encodeURIComponent(username)}`, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; github-stats-service/2.0)", Accept: "text/html" },
  });
  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (!res.ok) return null;
  const html = await res.text();

  const starts: number[] = [];
  for (const m of html.matchAll(/<span class="repo"[^>]*>/g)) starts.push(m.index ?? 0);

  const items: PinnedItem[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < starts.length && items.length < 6; i++) {
    const segEnd = i + 1 < starts.length ? starts[i + 1] : Math.min(html.length, starts[i] + 6000);
    const seg = html.slice(starts[i], segEnd);
    const name = decode(/<span class="repo"[^>]*>([\s\S]*?)<\/span>/.exec(seg)?.[1] ?? "");
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());

    const before = html.slice(Math.max(0, starts[i] - 700), starts[i]);
    const hrefs = [...before.matchAll(/href="\/([^"\/]+)\/([^"\/?#]+)"/g)];
    const owner = hrefs.length ? hrefs[hrefs.length - 1][1] : username;

    const desc = /<p class="pinned-item-desc[^"]*"[^>]*>([\s\S]*?)<\/p>/.exec(seg)?.[1];
    const lang = /itemprop="programmingLanguage"[^>]*>([^<]+)</.exec(seg)?.[1];
    const color = /background-color:\s*(#[0-9a-fA-F]{3,8})/.exec(seg)?.[1];
    const stars = /\/stargazers"[^>]*>([\s\S]*?)<\/a>/.exec(seg)?.[1];
    const forks = /\/(?:forks|network\/members)"[^>]*>([\s\S]*?)<\/a>/.exec(seg)?.[1];
    items.push({
      owner,
      name,
      description: desc ? decode(desc) || null : null,
      language: lang ? decode(lang) : null,
      languageColor: color ?? null,
      stars: stars ? parseCount(stars) : 0,
      forks: forks ? parseCount(forks) : 0,
    });
  }
  return items.length ? items : null;
}

export async function fetchPinned(username: string): Promise<PinnedData> {
  const cacheKey = `pinned:${username.toLowerCase()}`;
  const hit = cache.get<PinnedData>(cacheKey);
  if (hit) return hit.data;

  const user = await fetchUser(username);
  let items: PinnedItem[] | null = null;
  let source: "pinned" | "top" = "pinned";

  try { items = await viaGraphQL(username); } catch { items = null; }
  if (!items?.length) { try { items = await viaHtml(username); } catch (e) { if (e instanceof Error && e.message === "USER_NOT_FOUND") throw e; items = null; } }

  if (!items?.length) {
    source = "top";
    const repos = await fetchRepos(username);
    items = repos
      .filter((r) => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 6)
      .map((r) => ({
        owner: user.login, name: r.name, description: (r as { description?: string | null }).description ?? null,
        language: r.language, languageColor: null, stars: r.stargazers_count, forks: r.forks_count,
      }));
  }

  const data: PinnedData = { login: user.login, source, items };
  cache.set(cacheKey, data, 1800);
  return data;
}

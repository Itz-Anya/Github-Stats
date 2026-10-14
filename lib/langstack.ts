import { cache } from "./cache.js";
import { GITHUB_API, headers, fetchUser, fetchRepos } from "./profile.js";
import type { RestRepo } from "./profile.js";

export interface LangStat {
  name: string;
  bytes: number;
  percent: number;
}

export interface LangStackData {
  login: string;
  repoCount: number;
  totalBytes: number;
  languages: LangStat[];
}

const MAX_REPOS = 100;
const CHUNK = 15;

const SKIP = new Set(["Makefile", "Batchfile", "CMake", "Roff", "Dockerfile"]);

type LangBytes = Record<string, number>;

async function repoLanguages(
  username: string,
  repo: RestRepo
): Promise<{ data: LangBytes | null; blocked: boolean }> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`,
      { headers: headers() }
    );
    if (res.status === 403 || res.status === 429) return { data: null, blocked: true };
    if (!res.ok) return { data: null, blocked: false };
    return { data: (await res.json()) as LangBytes, blocked: false };
  } catch {
    return { data: null, blocked: false };
  }
}

export async function fetchLangStack(
  username: string,
  includeForks: boolean
): Promise<LangStackData> {
  const cacheKey = `langstack:${username.toLowerCase()}:${includeForks ? 1 : 0}`;
  const hit = cache.get<LangStackData>(cacheKey);
  if (hit) return hit.data;

  const [user, allRepos] = await Promise.all([fetchUser(username), fetchRepos(username)]);
  const repos = allRepos.filter((r) => includeForks || !r.fork).slice(0, MAX_REPOS);

  const totals = new Map<string, number>();
  const add = (lang: string, bytes: number): void => {
    if (SKIP.has(lang) || bytes <= 0) return;
    totals.set(lang, (totals.get(lang) ?? 0) + bytes);
  };

  let blocked = false;
  for (let i = 0; i < repos.length; i += CHUNK) {
    const slice = repos.slice(i, i + CHUNK);

    if (blocked) {
      for (const r of slice) if (r.language) add(r.language, Math.max(r.size, 1) * 1024);
      continue;
    }

    const results = await Promise.all(slice.map((r) => repoLanguages(username, r)));
    results.forEach((res, idx) => {
      if (res.blocked) blocked = true;
      const r = slice[idx];
      if (res.data && Object.keys(res.data).length) {
        for (const [lang, bytes] of Object.entries(res.data)) add(lang, bytes);
      } else if (r.language) {
        add(r.language, Math.max(r.size, 1) * 1024);
      }
    });
  }

  const totalBytes = [...totals.values()].reduce((a, b) => a + b, 0);
  const languages: LangStat[] = [...totals.entries()]
    .map(([name, bytes]) => ({ name, bytes, percent: totalBytes ? (bytes / totalBytes) * 100 : 0 }))
    .sort((a, b) => b.bytes - a.bytes);

  const data: LangStackData = { login: user.login, repoCount: repos.length, totalBytes, languages };
  cache.set(cacheKey, data, blocked ? 120 : 1800);
  return data;
}

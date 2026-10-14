import { cache } from "./cache.js";
import { fetchRepos, fetchUser } from "./profile.js";
import { fetchLifetimeQuick } from "./contrib.js";

export interface TrophyData {
  login: string;
  followers: number;
  repos: number;
  stars: number;
  forks: number;
  years: number;
  languages: number;
  topRepoStars: number;
  commits: number | null;
}

export async function fetchTrophyData(username: string, includePrivate: boolean): Promise<TrophyData> {
  const cacheKey = `trophies:${username.toLowerCase()}:${includePrivate ? 1 : 0}`;
  const hit = cache.get<TrophyData>(cacheKey);
  if (hit) return hit.data;

  const commitsP = fetchLifetimeQuick(username)
    .then((l) => l.totalCommits + (includePrivate ? l.privateContributions : 0))
    .catch((e: unknown) => {
      if (e instanceof Error && e.message === "USER_NOT_FOUND") throw e;
      return null;
    });

  const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username)]);
  const own = repos.filter((r) => !r.fork);

  const commits = await Promise.race<number | null>([
    commitsP,
    new Promise<number | null>((r) => setTimeout(() => r(null), 5000)),
  ]);

  const created = user.created_at ? Date.parse(user.created_at) : Date.now();
  const years = Math.max(0, Math.floor((Date.now() - created) / (365.25 * 86400000)));

  const data: TrophyData = {
    login: user.login,
    followers: user.followers,
    repos: user.public_repos,
    stars: own.reduce((s, r) => s + r.stargazers_count, 0),
    forks: own.reduce((s, r) => s + r.forks_count, 0),
    years,
    languages: new Set(own.map((r) => r.language).filter((l): l is string => Boolean(l))).size,
    topRepoStars: own.reduce((m, r) => Math.max(m, r.stargazers_count), 0),
    commits,
  };
  cache.set(cacheKey, data, commits === null ? 120 : 1800);
  return data;
}

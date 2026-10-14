import { cache } from "./cache.js";
import { fetchAvatar, fetchRepos, fetchUser } from "./profile.js";
import { fetchLangStack } from "./langstack.js";

export interface BannerLang {
  name: string;
  percent: number;
}

export interface BannerData {
  login: string;
  name: string | null;
  bio: string | null;
  avatarBase64: string | null;
  followers: number;
  totalStars: number;
  publicRepos: number;
  langs: BannerLang[];
}

export async function fetchBanner(username: string): Promise<BannerData> {
  const cacheKey = `banner:${username.toLowerCase()}`;
  const hit = cache.get<BannerData>(cacheKey);
  if (hit) return hit.data;

  const [user, repos] = await Promise.all([fetchUser(username), fetchRepos(username)]);
  const own = repos.filter((r) => !r.fork);

  const accurate = fetchLangStack(username, false)
    .then((d) => d.languages.map((l) => ({ name: l.name, percent: l.percent })))
    .catch(() => null);
  const [avatarBase64, accurateLangs] = await Promise.all([
    fetchAvatar(user.avatar_url),
    Promise.race<Array<{ name: string; percent: number }> | null>([
      accurate,
      new Promise<null>((r) => setTimeout(() => r(null), 4000)),
    ]),
  ]);

  let langs: BannerLang[];
  if (accurateLangs && accurateLangs.length) {
    langs = accurateLangs.slice(0, 3);
  } else {
    const weight = new Map<string, number>();
    for (const r of own) if (r.language) weight.set(r.language, (weight.get(r.language) ?? 0) + Math.max(r.size, 1));
    const total = [...weight.values()].reduce((a, b) => a + b, 0) || 1;
    langs = [...weight.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, w]) => ({ name, percent: (w / total) * 100 }));
  }

  const data: BannerData = {
    login: user.login,
    name: user.name,
    bio: user.bio,
    avatarBase64,
    followers: user.followers,
    totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
    publicRepos: user.public_repos,
    langs,
  };
  cache.set(cacheKey, data, accurateLangs ? 1800 : 300);
  return data;
}

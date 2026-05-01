import { cache } from "./cache.js";

export interface LanguageStat {
  name: string;
  color: string;
  percentage: number;
  bytes: number;
}

export interface PinnedRepo {
  name: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  url: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  avatarBase64: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitterUsername: string | null;
  email: string | null;
  hireable: boolean;
  createdAt: string;
  updatedAt: string;
  accountAgeDays: number;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  totalStars: number;
  totalForks: number;      
  totalWatchers: number;
  totalOpenIssues: number;
  totalCommits: number;     
  totalPRs: number;
  totalIssuesOpened: number;
  totalCodeReviews: number;
  totalDiscussions: number;
  contributionsLastYear: number;
  privateContributions: number;
  longestStreak: number;
  currentStreak: number;
  topLanguages: LanguageStat[];
  pinnedRepos: PinnedRepo[];
  hasToken: boolean;
}


interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  twitter_username: string | null;
  email: string | null;
  hireable: boolean | null;
  created_at: string;
  updated_at: string;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
}

interface RestRepo {
  name: string;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  language: string | null;
  size: number;
}


interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalIssueContributions: number;
        totalPullRequestReviewContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar?: {
          totalContributions: number;
          weeks?: Array<{
            contributionDays: Array<{
              contributionCount: number;
              date: string;
            }>;
          }>;
        };
      };
      repositoriesContributedTo?: {
        totalCount: number;
      };
      repositories?: {
        nodes?: Array<{
          name: string;
          description: string | null;
          url: string;
          stargazerCount: number;
          forkCount: number;
          primaryLanguage?: { name: string; color: string | null } | null;
          languages?: {
            edges?: Array<{
              size: number;
              node: { name: string; color: string | null };
            }>;
          };
        }>;
      };
      gists?: { totalCount: number };
      sponsorshipsAsMaintainer?: { totalCount: number };
    };
  };
  errors?: Array<{ message: string }>;
}


const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5",
  Java: "#b07219", "C++": "#f34b7d", C: "#555555", "C#": "#239120",
  Ruby: "#701516", Go: "#00ADD8", Rust: "#dea584", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Scala: "#c22d40",
  R: "#198CE7", Shell: "#89e051", HTML: "#e34c26", CSS: "#563d7c",
  Vue: "#41b883", Svelte: "#ff3e00", Elixir: "#6e4a7e", Haskell: "#5e5086",
  Lua: "#000080", MATLAB: "#e16737", Perl: "#0298c3", Julia: "#a270ba",
  Clojure: "#db5855", "Objective-C": "#438eff", Assembly: "#6E4C13",
  Dockerfile: "#384d54", Makefile: "#427819", Nix: "#7e7eff",
  PowerShell: "#012456", Groovy: "#4298b8", Terraform: "#7B42BC",
};

function langColor(name: string): string {
  return LANG_COLORS[name] ?? "#8b949e";
}

function buildHeaders(etag?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-stats-service/2.0",
  };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  if (etag) headers["If-None-Match"] = etag;
  return headers;
}


async function fetchAvatarBase64(url: string): Promise<string | null> {
  const cacheKey = `avatar:${url}`;
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached.data;

  try {
    const sized = url.includes("?") ? `${url}&s=96` : `${url}?s=96`;
    const res = await fetch(sized, {
      headers: { "User-Agent": "github-stats-service/2.0" },
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "image/png";
    const safeType = contentType.split(";")[0].trim();
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
    if (!allowed.includes(safeType)) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUri = `data:${safeType};base64,${base64}`;

    cache.set(cacheKey, dataUri, 3600); 
    return dataUri;
  } catch {
    return null;
  }
}


async function fetchRestUser(username: string): Promise<RestUser> {
  const cacheKey = `rest:${username}`;
  const cached = cache.get<RestUser>(cacheKey);
  const etag = cache.getEtag(cacheKey);

  const res = await fetch(`${GITHUB_API}/users/${username}`, {
    headers: buildHeaders(etag),
  });

  if (res.status === 304 && cached) return cached.data;
  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (res.status === 403) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`GITHUB_API_ERROR:${res.status}`);

  const data = (await res.json()) as RestUser;
  cache.set(cacheKey, data, 1800, res.headers.get("etag") ?? undefined);
  return data;
}

async function fetchAllRepos(username: string): Promise<RestRepo[]> {
  const cacheKey = `repos:${username}`;
  const cached = cache.get<RestRepo[]>(cacheKey);
  if (cached) return cached.data;

  const pages: RestRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/users/${username}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
      { headers: buildHeaders() }
    );
    if (!res.ok) break;

    const data = (await res.json()) as RestRepo[];
    pages.push(...data);
    if (data.length < 100) break;
    page++;
    if (page > 5) break; 
  }

  cache.set(cacheKey, pages, 1800);
  return pages;
}


async function fetchGraphQL(username: string): Promise<GraphQLResponse["data"]> {
  if (!TOKEN) return undefined;

  const cacheKey = `graphql:${username}`;
  const cached = cache.get<GraphQLResponse["data"]>(cacheKey);
  if (cached) return cached.data;

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
        repositoriesContributedTo(
          first: 1
          contributionTypes: [COMMIT, PULL_REQUEST, REPOSITORY, PULL_REQUEST_REVIEW]
        ) {
          totalCount
        }
        repositories(
          ownerAffiliations: OWNER
          isFork: false
          first: 100
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          nodes {
            name
            description
            url
            stargazerCount
            forkCount
            primaryLanguage { name color }
            languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name color } }
            }
          }
        }
      }
    }
  `;

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: { ...buildHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!res.ok) return undefined;

  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length) {
    const msg = json.errors[0].message;
    if (msg.toLowerCase().includes("could not resolve")) throw new Error("USER_NOT_FOUND");
    return undefined;
  }

  cache.set(cacheKey, json.data, 1800);
  return json.data;
}


function calcStreaks(weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string }> }>): {
  longest: number;
  current: number;
} {
  const days = weeks.flatMap((w) => w.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0;
  let current = 0;
  let streak = 0;

  const todayStr = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (d.contributionCount > 0) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      if (d.date !== todayStr) streak = 0;
    }
  }
  current = streak;

  return { longest, current };
}


function aggregateLanguages(
  repos: RestRepo[],
  gqlNodes?: Array<{ languages?: { edges?: Array<{ size: number; node: { name: string; color: string | null } }> } }>
): LanguageStat[] {
  const bytesMap = new Map<string, { bytes: number; color: string }>();

  
  if (gqlNodes?.length) {
    for (const repo of gqlNodes) {
      for (const edge of repo.languages?.edges ?? []) {
        const { name, color } = edge.node;
        const prev = bytesMap.get(name);
        bytesMap.set(name, {
          bytes: (prev?.bytes ?? 0) + edge.size,
          color: color ?? langColor(name),
        });
      }
    }
  } else {
    
    for (const repo of repos) {
      if (!repo.language || repo.fork) continue;
      const prev = bytesMap.get(repo.language);
      bytesMap.set(repo.language, {
        bytes: (prev?.bytes ?? 0) + (repo.size * 1024),
        color: langColor(repo.language),
      });
    }
  }

  const total = [...bytesMap.values()].reduce((s, v) => s + v.bytes, 0);
  if (total === 0) return [];

  return [...bytesMap.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 8)
    .map(([name, { bytes, color }]) => ({
      name,
      color,
      percentage: Math.round((bytes / total) * 1000) / 10,
      bytes,
    }));
}


async function fetchPinnedRepos(username: string, gqlNodes?: GraphQLResponse["data"]): Promise<PinnedRepo[]> {
  if (gqlNodes?.user?.repositories?.nodes) {
    return (gqlNodes.user.repositories.nodes ?? [])
      .sort((a, b) => b.stargazerCount - a.stargazerCount)
      .slice(0, 4)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.primaryLanguage?.name ?? null,
        languageColor: r.primaryLanguage?.color ?? null,
        stars: r.stargazerCount,
        forks: r.forkCount,
        url: r.url,
      }));
  }
  return [];
}


export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const [restUser, repos, gqlData] = await Promise.all([
    fetchRestUser(username),
    fetchAllRepos(username),
    fetchGraphQL(username),
  ]);

  const avatarBase64 = await fetchAvatarBase64(restUser.avatar_url);

  const gqlUser = gqlData?.user;
  const cc = gqlUser?.contributionsCollection;
  const gqlNodes = gqlUser?.repositories?.nodes ?? undefined;
  
  const ownRepos = repos.filter((r) => !r.fork);
  const totalStars = ownRepos.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = ownRepos.reduce((s, r) => s + r.forks_count, 0);
  const totalWatchers = ownRepos.reduce((s, r) => s + r.watchers_count, 0);
  const totalOpenIssues = ownRepos.reduce((s, r) => s + r.open_issues_count, 0);

  const totalCommits = (cc?.totalCommitContributions ?? 0) + (cc?.restrictedContributionsCount ?? 0);
  const totalPRs = cc?.totalPullRequestContributions ?? 0;
  const totalIssuesOpened = cc?.totalIssueContributions ?? 0;
  const totalCodeReviews = cc?.totalPullRequestReviewContributions ?? 0;
  const totalDiscussions = 0;
  const contributionsLastYear = cc?.contributionCalendar?.totalContributions ?? 0;
  const privateContributions = cc?.restrictedContributionsCount ?? 0;

  const weeks = cc?.contributionCalendar?.weeks ?? [];
  const { longest: longestStreak, current: currentStreak } = calcStreaks(weeks);

  const topLanguages = aggregateLanguages(repos, gqlNodes);

  const pinnedRepos = await fetchPinnedRepos(username, gqlData);

  
  const createdAt = new Date(restUser.created_at);
  const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);

  return {
    login: restUser.login,
    name: restUser.name,
    avatarUrl: restUser.avatar_url,
    avatarBase64,
    bio: restUser.bio,
    company: restUser.company,
    location: restUser.location,
    blog: restUser.blog,
    twitterUsername: restUser.twitter_username,
    email: restUser.email,
    hireable: restUser.hireable ?? false,
    createdAt: restUser.created_at,
    updatedAt: restUser.updated_at,
    accountAgeDays,
    publicRepos: restUser.public_repos,
    publicGists: restUser.public_gists,
    followers: restUser.followers,
    following: restUser.following,
    totalStars,
    totalForks,
    totalWatchers,
    totalOpenIssues,
    totalCommits,
    totalPRs,
    totalIssuesOpened,
    totalCodeReviews,
    totalDiscussions,
    contributionsLastYear,
    privateContributions,
    longestStreak,
    currentStreak,
    topLanguages,
    pinnedRepos,
    hasToken: Boolean(TOKEN),
  };
}

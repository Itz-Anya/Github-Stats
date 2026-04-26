import { cache } from "./cache.js";

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  totalStars: number;
  totalCommits: number;
  contributions: number;
  privateContributions: number;
}

interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        totalCommitContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar?: {
          totalContributions: number;
        };
      };
      repositories?: {
        nodes?: Array<{ stargazerCount: number }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";
const TOKEN = process.env.GITHUB_TOKEN ?? "";

function buildHeaders(etag?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-stats-service/1.0",
  };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;
  if (etag) headers["If-None-Match"] = etag;
  return headers;
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

async function fetchGraphQLStats(username: string): Promise<{
  totalCommits: number;
  totalStars: number;
  contributions: number;
  privateContributions: number;
}> {
  if (!TOKEN) {
    // Fallback: fetch public repos for star count via REST
    return fetchPublicStatsREST(username);
  }

  const cacheKey = `graphql:${username}`;
  const cached = cache.get<{
    totalCommits: number;
    totalStars: number;
    contributions: number;
    privateContributions: number;
  }>(cacheKey);
  if (cached) return cached.data;

  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
          }
        }
        repositories(
          ownerAffiliations: OWNER
          isFork: false
          first: 100
          orderBy: { field: STARGAZERS, direction: DESC }
        ) {
          nodes {
            stargazerCount
          }
        }
      }
    }
  `;

  const res = await fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      ...buildHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });

  if (!res.ok) throw new Error(`GRAPHQL_ERROR:${res.status}`);

  const json = (await res.json()) as GraphQLResponse;

  if (json.errors?.length) {
    const msg = json.errors[0].message;
    if (msg.includes("Could not resolve")) throw new Error("USER_NOT_FOUND");
    throw new Error(`GRAPHQL_ERROR: ${msg}`);
  }

  const user = json.data?.user;
  if (!user) throw new Error("USER_NOT_FOUND");

  const cc = user.contributionsCollection;
  const totalCommits = cc?.totalCommitContributions ?? 0;
  const privateContributions = cc?.restrictedContributionsCount ?? 0;
  const contributions = cc?.contributionCalendar?.totalContributions ?? 0;
  const totalStars =
    user.repositories?.nodes?.reduce(
      (sum, repo) => sum + repo.stargazerCount,
      0
    ) ?? 0;

  const result = { totalCommits, totalStars, contributions, privateContributions };
  cache.set(cacheKey, result, 1800);
  return result;
}

async function fetchPublicStatsREST(username: string): Promise<{
  totalCommits: number;
  totalStars: number;
  contributions: number;
  privateContributions: number;
}> {
  const cacheKey = `reststats:${username}`;
  const cached = cache.get<{
    totalCommits: number;
    totalStars: number;
    contributions: number;
    privateContributions: number;
  }>(cacheKey);
  if (cached) return cached.data;

  // Fetch up to 100 repos for star count
  const res = await fetch(
    `${GITHUB_API}/users/${username}/repos?per_page=100&sort=stargazers`,
    { headers: buildHeaders() }
  );
  if (!res.ok) return { totalCommits: 0, totalStars: 0, contributions: 0, privateContributions: 0 };

  const repos = (await res.json()) as Array<{ stargazers_count: number }>;
  const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

  const result = { totalCommits: 0, totalStars, contributions: 0, privateContributions: 0 };
  cache.set(cacheKey, result, 1800);
  return result;
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const [restUser, graphqlStats] = await Promise.all([
    fetchRestUser(username),
    fetchGraphQLStats(username),
  ]);

  return {
    login: restUser.login,
    name: restUser.name,
    avatarUrl: restUser.avatar_url,
    bio: restUser.bio,
    publicRepos: restUser.public_repos,
    followers: restUser.followers,
    following: restUser.following,
    totalStars: graphqlStats.totalStars,
    totalCommits: graphqlStats.totalCommits,
    contributions: graphqlStats.contributions,
    privateContributions: graphqlStats.privateContributions,
  };
}

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

interface ContributionDay {
  contributionCount: number;
  date: string;
}

interface ContributionWeek {
  contributionDays: ContributionDay[];
}

interface YearContributions {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  restrictedContributionsCount: number;
  contributionCalendar: {
    totalContributions: number;
    weeks: ContributionWeek[];
  };
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: YearContributions;

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
          primaryLanguage?: {
            name: string;
            color: string | null;
          } | null;
          languages?: {
            edges?: Array<{
              size: number;
              node: {
                name: string;
                color: string | null;
              };
            }>;
          };
        }>;
      };

      gists?: {
        totalCount: number;
      };

      sponsorshipsAsMaintainer?: {
        totalCount: number;
      };
    };
  };

  errors?: Array<{
    message: string;
  }>;
}

const GITHUB_API = "https://api.github.com";
const GITHUB_GRAPHQL = "https://api.github.com/graphql";

const TOKEN = process.env.GITHUB_TOKEN ?? "";

const LANG_COLORS: Record<string, string> = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#239120",
  Ruby: "#701516",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Scala: "#c22d40",
  R: "#198CE7",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Lua: "#000080",
  MATLAB: "#e16737",
  Perl: "#0298c3",
  Julia: "#a270ba",
  Clojure: "#db5855",
  "Objective-C": "#438eff",
  Assembly: "#6E4C13",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Nix: "#7e7eff",
  PowerShell: "#012456",
  Groovy: "#4298b8",
  Terraform: "#7B42BC",
};

function langColor(name: string): string {
  return LANG_COLORS[name] ?? "#8b949e";
}

function buildHeaders(etag?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "github-stats-service/2.0",
  };

  if (TOKEN) {
    headers["Authorization"] = `Bearer ${TOKEN}`;
  }

  if (etag) {
    headers["If-None-Match"] = etag;
  }

  return headers;
}

async function fetchAvatarBase64(url: string): Promise<string | null> {
  const cacheKey = `avatar:${url}`;

  const cached = cache.get<string>(cacheKey);
  if (cached) {
    return cached.data;
  }

  try {
    const sized = url.includes("?")
      ? `${url}&s=96`
      : `${url}?s=96`;

    const res = await fetch(sized, {
      headers: {
        "User-Agent": "github-stats-service/2.0",
      },
    });

    if (!res.ok) {
      return null;
    }

    const contentType =
      res.headers.get("content-type") ?? "image/png";

    const safeType = contentType.split(";")[0].trim();

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp",
    ];

    if (!allowed.includes(safeType)) {
      return null;
    }

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

  const res = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}`,
    {
      headers: buildHeaders(etag),
    }
  );

  if (res.status === 304 && cached) {
    return cached.data;
  }

  if (res.status === 404) {
    throw new Error("USER_NOT_FOUND");
  }

  if (res.status === 403) {
    throw new Error("RATE_LIMITED");
  }

  if (!res.ok) {
    throw new Error(`GITHUB_API_ERROR:${res.status}`);
  }

  const data = (await res.json()) as RestUser;

  cache.set(
    cacheKey,
    data,
    1800,
    res.headers.get("etag") ?? undefined
  );

  return data;
}

async function fetchAllRepos(username: string): Promise<RestRepo[]> {
  const cacheKey = `repos:${username}`;

  const cached = cache.get<RestRepo[]>(cacheKey);

  if (cached) {
    return cached.data;
  }

  const pages: RestRepo[] = [];

  let page = 1;

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(
        username
      )}/repos?per_page=100&page=${page}&type=owner&sort=updated`,
      {
        headers: buildHeaders(),
      }
    );

    if (!res.ok) {
      break;
    }

    const data = (await res.json()) as RestRepo[];

    pages.push(...data);

    if (data.length < 100) {
      break;
    }

    page++;

    /*
     * Keep the existing safety limit.
     * GitHub's normal user repository list is usually
     * well below this, while preventing excessive requests.
     */
    if (page > 5) {
      break;
    }
  }

  cache.set(cacheKey, pages, 1800);

  return pages;
}

async function fetchGraphQLForYear(
  username: string,
  from: string,
  to: string
): Promise<YearContributions | undefined> {
  /*
   * GitHub's contributionCollection requires GraphQL.
   * Without a token, we cannot query it.
   */
  if (!TOKEN) {
    return undefined;
  }

  const query = `
    query(
      $login: String!
      $from: DateTime!
      $to: DateTime!
    ) {
      user(login: $login) {
        contributionsCollection(
          from: $from
          to: $to
        ) {
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
      }
    }
  `;

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        ...buildHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          login: username,
          from,
          to,
        },
      }),
    });

    if (!res.ok) {
      return undefined;
    }

    const json = (await res.json()) as GraphQLResponse;

    if (json.errors?.length) {
      const message = json.errors[0]?.message ?? "";

      if (
        message.toLowerCase().includes("could not resolve") ||
        message.toLowerCase().includes("unknown user")
      ) {
        throw new Error("USER_NOT_FOUND");
      }

      return undefined;
    }

    return json.data?.user?.contributionsCollection;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      throw error;
    }

    return undefined;
  }
}

async function fetchGraphQL(
  username: string
): Promise<GraphQLResponse["data"]> {
  if (!TOKEN) {
    return undefined;
  }

  const cacheKey = `graphql:${username}`;

  const cached = cache.get<GraphQLResponse["data"]>(cacheKey);

  if (cached) {
    return cached.data;
  }

  const query = `
    query($login: String!) {
      user(login: $login) {

        repositoriesContributedTo(
          first: 1
          contributionTypes: [
            COMMIT
            PULL_REQUEST
            REPOSITORY
            PULL_REQUEST_REVIEW
          ]
        ) {
          totalCount
        }

        repositories(
          ownerAffiliations: OWNER
          isFork: false
          first: 100
          orderBy: {
            field: STARGAZERS
            direction: DESC
          }
        ) {
          nodes {
            name
            description
            url
            stargazerCount
            forkCount

            primaryLanguage {
              name
              color
            }

            languages(
              first: 10
              orderBy: {
                field: SIZE
                direction: DESC
              }
            ) {
              edges {
                size

                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(GITHUB_GRAPHQL, {
      method: "POST",
      headers: {
        ...buildHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          login: username,
        },
      }),
    });

    if (!res.ok) {
      return undefined;
    }

    const json = (await res.json()) as GraphQLResponse;

    if (json.errors?.length) {
      const message = json.errors[0]?.message ?? "";

      if (
        message.toLowerCase().includes("could not resolve") ||
        message.toLowerCase().includes("unknown user")
      ) {
        throw new Error("USER_NOT_FOUND");
      }

      return undefined;
    }

    cache.set(cacheKey, json.data, 1800);

    return json.data;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "USER_NOT_FOUND"
    ) {
      throw error;
    }

    return undefined;
  }
}

async function fetchAllYearsContributions(
  username: string,
  accountCreatedAt: string
): Promise<{
  totalCommits: number;
  totalPRs: number;
  totalIssuesOpened: number;
  totalCodeReviews: number;
  privateContributions: number;
  contributionsLastYear: number;
  allWeeks: ContributionWeek[];
}> {
  const cacheKey = `allYears:${username}`;

  type AggregatedResult = {
    totalCommits: number;
    totalPRs: number;
    totalIssuesOpened: number;
    totalCodeReviews: number;
    privateContributions: number;
    contributionsLastYear: number;
    allWeeks: ContributionWeek[];
  };

  const cached = cache.get<AggregatedResult>(cacheKey);

  if (cached) {
    return cached.data;
  }

  const startYear = new Date(accountCreatedAt).getFullYear();
  const currentYear = new Date().getFullYear();

  const years: Array<{
    from: string;
    to: string;
  }> = [];

  for (let year = startYear; year <= currentYear; year++) {
    years.push({
      from: `${year}-01-01T00:00:00Z`,
      to:
        year === currentYear
          ? new Date().toISOString()
          : `${year}-12-31T23:59:59Z`,
    });
  }

  /*
   * Query all years concurrently.
   */
  const results = await Promise.all(
    years.map(({ from, to }) =>
      fetchGraphQLForYear(username, from, to)
    )
  );

  let totalCommits = 0;
  let totalPRs = 0;
  let totalIssuesOpened = 0;
  let totalCodeReviews = 0;
  let privateContributions = 0;

  const allWeeks: ContributionWeek[] = [];

  for (const cc of results) {
    if (!cc) {
      continue;
    }

    /*
     * IMPORTANT:
     *
     * restrictedContributionsCount is NOT a commit count.
     *
     * It represents restricted contributions across multiple
     * contribution types. Therefore it must NOT be added to
     * totalCommitContributions.
     */
    totalCommits += cc.totalCommitContributions;

    /*
     * This is the PR contribution count GitHub explicitly
     * exposes for the user.
     *
     * We intentionally do NOT add restrictedContributionsCount
     * here because restricted contributions may include commits,
     * issues, reviews, PRs, etc. GitHub does not expose a
     * restrictedPullRequestContributions field.
     */
    totalPRs += cc.totalPullRequestContributions;

    totalIssuesOpened += cc.totalIssueContributions;

    totalCodeReviews +=
      cc.totalPullRequestReviewContributions;

    /*
     * Keep restricted/private activity separate.
     */
    privateContributions +=
      cc.restrictedContributionsCount;

    allWeeks.push(
      ...(cc.contributionCalendar?.weeks ?? [])
    );
  }

  /*
   * The final yearly result represents the current year.
   * Its contributionCalendar is the basis for the
   * "contributionsLastYear" value used by this project.
   */
  const lastYearResult =
    results.length > 0
      ? results[results.length - 1]
      : undefined;

  const contributionsLastYear =
    lastYearResult?.contributionCalendar
      ?.totalContributions ?? 0;

  const aggregated: AggregatedResult = {
    totalCommits,
    totalPRs,
    totalIssuesOpened,
    totalCodeReviews,
    privateContributions,
    contributionsLastYear,
    allWeeks,
  };

  cache.set(cacheKey, aggregated, 1800);

  return aggregated;
}

function calcStreaks(
  weeks: ContributionWeek[]
): {
  longest: number;
  current: number;
} {
  const days = weeks
    .flatMap((week) => week.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (days.length === 0) {
    return {
      longest: 0,
      current: 0,
    };
  }

  let longest = 0;
  let streak = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      streak++;

      if (streak > longest) {
        longest = streak;
      }
    } else {
      streak = 0;
    }
  }

  /*
   * Calculate the CURRENT streak independently.
   *
   * We walk backwards from the newest contribution day.
   * This prevents an old historical streak from being
   * incorrectly reported as the current streak.
   */
  let current = 0;

  const today = new Date();

  /*
   * Use UTC because GitHub contribution dates are YYYY-MM-DD.
   */
  const todayStr = today.toISOString().slice(0, 10);

  /*
   * Find the latest available contribution day.
   */
  let index = days.length - 1;

  while (
    index >= 0 &&
    days[index].date > todayStr
  ) {
    index--;
  }

  /*
   * If today has no contribution, GitHub streak semantics
   * may still allow yesterday to be the active streak.
   *
   * Start from today if available; otherwise start from
   * the latest day <= today.
   */
  if (
    index >= 0 &&
    days[index].date === todayStr &&
    days[index].contributionCount === 0
  ) {
    index--;
  }

  /*
   * Count consecutive contribution days backwards.
   */
  let expectedDate: Date | null = null;

  for (let i = index; i >= 0; i--) {
    const day = days[i];

    if (day.contributionCount <= 0) {
      break;
    }

    if (expectedDate === null) {
      expectedDate = new Date(`${day.date}T00:00:00Z`);
      current++;
      continue;
    }

    expectedDate.setUTCDate(
      expectedDate.getUTCDate() - 1
    );

    const expectedStr =
      expectedDate.toISOString().slice(0, 10);

    if (day.date !== expectedStr) {
      break;
    }

    current++;
  }

  return {
    longest,
    current,
  };
}

function aggregateLanguages(
  repos: RestRepo[],
  gqlNodes?: Array<{
    languages?: {
      edges?: Array<{
        size: number;
        node: {
          name: string;
          color: string | null;
        };
      }>;
    };
  }>
): LanguageStat[] {
  const bytesMap = new Map<
    string,
    {
      bytes: number;
      color: string;
    }
  >();

  if (gqlNodes?.length) {
    for (const repo of gqlNodes) {
      for (const edge of repo.languages?.edges ?? []) {
        const { name, color } = edge.node;

        const previous = bytesMap.get(name);

        bytesMap.set(name, {
          bytes:
            (previous?.bytes ?? 0) + edge.size,
          color:
            color ?? langColor(name),
        });
      }
    }
  } else {
    for (const repo of repos) {
      if (!repo.language || repo.fork) {
        continue;
      }

      const previous = bytesMap.get(repo.language);

      bytesMap.set(repo.language, {
        bytes:
          (previous?.bytes ?? 0) +
          repo.size * 1024,
        color: langColor(repo.language),
      });
    }
  }

  const total = [...bytesMap.values()].reduce(
    (sum, value) => sum + value.bytes,
    0
  );

  if (total === 0) {
    return [];
  }

  return [...bytesMap.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes)
    .slice(0, 8)
    .map(([name, { bytes, color }]) => ({
      name,
      color,
      percentage:
        Math.round((bytes / total) * 1000) / 10,
      bytes,
    }));
}

async function fetchPinnedRepos(
  username: string,
  gqlData?: GraphQLResponse["data"]
): Promise<PinnedRepo[]> {
  /*
   * GitHub's API does not expose the user's actual pinned
   * repository list through this query.
   *
   * We therefore keep the existing behavior:
   * use the user's top repositories by star count.
   */
  if (gqlData?.user?.repositories?.nodes) {
    return (gqlData.user.repositories.nodes ?? [])
      .sort(
        (a, b) =>
          b.stargazerCount - a.stargazerCount
      )
      .slice(0, 4)
      .map((repo) => ({
        name: repo.name,
        description: repo.description,
        language:
          repo.primaryLanguage?.name ?? null,
        languageColor:
          repo.primaryLanguage?.color ?? null,
        stars: repo.stargazerCount,
        forks: repo.forkCount,
        url: repo.url,
      }));
  }

  return [];
}

export async function fetchGitHubUser(
  username: string
): Promise<GitHubUser> {
  const [
    restUser,
    repos,
    gqlData,
  ] = await Promise.all([
    fetchRestUser(username),
    fetchAllRepos(username),
    fetchGraphQL(username),
  ]);

  const avatarBase64 =
    await fetchAvatarBase64(
      restUser.avatar_url
    );

  const gqlNodes =
    gqlData?.user?.repositories?.nodes ??
    undefined;

  /*
   * Only count repositories owned by the user.
   */
  const ownRepos = repos.filter(
    (repo) => !repo.fork
  );

  const totalStars = ownRepos.reduce(
    (sum, repo) =>
      sum + repo.stargazers_count,
    0
  );

  const totalForks = ownRepos.reduce(
    (sum, repo) =>
      sum + repo.forks_count,
    0
  );

  const totalWatchers = ownRepos.reduce(
    (sum, repo) =>
      sum + repo.watchers_count,
    0
  );

  const totalOpenIssues = ownRepos.reduce(
    (sum, repo) =>
      sum + repo.open_issues_count,
    0
  );

  const {
    totalCommits,
    totalPRs,
    totalIssuesOpened,
    totalCodeReviews,
    privateContributions,
    contributionsLastYear,
    allWeeks,
  } =
    await fetchAllYearsContributions(
      username,
      restUser.created_at
    );

  /*
   * Discussions are not currently calculated by this API.
   */
  const totalDiscussions = 0;

  const {
    longest: longestStreak,
    current: currentStreak,
  } = calcStreaks(allWeeks);

  const topLanguages =
    aggregateLanguages(
      repos,
      gqlNodes
    );

  const pinnedRepos =
    await fetchPinnedRepos(
      username,
      gqlData
    );

  const createdAt =
    new Date(restUser.created_at);

  const accountAgeDays = Math.floor(
    (Date.now() -
      createdAt.getTime()) /
      86400000
  );

  return {
    login: restUser.login,
    name: restUser.name,

    avatarUrl: restUser.avatar_url,
    avatarBase64,

    bio: restUser.bio,
    company: restUser.company,
    location: restUser.location,
    blog: restUser.blog,
    twitterUsername:
      restUser.twitter_username,
    email: restUser.email,
    hireable:
      restUser.hireable ?? false,

    createdAt:
      restUser.created_at,
    updatedAt:
      restUser.updated_at,

    accountAgeDays,

    publicRepos:
      restUser.public_repos,
    publicGists:
      restUser.public_gists,

    followers:
      restUser.followers,
    following:
      restUser.following,

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


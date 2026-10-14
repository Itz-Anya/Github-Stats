import { cache } from "./cache.js";

export interface ContribDay {
  date: string;
  count: number;
  level: number;
}

export interface ContribData {
  login: string;
  from: string;
  to: string;
  total: number;
  restricted: number;
  days: ContribDay[];
}

export interface ContribSummary {
  total: number;
  activeDays: number;
  longest: number;
  current: number;
  bestDay: ContribDay | null;
}

const TOKEN = process.env.GITHUB_TOKEN ?? "";
const GQL = "https://api.github.com/graphql";

async function timedFetch(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

const ghHeaders = (): Record<string, string> => ({
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  "User-Agent": "github-stats-service/2.0",
});

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekday(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

function assignLevels(days: Array<{ date: string; count: number }>): ContribDay[] {
  const nz = days.map((d) => d.count).filter((c) => c > 0).sort((a, b) => a - b);
  const at = (p: number): number => nz[Math.min(nz.length - 1, Math.floor(p * (nz.length - 1)))] ?? 0;
  const t1 = at(0.25);
  const t2 = at(0.5);
  const t3 = at(0.75);
  return days.map((d) => ({
    ...d,
    level: d.count === 0 ? 0 : d.count <= t1 ? 1 : d.count <= t2 ? 2 : d.count <= t3 ? 3 : 4,
  }));
}

async function viaGraphQL(username: string, from: string, to: string): Promise<{ login: string; restricted: number; days: Array<{ date: string; count: number }> } | null> {
  if (!TOKEN) return null;
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){
    user(login:$login){ login contributionsCollection(from:$from,to:$to){ restrictedContributionsCount contributionCalendar{ weeks{ contributionDays{ date contributionCount } } } } }
  }`;
  let res: Response;
  try {
    res = await timedFetch(
      GQL,
      {
        method: "POST",
        headers: ghHeaders(),
        body: JSON.stringify({ query, variables: { login: username, from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` } }),
      },
      5000
    );
  } catch {
    return null;
  }
  if (res.status === 401) return null;
  if (res.status === 403 || res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: { user: null | { login: string; contributionsCollection: { restrictedContributionsCount: number; contributionCalendar: { weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number }> }> } } } };
    errors?: Array<{ type?: string }>;
  };
  if (json.errors?.some((e) => e.type === "NOT_FOUND")) throw new Error("USER_NOT_FOUND");
  const user = json.data?.user;
  if (!user) return null;

  const days = user.contributionsCollection.contributionCalendar.weeks.flatMap((w) =>
    w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
  );
  return { login: user.login, restricted: user.contributionsCollection.restrictedContributionsCount ?? 0, days };
}

async function viaHtml(username: string, from: string, to: string): Promise<{ login: string; restricted: number; days: Array<{ date: string; count: number }> }> {
  const res = await timedFetch(
    `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${from}&to=${to}`,
    { headers: { "User-Agent": "Mozilla/5.0 (compatible; github-stats-service/2.0)", Accept: "text/html" } },
    5000
  );
  if (res.status === 404) throw new Error("USER_NOT_FOUND");
  if (res.status === 429) throw new Error("RATE_LIMITED");
  if (!res.ok) throw new Error(`CONTRIB_HTML_${res.status}`);
  const html = await res.text();

  const tips = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const n = /(\d[\d,]*)\s+contribution/.exec(m[2]);
    tips.set(m[1], n ? parseInt(n[1].replace(/,/g, ""), 10) : 0);
  }

  const days: Array<{ date: string; count: number }> = [];
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const date = /data-date="(\d{4}-\d{2}-\d{2})"/.exec(tag)?.[1];
    if (!date) continue;
    const id = /\sid="([^"]+)"/.exec(tag)?.[1];
    const level = parseInt(/data-level="(\d)"/.exec(tag)?.[1] ?? "0", 10);
    const dataCount = /data-count="(\d+)"/.exec(tag)?.[1];
    const count = id && tips.has(id) ? (tips.get(id) as number) : dataCount ? parseInt(dataCount, 10) : level;
    days.push({ date, count });
  }
  if (days.length === 0) throw new Error("NO_CONTRIBUTION_DATA");
  return { login: username, restricted: 0, days };
}

type Calendar = { login: string; restricted: number; days: Array<{ date: string; count: number }> };

function firstSuccess<T>(tasks: Array<() => Promise<T>>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let failed = 0;
    const errors: unknown[] = [];
    tasks.forEach((t) => {
      t().then(resolve, (e: unknown) => {
        errors.push(e);
        failed += 1;
        if (failed === tasks.length) {
          const nf = errors.find((x) => x instanceof Error && x.message === "USER_NOT_FOUND");
          reject(nf ?? errors[0] ?? new Error("NO_CONTRIBUTION_DATA"));
        }
      });
    });
  });
}

async function restrictedInWindow(username: string, from: string, to: string): Promise<number> {
  if (!TOKEN) return 0;
  try {
    const res = await timedFetch(
      GQL,
      {
        method: "POST",
        headers: ghHeaders(),
        body: JSON.stringify({
          query: "query($l:String!,$f:DateTime!,$t:DateTime!){user(login:$l){contributionsCollection(from:$f,to:$t){restrictedContributionsCount}}}",
          variables: { l: username, f: `${from}T00:00:00Z`, t: `${to}T23:59:59Z` },
        }),
      },
      5000
    );
    if (!res.ok) return 0;
    const json = (await res.json()) as { data?: { user: null | { contributionsCollection: { restrictedContributionsCount: number } } } };
    return json.data?.user?.contributionsCollection.restrictedContributionsCount ?? 0;
  } catch {
    return 0;
  }
}

export async function fetchContributions(username: string, year?: number): Promise<ContribData> {
  const today = new Date().toISOString().slice(0, 10);
  let from: string;
  let to: string;
  if (year) {
    from = `${year}-01-01`;
    to = `${year}-12-31` > today ? today : `${year}-12-31`;
  } else {
    to = today;
    from = addDays(today, -364);
  }

  const cacheKey = `contrib:${username.toLowerCase()}:${from}:${to}`;
  const hit = cache.get<ContribData>(cacheKey);
  if (hit) return hit.data;

  const restrictedP = restrictedInWindow(username, from, to);
  const raw: Calendar = await firstSuccess<Calendar>([
    () => viaHtml(username, from, to),
    async () => {
      const g = await viaGraphQL(username, from, to);
      if (!g) throw new Error("GRAPHQL_UNAVAILABLE");
      return g;
    },
  ]);
  const restricted =
    raw.restricted ||
    (await Promise.race([restrictedP, new Promise<number>((r) => setTimeout(() => r(0), 1200))]));

  const inRange = raw.days
    .filter((d) => d.date >= from && d.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const days = assignLevels(inRange);
  const data: ContribData = { login: raw.login, from, to, total: days.reduce((s, d) => s + d.count, 0), restricted, days };
  cache.set(cacheKey, data, 1800);
  return data;
}

export function summarize(data: ContribData): ContribSummary {
  const { days } = data;
  let longest = 0;
  let run = 0;
  let best: ContribDay | null = null;
  let active = 0;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      active += 1;
      longest = Math.max(longest, run);
      if (!best || d.count > best.count) best = d;
    } else run = 0;
  }
  let current = 0;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  for (; i >= 0 && days[i].count > 0; i--) current += 1;
  return { total: data.total, activeDays: active, longest, current, bestDay: best };
}

export interface LifetimeQuick {
  totalCommits: number;
  privateContributions: number;
  approx: boolean;
}

interface YearCounts {
  commits: number;
  restricted: number;
}

async function searchCommitTotal(username: string): Promise<number> {
  try {
    const res = await timedFetch(
      `https://api.github.com/search/commits?q=${encodeURIComponent(`author:${username}`)}&per_page=1`,
      { headers: { ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), Accept: "application/vnd.github+json", "User-Agent": "github-stats-service/2.0" } },
      6000
    );
    if (!res.ok) return 0;
    return ((await res.json()) as { total_count?: number }).total_count ?? 0;
  } catch {
    return 0;
  }
}

async function accountCreatedYear(username: string): Promise<number> {
  const res = await timedFetch(
    GQL,
    { method: "POST", headers: ghHeaders(), body: JSON.stringify({ query: "query($l:String!){user(login:$l){createdAt}}", variables: { l: username } }) },
    5000
  );
  if (res.status === 403 || res.status === 429) throw new Error("RATE_LIMITED");
  const json = (await res.json()) as { data?: { user: null | { createdAt: string } }; errors?: Array<{ type?: string }> };
  if (json.errors?.some((e) => e.type === "NOT_FOUND")) throw new Error("USER_NOT_FOUND");
  const created = json.data?.user?.createdAt;
  if (!created) throw new Error("NO_CREATED_AT");
  return new Date(created).getUTCFullYear();
}

async function yearBatch(username: string, years: number[]): Promise<Map<number, YearCounts> | null> {
  const now = new Date();
  const fields = years
    .map((y) => {
      const to = y === now.getUTCFullYear() ? now.toISOString().slice(0, 19) + "Z" : `${y}-12-31T23:59:59Z`;
      return `y${y}: contributionsCollection(from:"${y}-01-01T00:00:00Z",to:"${to}"){ totalCommitContributions restrictedContributionsCount }`;
    })
    .join(" ");
  const body = JSON.stringify({ query: `query($l:String!){ user(login:$l){ ${fields} } }`, variables: { l: username } });

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await timedFetch(GQL, { method: "POST", headers: ghHeaders(), body }, 4000);
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: { user: null | Record<string, { totalCommitContributions: number; restrictedContributionsCount: number }> } };
      const user = json.data?.user;
      if (!user) continue;
      const out = new Map<number, YearCounts>();
      for (const y of years) {
        const r = user[`y${y}`];
        if (r) out.set(y, { commits: r.totalCommitContributions, restricted: r.restrictedContributionsCount });
      }
      return out;
    } catch {
    }
  }
  return null;
}

export async function fetchLifetimeQuick(username: string): Promise<LifetimeQuick> {
  const cacheKey = `lifetime-quick:${username.toLowerCase()}`;
  const hit = cache.get<LifetimeQuick>(cacheKey);
  if (hit) return hit.data;

  const searchP = searchCommitTotal(username);

  let commits = 0;
  let restricted = 0;
  let complete = false;

  if (TOKEN) {
    try {
      const startYear = await accountCreatedYear(username);
      const nowYear = new Date().getUTCFullYear();
      const years: number[] = [];
      for (let y = startYear; y <= nowYear; y++) years.push(y);

      const BATCH = 4;
      const batches: number[][] = [];
      for (let i = 0; i < years.length; i += BATCH) batches.push(years.slice(i, i + BATCH));

      const results = await Promise.all(batches.map((b) => yearBatch(username, b)));
      complete = results.every((r) => r !== null);
      for (const r of results) {
        if (!r) continue;
        for (const v of r.values()) {
          commits += v.commits;
          restricted += v.restricted;
        }
      }
    } catch (e) {
      if (e instanceof Error && (e.message === "USER_NOT_FOUND" || e.message === "RATE_LIMITED")) throw e;
    }
  }

  const search = await searchP;
  const totalCommits = Math.max(commits, search);
  const data: LifetimeQuick = { totalCommits, privateContributions: restricted, approx: !complete };
  cache.set(cacheKey, data, complete ? 1800 : 120);
  return data;
}

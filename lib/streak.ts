import { cache } from "./cache.js";
import { fetchContributions } from "./contrib.js";
import type { ContribDay } from "./contrib.js";

export interface StreakRun {
  length: number;
  start: string;
  end: string;
}

export interface StreakData {
  login: string;
  total: number;
  restricted: number;
  activeDays: number;
  windowDays: number;
  current: StreakRun;
  longest: StreakRun;
  week: ContribDay[];
  from: string;
  to: string;
}

const EMPTY: StreakRun = { length: 0, start: "", end: "" };

function findRuns(days: ContribDay[]): { current: StreakRun; longest: StreakRun } {
  let longest: StreakRun = EMPTY;
  let run: StreakRun = EMPTY;
  for (const d of days) {
    if (d.count > 0) {
      run = run.length === 0 ? { length: 1, start: d.date, end: d.date } : { length: run.length + 1, start: run.start, end: d.date };
      if (run.length > longest.length) longest = run;
    } else {
      run = EMPTY;
    }
  }
  let current = EMPTY;
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i -= 1;
  if (i >= 0 && days[i].count > 0) {
    let n = 0;
    const end = days[i].date;
    for (; i >= 0 && days[i].count > 0; i--) n += 1;
    current = { length: n, start: days[i + 1].date, end };
  }
  return { current, longest };
}

export async function fetchStreak(username: string): Promise<StreakData> {
  const key = `streak:${username.toLowerCase()}`;
  const hit = cache.get<StreakData>(key);
  if (hit) return hit.data;

  const base = await fetchContributions(username);
  let days = base.days;
  let { current, longest } = findRuns(days);

  let reachesStart = current.length > 0 && current.start === days[0]?.date;
  let year = Number(base.from.slice(0, 4));
  for (let step = 0; step < 4 && reachesStart; step++) {
    let older: ContribDay[] = [];
    try {
      const prev = await fetchContributions(username, year);
      older = prev.days.filter((d) => d.date < days[0].date);
    } catch {
      break;
    }
    if (older.length === 0) break;
    days = [...older, ...days];
    const runs = findRuns(days);
    current = runs.current;
    if (runs.longest.length > longest.length) longest = runs.longest;
    reachesStart = current.length > 0 && current.start === days[0].date;
    year -= 1;
  }

  const win = base.days;
  const data: StreakData = {
    login: base.login,
    total: base.total,
    restricted: base.restricted,
    activeDays: win.filter((d) => d.count > 0).length,
    windowDays: win.length,
    current,
    longest,
    week: win.slice(-7),
    from: base.from,
    to: base.to,
  };
  cache.set(key, data, 1800);
  return data;
}

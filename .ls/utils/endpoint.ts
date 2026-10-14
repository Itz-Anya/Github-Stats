import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getTheme, THEME_NAMES } from "../themes/index.js";
import type { Theme } from "../themes/index.js";
import { renderProfileError } from "./profileCard.js";
import { sanitizeUsername, sanitizeTheme, clamp } from "./sanitize.js";

export interface EndpointCtx {
  theme: Theme;
  br: number;
  username: string;
  q: (key: string) => string;
  fail: (message: string) => void;
  handleError: (err: unknown) => void;
}

export function beginCard(req: VercelRequest, res: VercelResponse): EndpointCtx | null {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).end();
    return null;
  }
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return null;
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const q = (key: string): string => {
    const v = req.query[key];
    return typeof v === "string" ? v : "";
  };

  const sanitized = sanitizeTheme(q("theme") || "dark");
  const themeName = sanitized === "random" || THEME_NAMES.includes(sanitized) ? sanitized : "dark";

  if (themeName === "random") {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.setHeader("CDN-Cache-Control", "no-store");
    res.setHeader("Vercel-CDN-Cache-Control", "no-store");
  } else {
    res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400");
  }

  const brRaw = q("border_radius");
  const brOverride = brRaw !== "" ? clamp(parseInt(brRaw, 10) || 10, 0, 28) : undefined;
  const theme = getTheme(themeName, brOverride);
  const br = theme.borderRadius;

  const fail = (message: string): void => {
    res.status(200).send(renderProfileError(message, theme, br));
  };

  const raw = q("username");
  if (!raw.trim()) {
    fail("Missing required parameter: ?username=<github_username>");
    return null;
  }
  let username: string;
  try {
    username = sanitizeUsername(raw);
  } catch {
    fail("Invalid GitHub username format.");
    return null;
  }

  const handleError = (err: unknown): void => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "USER_NOT_FOUND") {
      fail(`GitHub user "${username}" not found.`);
    } else if (msg === "RATE_LIMITED") {
      res.setHeader("Cache-Control", "no-store");
      fail("GitHub API rate limit reached. Set GITHUB_TOKEN env var.");
    } else {
      console.error("[github-card] error:", msg);
      res.setHeader("Cache-Control", "no-store");
      fail("Unexpected error fetching GitHub data. Try again shortly.");
    }
  };

  return { theme, br, username, q, fail, handleError };
}

export function deadline<T>(p: Promise<T>, ms: number, onTimeout: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        resolve(onTimeout());
      } catch (e) {
        reject(e);
      }
    }, ms);
    p.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e: unknown) => { clearTimeout(timer); reject(e); }
    );
  });
}

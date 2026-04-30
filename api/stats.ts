import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchGitHubUser } from "../lib/github.js";
import { getTheme, THEME_NAMES } from "../themes/index.js";
import { renderStatsCard, renderErrorCard } from "../utils/svgBuilder.js";
import { sanitizeUsername, sanitizeTheme, parseHideList, clamp } from "../utils/sanitize.js";
import { rateLimiter } from "../lib/rateLimit.js";

function getClientIP(req: VercelRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  // Cache 30min, stale-while-revalidate 24h (important for GitHub README caching)
  res.setHeader("Cache-Control", "public, max-age=1800, s-maxage=1800, stale-while-revalidate=86400");
  // Disable X-Content-Type-Options sniffing so GitHub renders the SVG
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Theme + border radius (resolve early so error cards use correct theme)
  const themeRaw = typeof req.query["theme"] === "string" ? req.query["theme"] : "dark";
  const themeName = THEME_NAMES.includes(sanitizeTheme(themeRaw))
    ? sanitizeTheme(themeRaw)
    : "dark";

  const brRaw = req.query["border_radius"];
  const brOverride =
    typeof brRaw === "string" && brRaw !== ""
      ? clamp(parseInt(brRaw, 10) || 10, 0, 28)
      : undefined;

  const theme = getTheme(themeName, brOverride);
  const br = theme.borderRadius;

  function sendError(msg: string): void {
    res.status(200).send(renderErrorCard(msg, theme, br));
  }

  // Rate limit
  const ip = getClientIP(req);
  if (!rateLimiter.isAllowed(ip)) {
    sendError("Rate limit exceeded — please wait a minute and try again.");
    return;
  }

  // Validate username
  const rawUsername = req.query["username"];
  if (!rawUsername || typeof rawUsername !== "string" || rawUsername.trim() === "") {
    sendError("Missing required parameter: ?username=<github_username>");
    return;
  }

  let username: string;
  try {
    username = sanitizeUsername(rawUsername);
  } catch {
    sendError("Invalid GitHub username format (only a-z, 0-9, and hyphens allowed).");
    return;
  }

  // Options
  const hideRaw = typeof req.query["hide"] === "string" ? req.query["hide"] : "";
  const hideStats = parseHideList(hideRaw);

  const showIconsRaw = req.query["show_icons"];
  const showIcons = showIconsRaw !== "false" && showIconsRaw !== "0";

  const compactRaw = req.query["compact"];
  const compact = compactRaw === "true" || compactRaw === "1";

  const hideAvatarRingRaw = req.query["hide_avatar_ring"];
  const hideAvatarRing = hideAvatarRingRaw === "true" || hideAvatarRingRaw === "1";

  const hideStreakEmojiRaw = req.query["hide_streak_emoji"];
  const hideStreakEmoji = hideStreakEmojiRaw === "true" || hideStreakEmojiRaw === "1";

  const hideStatChartsRaw = req.query["hide_stat_charts"];
  const hideStatCharts = hideStatChartsRaw === "true" || hideStatChartsRaw === "1";

  const sectionSpacingRaw = req.query["section_spacing"];
  const sectionSpacing = typeof sectionSpacingRaw === "string" && sectionSpacingRaw !== ""
    ? clamp(parseInt(sectionSpacingRaw, 10) || 0, 0, 40)
    : 0;

  // Fetch
  try {
    const user = await fetchGitHubUser(username);

    const svg = renderStatsCard(user, {
      theme,
      hideStats,
      showIcons,
      compact,
      borderRadius: br,
      hideAvatarRing,
      hideStreakEmoji,
      hideStatCharts,
      sectionSpacing,
    });

    res.status(200).send(svg);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);

    if (msg === "USER_NOT_FOUND") {
      sendError(`GitHub user "${username}" not found.`);
    } else if (msg === "RATE_LIMITED") {
      res.setHeader("Cache-Control", "no-store");
      sendError("GitHub API rate limit reached. Set GITHUB_TOKEN env var to increase limits.");
    } else if (msg === "INVALID_USERNAME") {
      sendError("Invalid GitHub username.");
    } else {
      console.error("[github-stats] error:", msg);
      sendError("Unexpected error fetching GitHub data. Please try again shortly.");
    }
  }
}

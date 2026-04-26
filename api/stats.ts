import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchGitHubUser } from "../lib/github.js";
import { getTheme, THEME_NAMES } from "../themes/index.js";
import { renderStatsCard, renderErrorCard } from "../utils/svgBuilder.js";
import { sanitizeUsername, sanitizeTheme, parseHideList, clamp } from "../utils/sanitize.js";
import { rateLimiter } from "../lib/rateLimit.js";

function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow GET
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  // Set SVG content type early
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=86400");

  const ip = getClientIP(req);
  const themeParam = sanitizeTheme(
    typeof req.query["theme"] === "string" ? req.query["theme"] : "dark"
  );
  const validTheme = THEME_NAMES.includes(themeParam) ? themeParam : "dark";

  const borderRadiusParam = req.query["border_radius"];
  const borderRadiusOverride =
    typeof borderRadiusParam === "string"
      ? clamp(parseInt(borderRadiusParam, 10) || 10, 0, 24)
      : undefined;

  const theme = getTheme(validTheme, borderRadiusOverride);
  const borderRadius = theme.borderRadius;

  function sendError(message: string, status = 200): void {
    res.status(status).send(renderErrorCard(message, theme, borderRadius));
  }

  // Rate limiting
  if (!rateLimiter.isAllowed(ip)) {
    sendError("Rate limit exceeded. Please try again in a minute.");
    return;
  }

  // Validate username
  const rawUsername = req.query["username"];
  if (!rawUsername || typeof rawUsername !== "string") {
    sendError("Missing required query param: ?username=<github_username>");
    return;
  }

  let username: string;
  try {
    username = sanitizeUsername(rawUsername);
  } catch {
    sendError("Invalid GitHub username format.");
    return;
  }

  // Parse options
  const hideRaw = typeof req.query["hide"] === "string" ? req.query["hide"] : "";
  const hideStats = parseHideList(hideRaw);

  const showIconsRaw = req.query["show_icons"];
  const showIcons = showIconsRaw !== "false"; // default true

  const compactRaw = req.query["compact"];
  const compact = compactRaw === "true" || compactRaw === "1";

  const hasToken = Boolean(process.env.GITHUB_TOKEN);

  // Fetch data
  try {
    const user = await fetchGitHubUser(username);

    const svg = renderStatsCard(user, {
      theme,
      hideStats,
      showIcons,
      compact,
      borderRadius,
      hasToken,
    });

    res.status(200).send(svg);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message === "USER_NOT_FOUND") {
      sendError(`GitHub user "${username}" not found.`);
    } else if (message === "RATE_LIMITED") {
      res.setHeader("Cache-Control", "no-store");
      sendError("GitHub API rate limit reached. Add GITHUB_TOKEN to increase limits.");
    } else if (message === "INVALID_USERNAME") {
      sendError("Invalid GitHub username.");
    } else {
      console.error("[github-stats] Unexpected error:", message);
      sendError("Unexpected error fetching GitHub data. Please try again.");
    }
  }
}

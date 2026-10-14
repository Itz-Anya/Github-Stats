import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchStreak } from "../lib/streak.js";
import { renderStreakCard } from "../utils/streakCard.js";
import { beginCard, deadline } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  try {
    const data = await deadline(fetchStreak(ctx.username), 12000, () => {
      throw new Error("TIMEOUT");
    });
    res.status(200).send(
      renderStreakCard(data, ctx.theme, ctx.br, {
        hideTitle: ctx.q("hide_title") === "true",
        includePrivate: ctx.q("include_private") !== "false",
        animate: ctx.q("animate") !== "false",
      })
    );
  } catch (err) {
    ctx.handleError(err);
  }
}

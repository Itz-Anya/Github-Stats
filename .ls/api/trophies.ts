import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchTrophyData } from "../lib/trophies.js";
import { renderTrophyCard } from "../utils/trophyCard.js";
import { beginCard, deadline } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  const cols = parseInt(ctx.q("columns"), 10);
  try {
    const data = await deadline(fetchTrophyData(ctx.username, ctx.q("include_private") !== "false"), 10000, () => {
      throw new Error("TIMEOUT");
    });
    res.status(200).send(
      renderTrophyCard(data, ctx.theme, ctx.br, {
        hideTitle: ctx.q("hide_title") === "true",
        columns: Number.isFinite(cols) ? cols : 4,
        animate: ctx.q("animate") !== "false",
      })
    );
  } catch (err) {
    ctx.handleError(err);
  }
}

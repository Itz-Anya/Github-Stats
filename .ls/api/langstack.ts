import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchLangStack } from "../lib/langstack.js";
import { buildLangRows, renderLangCard } from "../utils/langCard.js";
import { fetchTechLogos } from "../utils/techLogos.js";
import { parseHideList, clamp } from "../utils/sanitize.js";
import { beginCard } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  const limit = clamp(parseInt(ctx.q("limit"), 10) || 10, 3, 15);
  const hide = parseHideList(ctx.q("hide"));

  try {
    const data = await fetchLangStack(ctx.username, ctx.q("include_forks") === "true");
    const rows = buildLangRows(data, hide, limit);
    const logos = await fetchTechLogos(rows.flatMap((r) => (r.item ? [r.item] : [])));
    res.status(200).send(
      renderLangCard(data, rows, ctx.theme, ctx.br, logos, {
        limit,
        hideTitle: ctx.q("hide_title") === "true",
        animate: ctx.q("animate") !== "false",
      })
    );
  } catch (err) {
    ctx.handleError(err);
  }
}

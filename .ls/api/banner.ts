import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchBanner } from "../lib/banner.js";
import { renderBanner } from "../utils/bannerCard.js";
import { fetchTechLogos } from "../utils/techLogos.js";
import { beginCard, deadline } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  try {
    const data = await deadline(fetchBanner(ctx.username), 10000, () => {
      throw new Error("TIMEOUT");
    });
    const logos = await deadline(
      fetchTechLogos(data.langs.map((l) => ({ key: l.name, name: l.name, kind: "language" as const, repos: 0 }))),
      3500,
      () => ({})
    );
    res.status(200).send(
      renderBanner(data, ctx.theme, ctx.br, logos, {
        animate: ctx.q("animate") !== "false",
        hideStats: ctx.q("hide_stats") === "true",
      })
    );
  } catch (err) {
    ctx.handleError(err);
  }
}

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchPinned } from "../lib/pinned.js";
import { renderPinnedCard } from "../utils/pinnedCard.js";
import { fetchTechLogos } from "../utils/techLogos.js";
import { beginCard } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  try {
    const data = await fetchPinned(ctx.username);
    const langs = [...new Set(data.items.flatMap((i) => (i.language ? [i.language] : [])))];
    const logos = await fetchTechLogos(langs.map((l) => ({ key: l, name: l, kind: "language" as const, repos: 0 })));
    res.status(200).send(renderPinnedCard(data, ctx.theme, ctx.br, logos, { hideTitle: ctx.q("hide_title") === "true", animate: ctx.q("animate") !== "false" }));
  } catch (err) {
    ctx.handleError(err);
  }
}

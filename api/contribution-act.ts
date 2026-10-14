import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchContributions, fetchLifetimeQuick } from "../lib/contrib.js";
import type { LifetimeQuick } from "../lib/contrib.js";
import { renderContribCard } from "../utils/contribCard.js";
import { beginCard, deadline } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  const yearRaw = parseInt(ctx.q("year"), 10);
  const thisYear = new Date().getUTCFullYear();
  const year = yearRaw >= 2008 && yearRaw <= thisYear ? yearRaw : undefined;

  try {
    const calendarP = deadline(fetchContributions(ctx.username, year), 9000, () => {
      throw new Error("TIMEOUT");
    });

    const lifetimeP = deadline<LifetimeQuick | null>(
      fetchLifetimeQuick(ctx.username).catch((e: unknown) => {
        if (e instanceof Error && e.message === "USER_NOT_FOUND") throw e;
        return null;
      }),
      5000,
      () => null
    );

    const data = await calendarP;
    const lifetime = await deadline<LifetimeQuick | null>(lifetimeP, 1500, () => null);

    res.status(200).send(
      renderContribCard(data, lifetime, ctx.theme, ctx.br, {
        hideTitle: ctx.q("hide_title") === "true",
        year,
        includePrivate: ctx.q("include_private") !== "false",
        animate: ctx.q("animate") !== "false",
      })
    );
  } catch (err) {
    ctx.handleError(err);
  }
}

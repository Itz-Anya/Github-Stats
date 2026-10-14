import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchProfile } from "../lib/profile.js";
import { renderProfileCard } from "../utils/profileCard.js";
import { fetchTechLogos } from "../utils/techLogos.js";
import { beginCard } from "../utils/endpoint.js";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const ctx = beginCard(req, res);
  if (!ctx) return;

  try {
    const profile = await fetchProfile(ctx.username);
    const logos = await fetchTechLogos(profile.tech);
    res.status(200).send(renderProfileCard(profile, ctx.theme, ctx.br, logos, { animate: ctx.q("animate") !== "false" }));
  } catch (err) {
    ctx.handleError(err);
  }
}

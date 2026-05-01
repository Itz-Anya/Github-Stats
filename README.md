
<div align="center">

<img src="https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=sakura" width="100%" alt="Itz-Anya GitHub Stats — Sakura" />

<br/>

# GitHub Stats Card Generator

**Beautiful, highly customizable GitHub stats SVG cards — deploy on Vercel in one click.**

<br/>

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Itz-Anya/Github-Stats)
&nbsp;&nbsp;
[![GitHub Stars](https://img.shields.io/github/stars/Itz-Anya/Github-Stats?style=flat-square&color=e91e8c&labelColor=fce4ec)](https://github.com/Itz-Anya/Github-Stats/stargazers)
&nbsp;&nbsp;
[![License: MIT](https://img.shields.io/badge/License-MIT-ff69b4.svg?style=flat-square)](LICENSE)
&nbsp;&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

## ✨ What Is This?

GitHub Stats is an open-source **SVG card API** you can embed anywhere — GitHub READMEs, personal sites, portfolios, and more. It fetches live data from the GitHub API, renders it into a beautiful card, and returns a pure SVG you can drop into any Markdown image tag.

No build step. No JavaScript required. Just one URL.

---

## 🚀 Quick Start

### Option A — Use the visual generator (easiest)

Open **[anya-github-stats.vercel.app](https://anya-github-stats.vercel.app)**, type your username, pick a theme, and copy the generated Markdown snippet straight into your README.

### Option B — Embed directly

```markdown
![GitHub Stats](https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya)
```

Replace `Itz-Anya` with your GitHub username. Done! ✅

### Pick a theme

```markdown
![GitHub Stats](https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=tokyonight)
```

### Deploy your own instance

```bash
git clone https://github.com/Itz-Anya/Github-Stats.git
cd Github-Stats
npm install
echo "GITHUB_TOKEN=ghp_yourtoken" > .env
npx vercel --prod
```

Or just click **Deploy on Vercel** above ☝️ — your own generator + API will be live in under a minute.

---

## 🎨 Themes

**65+ themes across 12 categories.** Pass any theme name as `&theme=<name>`.

> 🌐 **Want to browse & preview all themes visually?**
> Open the card generator → **[anya-github-stats.vercel.app](https://anya-github-stats.vercel.app)** — pick your theme, tweak settings, and copy the ready-made Markdown in one click.

| Category | Themes |
|----------|--------|
| 🌑 **Dark Dev** | `dark` · `github_dark` · `tokyonight` · `dracula` · `nord` · `solarized` · `monokai` |
| 🌌 **Futuristic** | `cyberpunk` · `midnight` · `ocean_dark` · `neon_dreams` · `galaxy` · `aurora` · `starlight` |
| ☀️ **Light** | `light` · `github_light` |
| 🌸 **Pastel** | `sakura` · `rose_gold` · `lavender` · `cotton_candy` · `mint_fresh` · `peach_blossom` · `bubblegum` · `sunshine` · `ocean_breeze` · `cherry_blossom` · `pastel_rainbow` |
| ⚡ **Neon** | `neon_green` · `neon_pink` · `neon_orange` · `neon_blue` · `neon_purple` · `neon_red` |
| 🖤 **Ultra Dark** | `obsidian` · `black_ice` · `pitch_dark` |
| 💎 **Beautiful** | `emerald` · `sapphire` · `ruby` · `amber_glow` · `velvet` · `golden_hour` |
| ☀️ **Bright** | `vivid_day` · `solar_flare` · `electric` · `lime_burst` |
| ✏️ **Simple** | `minimal_white` · `minimal_dark` · `paper` · `ink` · `mono_slate` |
| 📺 **Retro** | `retro_terminal` · `amber_crt` · `vaporwave` · `outrun` |
| 🌿 **Nature** | `forest` · `desert` · `arctic` · `deep_sea` · `sunset` |
| 🎨 **Colorful** | `rainbow_dark` · `pastel_rainbow` · `tropical` · `cosmic` |

---

## 🔧 API Reference

**Endpoint:** `GET /api/stats`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `username` | `string` | *(required)* | GitHub username |
| `theme` | `string` | `dark` | Card theme key |
| `show_icons` | `bool` | `true` | Show GitHub Octicon icons |
| `compact` | `bool` | `false` | Condensed card layout |
| `border_radius` | `number` | `10` | Corner radius 0–28 px |
| `hide` | `string` | — | Comma-separated stats/sections to hide |
| `hide_avatar_ring` | `bool` | `false` | Remove animated ring around avatar |
| `hide_streak_emoji` | `bool` | `false` | Remove 🔥 emoji from streak |
| `hide_stat_charts` | `bool` | `false` | Remove sparkline charts |
| `section_spacing` | `number` | `0` | Extra padding between sections (0–40 px) |

### Hideable Stats

`repos` · `stars` · `forks` · `commits` · `prs` · `issues` · `reviews` · `followers` · `following` · `gists` · `watchers`

### Hideable Sections

`stats` · `languages` · `streakinfo` · `pinned`

### Example URLs

```
# Compact dark card, no icons
https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=dark&show_icons=false&compact=true

# Sakura, hide repos & gists
https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=sakura&hide=repos,gists

# Neon blue, no avatar ring, max radius
https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=neon_blue&hide_avatar_ring=true&border_radius=28

# Cyberpunk, hide languages section
https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=cyberpunk&hide=languages

# Vaporwave, extra section spacing
https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=vaporwave&section_spacing=20
```

---

## 🌐 Card Generator — Try It Live

<div align="center">

### 👉 **[anya-github-stats.vercel.app](https://anya-github-stats.vercel.app)**

*Enter your username → pick a theme → copy your Markdown. No coding needed.*

</div>

The generator is hosted at the **root URL** of every deployment. Just open it in your browser:

```
https://anya-github-stats.vercel.app
```

What you can do there:

- **Live preview** — card updates in real time as you change any setting
- **Theme browser** — all 65+ themes with color swatches, search, and category tabs
- **Toggle controls** — icons, avatar ring, streak emoji, stat charts, entire sections
- **Sliders** — border radius (0–28 px) and section spacing (0–40 px)
- **Hide individual stats** — repos, stars, forks, commits, PRs, and more
- **One-click copy** — Direct URL · Markdown · HTML — ready to paste into your README

> If you deploy your own instance, your generator lives at your own Vercel URL, e.g. `https://your-project.vercel.app`

---

## 🏗️ Project Structure

```
Github-Stats/
├── api/
│   └── stats.ts          # Vercel serverless handler — routing & validation
├── lib/
│   ├── github.ts         # GitHub REST + GraphQL fetching, base64 avatar
│   ├── cache.ts          # In-memory LRU cache (30-min TTL)
│   └── rateLimit.ts      # Per-IP sliding-window rate limiter
├── themes/
│   └── index.ts          # 65+ theme definitions + getTheme() helper
├── utils/
│   ├── svgBuilder.ts     # Full SVG renderer (stats, langs, streaks, pinned)
│   └── sanitize.ts       # Input sanitization & username validation
├── public/
│   ├── index.html        # Visual generator UI (React-in-browser)
│   └── s.png             # Logo / favicon
├── vercel.json           # Vercel routing config
└── package.json
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | **Recommended** | Personal access token with `read:user` and `repo` scopes. Without it: ~60 req/hr. With it: 5,000 req/hr. |

Set in Vercel dashboard → **Project → Settings → Environment Variables**.

> **How to create a token:** GitHub → Settings → Developer Settings → Personal access tokens → Fine-grained tokens → New token. Enable **Read-only** access for *Public Repositories* and *User*.

---

## 🛠️ Local Development

```bash
npm install -g vercel
git clone https://github.com/Itz-Anya/Github-Stats.git
cd Github-Stats
npm install
echo "GITHUB_TOKEN=ghp_yourtoken" > .env
npx vercel dev       # http://localhost:3000
npm run typecheck
```

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ / Vercel Serverless |
| Language | TypeScript 5.3 |
| Hosting | Vercel (Edge CDN) |
| Data | GitHub REST API v3 + GraphQL API v4 |
| Frontend | React (CDN) + Tailwind CSS (CDN) |
| Fonts | Fraunces · JetBrains Mono · Outfit |
| Icons | Boxicons · GitHub Octicons (inline SVG) |

---

## 🔒 Rate Limiting & Caching

| Layer | Details |
|-------|---------|
| Per-IP rate limit | Sliding-window limiter |
| HTTP cache | `max-age=1800, s-maxage=1800, stale-while-revalidate=86400` |
| GitHub API quota | 60 req/hr without token · 5,000 req/hr with `GITHUB_TOKEN` |

---

## 🤝 Contributing

Pull requests are welcome!

### Adding a theme

1. Add your theme object to `themes/index.ts` following the `Theme` interface.
2. Add the key to the appropriate category in the `THEMES` constant in `public/index.html`.
3. Test locally: `npx vercel dev`
4. Open a PR with a screenshot of the rendered card.

**Naming convention:** `lowercase_with_underscores`

---

## 📄 License

MIT © Anya & Murali

---

## 🙏 Credits

- **Created by [Anya](https://github.com/itz-Anya) & Murali** — design, engineering, theme curation
- **[Vercel](https://vercel.com/)** — serverless hosting
- **[GitHub REST API](https://docs.github.com/en/rest)** + **[GraphQL API](https://docs.github.com/en/graphql)** — data source
- **[Boxicons](https://boxicons.com/)** — UI icons
- **[Google Fonts](https://fonts.google.com/)** — Fraunces, JetBrains Mono, Outfit
- **[Tailwind CSS](https://tailwindcss.com/)** — UI styling
- Inspired by [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats)

---

<div align="center">

Made with 🌸 by **[Anya](https://github.com/itz-Anya) & Murali**

*If this helped you, please ⭐ the repo!*

[![Star on GitHub](https://img.shields.io/github/stars/Itz-Anya/Github-Stats?style=social)](https://github.com/Itz-Anya/Github-Stats/stargazers)

</div>

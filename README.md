
<div align="center">

<img src="public/s.png" alt="GitHub Stats Logo" width="80" />

# GitHub Stats Card Generator

**Beautiful, highly customizable GitHub stats SVG cards — deployable on Vercel in one click.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/Github-Stats)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

<br/>

![Stats Card Preview](public/s.png)

</div>

---

## ✨ Features

- **65+ beautiful themes** — dark dev, neon glow, pastel, retro, nature, minimal, and more
- **Live SVG generation** — embed directly in your GitHub README, no screenshot needed
- **Zero runtime dependencies** — pure TypeScript on Vercel serverless functions
- **Rich stats** — commits, PRs, code reviews, stars, streaks, top languages, pinned repos, and more
- **Fully customizable** — hide sections, toggle icons, adjust border radius, compact mode
- **Avatar embedding** — base64-encoded avatar rendered inside the SVG
- **Rate limiting & caching** — protected API with 30-minute cache headers
- **Visual generator** — no URL editing needed; use the web UI at your deployed URL

---

## 🚀 Quick Start

### 1. Embed in your README

```markdown
![GitHub Stats](https://anya-github-stats.vercel.app/api/stats?username=YOUR_USERNAME)
```

Replace `YOUR_USERNAME` with your GitHub handle. Done!

### 2. Deploy your own instance

```bash
git clone https://github.com/yourusername/Github-Stats.git
cd Github-Stats
npm install

# Optional: set your GitHub token to raise API limits
echo "GITHUB_TOKEN=ghp_yourtoken" > .env

npx vercel --prod
```

---

## 🔧 API Reference

**Endpoint:** `GET /api/stats`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | `string` | *(required)* | GitHub username |
| `theme` | `string` | `dark` | Card theme (see Themes below) |
| `show_icons` | `bool` | `true` | Show GitHub Octicon icons |
| `compact` | `bool` | `false` | Condensed card layout |
| `border_radius` | `number` | `10` | Border radius 0–28px |
| `hide` | `string` | — | Comma-separated stats/sections to hide |
| `hide_avatar_ring` | `bool` | `false` | Remove animated ring around avatar |
| `hide_streak_emoji` | `bool` | `false` | Remove 🔥 emoji from streak |
| `hide_stat_charts` | `bool` | `false` | Remove sparkline charts |
| `section_spacing` | `number` | `0` | Extra padding between sections (0–40px) |

### Hide options

**Stats:** `repos`, `stars`, `forks`, `commits`, `prs`, `issues`, `reviews`, `followers`, `following`, `gists`, `watchers`

**Sections:** `stats`, `languages`, `streakinfo`, `pinned`

### Example URLs

```
# Minimal dark card, no icons
/api/stats?username=torvalds&theme=dark&show_icons=false

# Pastel sakura card, compact mode
/api/stats?username=gvanrossum&theme=sakura&compact=true

# Neon blue, hide repos and gists
/api/stats?username=yyx990803&theme=neon_blue&hide=repos,gists

# Cyberpunk, no avatar ring, max rounded corners
/api/stats?username=sindresorhus&theme=cyberpunk&hide_avatar_ring=true&border_radius=28
```

---

## 🎨 Themes

65+ themes organized into 12 categories. Pass the key as `?theme=key`.

### 🌑 Dark Dev
`dark` · `github_dark` · `tokyonight` · `dracula` · `nord` · `solarized` · `monokai`

### 🌌 Futuristic
`cyberpunk` · `midnight` · `ocean_dark` · `neon_dreams` · `galaxy` · `aurora` · `starlight`

### ☀️ Light
`light` · `github_light`

### 🌸 Pastel
`sakura` · `rose_gold` · `lavender` · `cotton_candy` · `mint_fresh` · `peach_blossom` · `bubblegum` · `sunshine` · `ocean_breeze` · `cherry_blossom` · `pastel_rainbow`

### ⚡ Neon
`neon_green` · `neon_pink` · `neon_orange` · `neon_blue` · `neon_purple` · `neon_red`

### 🖤 Ultra Dark
`obsidian` · `black_ice` · `pitch_dark`

### 💎 Beautiful
`emerald` · `sapphire` · `ruby` · `amber_glow` · `velvet` · `golden_hour`

### ☀️ Bright
`vivid_day` · `solar_flare` · `electric` · `lime_burst`

### ✏️ Simple
`minimal_white` · `minimal_dark` · `paper` · `ink` · `mono_slate`

### 📺 Retro
`retro_terminal` · `amber_crt` · `vaporwave` · `outrun`

### 🌿 Nature
`forest` · `desert` · `arctic` · `deep_sea` · `sunset`

### 🎨 Colorful
`rainbow_dark` · `tropical` · `cosmic`

---

## 🌐 Web UI Generator

The root URL of every deployment hosts a visual card builder:

- **Live preview** — card updates in real time as you change settings
- **Theme browser** — all 65+ themes in category tabs with one-click selection
- **Toggle controls** — icons, avatar ring, streak emoji, charts, sections
- **Sliders** — border radius and section spacing
- **One-click copy** — markdown snippet ready for your README

---

## 🏗️ Project Structure

```
Github-Stats/
├── api/
│   └── stats.ts          # Vercel serverless handler — routing, validation
├── lib/
│   ├── github.ts         # GitHub REST + GraphQL fetching, base64 avatar
│   ├── cache.ts          # In-memory LRU cache (30-min TTL)
│   └── rateLimit.ts      # Per-IP sliding-window rate limiter
├── themes/
│   └── index.ts          # 65+ theme definitions + getTheme() helper
├── utils/
│   ├── svgBuilder.ts     # Full SVG renderer (stats, langs, streaks, pinned)
│   └── sanitize.ts       # Input sanitization, username validation
├── public/
│   ├── index.html        # React-in-browser visual generator UI
│   └── s.png             # Logo / favicon
├── vercel.json           # Vercel routing config
└── package.json
```

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | Recommended | Personal access token with `read:user` + `repo` scopes. Without it: ~60 req/hr. With it: 5,000 req/hr. |

Set in Vercel dashboard → **Project → Settings → Environment Variables**.

---

## 🛠️ Local Development

```bash
# Requires Node.js ≥ 18 and Vercel CLI
npm install
npx vercel dev        # runs at http://localhost:3000

# Type checking
npm run typecheck
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ / Vercel serverless |
| Language | TypeScript 5.3 |
| Hosting | Vercel |
| Data | GitHub REST API v3 + GraphQL API v4 |
| Frontend | React (CDN) + Tailwind CSS (CDN) |
| Fonts | Fraunces · JetBrains Mono · Outfit |
| Icons | Boxicons · GitHub Octicons (inline SVG) |

---

## 🔒 Rate Limiting & Caching

- **Per-IP rate limiter** — sliding window, protects against abuse
- **HTTP caching** — `max-age=1800, s-maxage=1800, stale-while-revalidate=86400` (30 min CDN cache)
- **GitHub API** — use `GITHUB_TOKEN` to avoid the 60 req/hr unauthenticated limit

---

## 🤝 Contributing

Pull requests welcome! To add a theme:

1. Add your theme object to `themes/index.ts` following the `Theme` interface
2. Add the key to the appropriate group in the `THEMES` constant in `public/index.html`
3. Test locally: `npx vercel dev`

Theme naming convention: `lowercase_with_underscores`

---

## 📄 License

MIT © Anya & Murali

---

## 🙏 Credits

- **Created by Anya & Murali** — design, engineering, and theme curation
- **[Vercel](https://vercel.com/)** — serverless hosting
- **[GitHub REST API](https://docs.github.com/en/rest)** + **[GraphQL API](https://docs.github.com/en/graphql)** — data source
- **[Boxicons](https://boxicons.com/)** — UI icons
- **[Google Fonts](https://fonts.google.com/)** — Fraunces, JetBrains Mono, Outfit
- **[Tailwind CSS](https://tailwindcss.com/)** — generator UI styling
- Inspired by [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats)

---

<div align="center">

Made with 🌸 by **Anya & Murali**

*If this helped you, please ⭐ the repo!*

</div>

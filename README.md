
<div align="center">


# GitHub Stats Card Generator

<img src="https://anya-github-stats.vercel.app/api/stats?username=Itz-Anya&theme=sakura" width="100%" alt="Itz-Anya GitHub Stats — Sakura" />


**Beautiful, highly customizable GitHub stats SVG cards — deploy on Vercel in one click.**

<br/>

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Itz-Anya/Github-Stats)
&nbsp;&nbsp;


</div>

---

## ✨ What Is This?

GitHub Stats is an open-source **SVG card API** you can embed anywhere — GitHub READMEs, personal sites, portfolios, and more. It fetches live data from the GitHub API, renders it into a beautiful card, and returns a pure SVG you can drop into any Markdown image tag.

No build step. No JavaScript required. Just one URL.

---

## 🚀 Quick Start

### Option A — Use the visual generator (easiest)

Open **[Website](https://anya-github-stats.vercel.app)**, type your username, pick a theme, and copy the generated Markdown snippet straight into your README.

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

### 👉 **[GitHub Stats Gen](https://anya-github-stats.vercel.app)**

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



## 👩‍💻 Creators

<table width="100%">
    <tr>
      <td align="center" width="50%">
        <img src="https://random-images-anya.vercel.app/anya" width="260"><br><br>
        <b>𝜜ɴყꫝㅤ𓆩💗𓆪</b><br><br>
        <a href="https://github.com/itz-Anya">
          <img src="https://img.shields.io/badge/GitHub-Anya-black?style=for-the-badge&logo=github">
        </a>
      </td>
      <td align="center" width="50%">
        <img src="https://itz-murali-images.vercel.app/api" width="260"><br><br>
        <b>𝐌 𝐔 𝐑 𝚨 𝐋 𝐈 𓂃ִֶָ⋆.˚</b><br><br>
        <a href="https://github.com/Itz-Murali">
          <img src="https://img.shields.io/badge/GitHub-Itz--Murali-black?style=for-the-badge&logo=github">
        </a>
      </td>
    </tr>
  </table>


---

<p align="center">
⭐ If you like this project, don’t forget to star the repo!
</p> 
 

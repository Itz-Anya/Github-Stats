. 
![f](https://github-stats-green-omega.vercel.app/api/stats?username=Itz-Anya) 



# GitHub Stats Service v2

> Dynamic, beautiful GitHub stats SVG cards — deployable on Vercel in one click.

## Quick start

```
https://your-deployment.vercel.app/api/stats?username=torvalds&theme=tokyonight
```

Embed in your GitHub profile README:

```markdown
![GitHub Stats](https://your-deployment.vercel.app/api/stats?username=YOUR_USERNAME&theme=tokyonight)
```

---

## Query Parameters

| Parameter       | Default  | Description |
|-----------------|----------|-------------|
| `username`      | —        | **Required.** GitHub username |
| `theme`         | `dark`   | Card theme (see list below) |
| `hide`          | —        | Comma-separated stats to hide, e.g. `hide=gists,watchers` |
| `show_icons`    | `true`   | Show stat icons (`false` to disable) |
| `compact`       | `false`  | Smaller single-column layout |
| `border_radius` | theme    | Override corner radius (0–28) |

### Stats you can hide via `hide=`

`repos`, `stars`, `forks`, `commits`, `prs`, `issues`, `reviews`,
`followers`, `following`, `gists`, `watchers`, `streak`, `curstreak`,
`languages`, `stats`, `streakinfo`

---

## Themes

### Dark / Developer
| Theme | Preview |
|-------|---------|
| `dark` | GitHub dark |
| `github_dark` | GitHub dark dimmed |
| `tokyonight` | Tokyo Night |
| `dracula` | Dracula |
| `nord` | Nord |
| `solarized` | Solarized Dark |
| `monokai` | Monokai |
| `cyberpunk` | Cyberpunk neon |
| `midnight` | Midnight blue |
| `ocean_dark` | Ocean dark |
| `neon_dreams` | Neon dreams |
| `galaxy` | Galaxy purple |
| `aurora` | Aurora borealis |

### Light
| Theme | Preview |
|-------|---------|
| `light` | GitHub light |
| `github_light` | GitHub light default |

### Girly / Pastel 🌸
| Theme | Preview |
|-------|---------|
| `sakura` | Sakura pink |
| `rose_gold` | Rose gold |
| `lavender` | Lavender dream |
| `cotton_candy` | Cotton candy |
| `bubblegum` | Bubblegum pop |
| `mint_fresh` | Mint green |
| `peach_blossom` | Peach blossom |
| `sunshine` | Sunshine yellow |
| `ocean_breeze` | Ocean breeze |
| `starlight` | Starlight night |
| `cherry_blossom` | Cherry blossom dark |

---

## Stats shown

- 📁 Public repos
- ⭐ Total stars received
- 🍴 Total forks of your repos
- 💬 Total commits (this year, includes private if token provided)
- 🔀 Pull requests
- 🐛 Issues opened
- 👁 Code reviews
- 👥 Followers / Following
- 📝 Public gists
- 👀 Total watchers
- 🔥 Current streak & longest streak (requires token)
- 💻 Top languages by repo size (up to 8)
- 📅 Account join date, location, company, website

---

## Deployment

### Vercel (recommended)

```bash
npm install
vercel deploy
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Optional but recommended | GitHub Personal Access Token |

**Without token:** public stats only, 60 req/hour API limit.  
**With token:** private contribution counts, commit data, 5000 req/hour.

Generate at: https://github.com/settings/tokens  
Recommended scopes: `read:user`, `repo` (for private contributions)

Add in Vercel: **Project Settings → Environment Variables → `GITHUB_TOKEN`**

---

## Why does the avatar embed as base64?

GitHub's CDN blocks external image sources in SVG `<image>` tags when rendered
inside `<img>` in a README. This service fetches your avatar server-side and
embeds it as a base64 data URI — so it renders perfectly everywhere.

---

## Local development

```bash
npm install
vercel dev
# Open: http://localhost:3000/api/stats?username=torvalds&theme=sakura
```

---

## Architecture

```
api/stats.ts          Vercel serverless handler — routing, validation, response
lib/
  github.ts           GitHub REST + GraphQL fetching, avatar base64 encoding
  cache.ts            In-memory TTL cache (warm-invocation persistent on Vercel)
  rateLimit.ts        Per-IP sliding window rate limiter
themes/index.ts       23 theme definitions
utils/
  sanitize.ts         Input validation, number formatting, XML escaping
  svgBuilder.ts       Pure SVG card & error card renderer
```

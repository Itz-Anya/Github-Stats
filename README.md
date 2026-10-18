<div align="center">

# GitHub Stats

Animated GitHub README cards as a single URL. Deploy on Vercel in one click.

[![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Itz-Anya/Github-Stats)

<img src="https://anya-github-stats.vercel.app/api/profile?username=Itz-Anya&theme=tokyonight" width="100%" alt="Profile card" />

</div>

## Use it

Open the generator at [anya-github-stats.vercel.app](https://anya-github-stats.vercel.app), pick a card and a theme, then copy the snippet. Or embed directly:

```markdown
![Profile](https://anya-github-stats.vercel.app/api/profile?username=Itz-Anya&theme=tokyonight)
```

## Cards

| Card | Endpoint | Extra parameters |
|------|----------|------------------|
| Stats | `/api/stats` | `show_icons`, `compact`, `include_private`, `hide_avatar_ring`, `section_spacing`, `hide` |
| Profile | `/api/profile` | none |
| Languages | `/api/langstack` | `limit` (3-15), `include_forks`, `hide`, `hide_title` |
| Pinned | `/api/pinned` | `hide_title` |
| Contributions | `/api/contribution-act` | `year`, `include_private`, `hide_title` |
| Streak | `/api/streak` | `include_private`, `hide_title` |
| Trophies | `/api/trophies` | `columns` (2-4), `include_private`, `hide_title` |
| Banner | `/api/banner` | `hide_stats` |
| About | `/api/about` | `query`, `username`, `randompfp`, `avatar`, `font`, `size`, `loop`, `theme` |
| Repo | `/api/repo` | `repo` (owner/name or URL), `hide`, `title`, `description`, `font`, `columns`, `width`, `max_topics`, `max_langs`, `show_owner` |
| Typing | `/api/typing` | `text` (`;` = next line), `font`, `color`, `size`, `speed`, `pause`, `width`, `height`, `center`, `cursor`, `erase`, `weight`, `bg` |

Parameters shared by every card:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `username` | required (not for `repo`, `typing`) | GitHub username |
| `theme` | `dark` | Any theme name, or `random` |
| `border_radius` | theme default | 0-28 |
| `animate` | `true` | `false` returns a static SVG |

`hide` on the stats card accepts: `repos`, `stars`, `forks`, `commits`, `prs`, `issues`, `reviews`, `followers`, `following`, `gists`, `watchers`, `stats`, `languages`, `streakinfo`, `pinned`.

## Themes

63 themes. Text colors are tuned for contrast on every background.

| Category | Themes |
|----------|--------|
| Dark Dev | `dark` `github_dark` `tokyonight` `dracula` `nord` `solarized` `monokai` |
| Futuristic | `cyberpunk` `midnight` `ocean_dark` `neon_dreams` `galaxy` `aurora` `starlight` |
| Light | `light` `github_light` |
| Pastel | `sakura` `rose_gold` `lavender` `cotton_candy` `mint_fresh` `peach_blossom` `bubblegum` `sunshine` `ocean_breeze` `cherry_blossom` `pastel_rainbow` |
| Neon | `neon_green` `neon_pink` `neon_orange` `neon_blue` `neon_purple` `neon_red` |
| Ultra Dark | `obsidian` `black_ice` `pitch_dark` |
| Beautiful | `emerald` `sapphire` `ruby` `amber_glow` `velvet` `golden_hour` |
| Bright | `vivid_day` `solar_flare` `electric` `lime_burst` |
| Simple | `minimal_white` `minimal_dark` `paper` `ink` `mono_slate` |
| Retro | `retro_terminal` `amber_crt` `vaporwave` `outrun` |
| Nature | `forest` `desert` `arctic` `deep_sea` `sunset` |
| Colorful | `rainbow_dark` `tropical` `cosmic` |

## Deploy

```bash
git clone https://github.com/Itz-Anya/Github-Stats.git
cd Github-Stats
npm install
echo "GITHUB_TOKEN=ghp_yourtoken" > .env
npx vercel --prod
```

Set `GITHUB_TOKEN` to avoid GitHub API rate limits.

## License

See [LICENSE](LICENSE).

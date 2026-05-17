# siteblaze

**AI picks sections, not code. Clean React. Free. Yours.**

```bash
npm i -g siteblaze
siteblaze auth
siteblaze generate "SaaS landing page for a project management tool"
```

No browser required. No subscription. Just your terminal, your API key, and a scaffolded project you actually own — or open a live browser editor and download when you're happy.

---

## Why siteblaze

- **AI picks the sections, not the code** — your prompt decides what sections appear, what copy they contain, what colors fit. The component library is fixed and tested; the AI fills the content
- **Developer-native** — runs in your terminal, outputs a real project in your filesystem. No accounts, no browser tabs, no platform lock-in
- **Free models by default** — races multiple OpenRouter free-tier models in parallel; first valid response wins. Bring a paid key if you want, but you don't have to
- **You own the output** — Vite or Next.js, Tailwind or shadcn/ui, plain git repo. `cd`, `npm install`, `npm run dev` — that's it

---

## Quick start

```bash
# Install globally
npm i -g siteblaze

# Save your OpenRouter API key (free at openrouter.ai/keys)
siteblaze auth

# Generate and scaffold immediately
siteblaze generate "Portfolio for a UX designer"

# Or — open a live browser editor first, download when happy
siteblaze generate "Portfolio for a UX designer" --preview
```

The generated project is a standalone repo. `cd` into it, `npm install`, `npm run dev`.

---

## Preview mode

Add `--preview` to open a browser editor before any files are written to disk:

```bash
siteblaze generate "Vault — a fintech app for wealth management" --preview
```

The editor opens at `http://localhost:3000` with a live page and a settings panel:

- **Site name** — rename the project (sets the zip filename and folder on download)
- **Theme** — Light, Dark, or Midnight
- **Font** — Sans-serif, Serif, or Monospace
- **Colors** — primary and secondary with a color picker or hex input
- **Theme toggle** — show/hide the theme switcher button on the page
- **Sections** — reorder, delete, and add new sections; hit ↻ on any section to AI-fill it with fresh content

Changes in the settings panel apply to the live preview automatically. Hit **↓ Download Project** to get a ready-to-run zip. Press `Ctrl+C` in the terminal to stop — your session is saved and can be resumed with `siteblaze open`.

---

## Commands

| Command | Description |
|---|---|
| `siteblaze generate "<prompt>"` | Generate and scaffold a new site |
| `siteblaze open` | Re-open a `--preview` session in the browser editor (history saved for `--preview` only) |
| `siteblaze open --delete` | Delete a history entry |
| `siteblaze auth` | Save your OpenRouter API key — also caches the latest free model list |
| `siteblaze list-models` | Show active models and their source |
| `siteblaze list-models --refresh` | Fetch latest free models from OpenRouter |
| `siteblaze --version` | Print version |

### Generate flags

| Flag | Description |
|---|---|
| `--preview` | Open a live browser editor — tweak theme, colors, fonts, then download |
| `--framework <vite\|next>` | Override framework (prompted if omitted) |
| `--ui <tailwind\|shadcn>` | Override UI library (prompted if omitted) |
| `--theme <light\|dark\|midnight>` | Set theme mode |
| `--type <type>` | Site type: `landing` `portfolio` `saas` `agency` `blog` `ecommerce` `event` |
| `--no-image` | Skip AI hero image generation |
| `-y, --yes` | Auto-confirm all prompts, use defaults |
| `--verbose` | Show model racing output |

---

## Model configuration

siteblaze races multiple free OpenRouter models and uses the first valid response — so you always get a result even if one model is slow or down.

**Override with env var:**
```bash
SITEBLAZE_MODELS=anthropic/claude-opus-4 siteblaze generate "..."
```

The model list is populated automatically when you run `siteblaze auth`. To refresh it later (e.g. after models are deprecated):

```bash
siteblaze list-models --refresh
```

Precedence: `SITEBLAZE_MODELS` env → `~/.config/siteblaze/models.json` → built-in defaults.

---

## Coming soon

- `siteblaze publish` — deploy to Vercel / Netlify in one command
- Multi-page support — generate full sites, not just landing pages
- `@siteblaze/react` — use the component engine in your own Next.js / Remix app
- CMS integration — pull content from Contentful / Sanity into the schema

---

## Contributing

PRs welcome. This repo is an Nx monorepo:

```
apps/cli          # siteblaze CLI (published to npm)
apps/web          # preview web app (bundled into CLI)
libs/engine-core  # AI generation + schema + React renderer
libs/ui-elements  # section components (Tailwind + shadcn variants)
```

```bash
# Install deps
npm install

# Run tests
npm exec nx run-many -- -t test --projects=@org/engine-core,@org/cli

# Build web app (must run before CLI build)
npm exec nx build @org/web -- --skip-nx-cache

# Build CLI
cd apps/cli && node build.mjs

# Local dev (link CLI globally)
cd apps/cli && npm link
```

---

## License

MIT — see [LICENSE](./LICENSE)

# siteblaze

**One prompt. AI-generated React starter. Free. Yours.**

```bash
npm i -g siteblaze
siteblaze auth
siteblaze generate "SaaS landing page for a project management tool"
```

No browser required. No subscription. Just your terminal, your API key, and a scaffolded project you actually own — or open a live browser editor and download when you're happy.

---

## Why siteblaze

Most AI site builders (v0, Bolt, Lovable) are browser-based, locked to their platform, and hand you a blob of code you can't easily evolve. siteblaze is different:

- **Developer-native** — runs in your terminal, outputs a real project in your filesystem
- **Schema-validated output** — the AI fills content, not code. The component library is fixed and tested
- **Free models by default** — uses OpenRouter free-tier models; bring your own key, no subscription
- **You own the output** — Vite or Next.js, Tailwind or shadcn/ui, plain git repo, no lock-in

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

## Commands

| Command | Description |
|---|---|
| `siteblaze generate "<prompt>"` | Generate and scaffold a new site |
| `siteblaze auth` | Save your OpenRouter API key |
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

Hit **Save** to apply changes to the live preview. Hit **↓ Download Project** to get a ready-to-run zip. Press `Ctrl+C` in the terminal to stop.

---

## Model configuration

siteblaze races multiple free OpenRouter models and uses the first valid response — so you always get a result even if one model is slow or down.

**Override with env var:**
```bash
SITEBLAZE_MODELS=anthropic/claude-opus-4 siteblaze generate "..."
```

**Refresh free model list:**
```bash
siteblaze list-models --refresh
```

Precedence: `SITEBLAZE_MODELS` env → `~/.config/siteblaze/models.json` → built-in defaults.

---

## Coming soon

- `siteblaze publish` — deploy to Vercel / Netlify in one command
- Section editing in the browser — reorder, add, and remove sections visually
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

# Build CLI
cd apps/cli && node build.mjs

# Local dev (link CLI globally)
cd apps/cli && npm link
```

---

## License

MIT — see [LICENSE](./LICENSE)

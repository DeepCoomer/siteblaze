# siteblaze

**AI-powered site generator — from prompt to production-ready React project in seconds.**

```bash
npm i -g siteblaze
siteblaze auth
siteblaze generate "SaaS landing page for a project management tool"
```

No browser required. No subscription. Just your terminal, your API key, and a scaffolded project you actually own — or open a live preview in the browser and download when you're happy.

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

# Or — preview in the browser first, download when happy
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
| `siteblaze eject` | Eject the section components into your project |
| `siteblaze --version` | Print version |

### Generate flags

| Flag | Description |
|---|---|
| `--preview` | Open a live browser preview before saving files |
| `--framework <vite\|next>` | Override framework detection |
| `--ui <tailwind\|shadcn>` | Override UI library choice |
| `--theme <light\|dark\|midnight>` | Set theme mode |
| `--no-image` | Skip AI image generation |
| `--yes` | Auto-confirm all prompts |
| `--verbose` | Show model racing output |

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
- Multi-page support — generate full sites, not just landing pages
- `@siteblaze/react` — use the component engine in your own Next.js / Remix app
- CMS integration — pull content from Contentful / Sanity into the schema
- AI config editor — chat-based modifications in the browser preview

---

## Contributing

PRs welcome. This repo is an Nx monorepo:

```
apps/cli          # siteblaze CLI (published to npm)
apps/web          # preview web app (bundled into CLI)
apps/api          # local API server for the preview
libs/engine-core  # AI generation + schema + React renderer
libs/ui-elements  # section components (Tailwind + shadcn variants)
```

```bash
# Install deps
npm install

# Run tests
npm exec nx run-many -- -t test --projects=@org/engine-core,@org/cli

# Build CLI
node apps/cli/build.mjs

# Local dev
npm link  # from apps/cli/ — makes siteblaze command available
```

---

## License

MIT — see [LICENSE](./LICENSE)

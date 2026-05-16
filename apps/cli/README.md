# siteblaze

**AI picks sections, not code. Clean React. Free. Yours.**

```bash
npx siteblaze generate "Syncly — a SaaS project tracker for remote teams"
```

No browser. No subscription. No blank canvas. Just a complete, runnable React + Tailwind project you own — or tweak it live in the browser and download when you're happy.

---

## Why siteblaze?

Tools like v0, Bolt, and Lovable are browser-based platforms. siteblaze is a developer CLI that runs in your terminal:

- **One command** → fully scaffolded React project with real content and appropriate sections
- **Free tier** — races multiple OpenRouter free models in parallel; first valid response wins
- **You own every file** — no runtime dependency, no lock-in, no account required
- **Schema-validated output** — consistent structure every run, not ad-hoc code generation

---

## Install

```bash
npm install -g siteblaze
# or run without installing:
npx siteblaze generate "your prompt"
```

Requires Node.js ≥ 20 and a free [OpenRouter API key](https://openrouter.ai/keys).

---

## Usage

```bash
# Generate a project (prompts for framework, UI library, package manager)
siteblaze generate "Vault — a fintech app for wealth management"

# Open a live browser editor first, download when happy
siteblaze generate "Vault — a fintech app for wealth management" --preview

# Skip all prompts with sensible defaults
siteblaze generate "Orbit — SaaS project tracker" --yes

# Next.js + shadcn/ui, no hero image
siteblaze generate "Alex Rivera — freelance designer portfolio" --framework next --ui shadcn --no-image

# Use your own paid OpenRouter model
SITEBLAZE_MODELS=anthropic/claude-opus-4 siteblaze generate "..."

# Save API key for future runs
siteblaze auth

# See active models / refresh from OpenRouter
siteblaze list-models
siteblaze list-models --refresh
```

### Flags

| Flag | Description |
|---|---|
| `--preview` | Open a live browser editor — tweak theme, colors, fonts, then download |
| `-m, --model <id>` | Force a specific OpenRouter model |
| `-o, --output <path>` | Output directory (default: current dir) |
| `-t, --type <type>` | Site type: `landing` `portfolio` `agency` `saas` `blog` `ecommerce` `event` |
| `-f, --framework <fw>` | `vite` (default) or `next` |
| `--theme <mode>` | `light` `dark` `midnight` |
| `--ui <lib>` | `tailwind` (default) or `shadcn` |
| `--no-image` | Skip AI hero image generation |
| `-y, --yes` | Skip all prompts, use defaults |
| `--verbose` | Show model details and generation source |

---

## Preview mode

Add `--preview` to open a browser editor before any files are written to disk:

```bash
siteblaze generate "Vault — a fintech app for wealth management" --preview
```

The editor opens automatically at `http://localhost:3000`. On the left you'll find a settings panel with:

| Setting | Options |
|---|---|
| Site name | Free text — also sets the zip filename and project folder |
| Theme | Light · Dark · Midnight |
| Font | Sans-serif · Serif · Monospace |
| Primary color | Color picker + hex input |
| Secondary color | Color picker + hex input |
| Theme toggle | Show/hide the theme switcher button on the page |

The raw JSON is also editable in the panel for advanced changes to section content.

Hit **Save** to apply changes to the live preview. Hit **↓ Download Project** to get a ready-to-run zip named after your site. Press `Ctrl+C` in the terminal to stop.

---

## What gets generated

```
my-project/
├── src/
│   ├── Home.tsx          ← page layout — edit this to customise
│   ├── sections/         ← individual section components
│   └── theme.ts          ← colors, fonts, theme mode
├── public/
│   └── images/hero.jpg   ← AI-generated hero image
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

Then:

```bash
cd my-project
npm install
npm run dev
```

---

## Supported section types (22)

`NAVBAR` `HERO` `FEATURES` `TESTIMONIALS` `PRICING` `CTA` `FAQ` `STATS` `TEAM` `NEWSLETTER` `LOGO_CLOUD` `SKILLS` `TIMELINE` `PORTFOLIO_GRID` `CONTACT_FORM` `GALLERY` `PRODUCT_GRID` `TRUST_BADGES` `COUNTDOWN` `SCHEDULE` `CASE_STUDY` `VIDEO_EMBED`

Each section has 3 layout variants and is fully theme-reactive.

---

## Model configuration

By default siteblaze races a curated list of free OpenRouter models — first valid response wins.

```bash
# Refresh the model list from OpenRouter (fixes deprecated models)
siteblaze list-models --refresh

# Use specific models (comma-separated)
SITEBLAZE_MODELS=openai/gpt-4o,anthropic/claude-opus-4 siteblaze generate "..."
```

Precedence: `SITEBLAZE_MODELS` env → `~/.config/siteblaze/models.json` → built-in defaults.

---

## License

MIT

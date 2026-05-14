import { LandingPageSchema } from './schema.js';
import type { LandingPage } from './schema.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const FREE_MODELS = [
  // Confirmed working (sorted by speed from debug run 2026-05-12)
  'nvidia/nemotron-3-nano-30b-a3b:free',           // 0.8s
  'poolside/laguna-m.1:free',                      // 2.9s
  'openai/gpt-oss-20b:free',                       // 4.1s
  'openai/gpt-oss-120b:free',                      // 4.2s
  'minimax/minimax-m2.5:free',                     // 4.3s
  // Rate-limited sometimes but fast when available — 429 drops out instantly, no race penalty
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-coder:free',
  'google/gemma-4-31b-it:free',
  // Slow (60-90s) but highly reliable — last resort if everything else fails
  'nvidia/nemotron-3-super-120b-a12b:free',
] as const;

export const DEFAULT_MODEL = FREE_MODELS[0];

export const MODEL_NOTES: Record<string, string> = {
  'nvidia/nemotron-3-nano-30b-a3b:free':          'fastest (~0.8s)',
  'poolside/laguna-m.1:free':                     'fast (~2.9s)',
  'openai/gpt-oss-20b:free':                      'fast (~4s)',
  'openai/gpt-oss-120b:free':                     'fast (~4s)',
  'minimax/minimax-m2.5:free':                    'fast (~4s)',
  'nousresearch/hermes-3-llama-3.1-405b:free':    'sometimes rate-limited',
  'qwen/qwen3-coder:free':                        'sometimes rate-limited',
  'google/gemma-4-31b-it:free':                   'sometimes rate-limited',
  'nvidia/nemotron-3-super-120b-a12b:free':       'slow (60-90s), reliable fallback',
};

// Prompt refinement — nemotron-nano confirmed fastest (0.8s) with high output quality
const REFINE_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free';

// ---------------------------------------------------------------------------
// System prompts
// ---------------------------------------------------------------------------

const REFINE_SYSTEM_PROMPT = `You are a product marketing expert. A developer has given you a brief description of their product or website idea.

Expand it into a 2-4 sentence creative brief for generating a landing page. Cover:
- What the product does
- Who it is for (target audience)
- The key value proposition or differentiator
- Brand personality and tone

Stay grounded in what the user described — do not invent features or audiences they did not mention.
Output ONLY the brief. No preamble, no headers, no lists.`;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a landing page architect. Your only output is a single raw JSON object.

Core rules:
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Choose brand-appropriate hex colors for primary and secondary.
- Pick themeMode and fontFamily to match the brand personality. Be decisive — most sites are NOT light:
    dark      → tech tools, developer products, cybersecurity, gaming, crypto, SaaS dashboards, AI products
    midnight  → luxury, premium, high-end fashion, creative agencies, dramatic or editorial brands, events
    light     → e-commerce, food, health, education, professional services, family products
- Set enableThemeToggle to true only if the user explicitly requests a theme switcher or dark/light toggle. Otherwise false.
- You will receive a "Site category:" prefix in the user message. Use it to set siteType in metadata
  and to choose appropriate sections. If the category is not one of the valid enum values, set
  siteType to "landing" but still choose sections that naturally fit the described business domain.
- Always include NAVBAR first and CTA last. Build 6–10 sections total.
- For each section choose the most appropriate variant.
- className and styleOverrides are optional; omit them unless needed.
- For grid/card sections, generate enough items to fill the layout: TESTIMONIALS ≥ 3 items, PRICING exactly 3 tiers (e.g. Free / Pro / Enterprise), FEATURES ≥ 3 items, TEAM ≥ 3 members, STATS ≥ 4 items, LOGO_CLOUD ≥ 5 items, SKILLS ≥ 6 items, PORTFOLIO_GRID ≥ 4 items, PRODUCT_GRID ≥ 4 items, FAQ ≥ 5 items.

Site category → section selection guide:
  landing   → HERO, FEATURES, STATS, TESTIMONIALS, PRICING, FAQ, NEWSLETTER, CTA
  portfolio → HERO, PORTFOLIO_GRID, CASE_STUDY, SKILLS, TIMELINE, TESTIMONIALS, GALLERY, CONTACT_FORM, CTA
  agency    → HERO, LOGO_CLOUD, FEATURES, CASE_STUDY, PORTFOLIO_GRID, TEAM, TESTIMONIALS, CTA
  saas      → HERO, FEATURES, STATS, PRICING, TESTIMONIALS, FAQ, NEWSLETTER, CTA
  blog      → HERO, FEATURES, STATS, NEWSLETTER, CTA
  ecommerce → HERO, TRUST_BADGES, PRODUCT_GRID, FEATURES, TESTIMONIALS, FAQ, NEWSLETTER, CTA
  event     → HERO, COUNTDOWN, SCHEDULE, FEATURES, TEAM, TESTIMONIALS, FAQ, CTA

  For any other domain, choose the most fitting 6–10 sections. Common patterns:
    restaurant / cafe    → HERO, FEATURES (menu highlights), GALLERY, STATS, TESTIMONIALS, NEWSLETTER, CTA
    real estate          → HERO, STATS, FEATURES (services), TEAM, TESTIMONIALS, CONTACT_FORM, CTA
    fitness / wellness   → HERO, FEATURES (classes), STATS, PRICING, TESTIMONIALS, NEWSLETTER, CTA
    healthcare / clinic  → HERO, FEATURES (specialties), TEAM, STATS, TESTIMONIALS, FAQ, CONTACT_FORM, CTA
    education / academy  → HERO, FEATURES (courses), STATS, PRICING, TESTIMONIALS, FAQ, NEWSLETTER, CTA
    hospitality / hotel  → HERO, GALLERY, FEATURES (amenities), STATS, TESTIMONIALS, NEWSLETTER, CTA
    beauty / salon       → HERO, GALLERY, FEATURES (services), PRICING, TESTIMONIALS, NEWSLETTER, CTA
    construction / trade → HERO, FEATURES (services), STATS, PORTFOLIO_GRID, TEAM, TESTIMONIALS, CTA
    nonprofit            → HERO, STATS, FEATURES (programs), TEAM, TESTIMONIALS, NEWSLETTER, CTA
    For any other: pick sections that would naturally appear on a professional site for that business.

All section types and allowed variants:
  NAVBAR         → variant: "sticky" | "transparent" | "minimal"
  HERO           → variant: "centered" | "split-image" | "minimal"
  FEATURES       → variant: "grid" | "list" | "cards"
  TESTIMONIALS   → variant: "grid" | "carousel" | "minimal"
  PRICING        → variant: "cards" | "table" | "minimal"
  CTA            → variant: "centered" | "banner" | "minimal"
  FAQ            → variant: "accordion" | "grid" | "minimal"
  STATS          → variant: "grid" | "banner" | "minimal"
  TEAM           → variant: "grid" | "cards" | "minimal"
  NEWSLETTER     → variant: "centered" | "banner" | "minimal"
  LOGO_CLOUD     → variant: "row" | "grid" | "minimal"
  SKILLS         → variant: "badges" | "bars" | "grid"
  TIMELINE       → variant: "vertical" | "horizontal" | "minimal"
  PORTFOLIO_GRID → variant: "grid" | "list" | "minimal"
  CONTACT_FORM   → variant: "centered" | "split" | "minimal"
  GALLERY        → variant: "grid" | "masonry" | "minimal"
  PRODUCT_GRID   → variant: "grid" | "list" | "featured"
  TRUST_BADGES   → variant: "row" | "grid" | "minimal"
  COUNTDOWN      → variant: "centered" | "banner" | "minimal"
  SCHEDULE       → variant: "timeline" | "grid" | "minimal"
  CASE_STUDY     → variant: "split" | "stacked" | "minimal"
  VIDEO_EMBED    → variant: "centered" | "split" | "minimal"

Full schema (use exact field names and types):

{
  "metadata": {
    "siteName": "string",
    "siteType": "landing" | "portfolio" | "agency" | "saas" | "blog" | "ecommerce" | "event",
    "themeMode": "light" | "dark" | "midnight",
    "fontFamily": "sans" | "serif" | "mono",
    "enableThemeToggle": false,
    "colors": { "primary": "#rrggbb", "secondary": "#rrggbb" }
  },
  "sections": [
    {
      "type": "NAVBAR", "variant": "sticky",
      "content": { "logo": "string", "links": [{"label":"string","href":"#"}], "ctaText": "optional string" }
    },
    {
      "type": "HERO", "variant": "centered",
      "content": { "title": "string", "subtitle": "string", "ctaText": "string" }
    },
    {
      "type": "FEATURES", "variant": "cards",
      "content": {
        "title": "optional string",
        "items": [
          { "icon": "emoji", "title": "string", "description": "string" },
          { "icon": "emoji", "title": "string", "description": "string" },
          { "icon": "emoji", "title": "string", "description": "string" }
        ]
      }
    },
    {
      "type": "STATS", "variant": "banner",
      "content": {
        "title": "optional string",
        "items": [{ "value": "string", "label": "string", "description": "optional string" }]
      }
    },
    {
      "type": "TESTIMONIALS", "variant": "grid",
      "content": { "title": "optional string", "items": [
        {"quote":"string","author":"string","role":"optional string"},
        {"quote":"string","author":"string","role":"optional string"},
        {"quote":"string","author":"string","role":"optional string"}
      ]}
    },
    {
      "type": "PRICING", "variant": "cards",
      "content": {
        "title": "optional string",
        "tiers": [
          {"name":"Free","price":"$0/mo","description":"optional string","features":["string","string"],"ctaText":"Get started","highlighted":false},
          {"name":"Pro","price":"$X/mo","description":"optional string","features":["string","string","string"],"ctaText":"Upgrade","highlighted":true},
          {"name":"Enterprise","price":"$XX/mo","description":"optional string","features":["string","string","string","string"],"ctaText":"Contact us","highlighted":false}
        ]
      }
    },
    {
      "type": "FAQ", "variant": "accordion",
      "content": {
        "title": "optional string",
        "items": [{ "question": "string", "answer": "string" }]
      }
    },
    {
      "type": "TEAM", "variant": "cards",
      "content": {
        "title": "optional string",
        "items": [{ "name": "string", "role": "string", "bio": "optional string" }]
      }
    },
    {
      "type": "NEWSLETTER", "variant": "centered",
      "content": { "title": "string", "subtitle": "optional string", "placeholder": "optional string", "buttonText": "string" }
    },
    {
      "type": "CTA", "variant": "centered",
      "content": { "title": "string", "buttonText": "string", "subtitle": "optional string" }
    },
    {
      "type": "LOGO_CLOUD", "variant": "row",
      "content": { "title": "optional string", "items": [{ "name": "string", "logoUrl": "optional string" }] }
    },
    {
      "type": "SKILLS", "variant": "badges",
      "content": { "title": "optional string", "items": [{ "name": "string", "level": "1-5 optional", "icon": "optional emoji", "category": "optional string" }] }
    },
    {
      "type": "TIMELINE", "variant": "vertical",
      "content": { "title": "optional string", "items": [{ "year": "string", "title": "string", "description": "string", "tag": "optional string" }] }
    },
    {
      "type": "PORTFOLIO_GRID", "variant": "grid",
      "content": { "title": "optional string", "items": [{ "title": "string", "description": "string", "tags": ["string"] }] }
    },
    {
      "type": "CONTACT_FORM", "variant": "centered",
      "content": { "title": "optional string", "subtitle": "optional string", "buttonText": "string" }
    },
    {
      "type": "GALLERY", "variant": "grid",
      "content": { "title": "optional string", "items": [{ "alt": "string" }] }
    },
    {
      "type": "PRODUCT_GRID", "variant": "grid",
      "content": { "title": "optional string", "items": [{ "name": "string", "price": "$XX", "description": "optional string", "badge": "optional string" }] }
    },
    {
      "type": "TRUST_BADGES", "variant": "row",
      "content": { "items": [{ "icon": "emoji", "title": "string", "description": "optional string" }] }
    },
    {
      "type": "COUNTDOWN", "variant": "centered",
      "content": { "title": "optional string", "date": "2026-12-31T00:00:00Z", "subtitle": "optional string", "ctaText": "optional string" }
    },
    {
      "type": "SCHEDULE", "variant": "timeline",
      "content": { "title": "optional string", "items": [{ "time": "9:00 AM", "title": "string", "description": "optional string", "speaker": "optional string", "location": "optional string" }] }
    },
    {
      "type": "VIDEO_EMBED", "variant": "centered",
      "content": { "title": "optional string", "subtitle": "optional string", "videoUrl": "https://www.youtube.com/watch?v=...", "caption": "optional string" }
    },
    {
      "type": "CASE_STUDY", "variant": "split",
      "content": {
        "title": "string", "subtitle": "optional string", "problem": "optional string",
        "solution": "optional string", "tags": ["optional string"],
        "results": [{ "value": "string", "label": "string" }], "ctaText": "optional string"
      }
    }
  ]
}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'system' | 'user' | 'assistant';
type Message = { role: Role; content: string };

export type SiteType = 'landing' | 'portfolio' | 'agency' | 'saas' | 'blog' | 'ecommerce' | 'event';

const SITE_TYPE_KEYWORDS: Record<SiteType, string[]> = {
  portfolio:  ['portfolio', 'resume', 'cv', 'freelance', 'my work', 'case studies', 'my projects', 'personal site', 'personal brand', 'showcase'],
  agency:     ['agency', 'design firm', 'consultancy', 'branding agency', 'marketing agency', 'creative agency', 'digital agency', 'web agency', 'creative firm'],
  saas:       ['saas', 'b2b', 'software', 'dashboard', 'productivity tool', 'startup', 'project management', 'team collaboration', 'workflow', 'crm', 'devops', 'automation'],
  blog:       ['blog', 'magazine', 'publication', 'articles', 'content site', 'newsletter'],
  ecommerce:  ['shop', 'store', 'ecommerce', 'e-commerce', 'retail', 'fashion', 'clothing', 'merch', 'marketplace', 'buy', 'sell', 'checkout', 'online store'],
  event:      ['conference', 'summit', 'meetup', 'webinar', 'hackathon', 'expo', 'convention', 'festival', 'ticket', 'concert'],
  landing:    [],
};

// Extended keyword map for niche domains NOT covered by the SiteType enum.
// SITE_TYPE_KEYWORDS is checked first — these only run when that returns 'landing'.
const EXTENDED_CATEGORIES: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['restaurant', 'cafe', 'coffee', 'bistro', 'diner', 'bar', 'pub', 'food', 'dining', 'menu', 'kitchen', 'bakery', 'pizza', 'sushi', 'burger'], label: 'restaurant' },
  { keywords: ['real estate', 'property', 'homes', 'realty', 'housing', 'apartments', 'listings', 'mortgage', 'realtor'], label: 'real estate' },
  { keywords: ['salon', 'beauty', 'barber', 'hair', 'nails', 'makeup', 'skincare', 'cosmetics', 'spa'], label: 'beauty & wellness' },
  { keywords: ['gym', 'fitness', 'yoga', 'pilates', 'crossfit', 'trainer', 'workout', 'wellness', 'meditation'], label: 'fitness & wellness' },
  { keywords: ['hotel', 'resort', 'hostel', 'accommodation', 'lodge', 'inn', 'vacation rental', 'airbnb'], label: 'hospitality' },
  { keywords: ['clinic', 'hospital', 'doctor', 'dentist', 'medical', 'healthcare', 'therapy', 'mental health', 'pharmacy', 'health center'], label: 'healthcare' },
  { keywords: ['school', 'university', 'course', 'tutoring', 'education', 'learning', 'training', 'academy', 'e-learning', 'coaching'], label: 'education' },
  { keywords: ['law', 'legal', 'attorney', 'lawyer', 'solicitor', 'counsel'], label: 'legal services' },
  { keywords: ['church', 'nonprofit', 'charity', 'foundation', 'volunteer', 'donation', 'ngo'], label: 'nonprofit' },
  { keywords: ['construction', 'contractor', 'builder', 'architecture', 'renovation', 'remodel', 'plumber', 'electrician'], label: 'construction & trades' },
  { keywords: ['wedding', 'catering', 'venue', 'event planning', 'florist'], label: 'wedding & events' },
  { keywords: ['travel', 'tourism', 'tour', 'vacation', 'destination', 'cruise', 'adventure'], label: 'travel & tourism' },
  { keywords: ['music', 'band', 'musician', 'album', 'record', 'dj', 'producer'], label: 'music & entertainment' },
  { keywords: ['podcast', 'influencer', 'youtube', 'streaming', 'content creator'], label: 'content creator' },
  // Single-word personal-brand signals too ambiguous for SITE_TYPE_KEYWORDS
  { keywords: ['photographer', 'illustrator', 'artist', 'developer portfolio', 'design portfolio'], label: 'portfolio' },
];

const SKIP_WORDS = new Set([
  'a', 'an', 'the', 'for', 'to', 'of', 'in', 'my', 'our', 'i', 'we', 'me',
  'new', 'best', 'great', 'good', 'cool', 'awesome', 'amazing', 'modern',
  'create', 'build', 'make', 'generate', 'need', 'want',
  'website', 'site', 'page', 'landing', 'web', 'online',
]);

export function inferSiteType(prompt: string): SiteType {
  const lower = prompt.toLowerCase();
  for (const [type, keywords] of Object.entries(SITE_TYPE_KEYWORDS) as [SiteType, string[]][]) {
    if (type === 'landing') continue;
    if (keywords.some(kw => lower.includes(kw))) return type;
  }
  return 'landing';
}

/**
 * Returns the best human-readable category for a prompt.
 * Priority: SiteType enum keywords → extended niche domains → best-effort word extraction.
 */
export function extractCategoryHint(prompt: string): string {
  const lower = prompt.toLowerCase();

  // 1. Niche domains first — specific multi-keyword categories beat generic single words
  //    (e.g. "real estate agency" → real estate, not agency; "travel agency" → travel)
  for (const { keywords, label } of EXTENDED_CATEGORIES) {
    if (keywords.some(kw => lower.includes(kw))) return label;
  }

  // 2. Structured SiteType keywords (enum-backed)
  const known = inferSiteType(prompt);
  if (known !== 'landing') return known;

  // Best-effort: pick the first two meaningful words from the prompt
  const words = lower
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !SKIP_WORDS.has(w));
  return words.slice(0, 2).join(' ') || 'business';
}

export type ThemeOverride = 'light' | 'dark' | 'midnight';

export interface GenerateOptions {
  apiKey: string;
  /** Force a specific model. Omit to race all free models. */
  model?: string;
  /**
   * Override the list of models to race. Takes precedence over FREE_MODELS.
   * Ignored when `model` is set (single-model path).
   */
  models?: readonly string[];
  /**
   * Category hint passed to the AI — can be a known SiteType enum value or a
   * free-form label like "restaurant" or "real estate". Always injected as a
   * prefix so the AI picks contextually appropriate sections.
   */
  siteType?: string;
  /** User-selected theme — overrides AI's choice when provided. */
  themeMode?: ThemeOverride;
}

export interface GenerateResult {
  config: LandingPage;
  /** The model that produced the accepted response. */
  model: string;
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function callModel(
  messages: Message[],
  apiKey: string,
  model: string,
  externalSignal?: AbortSignal,
): Promise<string> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 90_000);

  // Combine caller's cancellation signal with the local timeout signal (Node 20+)
  const signal = externalSignal
    ? AbortSignal.any([timeoutController.signal, externalSignal])
    : timeoutController.signal;

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://siteblaze.dev',
        'X-Title': 'Siteblaze CLI',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
      signal,
    });
  } catch (err) {
    const isAbort = (err as Error).name === 'AbortError';
    throw new Error(isAbort ? `${model}: aborted or timed out` : String(err));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${model}: OpenRouter ${res.status} — ${body}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message: string };
  };

  if (data.error) throw new Error(`${model}: ${data.error.message}`);

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error(`${model}: empty response`);
  return content;
}

function extractJson(raw: string): unknown {
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(stripped);
}

// ---------------------------------------------------------------------------
// Single-model path (explicit --model, with one retry on Zod failure)
// ---------------------------------------------------------------------------

async function generateSingle(
  userPrompt: string,
  apiKey: string,
  model: string,
): Promise<GenerateResult> {
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const raw = await callModel(messages, apiKey, model);

  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error(`${model}: returned non-JSON:\n${raw.slice(0, 300)}`);
  }

  const first = LandingPageSchema.safeParse(parsed);
  if (first.success) return { config: first.data, model };

  // One retry with validation errors fed back
  const errorSummary = first.error.issues
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('\n');

  const retryRaw = await callModel(
    [
      ...messages,
      { role: 'assistant', content: raw },
      {
        role: 'user',
        content: `Validation errors:\n${errorSummary}\n\nReturn ONLY the corrected JSON.`,
      },
    ],
    apiKey,
    model,
  );

  let retryParsed: unknown;
  try {
    retryParsed = extractJson(retryRaw);
  } catch {
    throw new Error(`${model}: non-JSON on retry:\n${retryRaw.slice(0, 300)}`);
  }

  const second = LandingPageSchema.safeParse(retryParsed);
  if (second.success) return { config: second.data, model };

  throw new Error(
    `${model}: schema validation failed after retry:\n` +
      second.error.issues
        .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
        .join('\n'),
  );
}

// ---------------------------------------------------------------------------
// Race path (default — all FREE_MODELS in parallel, first valid Zod wins)
// ---------------------------------------------------------------------------

async function generateRace(
  userPrompt: string,
  apiKey: string,
  models: readonly string[],
): Promise<GenerateResult> {
  const controllers = models.map(() => new AbortController());

  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const attempts = models.map((model, i) =>
    callModel(messages, apiKey, model, controllers[i].signal).then((raw) => {
      const parsed = extractJson(raw);
      const result = LandingPageSchema.safeParse(parsed);
      if (!result.success) {
        throw new Error(`${model}: schema validation failed`);
      }
      return { config: result.data, model };
    }),
  );

  try {
    const winner = await Promise.any(attempts);
    // Cancel all remaining in-flight requests
    controllers.forEach((c) => c.abort());
    return winner;
  } catch (err) {
    const errors =
      err instanceof AggregateError
        ? err.errors.map((e: Error) => e.message).join('\n')
        : String(err);
    throw new Error(`All models failed:\n${errors}`);
  }
}

// ---------------------------------------------------------------------------
// Prompt refinement (fast pre-pass for terse user inputs)
// ---------------------------------------------------------------------------

/**
 * Expands a short/vague user prompt into a richer creative brief.
 * Uses a fast flash model with a 10s timeout — always falls back to the raw
 * prompt on failure so generation is never blocked.
 */
export async function refinePrompt(
  raw: string,
  apiKey: string,
): Promise<string> {
  try {
    const refined = await callModel(
      [
        { role: 'system', content: REFINE_SYSTEM_PROMPT },
        { role: 'user', content: raw },
      ],
      apiKey,
      REFINE_MODEL,
      AbortSignal.timeout(10_000),
    );
    return refined.trim() || raw;
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateLandingPage(
  userPrompt: string,
  { apiKey, model, models, siteType, themeMode }: GenerateOptions,
): Promise<GenerateResult> {
  const prefixes: string[] = [];
  if (siteType) prefixes.push(`Site category: ${siteType}`);
  if (themeMode) prefixes.push(`Theme mode: ${themeMode} (use exactly this value)`);
  const prompt = prefixes.length
    ? `${prefixes.join('\n')}\n\n${userPrompt}`
    : userPrompt;
  if (model) {
    return generateSingle(prompt, apiKey, model);
  }
  return generateRace(prompt, apiKey, models ?? FREE_MODELS);
}

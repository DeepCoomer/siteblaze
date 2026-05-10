import { LandingPageSchema } from './schema.js';
import type { LandingPage } from './schema.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a landing page architect. Your only output is a single raw JSON object.

Core rules:
- Return ONLY valid JSON. No markdown, no code fences, no explanation.
- Choose brand-appropriate hex colors for primary and secondary.
- Pick themeMode ("light" | "dark" | "midnight") and fontFamily ("sans" | "serif" | "mono") to match the brand personality.
- Set enableThemeToggle to true only if the user explicitly requests a theme switcher or dark/light toggle. Otherwise false.
- Build a rich, multi-section page. Always include NAVBAR first and CTA last.
- Include HERO, FEATURES, and at least 2 other relevant sections from: TESTIMONIALS, PRICING, FAQ, STATS, TEAM, NEWSLETTER.
- For each section choose the most appropriate variant.
- className and styleOverrides are optional; omit them unless needed.

Section types and allowed variants:
  NAVBAR       → variant: "sticky" | "transparent" | "minimal"
  HERO         → variant: "centered" | "split-image" | "minimal"
  FEATURES     → variant: "grid" | "list" | "cards"
  TESTIMONIALS → variant: "grid" | "carousel" | "minimal"
  PRICING      → variant: "cards" | "table" | "minimal"
  CTA          → variant: "centered" | "banner" | "minimal"
  FAQ          → variant: "accordion" | "grid" | "minimal"
  STATS        → variant: "grid" | "banner" | "minimal"
  TEAM         → variant: "grid" | "cards" | "minimal"
  NEWSLETTER   → variant: "centered" | "banner" | "minimal"

Full schema (use exact field names and types):

{
  "metadata": {
    "siteName": "string",
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
        "items": [{ "icon": "emoji", "title": "string", "description": "string" }]
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
      "content": { "title": "optional string", "items": [{"quote":"string","author":"string","role":"optional string"}] }
    },
    {
      "type": "PRICING", "variant": "cards",
      "content": {
        "title": "optional string",
        "tiers": [{"name":"string","price":"string","description":"optional string","features":["string"],"ctaText":"string","highlighted":false}]
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
    }
  ]
}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = 'system' | 'user' | 'assistant';
type Message = { role: Role; content: string };

export interface GenerateOptions {
  model?: string;
  apiKey: string;
}

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

async function callModel(messages: Message[], apiKey: string, model: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://landing-engine.local',
        'X-Title': 'Landing Engine CLI',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
      signal: controller.signal,
    });
  } catch (err) {
    const isTimeout = (err as Error).name === 'AbortError';
    throw new Error(isTimeout ? 'Model timed out after 90s — try again or use a different model.' : String(err));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message: string };
  };

  if (data.error) throw new Error(`Model error: ${data.error.message}`);

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error(`Model returned an empty response. Full response: ${JSON.stringify(data).slice(0, 200)}`);
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
// Public API
// ---------------------------------------------------------------------------

export async function generateLandingPage(
  userPrompt: string,
  { apiKey, model = DEFAULT_MODEL }: GenerateOptions
): Promise<LandingPage> {
  const messages: Message[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];

  const raw = await callModel(messages, apiKey, model);

  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    throw new Error(`Model returned non-JSON:\n${raw.slice(0, 300)}`);
  }

  const first = LandingPageSchema.safeParse(parsed);
  if (first.success) return first.data;

  const errorSummary = first.error.issues
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('\n');

  const retryMessages: Message[] = [
    ...messages,
    { role: 'assistant', content: raw },
    {
      role: 'user',
      content: `The JSON you returned failed validation:\n${errorSummary}\n\nReturn ONLY the corrected JSON with no other text.`,
    },
  ];

  const retryRaw = await callModel(retryMessages, apiKey, model);

  let retryParsed: unknown;
  try {
    retryParsed = extractJson(retryRaw);
  } catch {
    throw new Error(`Model returned non-JSON on retry:\n${retryRaw.slice(0, 300)}`);
  }

  const second = LandingPageSchema.safeParse(retryParsed);
  if (second.success) return second.data;

  const retryErrors = second.error.issues
    .map((i) => `${i.path.join('.') || 'root'}: ${i.message}`)
    .join('\n');
  throw new Error(`Schema validation failed after retry:\n${retryErrors}`);
}

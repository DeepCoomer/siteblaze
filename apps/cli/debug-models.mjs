#!/usr/bin/env node
/**
 * Debug script — tests all 4 FREE_MODELS with the refinement prompt.
 * Run: node apps/cli/debug-models.mjs [your-api-key]
 *   or: OPENROUTER_API_KEY=sk-... node apps/cli/debug-models.mjs
 */

// Active race models (as of 2026-05-12 debug run)
const CURRENT_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'poolside/laguna-m.1:free',
  'openai/gpt-oss-20b:free',
  'openai/gpt-oss-120b:free',
  'minimax/minimax-m2.5:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'qwen/qwen3-coder:free',
  'google/gemma-4-31b-it:free',
];

// Candidates to evaluate next time — swap these in when checking for new additions
const CANDIDATE_MODELS = [];

const MODELS = [...CURRENT_MODELS, ...CANDIDATE_MODELS];

const TEST_PROMPT = 'a ecommerce site';

const SYSTEM_PROMPT = `You are a product marketing expert. A developer has given you a brief description of their product or website idea.

Expand it into a 2-4 sentence creative brief for generating a landing page. Cover:
- What the product does
- Who it is for (target audience)
- The key value proposition or differentiator
- Brand personality and tone

Stay grounded in what the user described — do not invent features or audiences they did not mention.
Output ONLY the brief. No preamble, no headers, no lists.`;

const apiKey = process.argv[2] || process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error('Usage: node debug-models.mjs <api-key>  or set OPENROUTER_API_KEY');
  process.exit(1);
}

async function testModel(model) {
  const start = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://siteblaze.dev',
        'X-Title': 'Siteblaze Debug',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: TEST_PROMPT },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!res.ok) {
      const body = await res.text();
      const tag = res.status === 429 ? 'RATE_LIMITED' : `HTTP ${res.status}`;
      return { model, ok: false, elapsed, status: res.status, error: `${tag}: ${body.slice(0, 200)}` };
    }

    const data = await res.json();

    if (data.error) {
      return { model, ok: false, elapsed, error: data.error.message };
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return { model, ok: false, elapsed, error: 'Empty response', raw: JSON.stringify(data).slice(0, 300) };
    }

    return { model, ok: true, elapsed, content };
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return { model, ok: false, elapsed, error: err.message };
  }
}

console.log(`\nTesting ${MODELS.length} models with prompt: "${TEST_PROMPT}"`);
console.log(`\x1b[2m  Current (${CURRENT_MODELS.length}) + Candidates (${CANDIDATE_MODELS.length})\x1b[0m\n`);
console.log('─'.repeat(70));

// Fire all in parallel, print results as they arrive
const promises = MODELS.map((model) =>
  testModel(model).then((result) => {
    const label = model.split('/').at(-1).padEnd(35);
    if (result.ok) {
      console.log(`\n\x1b[32m✓\x1b[0m  ${label} (${result.elapsed}s)`);
      console.log(`   \x1b[2m${result.content}\x1b[0m`);
    } else if (result.status === 429) {
      console.log(`\n\x1b[33m⚠\x1b[0m  ${label} (${result.elapsed}s)  \x1b[33mRATE LIMITED\x1b[0m`);
    } else {
      console.log(`\n\x1b[31m✗\x1b[0m  ${label} (${result.elapsed}s)`);
      console.log(`   \x1b[31m${result.error}\x1b[0m`);
      if (result.raw) console.log(`   raw: ${result.raw}`);
    }
    return result;
  })
);

await Promise.allSettled(promises);
console.log('\n' + '─'.repeat(70) + '\n');

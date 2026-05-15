import { describe, it, expect, vi, afterEach } from 'vitest';
import { inferSiteType, extractCategoryHint, generateLandingPage } from './ai.js';

// ---------------------------------------------------------------------------
// inferSiteType
// ---------------------------------------------------------------------------

describe('inferSiteType', () => {
  it('returns saas for explicit saas keyword', () => {
    expect(inferSiteType('a SaaS product for teams')).toBe('saas');
  });

  it('returns saas for team collaboration', () => {
    expect(inferSiteType('team collaboration tool called Syncly')).toBe('saas');
  });

  it('returns saas for project management', () => {
    expect(inferSiteType('project management app for startups')).toBe('saas');
  });

  it('returns saas for b2b', () => {
    expect(inferSiteType('b2b analytics dashboard')).toBe('saas');
  });

  it('returns portfolio for portfolio keyword', () => {
    expect(inferSiteType('my portfolio website')).toBe('portfolio');
  });

  it('returns portfolio for resume', () => {
    expect(inferSiteType('resume and cv site for job hunting')).toBe('portfolio');
  });

  it('returns agency for agency keyword', () => {
    expect(inferSiteType('creative agency specialising in branding')).toBe('agency');
  });

  it('returns agency for design firm', () => {
    expect(inferSiteType('design firm based in London')).toBe('agency');
  });

  it('returns ecommerce for shop', () => {
    expect(inferSiteType('online shop for handmade jewellery')).toBe('ecommerce');
  });

  it('returns ecommerce for buy/sell signals', () => {
    expect(inferSiteType('where you can buy and sell vintage clothing')).toBe('ecommerce');
  });

  it('returns event for conference', () => {
    expect(inferSiteType('annual developer conference in Berlin')).toBe('event');
  });

  it('returns event for ticket', () => {
    expect(inferSiteType('ticket sales for our music festival')).toBe('event');
  });

  it('returns blog for blog keyword', () => {
    expect(inferSiteType('personal blog about travel and food')).toBe('blog');
  });

  it('returns landing for unknown domain', () => {
    expect(inferSiteType('something completely unrecognisable xyz')).toBe('landing');
  });

  // False-positive regression tests
  it('does NOT return ecommerce for "SaaS product" prompt', () => {
    expect(inferSiteType('a SaaS product for team collaboration called Syncly')).not.toBe('ecommerce');
  });

  it('does NOT return saas for yoga studio', () => {
    expect(inferSiteType('yoga studio in downtown NYC')).not.toBe('saas');
  });
});

// ---------------------------------------------------------------------------
// extractCategoryHint
// ---------------------------------------------------------------------------

describe('extractCategoryHint', () => {
  // SiteType enum matches (SITE_TYPE_KEYWORDS checked first)
  it('returns saas for saas product prompt', () => {
    expect(extractCategoryHint('a SaaS product for team collaboration called Syncly')).toBe('saas');
  });

  it('returns portfolio for portfolio prompt', () => {
    expect(extractCategoryHint('portfolio for a freelance photographer')).toBe('portfolio');
  });

  it('returns agency for agency prompt', () => {
    expect(extractCategoryHint('digital agency specialising in web design')).toBe('agency');
  });

  it('returns ecommerce for online store', () => {
    expect(extractCategoryHint('online store for handmade jewellery')).toBe('ecommerce');
  });

  // Extended niche domains (EXTENDED_CATEGORIES)
  it('returns restaurant for cafe prompt', () => {
    expect(extractCategoryHint('coffee shop and cafe in Brooklyn')).toBe('restaurant');
  });

  it('returns restaurant for food/dining keywords', () => {
    expect(extractCategoryHint('fine dining restaurant with seasonal menu')).toBe('restaurant');
  });

  it('returns fitness & wellness for yoga', () => {
    expect(extractCategoryHint('yoga studio offering morning classes')).toBe('fitness & wellness');
  });

  it('returns fitness & wellness for gym', () => {
    expect(extractCategoryHint('gym and personal trainer in Manchester')).toBe('fitness & wellness');
  });

  it('returns healthcare for clinic', () => {
    expect(extractCategoryHint('dental clinic accepting new patients')).toBe('healthcare');
  });

  it('returns real estate for property listings', () => {
    expect(extractCategoryHint('real estate agency with property listings')).toBe('real estate');
  });

  it('returns education for online course platform', () => {
    expect(extractCategoryHint('online learning academy for coding courses')).toBe('education');
  });

  it('returns hospitality for hotel', () => {
    expect(extractCategoryHint('boutique hotel in the Swiss Alps')).toBe('hospitality');
  });

  it('returns nonprofit for charity', () => {
    expect(extractCategoryHint('charity foundation supporting underprivileged children')).toBe('nonprofit');
  });

  it('returns travel & tourism for travel agency', () => {
    expect(extractCategoryHint('travel agency offering adventure tours')).toBe('travel & tourism');
  });

  it('returns music & entertainment for band', () => {
    expect(extractCategoryHint('indie band promoting new album')).toBe('music & entertainment');
  });

  // Best-effort fallback
  it('returns a meaningful fallback for truly unknown prompts', () => {
    const result = extractCategoryHint('a bespoke thingamajig for widgets');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  // Priority: SITE_TYPE_KEYWORDS beats EXTENDED_CATEGORIES
  it('returns saas not ecommerce for "SaaS product" (regression)', () => {
    expect(extractCategoryHint('a SaaS product for team collaboration')).toBe('saas');
  });

  it('returns fitness not saas for "yoga platform"', () => {
    expect(extractCategoryHint('yoga platform with live streaming classes')).toBe('fitness & wellness');
  });
});

// ---------------------------------------------------------------------------
// generateLandingPage — error propagation (fetch mocked)
// ---------------------------------------------------------------------------

describe('generateLandingPage — error handling', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('throws with "401" in the message when the API key is invalid', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }));

    await expect(
      generateLandingPage('a simple landing page', {
        apiKey: 'sk-bad-key',
        model: 'openai/gpt-4o-mini',
      }),
    ).rejects.toThrow('401');
  });

  it('throws "All models failed" when every model in the race errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    }));

    await expect(
      generateLandingPage('a simple landing page', {
        apiKey: 'sk-test',
        models: ['openai/gpt-4o-mini', 'google/gemma-2-9b-it:free'],
      }),
    ).rejects.toThrow('All models failed');
  });
});

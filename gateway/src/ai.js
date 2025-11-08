//https://platform.openai.com/docs/bots/overview-of-openai-crawlers
export const OPENAI_CRAWLER_PATTERNS = [
    /gptbot/i,
    /chatgpt-user/i,
    /oai-searchbot/i,
  ];

//https://docs.perplexity.ai/guides/bots
export const PERPLEXITY_CRAWLER_PATTERNS = [
    /perplexitybot/i,
    /perplexity-user/i
];

//https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
export const CLAUDE_CRAWLER_PATTERNS = [
    /claudebot/i,
    /claude-user/i,
    /claude-searchbot/i
];

export const AI_CRAWLER_PATTERNS = [
    ...OPENAI_CRAWLER_PATTERNS,
    ...PERPLEXITY_CRAWLER_PATTERNS,
    ...CLAUDE_CRAWLER_PATTERNS
]

/*
 * Check if the request was initiated by an AI crawler.
 */
export function isRequestedFromAICrawler(request) {
  const userAgent = request.headers.get("user-agent") || "";
  return AI_CRAWLER_PATTERNS.some((pattern) => pattern.test(userAgent));
}


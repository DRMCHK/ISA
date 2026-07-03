// Word blacklist — add/remove words as needed
const WORD_BLACKLIST: string[] = [
  'badword1',
  'badword2',
  'slur1',
  // Add institution-specific banned words here
];

const BLACKLIST_REGEX = new RegExp(
  WORD_BLACKLIST.map((w) => `\\b${w}\\b`).join('|'),
  'gi'
);

export function containsBannedWords(text: string): boolean {
  if (WORD_BLACKLIST.length === 0) return false;
  return BLACKLIST_REGEX.test(text);
}

export function censorText(text: string): string {
  return text.replace(BLACKLIST_REGEX, (match) => '*'.repeat(match.length));
}

/**
 * Check a URL against Google Safe Browsing API.
 * Returns true if the URL is SAFE (not flagged).
 * Gracefully degrades if API key is missing.
 */
export async function isUrlSafe(url: string): Promise<boolean> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    // No API key configured — skip check (allow URL)
    return true;
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'isa-link', clientVersion: '2.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    if (!response.ok) return true; // API error → allow

    const data = (await response.json()) as { matches?: unknown[] };
    // If matches array exists and has items, URL is unsafe
    return !data.matches || data.matches.length === 0;
  } catch {
    // Network error → allow (fail open)
    return true;
  }
}

/**
 * Moderate a post. Returns flagged:true if content violates policy.
 */
export async function moderatePost(
  content: string | null,
  linkUrl: string | null
): Promise<{ flagged: boolean; reason?: string }> {
  if (content && containsBannedWords(content)) {
    return { flagged: true, reason: 'Banned words detected in content' };
  }

  if (linkUrl) {
    const safe = await isUrlSafe(linkUrl);
    if (!safe) {
      return { flagged: true, reason: 'URL flagged by Google Safe Browsing' };
    }
  }

  return { flagged: false };
}

// Content moderation: word blacklist + optional Google Safe Browsing API

const BLACKLIST = [
  'spam', 'scam', 'hack', 'phish', 'malware', 'virus',
  // Add more words as needed
];

export function containsBlacklistedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BLACKLIST.some((word) => lower.includes(word));
}

export async function checkUrlSafety(url: string): Promise<boolean> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) return true; // Degrade gracefully if not configured

  try {
    const res = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'isa-link', clientVersion: '2.0.0' },
          threatInfo: {
            threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    const data = await res.json() as { matches?: unknown[] };
    return !data.matches || data.matches.length === 0;
  } catch {
    return true; // Fail open — don't block content if API is down
  }
}

export function moderateContent(text: string): { flagged: boolean; reason?: string } {
  if (containsBlacklistedWords(text)) {
    return { flagged: true, reason: 'blacklisted_words' };
  }
  return { flagged: false };
}

const SUSPICIOUS_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'grabify.link', 'iplogger.org', 'iplogger.com', '2no.co',
  'bc.vc', 'adf.ly', 'sh.st', 'linkvertise.com',
];

const BLOCKED_KEYWORDS = [
  'porn', 'xxx', 'nude', 'naked', 'sex tape', 'casino', 'gambling',
  'hack password', 'steal account', 'phishing', 'malware', 'ransomware',
  'buy followers', 'free money', 'get rich quick', 'drug dealer',
  'hate speech', 'kill yourself', 'suicide pact',
];

const WARNING_KEYWORDS = [
  'password', 'credit card', 'ssn', 'social security',
  'wire transfer', 'bitcoin scam', 'click here now', 'urgent action',
  'verify your account', 'account suspended', 'winner selected',
];

const EDUCATIONAL_WHITELIST = [
  'edu', 'ac.uk', 'scholar.google', 'researchgate.net', 'arxiv.org',
  'ieee.org', 'acm.org', 'jstor.org', 'pubmed', 'doi.org',
  'linkedin.com', 'github.com', 'stackoverflow.com', 'wikipedia.org',
  'coursera.org', 'edx.org', 'khanacademy.org', 'mit.edu',
];

function extractUrls(text) {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  return text.match(urlRegex) || [];
}

function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function checkUrl(url) {
  const domain = getDomain(url);
  if (!domain) return { safe: false, reason: 'Invalid URL format', score: 1.0 };

  if (SUSPICIOUS_DOMAINS.some(d => domain.includes(d))) {
    return { safe: false, reason: 'Suspicious shortened or tracking URL', score: 0.9 };
  }

  const isEducational = EDUCATIONAL_WHITELIST.some(d => domain.includes(d));
  if (isEducational) return { safe: true, reason: 'Educational/trusted domain', score: 0 };

  if (domain.endsWith('.tk') || domain.endsWith('.ml') || domain.endsWith('.ga') || domain.endsWith('.cf')) {
    return { safe: false, reason: 'Free domain often used for phishing', score: 0.8 };
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return { safe: false, reason: 'Direct IP address link (suspicious)', score: 0.85 };
  }

  return { safe: true, reason: 'URL appears safe', score: 0.1 };
}

function checkTextContent(text) {
  const lower = text.toLowerCase();
  const flags = [];
  let score = 0;

  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      flags.push({ type: 'blocked_keyword', keyword });
      score += 0.4;
    }
  }

  for (const keyword of WARNING_KEYWORDS) {
    if (lower.includes(keyword)) {
      flags.push({ type: 'warning_keyword', keyword });
      score += 0.15;
    }
  }

  const urls = extractUrls(text);
  for (const url of urls) {
    const urlCheck = checkUrl(url);
    if (!urlCheck.safe) {
      flags.push({ type: 'suspicious_url', url, reason: urlCheck.reason });
      score += urlCheck.score;
    }
  }

  return {
    score: Math.min(score, 1.0),
    flags,
    blocked: score >= 0.6,
    flagged: score >= 0.3 && score < 0.6,
    clean: score < 0.3,
  };
}

function moderatePost({ content, linkUrl, mediaType }) {
  const flags = [];
  let totalScore = 0;

  const contentCheck = checkTextContent(content || '');
  flags.push(...contentCheck.flags);
  totalScore += contentCheck.score * 0.6;

  if (linkUrl) {
    const linkCheck = checkUrl(linkUrl);
    if (!linkCheck.safe) {
      flags.push({ type: 'suspicious_link', url: linkUrl, reason: linkCheck.reason });
      totalScore += linkCheck.score * 0.4;
    }
  }

  if (mediaType === 'link' && linkUrl) {
    const linkCheck = checkUrl(linkUrl);
    totalScore += linkCheck.score * 0.5;
  }

  totalScore = Math.min(totalScore, 1.0);

  let status = 'published';
  if (totalScore >= 0.6) status = 'removed';
  else if (totalScore >= 0.3) status = 'flagged';

  return {
    score: totalScore,
    flags,
    status,
    blocked: status === 'removed',
    flagged: status === 'flagged',
  };
}

function moderateSearchQuery(query) {
  const check = checkTextContent(query);
  return {
    allowed: !check.blocked,
    score: check.score,
    flags: check.flags,
    sanitized: check.blocked ? '' : query.trim(),
  };
}

module.exports = {
  moderatePost,
  moderateSearchQuery,
  checkTextContent,
  checkUrl,
  extractUrls,
};

const {
  moderatePost,
  moderateSearchQuery,
  checkTextContent,
  checkUrl,
  extractUrls,
} = require('../moderation');

describe('extractUrls', () => {
  test('should extract single URL from text', () => {
    const text = 'Check out https://example.com for more info';
    expect(extractUrls(text)).toEqual(['https://example.com']);
  });

  test('should extract multiple URLs from text', () => {
    const text = 'Visit https://google.com and http://github.com';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://google.com');
    expect(urls).toContain('http://github.com');
  });

  test('should return empty array when no URLs present', () => {
    const text = 'This is just plain text with no links';
    expect(extractUrls(text)).toEqual([]);
  });

  test('should handle URLs with paths and query parameters', () => {
    const text = 'Go to https://example.com/path?query=value&other=123';
    const urls = extractUrls(text);
    expect(urls).toHaveLength(1);
    expect(urls[0]).toBe('https://example.com/path?query=value&other=123');
  });
});

describe('getDomain (via checkUrl)', () => {
  test('should extract domain from URL', () => {
    const result = checkUrl('https://www.example.com/page');
    expect(result.safe).toBe(true);
  });

  test('should handle URL without www', () => {
    const result = checkUrl('https://example.com');
    expect(result.safe).toBe(true);
  });

  test('should return invalid for malformed URL', () => {
    const result = checkUrl('not-a-valid-url');
    expect(result.safe).toBe(false);
    expect(result.reason).toBe('Invalid URL format');
  });
});

describe('checkUrl', () => {
  test('should identify suspicious URL shorteners', () => {
    const suspiciousUrls = [
      'https://bit.ly/abc123',
      'https://tinyurl.com/test',
      'https://goo.gl/maps',
      'https://t.co/xyz',
    ];

    suspiciousUrls.forEach((url) => {
      const result = checkUrl(url);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('Suspicious shortened or tracking URL');
    });
  });

  test('should identify IP logger domains as suspicious', () => {
    const ipLoggerUrls = [
      'https://grabify.link/test',
      'https://iplogger.org/log',
      'https://iplogger.com/track',
      'https://2no.co/abc',
    ];

    ipLoggerUrls.forEach((url) => {
      const result = checkUrl(url);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('Suspicious shortened or tracking URL');
    });
  });

  test('should identify educational domains as safe', () => {
    const educationalUrls = [
      'https://mit.edu/course',
      'https://scholar.google.com/search',
      'https://github.com/repo',
      'https://stackoverflow.com/questions',
      'https://en.wikipedia.org/wiki',
    ];

    educationalUrls.forEach((url) => {
      const result = checkUrl(url);
      expect(result.safe).toBe(true);
      expect(result.reason).toBe('Educational/trusted domain');
    });
  });

  test('should identify free TLD domains as suspicious', () => {
    const freeTldUrls = [
      'https://example.tk/page',
      'https://site.ml/test',
      'https://domain.ga/file',
      'https://website.cf/info',
    ];

    freeTldUrls.forEach((url) => {
      const result = checkUrl(url);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('Free domain often used for phishing');
    });
  });

  test('should identify direct IP addresses as suspicious', () => {
    const ipUrls = [
      'http://192.168.1.1/admin',
      'https://10.0.0.1/login',
    ];

    ipUrls.forEach((url) => {
      const result = checkUrl(url);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('Direct IP address link (suspicious)');
    });
  });

  test('should mark normal domains as safe with low score', () => {
    const normalUrls = [
      'https://example.com',
      'https://mysite.org',
      'https://company.net/about',
    ];

    normalUrls.forEach((url) => {
      const result = checkUrl(url);
      expect(result.safe).toBe(true);
      expect(result.score).toBeLessThanOrEqual(0.1);
    });
  });
});

describe('checkTextContent', () => {
  test('should detect blocked keywords', () => {
    const texts = [
      'Check out this porn site and xxx content',
      'Join the casino now for gambling',
      'Learn how to hack password and steal account',
      'Buy followers cheap get rich quick drug dealer',
      'Hate speech kill yourself suicide pact',
    ];

    texts.forEach((text) => {
      const result = checkTextContent(text);
      expect(result.blocked).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.6);
    });
  });

  test('should detect warning keywords', () => {
    const texts = [
      'Enter your password here',
      'Provide credit card details',
      'Wire transfer required',
      'Your account suspended click here',
    ];

    texts.forEach((text) => {
      const result = checkTextContent(text);
      expect(result.flags.some((f) => f.type === 'warning_keyword')).toBe(true);
    });
  });

  test('should detect suspicious URLs in text', () => {
    const text = 'Click here to claim prize: https://bit.ly/free-money';
    const result = checkTextContent(text);
    expect(result.flags.some((f) => f.type === 'suspicious_url')).toBe(true);
    expect(result.blocked).toBe(true);
  });

  test('should return clean for normal text', () => {
    const text = 'Hello everyone! How are you doing today?';
    const result = checkTextContent(text);
    expect(result.clean).toBe(true);
    expect(result.score).toBe(0);
    expect(result.flags).toHaveLength(0);
  });

  test('should handle mixed content correctly', () => {
    const text = 'Hi friends! Check out https://github.com for code';
    const result = checkTextContent(text);
    expect(result.clean).toBe(true);
    expect(result.score).toBe(0);
  });

  test('should be case insensitive', () => {
    const text = 'CHECK OUT THIS CASINO AND PORN SITE';
    const result = checkTextContent(text);
    expect(result.blocked).toBe(true);
    expect(result.flags.some((f) => f.keyword === 'casino')).toBe(true);
  });
});

describe('moderatePost', () => {
  test('should publish clean posts', () => {
    const post = {
      content: 'Just had a great day at the park!',
      linkUrl: null,
      mediaType: 'text',
    };

    const result = moderatePost(post);
    expect(result.status).toBe('published');
    expect(result.blocked).toBe(false);
    expect(result.flagged).toBe(false);
  });

  test('should remove posts with blocked content', () => {
    const post = {
      content: 'Visit this casino porn site for free money get rich quick!!!',
      linkUrl: null,
      mediaType: 'text',
    };

    const result = moderatePost(post);
    expect(result.status).toBe('removed');
    expect(result.blocked).toBe(true);
  });

  test('should flag suspicious posts', () => {
    const post = {
      content: 'Urgent action required! Verify your account now. Wire transfer needed. Click here now winner selected.',
      linkUrl: null,
      mediaType: 'text',
    };

    const result = moderatePost(post);
    expect(result.status).toBe('flagged');
    expect(result.flagged).toBe(true);
  });

  test('should remove posts with suspicious links', () => {
    const post = {
      content: 'Check out this link',
      linkUrl: 'https://bit.ly/suspicious',
      mediaType: 'link',
    };

    const result = moderatePost(post);
    expect(result.status).toBe('removed');
    expect(result.blocked).toBe(true);
  });

  test('should handle posts with only link URL', () => {
    const post = {
      content: '',
      linkUrl: 'https://example.com/safe-page',
      mediaType: 'link',
    };

    const result = moderatePost(post);
    expect(result.status).toBe('published');
  });

  test('should calculate correct flags array', () => {
    const post = {
      content: 'Get rich quick with this drug dealer scheme and porn content',
      linkUrl: null,
      mediaType: 'text',
    };

    const result = moderatePost(post);
    expect(result.flags.length).toBeGreaterThan(0);
    expect(result.status).toBe('removed');
  });
});

describe('moderateSearchQuery', () => {
  test('should allow clean search queries', () => {
    const query = 'javascript tutorials';
    const result = moderateSearchQuery(query);
    expect(result.allowed).toBe(true);
    expect(result.sanitized).toBe(query);
  });

  test('should block inappropriate search queries', () => {
    const query = 'how to steal account and hack password';
    const result = moderateSearchQuery(query);
    expect(result.allowed).toBe(false);
    expect(result.sanitized).toBe('');
  });

  test('should sanitize blocked queries to empty string', () => {
    const query = 'porn xxx adult content';
    const result = moderateSearchQuery(query);
    expect(result.sanitized).toBe('');
  });

  test('should trim whitespace from queries', () => {
    const query = '  valid search  ';
    const result = moderateSearchQuery(query);
    expect(result.allowed).toBe(true);
    expect(result.sanitized).toBe('valid search');
  });
});

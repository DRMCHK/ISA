import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Strip all HTML tags from a string — replaces sanitize-html for plain-text use cases.
 * This is safe for server-side use and has zero dependencies.
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')        // remove all HTML tags
    .replace(/&amp;/g, '&')         // decode common HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?`~\-]).{12,}$/;

export function validateStrongPassword(password: string): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must include at least one number.';
  if (!/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?`~\-]/.test(password))
    return 'Password must include at least one special character.';
  return null;
}

export function getDmRoomId(userA: string, userB: string): string {
  return `dm:${[userA, userB].sort().join('-')}`;
}

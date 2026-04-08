export function getBaseUrl(): string {
  return process.env.CANONICAL_URL || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');
}

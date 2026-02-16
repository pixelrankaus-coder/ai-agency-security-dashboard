// URL normalization utility
// Strips protocol, www, and trailing slashes for consistent site storage

export function normalizeUrl(url: string): string {
  let normalized = url.trim().toLowerCase();

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, "");

  // Remove www.
  normalized = normalized.replace(/^www\./, "");

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, "");

  // Remove port if it's default (80 or 443)
  normalized = normalized.replace(/:80$/, "").replace(/:443$/, "");

  return normalized;
}

export function addProtocol(url: string): string {
  const normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    return `https://${normalized}`;
  }
  return normalized;
}

const USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,37}$/;

export function sanitizeUsername(raw: string): string {
  const trimmed = raw.trim().slice(0, 39);
  if (!USERNAME_REGEX.test(trimmed)) {
    throw new Error("INVALID_USERNAME");
  }
  return trimmed;
}

export function sanitizeTheme(raw: string): string {
  // Only allow alphanumeric + underscore
  return raw.replace(/[^a-z0-9_]/gi, "").slice(0, 32).toLowerCase();
}

export function parseHideList(raw: string): Set<string> {
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  etag?: string;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTLMs: number;

  constructor(defaultTTLSeconds = 1800) {
    this.defaultTTLMs = defaultTTLSeconds * 1000;
  }

  get<T>(key: string): { data: T; etag?: string } | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return { data: entry.data, etag: entry.etag };
  }

  set<T>(key: string, data: T, ttlSeconds?: number, etag?: string): void {
    const ttl = (ttlSeconds ?? this.defaultTTLMs / 1000) * 1000;
    this.store.set(key, { data, expiresAt: Date.now() + ttl, etag });
  }

  getEtag(key: string): string | undefined {
    return (this.store.get(key) as CacheEntry<unknown> | undefined)?.etag;
  }

  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

export const cache = new InMemoryCache(1800);

interface RequestRecord {
  count: number;
  windowStart: number;
}

class RateLimiter {
  private records = new Map<string, RequestRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 60, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  isAllowed(ip: string): boolean {
    const now = Date.now();
    const record = this.records.get(ip);

    if (!record || now - record.windowStart > this.windowMs) {
      this.records.set(ip, { count: 1, windowStart: now });
      return true;
    }

    if (record.count >= this.maxRequests) return false;

    record.count++;
    return true;
  }

  prune(): void {
    const now = Date.now();
    for (const [ip, record] of this.records.entries()) {
      if (now - record.windowStart > this.windowMs) this.records.delete(ip);
    }
  }
}

export const rateLimiter = new RateLimiter(30, 60);

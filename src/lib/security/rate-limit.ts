type BucketEntry = {
  count: number;
  resetAt: number;
};

class RateLimitError extends Error {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

type RateLimitInput = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
};

const globalStore = globalThis as unknown as {
  __billetoRateLimitStore?: Map<string, BucketEntry>;
};

const store = globalStore.__billetoRateLimitStore ?? new Map<string, BucketEntry>();

if (!globalStore.__billetoRateLimitStore) {
  globalStore.__billetoRateLimitStore = store;
}

function nowMs() {
  return Date.now();
}

function composeKey(input: RateLimitInput) {
  return `${input.bucket}:${input.key}`;
}

export function consumeRateLimit(input: RateLimitInput) {
  const key = composeKey(input);
  const now = nowMs();
  const prev = store.get(key);

  if (!prev || prev.resetAt <= now) {
    const next: BucketEntry = {
      count: 1,
      resetAt: now + input.windowMs,
    };
    store.set(key, next);
    return {
      allowed: true,
      remaining: Math.max(input.limit - 1, 0),
      retryAfter: Math.ceil(input.windowMs / 1000),
      resetAt: next.resetAt,
    };
  }

  if (prev.count >= input.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(Math.ceil((prev.resetAt - now) / 1000), 1),
      resetAt: prev.resetAt,
    };
  }

  prev.count += 1;
  store.set(key, prev);

  return {
    allowed: true,
    remaining: Math.max(input.limit - prev.count, 0),
    retryAfter: Math.max(Math.ceil((prev.resetAt - now) / 1000), 1),
    resetAt: prev.resetAt,
  };
}

export function enforceRateLimit(input: RateLimitInput) {
  const result = consumeRateLimit(input);
  if (!result.allowed) {
    throw new RateLimitError("Has superado el límite de solicitudes. Intentá nuevamente en unos segundos.", result.retryAfter);
  }
  return result;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export { RateLimitError };

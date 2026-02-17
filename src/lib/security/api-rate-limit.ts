import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";

type ApiRateLimitOptions = {
  bucket: string;
  key: string;
  limit: number;
  windowMs: number;
};

export function checkApiRateLimit(options: ApiRateLimitOptions) {
  const result = consumeRateLimit(options);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Has superado el límite de solicitudes. Intentá nuevamente en unos segundos.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.retryAfter),
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}

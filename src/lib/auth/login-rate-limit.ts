import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export function createLoginRateLimitKey(
  normalizedEmail: string,
  request: Request,
) {
  // Hosting platforms append the connecting address to x-forwarded-for.
  // Combining it with the normalized email avoids globally locking an account.
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const clientAddress =
    forwardedFor || request.headers.get("x-real-ip") || "unknown";

  return createHash("sha256")
    .update(`${normalizedEmail}:${clientAddress}`)
    .digest("hex");
}

export async function isLoginAllowed(key: string) {
  const state = await prisma.loginRateLimit.findUnique({
    where: { key },
  });

  if (!state) {
    return true;
  }

  const now = Date.now();

  if (state.blockedUntil && state.blockedUntil.getTime() > now) {
    return false;
  }

  if (state.windowStartedAt.getTime() <= now - LOGIN_WINDOW_MS) {
    return true;
  }

  return state.failedAttempts < MAX_FAILED_ATTEMPTS;
}

export async function recordLoginFailure(key: string) {
  const now = new Date();
  const windowCutoff = new Date(now.getTime() - LOGIN_WINDOW_MS);
  const blockedUntil = new Date(now.getTime() + LOGIN_BLOCK_MS);

  // One PostgreSQL upsert makes failure increments atomic across instances.
  await prisma.$executeRaw`
    INSERT INTO "LoginRateLimit" (
      "key",
      "failedAttempts",
      "windowStartedAt",
      "blockedUntil",
      "updatedAt"
    )
    VALUES (${key}, 1, ${now}, NULL, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "failedAttempts" = CASE
        WHEN "LoginRateLimit"."windowStartedAt" <= ${windowCutoff}
          THEN 1
        ELSE "LoginRateLimit"."failedAttempts" + 1
      END,
      "windowStartedAt" = CASE
        WHEN "LoginRateLimit"."windowStartedAt" <= ${windowCutoff}
          THEN ${now}
        ELSE "LoginRateLimit"."windowStartedAt"
      END,
      "blockedUntil" = CASE
        WHEN "LoginRateLimit"."windowStartedAt" <= ${windowCutoff}
          THEN NULL
        WHEN "LoginRateLimit"."failedAttempts" + 1 >= ${MAX_FAILED_ATTEMPTS}
          THEN ${blockedUntil}
        ELSE "LoginRateLimit"."blockedUntil"
      END,
      "updatedAt" = ${now}
  `;
}

export async function clearLoginFailures(key: string) {
  await prisma.loginRateLimit.deleteMany({
    where: { key },
  });
}

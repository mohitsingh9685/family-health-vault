import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import {
  clearLoginFailures,
  createLoginRateLimitKey,
  isLoginAllowed,
  recordLoginFailure,
} from "@/lib/auth/login-rate-limit";
import { hashPassword, verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

// Unknown users still perform one real bcrypt comparison, reducing the email
// enumeration signal created by returning before password verification.
const dummyPasswordHash = hashPassword(
  "family-health-vault-invalid-credential",
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      // [Login API] Defines the credentials accepted by Auth.js.
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials, request) {
        const result = loginSchema.safeParse(credentials);

        if (!result.success) {
          return null;
        }

        const { email, password } = result.data;
        const rateLimitKey = createLoginRateLimitKey(email, request);

        if (!(await isLoginAllowed(rateLimitKey))) {
          return null;
        }

        // [Prisma] Find the normalized account stored in PostgreSQL.
        const user = await prisma.user.findUnique({
          where: { email },
        });

        const passwordMatches = await verifyPassword(
          password,
          user?.passwordHash ?? (await dummyPasswordHash),
        );

        if (!user || !passwordMatches) {
          await recordLoginFailure(rateLimitKey);
          return null;
        }

        await clearLoginFailures(rateLimitKey);

        // [Auth.js] Pass the database user ID into the authenticated user.
        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],

  callbacks: {
    // [Auth.js JWT] Persist the database user ID in the JWT.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },

    // [Auth.js Session] Expose the database user ID to server-side code.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
      }

      return session;
    },
  },
});
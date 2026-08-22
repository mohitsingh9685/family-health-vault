import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      // Login uses our existing email/password system
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        // Find the existing user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Reject invalid credentials
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
          return null;
        }

        // Auth.js creates the authenticated session from this user
        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
});
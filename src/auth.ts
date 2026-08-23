import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      // [Login API] Defines the credentials accepted by Auth.js.
      credentials: {
        email: {},
        password: {},
      },

      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        // [Prisma] Find the user stored in PostgreSQL.
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // Reject invalid credentials.
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
          return null;
        }

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
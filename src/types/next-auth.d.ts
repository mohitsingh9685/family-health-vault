import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    // [src/auth.ts] Database user ID returned during authentication.
    id: string;
  }

  interface Session {
    user: {
      // [src/auth.ts] Database user ID exposed through the session.
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    // [src/auth.ts] Database user ID persisted in the JWT.
    id: string;
  }
}
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      id: "credentials",
      name: "Email/Password",
      credentials: {
        contact: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const contact = credentials?.contact as string;
        const password = credentials?.password as string;

        if (!contact || !password) return null;

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);

        const user = await prisma.user.findFirst({
          where: isEmail ? { email: contact } : { phone: contact },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isVerified) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email ?? undefined,
          image: user.avatarUrl ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id as string;
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers, auto-verify and mark as verified
      if (account?.provider === "google") {
        if (user.email) {
          await prisma.user.upsert({
            where: { email: user.email },
            update: { isVerified: true, authProvider: "google" },
            create: {
              email: user.email,
              name: user.name,
              avatarUrl: user.image,
              authProvider: "google",
              isVerified: true,
            },
          });
        }
      }
      return true;
    },
  },
});

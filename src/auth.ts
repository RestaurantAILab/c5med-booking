import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAllowedEmails(): string[] {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/admin/signin",
    error: "/admin/signin",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const allowed = getAllowedEmails();
      if (allowed.length === 0) return false;
      return allowed.includes(email);
    },
    async session({ session }) {
      return session;
    },
  },
});

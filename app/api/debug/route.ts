export async function GET() {
  return Response.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasAuthSecret: !!(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    nextAuthUrlValue: process.env.NEXTAUTH_URL || "MISSING",
  });
}

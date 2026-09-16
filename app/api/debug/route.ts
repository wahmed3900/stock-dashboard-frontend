export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";

  return Response.json({
    clientId_length: clientId.length,
    clientId_startsWithQuote: clientId.startsWith('"') || clientId.startsWith("'"),
    clientId_hasTrailingSpace: clientId !== clientId.trim(),
    clientSecret_length: clientSecret.length,
    clientSecret_startsWithQuote: clientSecret.startsWith('"') || clientSecret.startsWith("'"),
    clientSecret_hasTrailingSpace: clientSecret !== clientSecret.trim(),
    authSecret_length: authSecret.length,
    authSecret_hasTrailingSpace: authSecret !== authSecret.trim(),
    nextAuthUrl_exact: JSON.stringify(nextAuthUrl),
  });
}

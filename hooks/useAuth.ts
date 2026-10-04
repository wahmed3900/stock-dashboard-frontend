"use client";

import { useSession } from "next-auth/react";

/**
 * Thin wrapper around next-auth's useSession that exposes a Firebase-style
 * `user` object so components can use `user?.uid` as a stable user key.
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const email = session?.user?.email ?? null;
  // Derive a stable uid from the email (same transform used across the app)
  const uid = email ? email.replace(/[@.]/g, "_") : null;

  const user = email ? { uid, email, name: session?.user?.name ?? null } : null;

  return { user, loading: status === "loading" };
}

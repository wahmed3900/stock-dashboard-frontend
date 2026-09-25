"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs text-white/40">Loading…</span>;
  }

  if (session) {
    return (
      <div className="flex min-w-0 items-center gap-3">
        <span className="min-w-0 truncate text-xs text-white/60" title={session.user?.email ?? ""}>{session.user?.email}</span>
        <button
          onClick={() => signOut()}
          className="shrink-0 whitespace-nowrap rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 transition hover:border-white/20 hover:text-white"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80 transition hover:border-white/20 hover:bg-white/[0.06]"
    >
      Sign in with Google
    </button>
  );
}

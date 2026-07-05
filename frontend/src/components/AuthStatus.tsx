"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut, type AuthUser } from "@/lib/api";

export default function AuthStatus() {
  const [user, setUser] = useState<AuthUser | null | "loading">("loading");

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  if (user === "loading") {
    return <div className="h-8" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 text-sm text-zinc-600">
        <span>Signed in as {user.email}</span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-zinc-300 px-3 py-1 font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <Link href="/signin" className="font-medium text-zinc-700 hover:underline">
        Sign in
      </Link>
      <Link href="/signup" className="font-medium text-zinc-700 hover:underline">
        Sign up
      </Link>
    </div>
  );
}

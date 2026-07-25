"use client";

import { useState } from "react";

import { authClient } from "../lib/auth-client";
import { useSession } from "../hooks/use-session";

export function AuthControls() {
  const [pending, setPending] = useState(false);
  const { data: session, isPending: sessionPending } = useSession();

  async function signIn() {
    setPending(true);
    await authClient.signIn.social({
      callbackURL: "/",
      provider: "github",
    });
    setPending(false);
  }

  async function signOut() {
    setPending(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => window.location.reload(),
      },
    });
    setPending(false);
  }

  return (
    <div className="auth-controls">
      {session?.user ? (
        <>
          <span>{session.user.email}</span>
          <button disabled={pending} onClick={signOut} type="button">
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : (
        <button
          disabled={pending || sessionPending}
          onClick={signIn}
          type="button"
        >
          {sessionPending
            ? "Loading session…"
            : pending
              ? "Redirecting…"
              : "Sign in with GitHub"}
        </button>
      )}
    </div>
  );
}

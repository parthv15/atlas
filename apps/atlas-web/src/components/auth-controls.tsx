"use client";

import { useState } from "react";

import { useSession } from "../hooks/use-session";
import { authClient } from "../lib/auth-client";
import { Button } from "./ui/button";

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
    <div className="flex items-center gap-3">
      {session?.user ? (
        <>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.email}
          </span>
          <Button
            disabled={pending}
            onClick={signOut}
            type="button"
            variant="outline"
          >
            {pending ? "Signing out…" : "Sign out"}
          </Button>
        </>
      ) : (
        <Button
          disabled={pending || sessionPending}
          onClick={signIn}
          type="button"
          variant="outline"
        >
          {sessionPending
            ? "Loading session…"
            : pending
              ? "Redirecting…"
              : "Sign in with GitHub"}
        </Button>
      )}
    </div>
  );
}

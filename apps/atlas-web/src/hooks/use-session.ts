"use client";

import { authClient } from "../lib/auth-client";

/**
 * Provides the current Better Auth session to client components.
 *
 * Better Auth owns the shared client-side session store, so consumers do not
 * need to be wrapped in an additional React context provider.
 */
export function useSession() {
  return authClient.useSession();
}

import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "./auth";

/**
 * Returns the Better Auth session associated with the current server request.
 *
 * React's cache deduplicates calls made during the same server render.
 */
export const getServerSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  }),
);

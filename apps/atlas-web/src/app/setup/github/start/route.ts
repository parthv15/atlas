import { randomBytes } from "node:crypto";

import { readWebEnvironment } from "@atlas/config";
import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/get-server-session";
import {
  INSTALLATION_STATE_COOKIE,
  INSTALLATION_STATE_TTL_SECONDS,
} from "@/lib/installation-state";

/**
 * Starts the GitHub App installation.
 *
 * Issues a single-use state nonce before handing the browser to GitHub, so the
 * eventual setup callback can be tied back to this session.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.redirect(
      new URL("/?installation_error=unauthorized", request.url),
    );
  }

  const state = randomBytes(32).toString("hex");
  const { GITHUB_APP_SLUG } = readWebEnvironment();

  const installUrl = new URL(
    `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`,
  );
  installUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(installUrl);

  response.cookies.set(INSTALLATION_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: INSTALLATION_STATE_TTL_SECONDS,
  });

  return response;
}

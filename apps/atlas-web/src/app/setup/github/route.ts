import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/get-server-session";
import { completeInstallation } from "@/lib/indexer-client";
import {
  INSTALLATION_STATE_COOKIE,
  statesMatch,
} from "@/lib/installation-state";

function backTo(request: NextRequest, query: string): NextResponse {
  const response = NextResponse.redirect(new URL(`/?${query}`, request.url));

  // The nonce is single-use regardless of how this callback turns out.
  response.cookies.delete(INSTALLATION_STATE_COOKIE);

  return response;
}

/**
 * The GitHub App setup URL.
 *
 * Everything arriving here is attacker-controllable, so this handler only
 * establishes that a signed-in user in *this* browser started the install. It
 * makes no judgement about the installation itself - Atlas Indexer verifies
 * that with GitHub directly.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return backTo(request, "installation_error=unauthorized");
  }

  const expectedState = request.cookies.get(INSTALLATION_STATE_COOKIE)?.value;
  const parameters = request.nextUrl.searchParams;

  if (!statesMatch(expectedState, parameters.get("state"))) {
    return backTo(request, "installation_error=invalid_request");
  }

  // An organisation member can request the App without being able to install
  // it. There is no installation to verify until an owner approves.
  if (parameters.get("setup_action") === "request") {
    return backTo(request, "installation=pending");
  }

  const installationId = Number(parameters.get("installation_id"));

  if (!Number.isInteger(installationId) || installationId <= 0) {
    return backTo(request, "installation_error=invalid_request");
  }

  const result = await completeInstallation({
    installationId,
    atlasAccountId: session.user.id,
  });

  if (!result.ok) {
    return backTo(request, `installation_error=${result.code}`);
  }

  return backTo(
    request,
    result.data.installation.suspendedAt
      ? "installation=suspended"
      : "installation=connected",
  );
}

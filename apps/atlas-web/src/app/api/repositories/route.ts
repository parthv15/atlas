import { type NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/get-server-session";
import {
  type InstallationFailureCode,
  listRepositories,
} from "@/lib/indexer-client";

const STATUS_BY_CODE: Record<InstallationFailureCode, number> = {
  unauthorized: 401,
  invalid_request: 400,
  installation_not_found: 404,
  installation_not_owned: 403,
  installation_conflict: 409,
  github_unavailable: 502,
  indexer_unavailable: 502,
};

function errorResponse(code: InstallationFailureCode, message: string) {
  return NextResponse.json(
    { error: { code, message } },
    { status: STATUS_BY_CODE[code] },
  );
}

/**
 * `GET /api/repositories?installationId=123`
 *
 * A manual smoke-test route for the web -> indexer -> GitHub path: it lists
 * the repositories a claimed installation can see. Not linked from the UI.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession();

  if (!session) {
    return errorResponse("unauthorized", "Sign in first.");
  }

  const installationId = Number(
    request.nextUrl.searchParams.get("installationId"),
  );

  if (!Number.isInteger(installationId) || installationId <= 0) {
    return errorResponse(
      "invalid_request",
      "installationId must be a positive integer query parameter.",
    );
  }

  const result = await listRepositories({
    installationId,
    atlasAccountId: session.user.id,
  });

  if (!result.ok) {
    return errorResponse(result.code, "Failed to list repositories.");
  }

  return NextResponse.json(result.data);
}

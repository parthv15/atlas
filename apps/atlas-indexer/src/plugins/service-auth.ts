import { createHash, timingSafeEqual } from "node:crypto";

import type { ErrorResponse } from "@atlas/contracts";
import type { FastifyReply, FastifyRequest } from "fastify";

const BEARER_PREFIX = "Bearer ";

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/**
 * Guards Atlas-internal commands with the shared service credential.
 *
 * Both values are hashed before comparison so the check runs in constant time
 * and reveals nothing about the expected token's length.
 */
export function createServiceAuthHook(serviceToken: string) {
  const expected = digest(serviceToken);

  return async function requireServiceToken(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply | undefined> {
    const header = request.headers.authorization;
    const presented =
      header && header.startsWith(BEARER_PREFIX)
        ? header.slice(BEARER_PREFIX.length)
        : "";

    if (timingSafeEqual(digest(presented), expected)) {
      return undefined;
    }

    const body: ErrorResponse = {
      error: {
        code: "unauthorized",
        message: "A valid Atlas service token is required.",
      },
    };

    // Returning the reply halts the request lifecycle before the handler runs.
    return reply.code(401).send(body);
  };
}

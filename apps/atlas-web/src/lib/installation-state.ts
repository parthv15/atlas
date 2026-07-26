import "server-only";

/**
 * Name of the cookie holding the installation state nonce.
 *
 * GitHub echoes the `state` we put on the installation URL back to the setup
 * URL. Comparing it to this cookie proves the callback belongs to the browser
 * that started the install, rather than to a link someone was handed.
 */
export const INSTALLATION_STATE_COOKIE = "atlas_github_install_state";

/** Long enough to pick repositories on GitHub, short enough to be single-use. */
export const INSTALLATION_STATE_TTL_SECONDS = 15 * 60;

/**
 * Compares two nonces without leaking their contents through timing.
 *
 * Both are hex strings of known equal length in practice, but the length check
 * runs first so `timingSafeEqual` is never handed mismatched buffers.
 */
export function statesMatch(
  expected: string | undefined,
  presented: string | null,
): boolean {
  if (!expected || !presented || expected.length !== presented.length) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ presented.charCodeAt(index);
  }

  return difference === 0;
}

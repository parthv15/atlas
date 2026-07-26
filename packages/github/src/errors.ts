/**
 * Raised when GitHub could not be reached, or answered with a status that does
 * not carry a meaningful domain answer.
 *
 * Callers map this to a gateway error rather than treating it as a negative
 * result, so that a GitHub outage never looks like "this installation does not
 * exist".
 */
export class GitHubUnavailableError extends Error {
  readonly status: number | undefined;

  constructor(
    message: string,
    options?: { cause?: unknown; status?: number | undefined },
  ) {
    super(message, options?.cause === undefined ? {} : { cause: options.cause });
    this.name = "GitHubUnavailableError";
    this.status = options?.status;
  }
}

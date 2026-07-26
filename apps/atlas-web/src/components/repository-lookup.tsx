"use client";

import { useState } from "react";

import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";

interface RepositoryResult {
  id: number;
  fullName: string;
  private: boolean;
}

/**
 * A manual check for the web -> indexer -> GitHub path, not a feature: enter
 * an installation id, fetch what it can see. The dashboard that lists a
 * user's own installations without asking them to paste an id belongs to a
 * later phase.
 */
export function RepositoryLookup() {
  const [installationId, setInstallationId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<RepositoryResult[] | null>(
    null,
  );

  async function fetchRepositories() {
    setPending(true);
    setError(null);
    setRepositories(null);

    try {
      // A same-origin request, so the browser attaches the session cookie
      // automatically - this route reads it via getServerSession(), the same
      // way any other page does.
      const response = await fetch(
        `/api/repositories?installationId=${encodeURIComponent(installationId)}`,
      );
      const payload: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: { message?: unknown } }).error
            ?.message === "string"
            ? (payload as { error: { message: string } }).error.message
            : `Request failed (${response.status})`;

        setError(message);
        return;
      }

      const { repositories: found } = payload as {
        repositories: RepositoryResult[];
      };

      setRepositories(found);
    } catch {
      setError("The request could not be completed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="bg-card/75 backdrop-blur" aria-label="Repository lookup">
      <CardHeader>
        <CardTitle>List repositories</CardTitle>
        <CardDescription className="mt-1">
          Enter an installation id to fetch what Atlas can see through it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            inputMode="numeric"
            onChange={(event) => setInstallationId(event.target.value)}
            placeholder="Installation id"
            value={installationId}
          />
          <Button
            disabled={pending || installationId.trim() === ""}
            onClick={fetchRepositories}
            type="button"
          >
            {pending ? "Listing…" : "List repositories"}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {repositories ? (
          repositories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This installation has no accessible repositories.
            </p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {repositories.map((repository) => (
                <li
                  key={repository.id}
                  className="flex items-center justify-between py-2"
                >
                  <span>{repository.fullName}</span>
                  <span className="text-muted-foreground">
                    {repository.private ? "private" : "public"}
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}

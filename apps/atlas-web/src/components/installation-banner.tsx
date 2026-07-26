import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "error";

interface Notice {
  tone: Tone;
  title: string;
  detail: string;
}

const OUTCOMES: Record<string, Notice> = {
  connected: {
    tone: "success",
    title: "GitHub connected",
    detail:
      "Atlas verified the installation with GitHub and linked it to your account.",
  },
  pending: {
    tone: "info",
    title: "Waiting on an organisation owner",
    detail:
      "Your request to install Atlas was sent. It will connect once an owner approves it.",
  },
  suspended: {
    tone: "info",
    title: "Installation suspended",
    detail:
      "Atlas recognised this installation, but GitHub has it suspended, so it grants no access yet.",
  },
};

const FAILURES: Record<string, Notice> = {
  unauthorized: {
    tone: "error",
    title: "Sign in first",
    detail: "Your session expired before the installation could be recorded.",
  },
  invalid_request: {
    tone: "error",
    title: "Installation could not be verified",
    detail:
      "This callback did not match the installation you started. Begin again from Atlas.",
  },
  installation_not_found: {
    tone: "error",
    title: "GitHub does not recognise this installation",
    detail: "It may have been uninstalled. Try installing Atlas again.",
  },
  installation_not_owned: {
    tone: "error",
    title: "That installation belongs to someone else",
    detail:
      "It is installed on a different GitHub account than the one you signed in with.",
  },
  installation_conflict: {
    tone: "error",
    title: "Already connected elsewhere",
    detail: "Another Atlas account has already claimed this installation.",
  },
  github_unavailable: {
    tone: "error",
    title: "GitHub did not respond",
    detail: "Atlas could not reach GitHub to verify the installation. Retry shortly.",
  },
  indexer_unavailable: {
    tone: "error",
    title: "Atlas Indexer is unreachable",
    detail: "The installation was not recorded. Retry once the service is back.",
  },
};

const TONE_CLASSES: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  error: "border-destructive/40 bg-destructive/10 text-red-200",
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function InstallationBanner({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const outcome = first(searchParams.installation);
  const failure = first(searchParams.installation_error);

  const notice =
    (outcome ? OUTCOMES[outcome] : undefined) ??
    (failure ? (FAILURES[failure] ?? FAILURES.indexer_unavailable) : undefined);

  if (!notice) {
    return null;
  }

  return (
    <div
      role="status"
      className={cn(
        "mt-8 rounded-xl border px-4 py-3 text-sm",
        TONE_CLASSES[notice.tone],
      )}
    >
      <p className="font-semibold">{notice.title}</p>
      <p className="mt-1 opacity-80">{notice.detail}</p>
    </div>
  );
}

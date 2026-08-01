"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { completeOnboarding, type OnboardingState } from "./actions";

const initialState: OnboardingState = {};

export function OnboardingForm() {
  const [state, action, pending] = useActionState(
    completeOnboarding,
    initialState,
  );

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="workspaceName">
          Workspace name
        </label>
        <Input
          autoComplete="organization"
          autoFocus
          disabled={pending}
          id="workspaceName"
          maxLength={80}
          minLength={2}
          name="workspaceName"
          placeholder="Acme Engineering"
          required
        />
        <p className="text-sm text-muted-foreground">
          Atlas will create a URL-friendly workspace address from this name.
        </p>
      </div>

      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating workspace…" : "Create workspace"}
      </Button>
    </form>
  );
}

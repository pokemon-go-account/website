"use client";

import { useActionState } from "react";
import { loginUser } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginUser, { success: false, error: null });

  return (
    <form action={formAction} className="space-y-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
          {state.error}
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" required placeholder="name@example.com" className="bg-muted/50 border-border" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required className="bg-muted/50 border-border" />
      </div>
      <Button type="submit" className="w-full font-medium" disabled={isPending}>
        {isPending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerUser, { success: false, error: null });

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=true");
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
          {state.error}
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" type="text" required placeholder="Sourav Jha" className="bg-muted/50 border-border" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" required placeholder="name@example.com" className="bg-muted/50 border-border" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required className="bg-muted/50 border-border" />
      </div>
      <Button type="submit" className="w-full font-medium" disabled={isPending}>
        {isPending ? "Creating account..." : "Sign Up"}
      </Button>
    </form>
  );
}
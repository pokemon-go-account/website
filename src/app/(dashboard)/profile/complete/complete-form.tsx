"use client";

import { useActionState, useEffect, useState } from "react";
import { completeUserProfile } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

export function CompleteProfileForm() {
  const [state, formAction, isPending] = useActionState(completeUserProfile, {
    success: false,
    error: null,
  } as any);
  const { update } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (state.success && !isRedirecting) {
      setIsRedirecting(true);
      update({ isOnboarded: true, role: "USER" }).then(() => {
        window.location.href = "/auctions";
      });
    }
  }, [state.success, update, isRedirecting]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 leading-snug">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Your full name"
          className="bg-muted/50 border-border text-sm"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="telegramUsername">Telegram Username</Label>
        <Input
          id="telegramUsername"
          name="telegramUsername"
          type="text"
          required
          placeholder="@yourhandle"
          className="bg-muted/50 border-border text-sm"
        />
        <p className="text-[10px] text-muted-foreground leading-normal">
          Required to receive auction notifications and order updates.
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="w-full font-medium mt-6">
        {isPending ? "Finalizing Profile..." : "Enter the Exchange →"}
      </Button>
    </form>
  );
}

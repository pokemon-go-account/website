"use client";

import { useActionState, useEffect } from "react";
import { completeUserProfile } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CompleteProfileForm() {
  const [state, formAction, isPending] = useActionState(completeUserProfile, { success: false, error: null });

  useEffect(() => {
    if (state.success) {
      alert("Profile finalized! Welcome aboard.");
      // Hard refresh to force session token updating with new isOnboarded status
      window.location.href = "/auctions";
    }
  }, [state.success]);

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
          placeholder="Sourav Jha" 
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
      </div>

      <div className="space-y-1">
        <Label htmlFor="role">Sign up as</Label>
        <select
          id="role"
          name="role"
          required
          className="flex h-9 w-full rounded-md border border-border bg-muted/50 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground cursor-pointer"
        >
          <option value="USER" className="bg-zinc-950 text-white">Bidder (Purchase Trainer Accounts)</option>
          <option value="SELLER" className="bg-zinc-950 text-white">Seller (List Trainer Accounts)</option>
        </select>
      </div>

      <Button type="submit" disabled={isPending} className="w-full font-medium mt-6">
        {isPending ? "Finalizing Profile..." : "Finish Onboarding"}
      </Button>
    </form>
  );
}

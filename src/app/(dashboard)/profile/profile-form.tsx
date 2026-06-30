"use client";

import { useActionState, useEffect } from "react";
import { updateUserProfileTelegram } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  currentTelegram: string;
}

export function ProfileForm({ currentTelegram }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateUserProfileTelegram, { success: false, error: null });

  useEffect(() => {
    if (state.success) {
      alert("Telegram handle successfully updated!");
      window.location.reload();
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded bg-destructive/10 p-2.5 text-[11px] text-destructive border border-destructive/20 leading-tight">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="telegramUsername" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Update Telegram Username
        </Label>
        <div className="flex gap-2">
          <Input
            id="telegramUsername"
            name="telegramUsername"
            type="text"
            required
            defaultValue={currentTelegram}
            placeholder="@yourname"
            className="flex-1 h-9 bg-muted/40 border-border text-xs focus:outline-none text-foreground"
          />
          <Button type="submit" disabled={isPending} className="h-9 text-xs font-semibold px-4 cursor-pointer bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/50 text-white">
            {isPending ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>
    </form>
  );
}

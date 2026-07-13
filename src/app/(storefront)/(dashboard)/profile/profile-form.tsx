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
        <div className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 leading-tight">
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="telegramUsername" className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
            className="flex-1 h-8 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus-visible:ring-zinc-900/10 rounded-md"
          />
          <Button type="submit" disabled={isPending} className="h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer shrink-0">
            {isPending ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>
    </form>
  );
}

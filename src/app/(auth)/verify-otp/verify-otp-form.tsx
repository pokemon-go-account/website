"use client";

import { useActionState, useEffect, useState } from "react";
import { verifyRegisterOtp, resendRegisterOtp } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { RefreshCw, Send, CheckCircle2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export function VerifyOtpForm() {
  const router = useRouter();
  const { update } = useSession();
  const [state, formAction, isPending] = useActionState(verifyRegisterOtp, {
    success: false,
    error: null,
  } as any);

  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle successful verification redirection
  useEffect(() => {
    if (state.success) {
      update({ isEmailVerified: true }).then(() => {
        window.location.href = "/profile/complete";
      });
    }
  }, [state.success, update]);

  const handleResend = async () => {
    setResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const res = await resendRegisterOtp();
      if (res.success) {
        setResendSuccess(true);
        setCooldown(60);
      } else {
        setResendError(res.error || "Failed to resend verification code.");
      }
    } catch (err: any) {
      setResendError(err.message || "Failed to resend verification code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages */}
      {state.error && (
        <div className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 leading-snug flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {resendError && (
        <div className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 leading-snug flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{resendError}</span>
        </div>
      )}

      {resendSuccess && (
        <div className="rounded-md bg-emerald-500/5 p-3 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 leading-snug flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Verification code resent! Check your inbox (including spam).</span>
        </div>
      )}

      {state.success ? (
        <div className="rounded-md bg-emerald-500/5 p-4 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 text-center flex flex-col items-center gap-2 font-medium">
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          <span className="font-semibold text-sm">Email Verified Successfully!</span>
          <span className="text-zinc-550 dark:text-zinc-400">Redirecting to profile setup...</span>
        </div>
      ) : (
        <form action={formAction} className="space-y-5 text-left">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              6-Digit Verification Code
            </Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="e.g. 123456"
              className="h-8 text-center text-sm font-semibold tracking-widest bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] focus-visible:ring-zinc-900/10 rounded-md transition-all shadow-xs"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-1 leading-relaxed font-medium">
              Please check your registered email inbox (and spam folder) for the 6-digit activation code we sent you.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || resending}
            className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer mt-2"
          >
            {isPending ? "Verifying..." : "Verify Code →"}
          </Button>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || isPending || cooldown > 0}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {cooldown > 0 ? `Resend Code in ${cooldown}s` : "Resend Verification Code"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

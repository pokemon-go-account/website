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
        <div className="rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 leading-snug flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {resendError && (
        <div className="rounded-xl bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 leading-snug flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{resendError}</span>
        </div>
      )}

      {resendSuccess && (
        <div className="rounded-xl bg-emerald-500/10 p-3.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 leading-snug flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Verification code resent! Check your inbox (including spam).</span>
        </div>
      )}

      {state.success ? (
        <div className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-center flex flex-col items-center gap-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
          <span className="font-bold">Email Verified Successfully!</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Redirecting to profile setup...</span>
        </div>
      ) : (
        <form action={formAction} className="space-y-5 text-left">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
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
              className="h-12 text-center text-xl font-bold tracking-widest bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.15] focus:border-zinc-400 dark:focus:border-white/[0.3] rounded-xl transition-all shadow-xs"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-1 leading-relaxed">
              Please check your registered email inbox (and spam folder) for the 6-digit activation code we sent you.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || resending}
            className="w-full h-11 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black mt-2 shadow-md"
          >
            {isPending ? "Verifying..." : "Verify Code →"}
          </Button>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || isPending || cooldown > 0}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-650 hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

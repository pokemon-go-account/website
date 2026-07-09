"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPasswordWithOtp
} from "@/features/auth/actions";
import { cn } from "@/lib/utils";

type Stage = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const [stage, setStage] = useState<Stage>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsPending(true);
    setError(null);

    const res = await requestPasswordResetOtp(email.trim());
    if (res.success) {
      setStage("OTP");
    } else {
      setError(res.error || "Failed to initiate password reset request.");
    }
    setIsPending(false);
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setIsPending(true);
    setError(null);

    const res = await verifyPasswordResetOtp(email, otp.trim());
    if (res.success) {
      setStage("RESET");
    } else {
      setError(res.error || "OTP verification failed. Please check the code.");
    }
    setIsPending(false);
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsPending(true);
    setError(null);

    const res = await resetPasswordWithOtp(email, otp, newPassword);
    if (res.success) {
      setStage("SUCCESS");
    } else {
      setError(res.error || "Password reset failed.");
    }
    setIsPending(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-50 dark:bg-black px-4 py-16 sm:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
      {/* Background Decorative Auras */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-violet-500/5 dark:bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 border border-zinc-200/80 dark:border-white/5 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-xl p-8 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/50 transition-colors duration-300 text-left">
        
        {/* Top Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            <KeyRound className="h-3 w-3" />
            Security Gateway
          </div>
        </div>

        {/* Dynamic Headers */}
        <div className="space-y-2 text-center">
          {stage === "EMAIL" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Forgot Password</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter your email and we will generate a verification OTP key</p>
            </>
          )}
          {stage === "OTP" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Enter OTP Key</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">We sent a 6-digit verification code to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{email}</span></p>
            </>
          )}
          {stage === "RESET" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Reset Password</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Create a secure new password for your account</p>
            </>
          )}
          {stage === "SUCCESS" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Password Updated</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Your account credentials have been successfully updated</p>
            </>
          )}
        </div>

        {/* Global Errors */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* Stage 1 Form: Email Request */}
        {stage === "EMAIL" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-zinc-650 dark:text-zinc-400 font-medium text-xs">Email Address</Label>
              <div className="relative group/input">
                <Input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-sm pl-9 h-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 transition-all rounded-xl"
                />
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-600 group-focus-within/input:text-indigo-500 transition-colors" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-10 font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in"
            >
              {isPending ? "Generating Code..." : "Send Verification OTP"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        )}

        {/* Stage 2 Form: OTP Verification */}
        {stage === "OTP" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-otp" className="text-zinc-650 dark:text-zinc-400 font-medium text-xs">6-Digit Verification Code</Label>
              <div className="relative group/input">
                <Input
                  id="reset-otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-sm pl-9 h-10 text-zinc-900 dark:text-white tracking-widest placeholder:tracking-normal text-center placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 transition-all rounded-xl font-bold"
                />
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-600 group-focus-within/input:text-indigo-500 transition-colors" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStage("EMAIL")}
                className="w-1/3 h-10 border-zinc-200 dark:border-white/5 text-xs text-zinc-650 dark:text-zinc-400 rounded-xl"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isPending || otp.length !== 6}
                className="w-2/3 h-10 font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer rounded-xl flex items-center justify-center gap-1.5"
              >
                {isPending ? "Verifying..." : "Verify OTP Code"}
              </Button>
            </div>
          </form>
        )}

        {/* Stage 3 Form: New Password Submission */}
        {stage === "RESET" && (
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-zinc-655 dark:text-zinc-400 font-medium text-xs">New Password</Label>
              <div className="relative group/input">
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-sm pl-9 h-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 transition-all rounded-xl"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-600 group-focus-within/input:text-indigo-500 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-zinc-655 dark:text-zinc-400 font-medium text-xs">Confirm New Password</Label>
              <div className="relative group/input">
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-sm pl-9 h-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 transition-all rounded-xl"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-600 group-focus-within/input:text-indigo-500 transition-colors" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending || newPassword.length < 6 || confirmPassword.length < 6}
              className="w-full h-10 font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer rounded-xl flex items-center justify-center gap-1.5"
            >
              {isPending ? "Updating Password..." : "Finalize Password Reset"}
            </Button>
          </form>
        )}

        {/* Stage 4 Form: Success State */}
        {stage === "SUCCESS" && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Credentials Updated Successfully</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-xs mx-auto">
                You can now log in securely using your new coordinate credential keys.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full h-11 inline-flex items-center justify-center font-bold text-xs uppercase tracking-wider rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black transition-all shadow-md active:scale-98 cursor-pointer"
            >
              Proceed to Sign In
            </Link>
          </div>
        )}

        {/* Footer Navigation Back Link */}
        {stage !== "SUCCESS" && (
          <div className="text-center pt-2 border-t border-zinc-200/50 dark:border-white/5">
            <Link
              href="/login"
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-500 dark:hover:text-indigo-300 hover:underline transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

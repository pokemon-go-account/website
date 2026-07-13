"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, Lock, CheckCircle2, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
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
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white px-4 py-16 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="relative w-full max-w-md space-y-6 border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 rounded-lg shadow-xs transition-colors duration-300 text-left">
        
        {/* Top Badge */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] px-2.5 py-1 text-[10px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
            <KeyRound className="h-3.5 w-3.5" />
            Security Gateway
          </div>
        </div>

        {/* Dynamic Headers */}
        <div className="space-y-2 text-center">
          {stage === "EMAIL" && (
            <>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Forgot Password</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter your email and we will generate a verification OTP key</p>
            </>
          )}
          {stage === "OTP" && (
            <>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Enter OTP Key</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">We sent a 6-digit verification code to <span className="font-semibold text-zinc-800 dark:text-zinc-200">{email}</span></p>
            </>
          )}
          {stage === "RESET" && (
            <>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Reset Password</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Create a secure new password for your account</p>
            </>
          )}
          {stage === "SUCCESS" && (
            <>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Password Updated</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Your account credentials have been successfully updated</p>
            </>
          )}
        </div>

        {/* Global Errors */}
        {error && (
          <div className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-normal">{error}</span>
          </div>
        )}

        {/* Stage 1 Form: Email Request */}
        {stage === "EMAIL" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-zinc-650 dark:text-zinc-400 font-semibold text-xs">Email Address</Label>
              <div className="relative group/input">
                <Input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs pl-9 h-8 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus-visible:ring-zinc-900/10 transition-colors rounded-md"
                />
                <Mail className="absolute left-3 top-2 h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5 animate-in fade-in"
            >
              {isPending ? "Generating Code..." : "Send Verification OTP"}
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </button>
          </form>
        )}

        {/* Stage 2 Form: OTP Verification */}
        {stage === "OTP" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-otp" className="text-zinc-650 dark:text-zinc-400 font-semibold text-xs">6-Digit Verification Code</Label>
              <div className="relative group/input">
                <Input
                  id="reset-otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs pl-9 h-8 text-zinc-900 dark:text-white tracking-widest placeholder:tracking-normal text-center placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus-visible:ring-zinc-900/10 transition-colors rounded-md font-bold"
                />
                <KeyRound className="absolute left-3 top-2 h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-colors" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStage("EMAIL")}
                className="w-1/3 h-8 border border-zinc-200 dark:border-white/[0.08] text-xs font-semibold text-zinc-650 dark:text-zinc-400 rounded-md bg-transparent"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isPending || otp.length !== 6}
                className="w-2/3 h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                {isPending ? "Verifying..." : "Verify OTP Code"}
              </button>
            </div>
          </form>
        )}

        {/* Stage 3 Form: New Password Submission */}
        {stage === "RESET" && (
          <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-zinc-655 dark:text-zinc-400 font-semibold text-xs">New Password</Label>
              <div className="relative group/input">
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs pl-9 h-8 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-655 focus-visible:ring-zinc-900/10 transition-colors rounded-md"
                />
                <Lock className="absolute left-3 top-2 h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-zinc-655 dark:text-zinc-400 font-semibold text-xs">Confirm New Password</Label>
              <div className="relative group/input">
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs pl-9 h-8 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-655 focus-visible:ring-zinc-900/10 transition-colors rounded-md"
                />
                <Lock className="absolute left-3 top-2 h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-colors" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || newPassword.length < 6 || confirmPassword.length < 6}
              className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              {isPending ? "Updating Password..." : "Finalize Password Reset"}
            </button>
          </form>
        )}

        {/* Stage 4 Form: Success State */}
        {stage === "SUCCESS" && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Credentials Updated Successfully</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal max-w-xs mx-auto">
                You can now log in securely using your new coordinate credential keys.
              </p>
            </div>

            <Link
              href="/login"
              className="w-full h-8 inline-flex items-center justify-center font-semibold text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black transition-all active:scale-[0.98] cursor-pointer"
            >
              Proceed to Sign In
            </Link>
          </div>
        )}

        {/* Footer Navigation Back Link */}
        {stage !== "SUCCESS" && (
          <div className="text-center pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
            <Link
              href="/login"
              className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold hover:text-zinc-900 dark:hover:text-white hover:underline transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

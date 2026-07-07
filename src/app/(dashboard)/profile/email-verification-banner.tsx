"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Mail, RefreshCw, Send, X } from "lucide-react";
import { syncEmailVerification } from "@/features/auth/verify-email-actions";

// Firebase imports — only used client-side
import { auth as firebaseAuth, isConfigured } from "@/lib/firebase";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || verified) return null;

  const getFirebaseUser = (): Promise<FirebaseUser | null> => {
    return new Promise((resolve) => {
      if (!firebaseAuth) return resolve(null);
      const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  };

  const handleSendVerification = async () => {
    if (!isConfigured || !firebaseAuth) {
      setError("Firebase is not configured. Add your Firebase env keys to .env.local.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      let firebaseUser = await getFirebaseUser();

      // If no Firebase session, we can't send (user logged in via credentials only)
      // Show a prompt to re-authenticate briefly if needed
      if (!firebaseUser) {
        setError("Could not reach Firebase. Please sign out and sign back in to trigger verification.");
        setSending(false);
        return;
      }

      await sendEmailVerification(firebaseUser, {
        url: `${window.location.origin}/profile`,
      });
      setSent(true);
    } catch (err: any) {
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes before requesting another email.");
      } else {
        setError(err.message || "Failed to send verification email.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerified = async () => {
    setChecking(true);
    setError(null);

    try {
      const firebaseUser = await getFirebaseUser();

      if (!firebaseUser) {
        setError("No active Firebase session found. Please sign out and sign back in.");
        setChecking(false);
        return;
      }

      // Reload to get the fresh emailVerified state from Firebase
      await firebaseUser.reload();

      if (firebaseUser.emailVerified) {
        // Sync to MongoDB
        const res = await syncEmailVerification();
        if (res.success) {
          setVerified(true);
          // Trigger a page reload so the banner disappears server-side too
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setError(res.error || "Sync failed. Please refresh the page.");
        }
      } else {
        setError("Email not yet verified. Please click the link in the verification email first.");
      }
    } catch (err: any) {
      setError(err.message || "Could not check verification status.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/[0.04] p-4 space-y-3"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Email Not Verified</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Verify <span className="font-semibold text-zinc-700 dark:text-zinc-300">{email}</span> to secure your account and unlock all features.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="h-6 w-6 rounded-lg hover:bg-amber-500/10 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-[10px] text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 leading-relaxed">
            {error}
          </p>
        )}

        {/* Success sent */}
        {sent && !error && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 leading-relaxed flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Verification email sent! Check your inbox and click the link.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={handleSendVerification}
            disabled={sending || checking}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 shadow-sm shadow-amber-500/20"
          >
            {sending ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            {sent ? "Resend Email" : "Send Verification Email"}
          </button>

          {sent && (
            <button
              onClick={handleCheckVerified}
              disabled={checking || sending}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
            >
              {checking ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              I've Verified My Email
            </button>
          )}
        </div>

        {sent && (
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            After clicking the link in your email, return here and click <strong>"I've Verified My Email"</strong> to activate your account.
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

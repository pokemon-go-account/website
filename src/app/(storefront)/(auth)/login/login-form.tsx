"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { loginUser, loginWithFirebaseIdToken } from "@/features/auth/actions";
import { AuthInput } from "@/features/auth/components/auth-input";
import { PasswordInput } from "@/features/auth/components/password-input";
import { auth, googleProvider, appleProvider, isConfigured } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { AlertCircle, Mail, Loader2, ArrowRight } from "lucide-react";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  // Standard Credentials State
  const [credState, credFormAction, isCredPending] = useActionState(loginUser, {
    success: false,
    error: null,
  });

  // Social loading states
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState("");
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<any>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.")) {
        setIsLocalhost(true);
      }
    }
  }, []);

  useEffect(() => {
    if (credState.success && (credState as any).redirectTo) {
      window.location.href = (credState as any).redirectTo;
    }
  }, [credState]);

  // Render Google reCAPTCHA Enterprise explicitly for credentials
  useEffect(() => {
    if (isLocalhost) return;
    let active = true;
    let interval: any;

    const renderRecaptcha = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (
        grecaptcha &&
        grecaptcha.enterprise &&
        typeof grecaptcha.enterprise.ready === "function" &&
        recaptchaRef.current
      ) {
        if (recaptchaRef.current.innerHTML === "") {
          try {
            grecaptcha.enterprise.ready(() => {
              try {
                if (active && recaptchaRef.current && recaptchaRef.current.innerHTML === "") {
                  const isDark = document.documentElement.classList.contains("dark");
                  const widgetId = grecaptcha.enterprise.render(recaptchaRef.current, {
                    sitekey:
                      process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
                      "6LfTJD4tAAAAAHsKOZikKbkNQRahOzidVC8tHKL8",
                    action: "LOGIN",
                    theme: isDark ? "dark" : "light",
                    size: "normal",
                  });
                  widgetIdRef.current = widgetId;
                }
              } catch (innerErr) {
                console.error("Error rendering reCAPTCHA inside ready callback:", innerErr);
              }
            });
          } catch (e) {
            console.error("Error rendering reCAPTCHA:", e);
          }
        }
        return true;
      }
      return false;
    };

    if (!renderRecaptcha()) {
      interval = setInterval(() => {
        if (renderRecaptcha() && active) {
          clearInterval(interval);
        }
      }, 500);
    }

    return () => {
      active = false;
      if (interval) clearInterval(interval);
    };
  }, [isLocalhost]);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    if (!isConfigured || !auth) {
      setAuthError(
        "Firebase Authentication is not configured. Please define required keys in `.env.local`."
      );
      return;
    }

    setIsSocialLoading(provider);
    setAuthError(null);

    try {
      const providerObj = provider === "google" ? googleProvider : appleProvider;
      const result = await signInWithPopup(auth, providerObj);
      const idToken = await result.user.getIdToken();
      const res = await loginWithFirebaseIdToken(idToken);

      if (res.success) {
        window.location.href = res.redirectTo || "/";
      } else {
        setAuthError(res.error || `Failed to sign in with ${provider}.`);
      }
    } catch (err: any) {
      console.error(`Firebase social signin error for ${provider}:`, err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup was closed before completion.");
      } else {
        setAuthError(err.message || `Social sign-in failed. Please try again.`);
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  const activeError = authError || credState.error;

  return (
    <div className="w-full space-y-4 sm:space-y-5">
      {!isLocalhost && (
        <Script
          src="https://www.google.com/recaptcha/enterprise.js?render=explicit"
          async
          defer
          strategy="afterInteractive"
        />
      )}

      {/* Configuration Status Warning (Dev Mode Only) */}
      {!isConfigured && (
        <div className="rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 flex gap-2.5 items-start">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold">Firebase Keys Missing:</span> Google sign-in requires configuration in your `.env.local`.
          </p>
        </div>
      )}

      {/* Global Error Banner */}
      {activeError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 flex gap-2.5 items-start"
        >
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed font-medium">{activeError}</span>
        </div>
      )}

      {/* Social Sign-In */}
      <div>
        <button
          type="button"
          disabled={!!isSocialLoading || isCredPending}
          onClick={() => handleSocialLogin("google")}
          className="w-full h-9.5 sm:h-10.5 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
        >
          {isSocialLoading === "google" ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-600 dark:text-zinc-400" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5c0-3.31 2.69-6 6-6c1.523 0 2.9.57 3.96 1.505l3.1-3.1C19.16 3.16 16.78 2 14 2a10.5 10.5 0 0 0 0 21c5.82 0 10.28-4.09 10.28-10.5c0-.687-.06-1.3-.22-1.9L12.24 10.285Z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>
      </div>

      {/* Subdued Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        <span className="absolute bg-white dark:bg-zinc-900 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Or continue with
        </span>
      </div>

      {/* Credentials Form */}
      <form action={credFormAction} className="space-y-4">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}

        {/* Email Field */}
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="name@example.com"
          autoComplete="email"
          required
          autoFocus
          icon={<Mail className="h-4 w-4" aria-hidden="true" />}
        />

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Password <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] sm:text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 rounded"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>

        {/* reCAPTCHA Render Anchor */}
        {!isLocalhost && (
          <div
            ref={recaptchaRef}
            className="recaptcha-responsive-container flex justify-center my-3 min-h-[78px]"
          />
        )}

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isCredPending || !!isSocialLoading}
          className="w-full h-9.5 sm:h-10.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300"
        >
          {isCredPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { loginUser, loginWithFirebaseIdToken } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider, appleProvider, isConfigured } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { AlertCircle, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  // Standard Credentials State
  const [credState, credFormAction, isCredPending] = useActionState(loginUser, { success: false, error: null });

  // Social loading states
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
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

  // Render Google reCAPTCHA Enterprise explicitly for credentials
  useEffect(() => {
    if (isLocalhost) return;
    let active = true;
    let interval: any;

    const renderRecaptcha = () => {
      const grecaptcha = (window as any).grecaptcha;
      if (grecaptcha && grecaptcha.enterprise && typeof grecaptcha.enterprise.ready === "function" && recaptchaRef.current) {
        if (recaptchaRef.current.innerHTML === "") {
          try {
            grecaptcha.enterprise.ready(() => {
              if (active && recaptchaRef.current && recaptchaRef.current.innerHTML === "") {
                const isDark = document.documentElement.classList.contains("dark");
                const widgetId = grecaptcha.enterprise.render(recaptchaRef.current, {
                  sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfTJD4tAAAAAHsKOZikKbkNQRahOzidVC8tHKL8",
                  action: "LOGIN",
                  theme: isDark ? "dark" : "light",
                  size: "normal",
                });
                widgetIdRef.current = widgetId;
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
  }, []);

  const handleSocialLogin = async (provider: "google" | "apple") => {
    if (!isConfigured || !auth) {
      setAuthError(
        `Firebase Authentication is not configured. Please define NEXT_PUBLIC_FIREBASE_API_KEY and other required keys in your .env.local file.`
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
        window.location.href = res.redirectTo || "/auctions";
      } else {
        setAuthError(res.error || `Failed to log in with ${provider}.`);
      }
    } catch (err: any) {
      console.error(`Firebase social signin error for ${provider}:`, err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup closed before completion.");
      } else {
        setAuthError(err.message || `Social login cancelled or failed.`);
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      {!isLocalhost && (
        <Script src="https://www.google.com/recaptcha/enterprise.js?render=explicit" async defer strategy="afterInteractive" />
      )}

      {/* Configuration Status Warning (Dev Mode Only) */}
      {!isConfigured && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-md border border-amber-500/10 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-200/90 flex gap-2.5 items-start leading-relaxed"
        >
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-600 dark:text-amber-400">Firebase Keys Missing:</span> Google button action will show configuration warnings until keys are configured in your `.env.local`.
          </div>
        </motion.div>
      )}

      {/* Global Errors */}
      {(authError || credState.error) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 flex gap-2 items-start"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-normal">{authError || credState.error}</span>
        </motion.div>
      )}

      {/* Social Login Section */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          disabled={!!isSocialLoading}
          onClick={() => handleSocialLogin("google")}
          className="w-full h-8 px-4 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.04] text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSocialLoading === "google" ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5c0-3.31 2.69-6 6-6c1.523 0 2.9.57 3.96 1.505l3.1-3.1C19.16 3.16 16.78 2 14 2a10.5 10.5 0 0 0 0 21c5.82 0 10.28-4.09 10.28-10.5c0-.687-.06-1.3-.22-1.9L12.24 10.285Z"
              />
            </svg>
          )}
          Sign In with Google
        </Button>
      </div>

      {/* Decorative Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase">
          <span className="bg-white dark:bg-[#111111] px-3 text-zinc-400 dark:text-zinc-500 font-semibold tracking-wider">
            Or log in with credentials
          </span>
        </div>
      </div>

      {/* Standard Form */}
      <form action={credFormAction} className="space-y-4">
        {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
        
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-zinc-650 dark:text-zinc-400 font-semibold text-xs">Email Address</Label>
          <div className="relative group/input">
            <Input 
              id="identifier" 
              name="email" 
              type="email" 
              required 
              placeholder="name@example.com" 
              className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs pl-9 h-8 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus-visible:ring-zinc-900/10 transition-colors rounded-md" 
            />
            <Mail className="absolute left-3 top-2 h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-zinc-655 dark:text-zinc-400 font-semibold text-xs">Password</Label>
            <Link
              href="/forgot-password"
              className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold hover:text-zinc-900 dark:hover:text-white hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group/input">
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs pl-9 h-8 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus-visible:ring-zinc-900/10 transition-colors rounded-md" 
            />
            <Lock className="absolute left-3 top-2 h-4 w-4 text-zinc-400 dark:text-zinc-600 transition-colors" />
          </div>
        </div>

        {/* reCAPTCHA Render Anchor */}
        {!isLocalhost && (
          <div 
            ref={recaptchaRef}
            className="recaptcha-responsive-container flex justify-center my-4 min-h-[78px]"
          ></div>
        )}

        <Button 
          type="submit" 
          disabled={isCredPending || !!isSocialLoading}
          className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
        >
          {isCredPending ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Verifying credentials...
            </>
          ) : (
            <>
              Sign In with Password
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

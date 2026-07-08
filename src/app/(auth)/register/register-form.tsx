"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { registerUser, loginWithFirebaseIdToken } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider, appleProvider, isConfigured } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { AlertCircle, Mail, Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function RegisterForm() {
  const router = useRouter();

  // Standard Credentials State
  const [credState, credFormAction, isCredPending] = useActionState(registerUser, { success: false, error: null });

  // Social loading states
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<any>(null);

  useEffect(() => {
    if (credState.success) {
      router.push("/login?registered=true");
    }
  }, [credState.success, router]);

  // Render Google reCAPTCHA Enterprise explicitly for credentials
  useEffect(() => {
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
                  action: "REGISTER",
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
        window.location.href = "/auctions";
      } else {
        setAuthError(res.error || `Failed to register/log in with ${provider}.`);
      }
    } catch (err: any) {
      console.error(`Firebase social signin error for ${provider}:`, err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in popup closed before completion.");
      } else {
        setAuthError(err.message || `Social signup cancelled or failed.`);
      }
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Script src="https://www.google.com/recaptcha/enterprise.js?render=explicit" async defer strategy="afterInteractive" />

      {/* Configuration Status Warning (Dev Mode Only) */}
      {!isConfigured && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs text-amber-600 dark:text-amber-200/90 flex gap-2.5 items-start leading-relaxed backdrop-blur-sm"
        >
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
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
          className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex gap-2 items-start"
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
          className="w-full h-10 gap-2 border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-800 dark:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-md dark:shadow-lg dark:shadow-black/20"
        >
          {isSocialLoading === "google" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5c0-3.31 2.69-6 6-6c1.523 0 2.9.57 3.96 1.505l3.1-3.1C19.16 3.16 16.78 2 14 2a10.5 10.5 0 0 0 0 21c5.82 0 10.28-4.09 10.28-10.5c0-.687-.06-1.3-.22-1.9L12.24 10.285Z"
              />
            </svg>
          )}
          Sign Up with Google
        </Button>
      </div>

      {/* Decorative Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-white/5" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-[#121215] px-3 text-zinc-400 dark:text-muted-foreground font-medium tracking-wide">
            Or sign up with credentials
          </span>
        </div>
      </div>

      {/* Standard Form */}
      <form action={credFormAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-zinc-650 dark:text-zinc-400 font-medium text-xs">Email Address</Label>
          <div className="relative group/input">
            <Input 
              id="identifier" 
              name="email" 
              type="email" 
              required 
              placeholder="name@example.com" 
              className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-sm pl-9 h-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 transition-all rounded-xl" 
            />
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-600 group-focus-within/input:text-indigo-500 transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-zinc-655 dark:text-zinc-400 font-medium text-xs">Password</Label>
          <div className="relative group/input">
            <Input 
              id="password" 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••"
              className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/5 text-sm pl-9 h-10 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20 transition-all rounded-xl" 
            />
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400 dark:text-zinc-600 group-focus-within/input:text-indigo-500 transition-colors" />
          </div>
        </div>

        {/* reCAPTCHA Render Anchor */}
        <div 
          ref={recaptchaRef}
          className="recaptcha-responsive-container flex justify-center my-4 min-h-[78px]"
        ></div>

        <Button 
          type="submit" 
          disabled={isCredPending || !!isSocialLoading}
          className="w-full h-10 font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-0 transition-all shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/25 active:scale-[0.98] cursor-pointer rounded-xl flex items-center justify-center gap-1.5"
        >
          {isCredPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              Creating account...
            </>
          ) : (
            <>
              Sign Up with Password
              <ArrowRight className="h-4 w-4 group-hover/button:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
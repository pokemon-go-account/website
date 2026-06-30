"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { registerUser, loginMockOAuth, loginWithFirebaseIdToken, loginMockPhone } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, googleProvider, appleProvider, isConfigured } from "@/lib/firebase";
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { AlertCircle, ShieldCheck, Mail, Phone, Lock, Sparkles, Send } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"credentials" | "phone">("credentials");
  
  // Standard Credentials State
  const [credState, credFormAction, isCredPending] = useActionState(registerUser, { success: false, error: null });

  // Firebase Client Phone State
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  useEffect(() => {
    if (credState.success) {
      router.push("/login?registered=true");
    }
  }, [credState.success, router]);

  // Clean up recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {}
      }
    };
  }, []);

  const handleSocialMock = async (provider: "google" | "apple") => {
    if (isConfigured && auth) {
      setIsPhoneLoading(true);
      setPhoneError(null);
      try {
        const providerObj = provider === "google" ? googleProvider : appleProvider;
        const result = await signInWithPopup(auth, providerObj);
        const idToken = await result.user.getIdToken();
        const res = await loginWithFirebaseIdToken(idToken);
        if (res.success) {
          window.location.href = "/auctions";
        } else {
          setPhoneError(res.error || "Failed to log in.");
        }
      } catch (err: any) {
        console.error("Firebase social signin error:", err);
        setPhoneError(err.message || "Social login cancelled or failed.");
      } finally {
        setIsPhoneLoading(false);
      }
    } else {
      const res = await loginMockOAuth(provider);
      if (!res.success) {
        alert(res.error);
      }
    }
  };

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      setPhoneError("Please enter a valid phone number with country code.");
      return;
    }

    setPhoneError(null);
    setIsPhoneLoading(true);

    if (isConfigured && auth) {
      try {
        // Create invisible ReCAPTCHA container anchor
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
            size: "invisible",
            callback: () => {},
            "expired-callback": () => {
              setPhoneError("ReCAPTCHA expired. Please try again.");
            }
          });
        }

        const confirmation = await signInWithPhoneNumber(auth, phone.trim(), recaptchaVerifierRef.current);
        setConfirmationResult(confirmation);
      } catch (err: any) {
        console.error("Firebase phone send OTP error:", err);
        setPhoneError(err.message || "Failed to send SMS OTP.");
      } finally {
        setIsPhoneLoading(false);
      }
    } else {
      // Sandbox Developer Mock Phone Flow
      setTimeout(async () => {
        setIsPhoneLoading(false);
        setConfirmationResult({ mock: true, phone: phone.trim() });
      }, 800);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setPhoneError("Please enter a valid 6-digit confirmation code.");
      return;
    }

    setPhoneError(null);
    setIsPhoneLoading(true);

    if (isConfigured && auth && confirmationResult && !confirmationResult.mock) {
      try {
        const userCredential = await confirmationResult.confirm(verificationCode.trim());
        const idToken = await userCredential.user.getIdToken();
        const res = await loginWithFirebaseIdToken(idToken);
        if (res.success) {
          window.location.href = "/auctions";
        } else {
          setPhoneError(res.error || "Authentication session failed.");
        }
      } catch (err: any) {
        console.error("Firebase OTP confirmation error:", err);
        setPhoneError(err.message || "Invalid OTP code entered.");
      } finally {
        setIsPhoneLoading(false);
      }
    } else {
      // Sandbox Developer Mock Verify Flow
      setTimeout(async () => {
        const res = await loginMockPhone(phone);
        if (res.success) {
          window.location.href = "/auctions";
        } else {
          setPhoneError(res.error);
          setIsPhoneLoading(false);
        }
      }, 800);
    }
  };

  return (
    <div className="space-y-6">
      <Script src="https://www.google.com/recaptcha/enterprise.js" async defer strategy="afterInteractive" />
      {/* Configuration status banner */}
      {!isConfigured && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-xs text-amber-200/90 flex gap-2.5 items-start leading-relaxed">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-400">Sandbox Simulation Mode:</span> Firebase API keys are not configured in your `.env.local`. Social and Phone OTP signups will run in simulated demo mode.
          </div>
        </div>
      )}

      {/* ReCAPTCHA anchor */}
      <div id="recaptcha-container"></div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => {
            setActiveTab("credentials");
            setPhoneError(null);
          }}
          className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 cursor-pointer transition-all ${
            activeTab === "credentials" 
              ? "border-primary text-foreground" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Password Signup
        </button>
        <button
          onClick={() => {
            setActiveTab("phone");
            setPhoneError(null);
          }}
          className={`flex-1 pb-3 text-xs font-semibold uppercase tracking-wider text-center border-b-2 cursor-pointer transition-all ${
            activeTab === "phone" 
              ? "border-primary text-foreground" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Phone OTP (Coming Soon)
        </button>
      </div>

      {/* Errors */}
      {phoneError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{phoneError}</span>
        </div>
      )}

      {/* Mode 1: Password Credentials */}
      {activeTab === "credentials" && (
        <form action={credFormAction} className="space-y-4">
          {credState.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex gap-2 items-center">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{credState.error}</span>
            </div>
          )}
          <div className="space-y-1">
            <Label htmlFor="identifier">Email address</Label>
            <div className="relative">
              <Input 
                id="identifier" 
                name="email" 
                type="email" 
                required 
                placeholder="name@example.com" 
                className="bg-muted/50 border-border text-sm pl-9" 
              />
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="bg-muted/50 border-border text-sm pl-9" 
              />
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div 
            className="g-recaptcha flex justify-center my-4" 
            data-sitekey="6LfTJD4tAAAAAHsKOZikKbkNQRahOzidVC8tHKL8" 
            data-action="REGISTER"
            data-theme="dark"
          ></div>
          <Button type="submit" className="w-full font-medium" disabled={isCredPending}>
            {isCredPending ? "Creating account..." : "Sign Up with Password"}
          </Button>
        </form>
      )}

      {/* Mode 2: Phone OTP (Coming Soon) */}
      {activeTab === "phone" && (
        <div className="border border-border/80 bg-muted/15 rounded-xl p-8 text-center space-y-4 backdrop-blur-sm animate-fade-in">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-700/50 text-muted-foreground">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Phone SMS Verification</h4>
            <p className="text-xs text-muted-foreground leading-normal max-w-xs mx-auto">
              Direct verification via SMS verification OTP codes is undergoing regulatory review and will be enabled soon.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold text-primary uppercase tracking-wider animate-pulse">
            Coming Soon
          </span>
        </div>
      )}

      {/* Decorative Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground font-semibold">
            Or continue with
          </span>
        </div>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={isPhoneLoading}
          onClick={() => handleSocialMock("google")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-xs font-semibold text-foreground hover:bg-muted transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5c0-3.31 2.69-6 6-6c1.523 0 2.9.57 3.96 1.505l3.1-3.1C19.16 3.16 16.78 2 14 2a10.5 10.5 0 0 0 0 21c5.82 0 10.28-4.09 10.28-10.5c0-.687-.06-1.3-.22-1.9L12.24 10.285Z"
            />
          </svg>
          Google
        </button>

        <button
          type="button"
          disabled={isPhoneLoading}
          onClick={() => handleSocialMock("apple")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-xs font-semibold text-foreground hover:bg-muted transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.56 2.95-1.39Z" />
          </svg>
          Apple
        </button>
      </div>
    </div>
  );
}
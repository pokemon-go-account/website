"use client";

import { useState, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanQrCode,
  ShieldCheck,
  X,
  ImageIcon,
} from "lucide-react";

// Inline vector logo components replacing plain text tags
const GPayLogo = () => (
  <svg className="h-4.5 w-auto" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.1 11.2c0-1.2.4-2.2 1.2-3 .8-.8 1.8-1.2 3-1.2 1.2 0 2.2.4 3 1.2.8.8 1.2 1.8 1.2 3s-.4 2.2-1.2 3c-.8.8-1.8 1.2-3 1.2-1.2 0-2.2-.4-3-1.2-.8-.8-1.2-1.8-1.2-3zm1.6 0c0 .8.3 1.5.8 2 .5.5 1.2.8 2 .8s1.5-.3 2-.8c.5-.5.8-1.2.8-2s-.3-1.5-.8-2c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8c-.5.5-.8 1.2-.8 2zM21 11.8c.4 0 .8-.1 1-.4.3-.3.4-.7.4-1.2V7.1H21V12.9c0 .9.2 1.6.7 2.1s1.2.8 2.1.8c.8 0 1.5-.3 2.1-.8c.5-.5.7-1.2.7-2.1V7.1h-1.7V12.9c0 .5-.1.9-.3 1.1-.3.3-.6.4-1.1.4s-.8-.1-1.1-.4c-.2-.2-.3-.6-.3-1.1v-1.5zm9.5-4.7H32v8.8h-1.5V7.1zm6.5 3.3c0-1 .3-1.8.8-2.4s1.2-.9 2.1-.9c.9 0 1.6.3 2.1.9s.8 1.4.8 2.4c0 1-.3 1.8-.8 2.4s-1.2.9-2.1.9c-.9 0-1.6-.3-2.1-.9s-.8-1.4-.8-2.4zm1.7 0c0 .7.2 1.2.5 1.6.3.4.8.6 1.3.6s1-.2 1.3-.6c.3-.4.5-1 .5-1.6s-.2-1.2-.5-1.6c-.3-.4-.8-.6-1.3-.6s-1 .2-1.3.6c-.3.4-.5 1-.5 1.6z" fill="#71717a"/>
    <path d="M4.6 10.1v3.1h1.1v-3.1c0-1.2.6-1.8 1.8-1.8 1.1 0 1.6.6 1.6 1.6v3.3h1.1v-3.4c0-1.6-.9-2.5-2.5-2.5-1.3 0-2.2.6-2.6 1.6h-.1V7.5h-1V10.1z" fill="#71717a"/>
  </svg>
);

const PhonePeLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 74 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#5f259f" />
    <path d="M12.5 6v5.2h2.2c1.8 0 3 1.1 3 2.7 0 1.7-1.2 2.7-3 2.7h-2.2V18h-1.8V6h1.8zm0 7.8V11.3h2.1c.8 0 1.3.4 1.3 1.2 0 .8-.5 1.3-1.3 1.3h-2.1z" fill="white" />
    <path d="M9.5 8.5H7.7v8h1.8v-8z" fill="white" />
    <text x="28" y="16" fill="#71717a" fontSize="10" fontWeight="bold" fontFamily="sans-serif">PhonePe</text>
  </svg>
);

const PaytmLogo = () => (
  <svg className="h-4.5 w-auto" viewBox="0 0 54 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 12.5v-7.5H5.5V3h7.5v9.5H8zm8.5-5c.6 0 1-.2 1.3-.5V3h2.1v9.5h-2.1V9.3c-.3-.3-.7-.5-1.3-.5s-1 .2-1.3.5v3.2H13V5h2.1v1.3c.3-.3.7-.5 1.3-.5zm12.1-3H31v8H28.6V4.5zM36.7 7.5c0-1.2.3-2.1 1-2.9s1.6-1.1 2.8-1.1c1.2 0 2.1.3 2.8 1.1s1 1.7 1 2.9v5.2h-2.1V9.3c-.7-.8-1.6-1.1-2.8-1.1-1.2 0-2.1.3-2.8 1.1V5h-2.1v7.5H36.7z" fill="#00b9f5" />
    <path d="M4 12.5H1.5V3H6.5c1.7 0 3 1 3 2.5 0 1.5-1.3 2.5-3 2.5H4v4.5z" fill="#002970" />
  </svg>
);

const BhimLogo = () => (
  <svg className="h-5 w-auto" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.5 16L7.5 3H10.5L4.5 16H1.5Z" fill="#FF9933" />
    <path d="M5.5 16L11.5 3H14.5L8.5 16H5.5Z" fill="#128807" />
    <text x="18" y="14" fill="#71717a" fontSize="11" fontWeight="900" fontFamily="sans-serif">BHIM</text>
  </svg>
);

interface UpiPaymentCheckoutProps {
  orderId: string;
  amount: number; // in INR
  customerEmail: string;
  upiId?: string; // Your UPI ID e.g. "yourname@upi"
}

export function UpiPaymentCheckout({
  orderId,
  amount,
  customerEmail,
  upiId = "to-babyrao@ybl",
}: UpiPaymentCheckoutProps) {
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UPI deep link for QR code / App launch
  const upiLink = `upi://pay?pa=${upiId}&pn=PokemonGOServices&am=${amount}&cu=INR&tn=Order-${orderId}`;

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot must be less than 5MB.");
      return;
    }
    setScreenshotFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileChange(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFileChange]
  );

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!utrNumber || utrNumber.length !== 12) {
      setError("Please enter a valid 12-digit UTR number.");
      return;
    }
    if (!screenshotFile) {
      setError("Please upload a screenshot of the payment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const screenshotBase64 = await toBase64(screenshotFile);
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          customerEmail,
          utrNumber,
          screenshotBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/[0.05]">
        <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">
            Verification Pending
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
            Your payment has been submitted. Our team will verify your UTR{" "}
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
              #{utrNumber}
            </span>{" "}
            and confirm within 1–24 hours.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Secured &amp; encrypted</span>
        </div>
      </div>
    );
  }

  // ─── Checkout Form (Responsive grid, mobile optimized) ───────────────────
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch text-left">
      
      {/* Step 1: Payment Method (QR code / App launch) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 flex flex-col justify-between space-y-4">
        
        {/* Header Title */}
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black flex items-center justify-center shrink-0">
            1
          </span>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            UPI QR &amp; App Gateway
          </h3>
        </div>

        {/* Mobile View: Launch App Directly */}
        <div className="block md:hidden w-full space-y-3 my-2">
          <a
            href={upiLink}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <ScanQrCode className="h-4.5 w-4.5" />
            PAY DIRECTLY VIA UPI APP
          </a>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed font-semibold">
            🚀 Tap to instantly launch your preferred UPI payment app (GPay, PhonePe, Paytm, BHIM) and pay. After paying, come back here to submit your UTR &amp; screenshot.
          </p>
        </div>

        {/* Desktop View: Scan QR Code */}
        <div className="hidden md:flex flex-col items-center gap-3">
          <div className="p-3 bg-white rounded-xl border border-zinc-150 shadow-xs inline-block">
            <QRCodeSVG
              value={upiLink}
              size={140}
              bgColor="#ffffff"
              fgColor="#18181b"
              level="M"
              includeMargin={false}
            />
          </div>
          <div className="text-center space-y-0.5">
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">Scan to pay instantly</p>
            <p className="text-lg font-black text-zinc-900 dark:text-white">
              ₹{amount.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Payment info + Logos */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-white/[0.04]">
          <div className="text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-400">UPI Address:</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300 font-semibold">{upiId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Order ID:</span>
              <span className="font-mono text-zinc-500">{orderId.slice(0, 15)}...</span>
            </div>
          </div>

          {/* Inline SVG Vector Logos replacing Text tags */}
          <div className="flex items-center gap-2.5 justify-center flex-wrap pt-1.5 opacity-85 hover:opacity-100 transition-opacity">
            <GPayLogo />
            <span className="text-zinc-200 dark:text-zinc-800 text-[10px]">•</span>
            <PhonePeLogo />
            <span className="text-zinc-200 dark:text-zinc-800 text-[10px]">•</span>
            <PaytmLogo />
            <span className="text-zinc-200 dark:text-zinc-800 text-[10px]">•</span>
            <BhimLogo />
          </div>
        </div>

      </div>

      {/* Step 2: Verification Input form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 flex flex-col justify-between space-y-4">
        
        {/* Header Title */}
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black flex items-center justify-center shrink-0">
            2
          </span>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Confirm Receipt Proof
          </h3>
        </div>

        {/* UTR Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
            12-Digit UTR Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="e.g. 423611234567"
            className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-xs font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 focus:border-violet-400 dark:focus:border-violet-500 transition"
          />
        </div>

        {/* Screenshot Upload preview */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-center">
          {screenshotPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-36">
              <img
                src={screenshotPreview}
                alt="Receipt screenshot preview"
                className="w-full h-full max-h-32 object-contain bg-zinc-50 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => {
                  setScreenshotFile(null);
                  setScreenshotPreview(null);
                }}
                className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer border-none"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 py-5 px-3 text-center cursor-pointer transition-colors flex-1 min-h-[90px]"
            >
              <ImageIcon className="h-4 w-4 text-zinc-400" />
              <div>
                <p className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Click/drop payment screenshot
                </p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">
                  Max size: 5 MB
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/[0.07] border border-red-200 dark:border-red-500/20 p-2">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-650 dark:text-red-400 leading-normal">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-9.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              Submit payment proof
            </>
          )}
        </button>

      </form>
    </div>
  );
}

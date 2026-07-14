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
  upiId = "souravkjha2007@oksbi",
}: UpiPaymentCheckoutProps) {
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UPI deep link for QR code
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

  // ─── Checkout Form ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Step 1: QR Code */}
      <div className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black flex items-center justify-center">
            1
          </span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Scan &amp; Pay via UPI
          </h3>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* QR Code */}
          <div className="p-4 bg-white rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm inline-block">
            <QRCodeSVG
              value={upiLink}
              size={180}
              bgColor="#ffffff"
              fgColor="#18181b"
              level="M"
              includeMargin={false}
            />
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <ScanQrCode className="h-3.5 w-3.5 text-violet-500" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                UPI ID: <span className="font-mono text-violet-600 dark:text-violet-400">{upiId}</span>
              </p>
            </div>
            <p className="text-2xl font-black text-zinc-900 dark:text-white">
              ₹{amount.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
              Order Ref: {orderId}
            </p>
          </div>

          {/* App shortcut pills */}
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
              <span
                key={app}
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
              >
                {app}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: UTR + Screenshot Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="h-5 w-5 rounded-full bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-black flex items-center justify-center">
            2
          </span>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Submit Proof of Payment
          </h3>
        </div>

        {/* UTR Input */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            12-Digit UTR / Transaction ID
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={12}
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="e.g. 423611234567"
            className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 text-sm font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-400 dark:focus:border-violet-500 transition"
          />
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Find this in your UPI app under "Transaction History" after payment.
          </p>
        </div>

        {/* Screenshot Upload */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
            Payment Screenshot
          </label>

          {screenshotPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
              <img
                src={screenshotPreview}
                alt="Payment screenshot preview"
                className="w-full max-h-48 object-contain bg-zinc-50 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => {
                  setScreenshotFile(null);
                  setScreenshotPreview(null);
                }}
                className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition cursor-pointer border-none"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 p-8 text-center cursor-pointer transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Drop screenshot or click to upload
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  JPG, PNG, WebP — max 5 MB
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-violet-500 font-semibold">
                <Upload className="h-3 w-3" />
                Browse files
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
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-500/[0.07] border border-red-200 dark:border-red-500/20 p-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-bold transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Submit for Verification
            </>
          )}
        </button>

        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-relaxed">
          Your payment proof is encrypted and reviewed by our admin team within 1–24 hours.
        </p>
      </form>
    </div>
  );
}

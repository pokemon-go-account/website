"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { useCartStore } from "@/store/useCartStore";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanQrCode,
  ShieldCheck,
  X,
  ImageIcon,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { cn, getUserCountry } from "@/lib/utils";
import { getGuestSessionAction } from "@/features/auth/guest-actions";
import { sendChatWebhookNotification } from "@/features/chat/actions";

interface UpiPaymentCheckoutProps {
  orderId: string;
  amount: number; // in INR
  customerEmail: string;
  upiId?: string; // Your UPI ID e.g. "yourname@upi"
  payeeName?: string; // Real name associated with UPI ID to prevent risk blocks
  walletDiscountApplied?: number;
  originalTotalPrice?: number;
}

export function UpiPaymentCheckout({
  orderId,
  amount,
  customerEmail,
  upiId = "adarshsingh9888-3@oksbi",
  payeeName = "Pokemon GO Services",
  walletDiscountApplied = 0,
  originalTotalPrice,
}: UpiPaymentCheckoutProps) {
  const { data: session } = useSession();
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UPI deep link for QR code / App launch
  // We remove 'tn' (transaction note) because passing long alphanumeric Order IDs triggers UPI Risk Policies/Spam filters on GPay/PhonePe.
  const encodedPayeeName = encodeURIComponent(payeeName);
  const upiLink = `upi://pay?pa=${upiId}&pn=${encodedPayeeName}&am=${amount}&cu=INR`;

  const handleCopyUpi = () => {
    console.log(`[UPI Checkout] 📋 Copy UPI ID Clicked -> ${upiId}`);
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    console.log(`[UPI Checkout] 🖼️ Payment Screenshot File Selected -> ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
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

    console.log(`[UPI Checkout] 🚀 Submit Payment Form Triggered | OrderId: ${orderId} | Amount: ₹${amount}`);

    if (!screenshotFile) {
      setError("Please upload a screenshot of the payment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedUtr = Math.floor(100000000000 + Math.random() * 900000000000).toString();
      setUtrNumber(generatedUtr);

      const screenshotBase64 = await toBase64(screenshotFile);
      const res = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          customerEmail,
          utrNumber: generatedUtr,
          screenshotBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      console.log(`[UPI Checkout] ✅ Payment Submitted Successfully | OrderId: ${orderId} | UTR: ${generatedUtr}`);

      // Create support chat for order payment proof verification
      try {
        let userId = ((session?.user as any)?.id as string | undefined);
        let username = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "User";

        if (!userId) {
          const guest = await getGuestSessionAction();
          if (guest) {
            userId = guest.userId;
            username = guest.username;
          }
        }
        userId = userId || "N/A";
        const country = getUserCountry(session?.user);
        const db = getDb();
        const chatId = `order-${orderId}`;
        const chatRef = doc(db, "supportChats", chatId);

        const subtotalText = originalTotalPrice ? `\nSubtotal Price: $${originalTotalPrice.toFixed(2)} USD` : "";
        const walletDiscountText = walletDiscountApplied > 0 ? `\nWallet Discount: $${walletDiscountApplied.toFixed(2)} USD` : "";

        const messageText = `📦 ORDER PAID & SUBMITTED (UPI)
----------------------------------
Order ID: ${orderId}${subtotalText}${walletDiscountText}
Paid Amount: ₹${amount.toLocaleString("en-IN")}
Payment Method: UPI Transfer

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${customerEmail}
User ID: ${userId}
🌍 Country: ${country}

🔍 VERIFICATION PROOF:
----------------------------------
Payment Screenshot: Uploaded & Stored

Please verify my payment proof and approve my order!`;

        await setDoc(chatRef, {
          userId,
          username,
          email: customerEmail,
          type: "order",
          orderId,
          title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
          lastMessage: `Payment proof screenshot submitted.`,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
          paymentMethod: "UPI",
          isGuest: !session?.user,
        });

        const msgsRef = collection(db, "supportChats", chatId, "messages");
        await addDoc(msgsRef, {
          text: messageText,
          sender: "user",
          senderName: username,
          timestamp: serverTimestamp(),
          read: false,
        });

        if (data.screenshotUrl) {
          await addDoc(msgsRef, {
            image: data.screenshotUrl,
            text: "Payment Proof Screenshot",
            sender: "user",
            senderName: username,
            timestamp: serverTimestamp(),
            read: false,
          });
        }

        await addDoc(msgsRef, {
          text: `System: Thank you for submitting your payment proof! A support representative will verify your payment screenshot shortly and confirm your order.`,
          sender: "admin",
          senderName: "Support Team",
          timestamp: serverTimestamp(),
          read: false,
        });

        // Trigger Webhook Notification on UPI payment proof submit
        sendChatWebhookNotification({
          ticketId: chatId,
          ticketTitle: `Order #${orderId.substring(0, 8).toUpperCase()} (UPI)`,
          senderName: username,
          senderType: "user",
          userEmail: customerEmail,
          text: messageText,
          hasImage: true,
        }).catch(() => {});

        // If cart contained a recovery order, post proof to recovery chat thread as well
        const cartItems = useCartStore.getState().items;
        const recoveryItem = cartItems.find((i) => i.recoveryRequestId || i.type === "RECOVERY");
        if (recoveryItem && recoveryItem.recoveryRequestId) {
          const recChatId = `recovery-${recoveryItem.recoveryRequestId}`;
          const recChatRef = doc(db, "supportChats", recChatId);

          await setDoc(recChatRef, {
            lastMessage: `Payment proof submitted (UPI). Status: In Progress.`,
            lastMessageAt: serverTimestamp(),
            unreadByAdmin: 1,
          }, { merge: true });

          const recMsgsRef = collection(db, "supportChats", recChatId, "messages");
          await addDoc(recMsgsRef, {
            text: `📦 RECOVERY PAYMENT SUBMITTED (UPI)
----------------------------------
Recovery Request ID: ${recoveryItem.recoveryRequestId}
Amount Paid: ₹${amount.toLocaleString("en-IN")}
Order ID: ${orderId}
UTR Reference: #${generatedUtr}

🔍 VERIFICATION PROOF:
----------------------------------
Payment Proof Screenshot: Uploaded & Stored

Our recovery specialists have received your payment proof and will start processing your request!`,
            sender: "user",
            senderName: username,
            timestamp: serverTimestamp(),
            read: false,
          });

          if (data.screenshotUrl) {
            await addDoc(recMsgsRef, {
              image: data.screenshotUrl,
              text: "Payment Proof Screenshot",
              sender: "user",
              senderName: username,
              timestamp: serverTimestamp(),
              read: false,
            });
          }

          await addDoc(recMsgsRef, {
            text: `System: Payment proof received! Your recovery request status is now IN_PROGRESS. Our team is actively processing your request!`,
            sender: "admin",
            senderName: "Support Team",
            timestamp: serverTimestamp(),
            read: false,
          });
        }

        useCartStore.getState().clearCart();
        setSubmitted(true);
        window.location.href = `/chat?chatId=${chatId}`;
      } catch (fErr) {
        console.error("Failed to write to support chats:", fErr);
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.08] to-transparent dark:from-emerald-500/[0.04] p-6 text-center shadow-xl backdrop-blur-md">
        {/* Glow effects */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
            <div className="relative h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-zinc-950 dark:text-white uppercase">
              Payment Submitted
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your transaction details have been sent for verification.
            </p>
          </div>

          {/* SaaS Styled Invoice Ticket */}
          <div className="w-full bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl p-4 space-y-3 text-xs text-left relative">
            {/* Cutout Notches */}
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white dark:bg-[#111111] rounded-r-full border-r border-zinc-200 dark:border-zinc-800" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white dark:bg-[#111111] rounded-l-full border-l border-zinc-200 dark:border-zinc-800" />

            <div className="flex justify-between items-center pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 font-medium">Verification Status</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                Pending Verification
              </span>
            </div>

            <div className="space-y-2 pt-1 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">UTR / Ref Number:</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-bold bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded">
                  #{utrNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Order ID:</span>
                <span className="font-mono text-zinc-550 dark:text-zinc-400">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Paid:</span>
                <span className="font-bold text-zinc-950 dark:text-white">
                  ₹{amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ETA Confirmation:</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">1 – 24 Hours</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
            🚀 Once our billing team validates the transaction against the UTR, your order will be automatically fulfilled and available in your dashboard.
          </p>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-450 dark:text-zinc-550 pt-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Secured Payment Gateway</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Checkout Form (Responsive grid, mobile optimized) ───────────────────
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch text-left">
      
      {/* Step 1: Payment Method (QR code / App launch) */}
      <div className={cn(
        "rounded-2xl border border-zinc-200/85 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#151515]/30 p-5 flex flex-col justify-between space-y-4",
        step !== 1 && "hidden sm:flex"
      )}>
        
        <div className="space-y-4">
          {/* Header Title */}
          <div className="flex items-center gap-2">
            <span className="h-5.5 w-5.5 rounded-full bg-violet-500/10 text-[#6133e1] dark:text-purple-400 text-[11px] font-black flex items-center justify-center shrink-0 border border-violet-500/20">
              1
            </span>
            <h3 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              UPI Pay Gateway
            </h3>
          </div>

          {/* Amount Card */}
          <div className="flex flex-col items-center justify-center bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl py-3 shadow-sm">
             <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Amount to Pay</p>
             <p className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
               ₹{amount.toLocaleString("en-IN")}
             </p>
          </div>

          {/* Mobile View: Copy UPI & Go to Verification Step */}
          <div className="block sm:hidden w-full space-y-3">
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 space-y-2.5">
              <div className="flex items-start gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                  Please copy the UPI ID below to pay manually from GPay, PhonePe, Paytm, or BHIM.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-500/30 hover:border-amber-400 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-all active:scale-[0.98] shadow-sm cursor-pointer"
              >
                {copiedUpi ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-zinc-500" />}
                {copiedUpi ? "COPIED UPI ID!" : "COPY UPI ID TO PAY"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs transition-all active:scale-[0.98] shadow-md shadow-violet-500/15 cursor-pointer"
            >
              <Check className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
              I HAVE PAID, SUBMIT PROOF
            </button>
          </div>

          {/* Desktop View: Scan QR Code */}
          <div className="hidden sm:flex flex-col items-center gap-3 pt-1">
            <div className="p-3 bg-white rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-md inline-block transition-transform hover:scale-[1.02] duration-300">
              <QRCodeSVG
                value={upiLink}
                size={120}
                bgColor="#ffffff"
                fgColor="#18181b"
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <ScanQrCode className="h-3 w-3 text-[#6133e1]" /> Scan QR with any UPI App
            </p>
          </div>
        </div>

        {/* Payment info + Logos */}
        <div className="space-y-3 pt-3 border-t border-zinc-200/60 dark:border-white/[0.04]">
          <div className="text-[10px] space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-zinc-450 dark:text-zinc-500">UPI Address:</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 font-mono text-zinc-700 dark:text-zinc-300 font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-violet-500/50 px-2 py-0.5 rounded transition cursor-pointer text-[10px]"
              >
                {upiId}
                {copiedUpi ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3 text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300" />
                )}
              </button>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-450 dark:text-zinc-500">Order ID:</span>
              <span className="font-mono text-zinc-500 dark:text-zinc-450">{orderId.slice(0, 15)}...</span>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center flex-wrap pt-2 opacity-95">
            <img src="https://cdn.simpleicons.org/googlepay" alt="Google Pay" className="h-5 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            <img src="https://cdn.simpleicons.org/phonepe" alt="PhonePe" className="h-5 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            <img src="https://cdn.simpleicons.org/paytm" alt="Paytm" className="h-5 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
          </div>
        </div>

      </div>

      {/* Step 2: Verification Input form */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "rounded-2xl border border-zinc-200/85 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#151515]/30 p-5 flex flex-col justify-between space-y-4",
          step !== 2 && "hidden sm:flex"
        )}
      >
        
        {/* Header Title */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="h-5.5 w-5.5 rounded-full bg-violet-500/10 text-[#6133e1] dark:text-purple-400 text-[11px] font-black flex items-center justify-center shrink-0 border border-violet-500/20">
              2
            </span>
            <h3 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Submit Payment Proof
            </h3>
          </div>
          {/* Back button visible only on mobile */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="block sm:hidden text-[10px] font-bold text-zinc-500 hover:text-[#6133e1] transition cursor-pointer bg-transparent border-none"
          >
            &larr; Back
          </button>
        </div>


        {/* Screenshot Upload preview */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-center">
          {screenshotPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-36 shadow-xs group">
              <img
                src={screenshotPreview}
                alt="Receipt screenshot preview"
                className="w-full h-full max-h-32 object-contain bg-white dark:bg-zinc-900"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                  className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all cursor-pointer border-none shadow-md hover:scale-105 active:scale-95"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900 py-4 px-3 text-center cursor-pointer transition duration-200 flex-1 min-h-[90px] shadow-xs group hover:border-[#6133e1]"
            >
              <ImageIcon className="h-5 w-5 text-zinc-400 group-hover:text-[#6133e1] transition-colors" />
              <div>
                <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                  Upload screenshot receipt
                </p>
                <p className="text-[8px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Drag &amp; drop or click to browse (Max 5MB)
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
          className="w-full h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-zinc-500 disabled:to-zinc-500 disabled:opacity-60 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-500/15"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting proof...
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              SUBMIT PAYMENT PROOF
            </>
          )}
        </button>

      </form>
    </div>
  );
}

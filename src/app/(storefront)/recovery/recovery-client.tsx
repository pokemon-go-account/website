"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitRecoveryRequest, getCloudinaryUploadSignature } from "@/features/recovery/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Activity, RefreshCw, KeyRound, ArrowRight, Star, HeartHandshake, Upload, X, ChevronDown, CheckCircle2 } from "lucide-react";
import { cn, getUserCountry } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { PriceDisplay } from "@/components/price-display";
import { useSession } from "next-auth/react";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { sendChatWebhookNotification } from "@/features/chat/actions";

// Custom Inline Platform SVG Icons for Visual Fidelity
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#24A1DE]">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#5865F2]">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#25D366]">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.454L0 24zm6.59-4.846c1.6.95 3.167 1.455 4.796 1.457 5.4 0 9.792-4.394 9.795-9.797.002-2.618-1.01-5.08-2.858-6.93C16.43 2.033 13.96 1.018 12.01 1.017 6.61 1.017 2.215 5.41 2.212 10.814c0 1.69.443 3.34 1.284 4.787l-.997 3.638 3.73-.978zm11.39-7.393c-.302-.15-1.785-.88-2.062-.98-.277-.1-.478-.15-.68.15-.202.3-.777.98-.953 1.18-.175.2-.352.224-.654.074-1.1-.55-1.926-.95-2.678-2.24-.2-.343.2-.317.57-.962.115-.23.057-.43-.028-.58-.086-.15-.68-1.64-.93-2.24-.24-.58-.48-.5-.68-.51-.173-.008-.373-.01-.573-.01-.2 0-.527.075-.803.374-.277.3-1.055 1.03-1.055 2.515s1.08 2.92 1.23 3.12c.15.2 2.126 3.25 5.15 4.56 2.05.89 3.05 1.02 4.14.86.64-.09 1.97-.8 2.24-1.57.277-.77.277-1.43.196-1.57-.08-.14-.3-.22-.6-.37z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#E1306C]">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-black dark:text-white">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const socialPlatforms = [
  { id: "telegram", name: "Telegram", icon: TelegramIcon, placeholder: "e.g. @johndoe" },
  { id: "discord", name: "Discord", icon: DiscordIcon, placeholder: "e.g. johndoe" },
  { id: "whatsapp", name: "WhatsApp", icon: WhatsappIcon, placeholder: "e.g. +1 234 567 8900" },
  { id: "instagram", name: "Instagram", icon: InstagramIcon, placeholder: "e.g. @johndoe" },
  { id: "x", name: "X (Twitter)", icon: XIcon, placeholder: "e.g. @johndoe" },
];

const creationMethods = [
  { id: "google", name: "Google Account" },
  { id: "facebook", name: "Facebook" },
  { id: "ptc", name: "Pokémon Trainer Club (PTC)" },
  { id: "kids", name: "Niantic Kids" },
  { id: "apple", name: "Apple ID" },
];

interface RecoveryClientProps {
  product: {
    _id: string;
    name: string;
    price: number;
    description: string;
    imageUrl: string;
  };
  isLoggedIn: boolean;
}

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "100% Secure & Confidential",
    desc: "All credentials are encrypted and stored in a secure offline vault. Once recovery is verified and your account is handed back, all session data and login history are permanently scrubbed.",
  },
  {
    icon: Activity,
    title: "95%+ Success Rate",
    desc: "Our dedicated security specialists utilize formal appeal procedures, coordinate logs analysis, and Niantic terms support to retrieve locked or hijacked Trainer profiles.",
  },
  {
    icon: RefreshCw,
    title: "Full Refund Guarantee",
    desc: "If our recovery team determines your account cannot be retrieved after all avenues are exhausted, we issue a 100% full refund on the spot. Zero risk to you.",
  },
  {
    icon: KeyRound,
    title: "Bypass Hard Locks",
    desc: "We assist with forgotten emails, deactivated PTC profiles, compromised Google/Facebook logins, and incorrect Niantic Kids account configurations.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Place Your Order",
    desc: "Purchase the recovery service directly by providing your trainer stats, a screenshot verification, and preferred contacts.",
  },
  {
    num: "02",
    title: "Secure Verification",
    desc: "Work with our support specialist to verify account creation devices, start dates, and email credentials access.",
  },
  {
    num: "03",
    title: "Diagnosis & Appeal",
    desc: "Our experts run diagnostics to identify locks or suspension reasons and compile a custom verification appeal.",
  },
  {
    num: "04",
    title: "Secure Restoration",
    desc: "We perform coordinate overrides, secure the login links, and hand over a clean, fully-accessible account.",
  },
];

function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string) || "");
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve((event.target?.result as string) || "");
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => resolve((event.target?.result as string) || "");
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

async function uploadImageDirectly(fileData: string): Promise<string> {
  const sigRes = await getCloudinaryUploadSignature();
  if (!sigRes.success) {
    throw new Error(sigRes.error || "Failed to generate upload signature.");
  }

  if (sigRes.isMock) {
    return fileData; // Fallback to base64
  }

  const formData = new FormData();
  formData.append("file", fileData);
  formData.append("api_key", sigRes.apiKey!);
  formData.append("timestamp", String(sigRes.timestamp!));
  formData.append("signature", sigRes.signature!);
  formData.append("folder", sigRes.folder!);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sigRes.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Cloudinary direct upload failed");
  }

  const data = await res.json();
  return data.secure_url;
}

export function RecoveryClient({ product, isLoggedIn }: RecoveryClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [screenshots, setScreenshots] = useState<{ id: string; base64: string; name: string }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("telegram");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [emailCheck, setEmailCheck] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, formAction, isPending] = useActionState(submitRecoveryRequest, {
    success: false,
    error: null,
  } as any);

  const isSubmitting = isPending || isUploading;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];
      const updatedScreenshots = [...screenshots];
      
      for (let i = 0; i < updatedScreenshots.length; i++) {
        const s = updatedScreenshots[i];
        if (s.base64.startsWith("http")) {
          uploadedUrls.push(s.base64);
        } else {
          const url = await uploadImageDirectly(s.base64);
          updatedScreenshots[i] = { ...s, base64: url };
          uploadedUrls.push(url);
        }
      }
      setScreenshots(updatedScreenshots);

      const formData = new FormData(e.currentTarget);
      formData.set("screenshotUrlsJson", JSON.stringify(uploadedUrls));
      formAction(formData);
    } catch (err: any) {
      console.error("Direct upload/submit failed:", err);
      setUploadError(err.message || "Failed to upload screenshots. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: session } = useSession();
  const { addItem: addCartItem, setIsOpen: setCartOpen } = useCartStore();

  // Handle successful form submission & cart item addition
  useEffect(() => {
    if (state.success && state.request) {
      const req = state.request;
      const reqIdStr = String(req._id || "");

      const safeImageUrl = req.screenshotUrl && !req.screenshotUrl.startsWith("data:")
        ? req.screenshotUrl
        : "/recovery-service.png";

      addCartItem({
        id: `recovery_${reqIdStr}`,
        name: `Account Recovery (Level ${req.accountLevel})`,
        price: null,
        imageUrl: safeImageUrl,
        type: "RECOVERY",
        recoveryRequestId: reqIdStr,
        pricePending: true,
      });

      setTimeout(() => {
        setDrawerOpen(false);
        setCartOpen(true);
        // Reset local states
        setScreenshots([]);
        setEmailCheck("");
      }, 1800);
    }
  }, [state.success, state.request, addCartItem, setCartOpen]);

  const handleBuyClick = () => {
    if (!isLoggedIn) {
      window.location.href = `/login?callbackUrl=/recovery`;
      return;
    }
    setDrawerOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      for (const file of fileList) {
        try {
          const base64 = await compressImage(file);
          if (base64) {
            setScreenshots((prev) => [
              ...prev,
              { id: Math.random().toString(), base64, name: file.name },
            ]);
          }
        } catch (err) {
          console.error("Failed to compress image screenshot:", err);
        }
      }
    }
  };

  const activePlatform = socialPlatforms.find((p) => p.id === selectedMethod) || socialPlatforms[0];
  const ActiveIcon = activePlatform.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      
      {/* Upper Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-zinc-200 dark:border-white/[0.06] pb-10">
        
        {/* Left Side: Text Details */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] text-zinc-900 dark:text-white px-3 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">
            <HeartHandshake className="h-3.5 w-3.5" />
            Trainer Support Desk
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-none">
              {product.name}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Pricing & Checkout card */}
          <div className="bg-white dark:bg-[#111111] border border-zinc-200 dark:border-white/[0.06] rounded-lg p-6 space-y-4 max-w-md shadow-xs">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-3">
              <div>
                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider font-semibold">Starts At</span>
                <div className="text-2xl font-semibold text-zinc-900 dark:text-white mt-0.5">
                  <PriceDisplay amountInUSD={product.price} />
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
                  ))}
                </div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1">4.9/5 Trainer Satisfaction</span>
              </div>
            </div>

            {/* Buy button */}
            <button
              onClick={handleBuyClick}
              className="w-full h-10 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              <KeyRound className="h-4 w-4" />
              <span>Buy Recovery Service</span>
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
              <span>Protected by Secure Appeals Vault</span>
            </div>
          </div>
        </div>

        {/* Right Side: Graphic Banner Image */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative group rounded-lg border border-zinc-200 dark:border-white/[0.06] overflow-hidden bg-zinc-100 dark:bg-zinc-950/60 p-2 shadow-xs max-w-md w-full">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto object-cover rounded-md group-hover:scale-[1.01] transition-transform duration-500"
            />
          </div>
        </div>

      </div>

      {/* Benefits grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight border-l-4 border-zinc-900 dark:border-white pl-3">
          Why Trainers Trust Our Support Service
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-5 hover:border-zinc-300 dark:hover:border-white/[0.1] transition-all space-y-3 text-left shadow-xs"
              >
                <div className="h-8 w-8 rounded-md bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.08] flex items-center justify-center text-zinc-700 dark:text-zinc-300">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-white tracking-tight">{benefit.title}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-450 leading-relaxed">{benefit.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step by step recovery workflow */}
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 space-y-8 text-left shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">How The Recovery Workflow Works</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            A step-by-step breakdown of how our recovery team escalates and retrieves your Trainer account.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div key={index} className="relative space-y-3">
              <div className="text-3xl font-black text-zinc-200 dark:text-zinc-800 leading-none">
                {step.num}
              </div>
              <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{step.title}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">{step.desc}</p>
              {index < 3 && (
                <div className="hidden lg:block absolute top-4 right-[-15px] text-zinc-350 dark:text-zinc-850">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Slide-out Checkout drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            />

            {/* Sliding Panel Form */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#111111] border-l border-zinc-200 dark:border-white/[0.06] p-6 flex flex-col justify-between shadow-xl transition-colors duration-300 overflow-y-auto"
            >
              <div className="space-y-6 text-left">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-zinc-900 dark:text-white" />
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">Buy Recovery Service</h3>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="h-8 w-8 rounded-md border border-zinc-200 dark:border-white/[0.08] hover:bg-zinc-50 dark:hover:bg-white/[0.04] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {state.success ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="h-10 w-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-900 dark:text-white">Order Placed Successfully!</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
                        Our recovery team will reach out to you via your preferred social method ({activePlatform.name}) shortly.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {(state.error || uploadError) && (
                      <div className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 leading-snug">
                        {state.error || uploadError}
                      </div>
                    )}

                    {/* Trainer Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="trainerName" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Trainer Name</Label>
                      <Input
                        id="trainerName"
                        name="trainerName"
                        type="text"
                        placeholder="Trainer name here (Can be Old Trainer name)"
                        className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs h-8 px-3 rounded-md"
                      />
                    </div>

                    {/* Account Level */}
                    <div className="space-y-1.5">
                      <Label htmlFor="accountLevel" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Level</Label>
                      <Input
                        id="accountLevel"
                        name="accountLevel"
                        type="number"
                        min={1}
                        max={100}
                        required
                        placeholder="e.g. 40"
                        className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs h-8 px-3 rounded-md"
                      />
                    </div>

                    {/* Account Creation Method */}
                    <div className="space-y-1.5">
                      <Label htmlFor="creationMethod" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Creation Method</Label>
                      <select
                        id="creationMethod"
                        name="creationMethod"
                        required
                        className="w-full h-8 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/40 text-xs font-semibold focus:outline-hidden transition-colors cursor-pointer"
                      >
                        {creationMethods.map((m) => (
                          <option key={m.id} value={m.id} className="dark:bg-zinc-950 dark:text-white">
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Start Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Creation Start Date</Label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs h-8 px-3 rounded-md"
                      />
                    </div>

                    {/* Preferred Contact Method dropdown */}
                    <div className="space-y-1.5" ref={dropdownRef}>
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Preferred Contact Method
                      </Label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="w-full h-8 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/40 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 text-zinc-850 dark:text-white font-semibold">
                            <ActiveIcon />
                            <span>{activePlatform.name}</span>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200", dropdownOpen && "rotate-180")} />
                        </button>

                        <input type="hidden" name="contactMethod" value={selectedMethod} />

                        {dropdownOpen && (
                          <div className="absolute z-50 w-full mt-1.5 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-zinc-950/95 backdrop-blur-md shadow-lg overflow-hidden py-1">
                            {socialPlatforms.map((platform) => {
                              const PlatformIcon = platform.icon;
                              return (
                                <button
                                  key={platform.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMethod(platform.id);
                                    setDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full h-8 px-3 text-left text-[11px] font-semibold flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer",
                                    selectedMethod === platform.id ? "text-zinc-900 bg-zinc-50 dark:text-white dark:bg-white/[0.02]" : "text-zinc-500 dark:text-zinc-455"
                                  )}
                                >
                                  <PlatformIcon />
                                  <span>{platform.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Social ID */}
                    <div className="space-y-1.5">
                      <Label htmlFor="contactId" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Social Username / Link</Label>
                      <Input
                        id="contactId"
                        name="contactId"
                        type="text"
                        required
                        placeholder={activePlatform.placeholder}
                        className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs h-8 px-3 rounded-md"
                      />
                    </div>

                    {/* Alternate Contact */}
                    <div className="space-y-1.5">
                      <Label htmlFor="alternateContact" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Additional Contact (Optional)</Label>
                      <Input
                        id="alternateContact"
                        name="alternateContact"
                        type="text"
                        placeholder="Add another social profile or handle"
                        className="bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-white/[0.08] text-xs h-8 px-3 rounded-md"
                      />
                    </div>
                    {/* Screenshot Upload with base64 conversion */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Screenshots</Label>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-zinc-350 dark:border-white/[0.08] hover:border-zinc-400 dark:hover:border-white/[0.15] bg-zinc-50 dark:bg-zinc-950/30 rounded-md p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Upload className="h-4 w-4 text-zinc-455" />
                        <span className="text-[10px] text-zinc-550 dark:text-zinc-400 font-semibold text-center">
                          {screenshots.length > 0 ? `${screenshots.length} screenshot(s) selected` : "Click to upload screenshots (multiple allowed)"}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </div>
                      
                      {/* Hidden base64 json input */}
                      <input type="hidden" name="screenshotsBase64Json" value={JSON.stringify(screenshots.map(s => s.base64))} />

                      {screenshots.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-2 max-h-[180px] overflow-y-auto pr-1">
                          {screenshots.map((s) => (
                            <div key={s.id} className="relative aspect-video border border-zinc-200 dark:border-white/[0.06] rounded-md overflow-hidden bg-black flex items-center justify-center">
                              <img src={s.base64} alt="Preview" className="max-h-full max-w-full object-contain" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScreenshots((prev) => prev.filter((item) => item.id !== s.id));
                                }}
                                className="absolute top-1 right-1 h-4 w-4 bg-black/75 hover:bg-black text-white rounded-full flex items-center justify-center cursor-pointer border border-white/10 text-[9px]"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Checklist: Access to Email */}
                    <div className="space-y-1.5 pt-2">
                      <Label htmlFor="hasEmailAccess" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Do you still have access to the registered email address?
                      </Label>
                      <select
                        id="hasEmailAccess"
                        value={emailCheck}
                        onChange={(e) => setEmailCheck(e.target.value)}
                        required
                        className="w-full h-8 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/40 text-xs font-semibold focus:outline-hidden transition-colors cursor-pointer appearance-none"
                      >
                        <option value="">Select an option</option>
                        <option value="yes">Yes, I have access</option>
                        <option value="no">No, I lost access</option>
                      </select>
                      <input type="hidden" name="hasEmailAccess" value={emailCheck === "yes" ? "true" : "false"} />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || emailCheck === "" || screenshots.length === 0}
                      className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? "Uploading screenshots..." : isPending ? "Submitting Order..." : "Confirm & Buy Service"}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}

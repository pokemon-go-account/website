"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import { completeUserProfile } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

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

const RedditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#FF4500]">
    <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-5.99-1.72l1.2-3.78 3.9 1c.04.94.82 1.7 1.8 1.7 1 0 1.8-.8 1.8-1.8S20.5 3.5 19.5 3.5c-.8 0-1.5.5-1.7 1.2l-4.4-1.1c-.24-.05-.48.09-.54.33l-1.38 4.4C9.25 8.4 7.07 9.04 5.4 10.04c-.56-.76-1.46-1.24-2.46-1.24-1.65 0-3 1.35-3 3 0 1.2.7 2.23 1.7 2.7-.06.33-.1.66-.1 1 0 3.6 4.3 6.5 9.5 6.5 5.2 0 9.5-2.9 9.5-6.5 0-.34-.04-.67-.1-1 1-.47 1.7-1.5 1.7-2.7zm-18.5 2c0-1 .8-1.8 1.8-1.8s1.8.8 1.8 1.8-.8 1.8-1.8 1.8-1.8-.8-1.8-1.8zm11 3.5c-1.5 1.5-4.4 1.5-5.9 0-.2-.2-.2-.5 0-.7.2-.2.5-.2.7 0 1.1 1.1 3.4 1.1 4.5 0 .2-.2.5-.2.7 0 .2.2.2.5 0 .7zm-.3-1.7c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-[#1877F2]">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const socialPlatforms = [
  { id: "telegram", name: "Telegram", icon: TelegramIcon, placeholder: "e.g. @johndoe" },
  { id: "discord", name: "Discord", icon: DiscordIcon, placeholder: "e.g. johndoe" },
  { id: "whatsapp", name: "WhatsApp", icon: WhatsappIcon, placeholder: "e.g. +1 234 567 8900" },
  { id: "instagram", name: "Instagram", icon: InstagramIcon, placeholder: "e.g. @johndoe" },
  { id: "facebook", name: "Facebook", icon: FacebookIcon, placeholder: "e.g. facebook.com/johndoe" },
  { id: "reddit", name: "Reddit", icon: RedditIcon, placeholder: "e.g. u/johndoe" },
  { id: "x", name: "X (Twitter)", icon: XIcon, placeholder: "e.g. @johndoe" },
];

export function CompleteProfileForm() {
  const [state, formAction, isPending] = useActionState(completeUserProfile, {
    success: false,
    error: null,
  } as any);
  const { update } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Custom select state
  const [selectedMethod, setSelectedMethod] = useState("telegram");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState("");

  useEffect(() => {
    if (state.success && !isRedirecting) {
      setIsRedirecting(true);
      update({ isOnboarded: true, role: "USER" }).then(() => {
        // Use absolute URL to avoid any server/proxy rewrite interception
        const base = process.env.NEXT_PUBLIC_APP_URL || "";
        window.location.replace(`${base}/`);
      });
    }
  }, [state.success, update, isRedirecting]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activePlatform = socialPlatforms.find((p) => p.id === selectedMethod) || socialPlatforms[0];
  const ActiveIcon = activePlatform.icon;

  return (
    <form action={formAction} className="space-y-5 text-left">
      {state.error && (
        <div className="rounded-md bg-red-500/5 p-3 text-xs text-red-500 border border-red-500/10 leading-snug">
          {state.error}
        </div>
      )}

      {/* Full Name field */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Full Name
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. John Doe"
          className="h-8 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs px-3 rounded-md focus-visible:ring-zinc-900/10 transition-colors shadow-xs"
        />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-1 leading-relaxed font-medium">
          Enter your full name.
        </p>
      </div>

      {/* Preferred Contact Method dropdown */}
      <div className="space-y-2" ref={dropdownRef}>
        <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Preferred Contact Method
        </Label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full h-8 px-3 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/40 text-xs flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-white/[0.02] cursor-pointer transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2.5 text-zinc-800 dark:text-white font-semibold">
              <ActiveIcon />
              <span>{activePlatform.name}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200", dropdownOpen && "rotate-180")} />
          </button>

          {/* Hidden input for server action submission */}
          <input type="hidden" name="preferredContactMethod" value={selectedMethod} />

          {/* Dropdown Options */}
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
                      "w-full h-8 px-3 text-left text-xs font-semibold flex items-center gap-2.5 hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer",
                      selectedMethod === platform.id ? "text-zinc-900 bg-zinc-50 dark:text-white dark:bg-white/[0.02]" : "text-zinc-500 dark:text-zinc-405"
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

      {/* Username or Profile Link field */}
      <div className="space-y-2">
        <Label htmlFor="preferredContactId" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Username or Profile Link
        </Label>
        <Input
          id="preferredContactId"
          name="preferredContactId"
          type="text"
          required
          placeholder={activePlatform.placeholder}
          className="h-8 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs px-3 rounded-md focus-visible:ring-zinc-900/10 transition-colors shadow-xs"
        />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal pl-1 font-medium">
          We'll use this to contact you if we need to discuss your account, purchases, sales, or other marketplace-related matters.
        </p>
      </div>

      {/* Optional Divider */}
      <div className="relative py-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-white/[0.06]" />
        </div>
        <span className="relative z-10 px-3 bg-white dark:bg-[#111111] text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
          Optional
        </span>
      </div>

      {/* Country Select */}
      <div className="space-y-2">
        <Label htmlFor="country" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-zinc-400" />
          Country
        </Label>
        <div className="relative">
          <select
            id="country"
            name="country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            required
            className="w-full h-8 pl-3 pr-8 rounded-md border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-zinc-950/40 text-xs font-semibold text-zinc-800 dark:text-white focus:outline-none cursor-pointer appearance-none shadow-xs"
          >
            <option value="">Select your country</option>
            {[
              "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
              "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Belarus","Belgium","Belize",
              "Benin","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria",
              "Burkina Faso","Cambodia","Cameroon","Canada","Chile","China","Colombia","Costa Rica",
              "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic","Ecuador",
              "Egypt","El Salvador","Estonia","Ethiopia","Finland","France","Georgia","Germany",
              "Ghana","Greece","Guatemala","Honduras","Hungary","Iceland","India","Indonesia",
              "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan",
              "Kenya","Kosovo","Kuwait","Latvia","Lebanon","Libya","Lithuania","Luxembourg",
              "Malaysia","Malta","Mexico","Moldova","Mongolia","Montenegro","Morocco","Mozambique",
              "Myanmar","Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Korea",
              "North Macedonia","Norway","Oman","Pakistan","Panama","Paraguay","Peru","Philippines",
              "Poland","Portugal","Qatar","Romania","Russia","Saudi Arabia","Senegal","Serbia",
              "Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","Spain",
              "Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand",
              "Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates","United Kingdom",
              "United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
            ].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal pl-1 font-medium">
          Your country will be visible in your profile and helps us serve you better.
        </p>
      </div>

      {/* Additional Contact (Optional) field */}
      <div className="space-y-2">
        <Label htmlFor="alternateContact" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Additional Contact (Optional)
        </Label>
        <Input
          id="alternateContact"
          name="alternateContact"
          type="text"
          placeholder="Add another social profile or messaging app"
          className="h-8 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs px-3 rounded-md focus-visible:ring-zinc-900/10 transition-colors shadow-xs"
        />
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal pl-1 font-medium">
          Share another way for us to contact you, if available.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-8 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer mt-6"
      >
        {isPending ? "Finalizing Profile..." : "Continue →"}
      </Button>
    </form>
  );
}

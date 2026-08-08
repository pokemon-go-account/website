"use client";

import { useState, useEffect } from "react";
import { Mail, Copy, Check, Sun, Moon, ArrowUpRight } from "lucide-react";

interface MaintenanceClientProps {
  contactEmail: string;
  maintenanceMode: boolean;
}

export function MaintenanceClient({ contactEmail }: MaintenanceClientProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between transition-colors duration-200 selection:bg-zinc-800 selection:text-white ${theme === "dark" ? "dark bg-[#09090b] text-zinc-100" : "bg-white text-zinc-900"}`}>
      
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 object-contain" />
          <span className="font-semibold text-sm tracking-tight text-zinc-900 dark:text-white">
            Pokémon GO Marketplace
          </span>
        </div>

        {/* Minimal Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-medium"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-3.5 w-3.5 text-zinc-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-zinc-600" />
              <span>Dark</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-xl mx-auto space-y-8 z-10">
        
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium tracking-tight">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Scheduled Maintenance</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3.5">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white leading-tight">
            We are currently on maintenance.
            <br />
            We will be back soon.
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed font-normal">
            We are upgrading system infrastructure and database performance. All services will resume shortly.
          </p>
        </div>

        {/* Contact Email Section */}
        <div className="w-full p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 backdrop-blur-xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Need assistance? Contact us
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Online
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <span className="font-mono text-sm sm:text-base font-semibold text-zinc-900 dark:text-white select-all">
                {contactEmail}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyEmail}
                className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>

              <a
                href={`mailto:${contactEmail}`}
                className="h-8 px-3 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <span>Email Us</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

      </main>

      {/* Clean Footer (No Admin Links) */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-8 border-t border-zinc-100 dark:border-zinc-800/60 text-center text-xs text-zinc-400 dark:text-zinc-500 font-normal">
        © {new Date().getFullYear()} Pokémon GO Marketplace. All rights reserved.
      </footer>

    </div>
  );
}

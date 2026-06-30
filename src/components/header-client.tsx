"use client";

import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, LogOut, Shield, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";

interface HeaderClientProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  signOutAction: () => Promise<void>;
}

export function HeaderClient({ user, signOutAction }: HeaderClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants: Variants = {
    closed: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    open: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Branding */}
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-foreground hover:opacity-90 transition-opacity">
            <Shield className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />
            <span className="text-sm md:text-base font-bold bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
              Pokemon Go Auctions
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/auctions" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Auctions
            </Link>
            {(user?.role === "SELLER" || user?.role === "ADMIN") && (
              <Link href="/dashboard/seller" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Seller Dashboard
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Admin Control
              </Link>
            )}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground transition-all hover:bg-muted active:scale-95 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  Logged in as <strong className="text-foreground">{user.name || user.email}</strong> ({user.role})
                </span>
                <button
                  onClick={() => signOutAction()}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-4 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-95">
                  Get Started
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Theme Toggle & Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground transition-all hover:bg-muted active:scale-95 cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none cursor-pointer"
              aria-label="Toggle main menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={menuVariants}
            className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="space-y-1 px-4 py-4">
              <Link
                href="/auctions"
                onClick={toggleMenu}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
              >
                Auctions
              </Link>
              {(user?.role === "SELLER" || user?.role === "ADMIN") && (
                <Link
                  href="/dashboard/seller"
                  onClick={toggleMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  Seller Dashboard
                </Link>
              )}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={toggleMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                >
                  Admin Control
                </Link>
              )}

              <div className="border-t border-border mt-4 pt-4">
                {user ? (
                  <div className="space-y-3 px-3">
                    <div className="text-xs text-neutral-400">
                      Logged in as <strong className="text-neutral-200">{user.name || user.email}</strong> ({user.role})
                    </div>
                    <button
                      onClick={() => {
                        toggleMenu();
                        signOutAction();
                      }}
                      className="flex w-full h-10 items-center justify-center gap-2 rounded-lg border border-border bg-muted/40 text-sm font-medium text-foreground transition-all hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-3">
                    <Link
                      href="/login"
                      onClick={toggleMenu}
                      className="flex h-10 items-center justify-center rounded-lg border border-border bg-muted/20 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={toggleMenu}
                      className="flex h-10 items-center justify-center rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-neutral-200"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

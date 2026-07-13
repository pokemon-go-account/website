"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogOut, Shield, Sun, Moon, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSession, signOut as clientSignOut } from "next-auth/react";
import { useCurrencyStore, Currency } from "@/store/useCurrencyStore";
import { PriceDisplay } from "@/components/price-display";
import { cn } from "@/lib/utils";
import { getFreshBalance } from "@/features/auth/actions";

interface HeaderClientProps {
  user?: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
    role?: string | null;
    walletBalance?: number;
  };
  signOutAction?: () => Promise<void>;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/auctions", label: "Auctions" },
  { href: "/store", label: "Store" },
  { href: "/recovery", label: "Account Recovery" },
  { href: "/feedback", label: "Feedback" },
  { href: "/#faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function HeaderClient({ user: propUser, signOutAction }: HeaderClientProps) {
  const [mounted, setMounted] = useState(false);
  const [freshBalance, setFreshBalance] = useState<number | null>(null);
  const { data: session } = useSession();
  const { currency, setCurrency, isConverting } = useCurrencyStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sessionUser = session?.user;

  useEffect(() => {
    if (mounted && sessionUser?.id) {
      getFreshBalance().then((bal) => {
        setFreshBalance(bal);
      });
    }
  }, [mounted, sessionUser?.id]);

  const clientUser = sessionUser ? {
    name: sessionUser.name,
    username: (sessionUser as any).username,
    email: sessionUser.email,
    role: (sessionUser as any).role as string | undefined,
    walletBalance: (sessionUser as any).walletBalance ?? 0,
  } : undefined;

  // Prefer client-side user once it is loaded and has a role to guarantee reactivity,
  // falling back to server-provided propUser for instant SSR render without flickering.
  const user = mounted
    ? ((clientUser?.role ? clientUser : propUser) || clientUser || propUser)
    : propUser;
  
  // Prefer the database-queried balance from the server component to bypass stale session cookies
  const balance = mounted
    ? (freshBalance !== null ? freshBalance : (typeof propUser?.walletBalance === "number" ? propUser.walletBalance : (clientUser?.walletBalance ?? 0)))
    : (propUser?.walletBalance ?? 0);

  useEffect(() => {
    if (mounted) {
      console.log("[HeaderClient Debug] propUser:", propUser);
      console.log("[HeaderClient Debug] clientUser:", clientUser);
      console.log("[HeaderClient Debug] resolved user:", user);
    }
  }, [propUser, clientUser, user, mounted]);

  const handleSignOut = async () => {
    if (signOutAction) {
      await signOutAction();
    } else {
      await clientSignOut({ callbackUrl: "/" });
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuVariants: Variants = {
    closed: { opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeInOut" } },
    open: { opacity: 1, height: "auto", transition: { duration: 0.3, ease: "easeInOut" } },
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-200 dark:border-white/[0.06] shadow-xs"
          : "bg-white dark:bg-[#09090b] border-b border-zinc-150 dark:border-white/[0.04]"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Pokémon GO Services"
              width={160}
              height={40}
              priority
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors relative group py-1"
              >
                {label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-zinc-950 dark:bg-white transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            {/* Currency Selector */}
            <div className="relative inline-flex items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-8 pl-2.5 pr-7 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-700 dark:text-zinc-300 text-xs font-semibold focus:outline-none cursor-pointer appearance-none hover:border-zinc-300 dark:hover:border-white/20 transition-colors"
              >
                <option value="USD" className="bg-white dark:bg-[#09090b] text-foreground">USD ($)</option>
                <option value="EUR" className="bg-white dark:bg-[#09090b] text-foreground">EUR (€)</option>
                <option value="INR" className="bg-white dark:bg-[#09090b] text-foreground">INR (₹)</option>
                <option value="GBP" className="bg-white dark:bg-[#09090b] text-foreground">GBP (£)</option>
                <option value="JPY" className="bg-white dark:bg-[#09090b] text-foreground">JPY (¥)</option>
              </select>
              <div className="absolute right-2.5 pointer-events-none flex items-center text-zinc-400 dark:text-zinc-500">
                {isConverting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-[8px]">▼</span>
                )}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-650 dark:text-zinc-350 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4 relative">
                {/* Balance display */}
                <div className="text-xs text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5 bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.06] px-2.5 py-1 rounded-full font-semibold select-none shadow-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Balance:</span>
                  <span className={cn("font-bold text-zinc-900 dark:text-white")}>
                    <PriceDisplay amountInUSD={balance} />
                  </span>
                </div>

                {/* User Dropdown Trigger */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 h-8 px-3 rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition-all active:scale-[0.97]"
                  >
                    <div className="h-4.5 w-4.5 rounded-full bg-[#6133e1] text-white font-bold text-[9px] flex items-center justify-center uppercase select-none">
                      {user.username ? user.username[0] : (user.email ? user.email[0] : "U")}
                    </div>
                    <span className="max-w-[80px] truncate">{user.username || user.email?.split("@")[0]}</span>
                    <span className="text-[8px] opacity-60 transition-transform duration-200" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                  </button>

                  {/* User Dropdown Menu */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        {/* Overlay to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-52 rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#111112] p-1.5 shadow-xl z-50 text-left text-zinc-900 dark:text-white"
                        >
                          {/* User details header */}
                          <div className="px-2.5 py-2 border-b border-zinc-150 dark:border-white/[0.04] mb-1">
                            <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{user.username || "Trainer"}</p>
                            <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                            {user.role && (
                              <span className="inline-block mt-1 text-[8px] font-bold bg-[#6133e1]/10 text-[#6133e1] dark:text-[#8b5cf6] border border-[#6133e1]/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                {user.role.replace("_", " ")}
                              </span>
                            )}
                          </div>

                          {/* Menu items */}
                          <div className="space-y-0.5">
                            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                              <Link
                                href="/dashboard/admin"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-amber-600 dark:text-amber-400 transition-colors"
                              >
                                <Shield className="h-3.5 w-3.5" />
                                Admin Dashboard
                              </Link>
                            )}
                            {user.role === "SUPER_ADMIN" && (
                              <Link
                                href="/console"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-violet-650 dark:text-violet-400 transition-colors"
                              >
                                <Shield className="h-3.5 w-3.5" />
                                Super Console
                              </Link>
                            )}
                            <Link
                              href="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-650 dark:text-zinc-300 transition-colors"
                            >
                              My Account
                            </Link>
                            <Link
                              href="/orders"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-50 dark:hover:bg-white/5 font-semibold text-zinc-650 dark:text-zinc-300 transition-colors"
                            >
                              My Orders
                            </Link>
                          </div>

                          <div className="border-t border-zinc-150 dark:border-white/[0.04] mt-1 pt-1">
                            <button
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                handleSignOut();
                              }}
                              className="flex w-full items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs hover:bg-red-500/10 hover:text-red-650 text-red-550 dark:text-red-400 font-semibold transition-colors cursor-pointer"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-transparent px-4 text-xs font-semibold text-zinc-800 dark:text-white transition-all hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-zinc-950 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 px-4 text-xs font-bold text-white dark:text-black transition-all active:scale-95 shadow-xs cursor-pointer"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Currency Selector */}
            <div className="relative inline-flex items-center">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="h-8 pl-2 pr-6 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.04] text-zinc-650 dark:text-zinc-300 text-xs font-semibold focus:outline-none cursor-pointer appearance-none"
              >
                <option value="USD" className="bg-white dark:bg-[#09090b] text-foreground">USD ($)</option>
                <option value="EUR" className="bg-white dark:bg-[#09090b] text-foreground">EUR (€)</option>
                <option value="INR" className="bg-white dark:bg-[#09090b] text-foreground">INR (₹)</option>
                <option value="GBP" className="bg-white dark:bg-[#09090b] text-foreground">GBP (£)</option>
                <option value="JPY" className="bg-white dark:bg-[#09090b] text-foreground">JPY (¥)</option>
              </select>
              <div className="absolute right-2 pointer-events-none flex items-center text-zinc-400 dark:text-zinc-550">
                {isConverting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="text-[9px]">▼</span>
                )}
              </div>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center rounded-lg h-8 w-8 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center rounded-lg h-8 w-8 bg-zinc-50 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
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
            className="lg:hidden border-t border-zinc-200 dark:border-white/[0.06] bg-white/98 dark:bg-[#09090b]/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="space-y-0.5 px-4 py-3">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={toggleMenu}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-950 dark:hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
              {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                <Link
                  href="/dashboard/admin"
                  onClick={toggleMenu}
                  className="flex items-center gap-2.5 rounded-lg mx-1 px-3 py-2 text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-500/8 hover:bg-amber-500/15 border border-amber-450/20 hover:border-amber-400/40 transition-all mt-1"
                >
                  <Shield className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              )}
              {user?.role === "SUPER_ADMIN" && (
                <Link
                  href="/console"
                  onClick={toggleMenu}
                  className="flex items-center gap-2.5 rounded-lg mx-1 px-3 py-2 text-sm font-bold text-violet-600 dark:text-violet-400 bg-violet-500/8 hover:bg-violet-500/15 border border-violet-450/20 hover:border-violet-400/40 transition-all mt-1"
                >
                  <Shield className="h-4 w-4" />
                  Super Console
                </Link>
              )}

              <div className="border-t border-zinc-200 dark:border-white/[0.06] mt-3 pt-3">
                {user ? (
                  <div className="space-y-2 px-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 py-1.5 border-b border-zinc-150 dark:border-white/[0.04]">
                      <span>Balance</span>
                      <span className={cn(
                        "font-bold",
                        balance < 0 ? "text-red-500" : "text-emerald-500"
                      )}>
                        <PriceDisplay amountInUSD={balance} />
                      </span>
                    </div>
                    <Link href="/profile" onClick={toggleMenu} className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 py-1">
                      My Account ({user.role?.replace("_", " ")})
                    </Link>
                    <Link href="/orders" onClick={toggleMenu} className="block text-xs font-semibold text-zinc-650 dark:text-zinc-400 py-1">
                      My Orders
                    </Link>
                    <button
                      onClick={() => { toggleMenu(); handleSignOut(); }}
                      className="flex w-full h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-55 dark:bg-white/5 text-xs font-semibold text-zinc-800 dark:text-white cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    <Link
                      href="/login"
                      onClick={toggleMenu}
                      className="flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-xs font-bold text-zinc-800 dark:text-white cursor-pointer"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={toggleMenu}
                      className="flex h-9 items-center justify-center rounded-lg bg-zinc-950 dark:bg-white text-xs font-bold text-white dark:text-black cursor-pointer"
                    >
                      Register
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

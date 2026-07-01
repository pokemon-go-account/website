"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogOut, Search, Shield, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSession, signOut as clientSignOut } from "next-auth/react";

interface HeaderClientProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
  signOutAction?: () => Promise<void>;
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/auctions", label: "Auctions" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/dashboard/seller/listings/new", label: "Sell With Us" },
  { href: "/#faq", label: "FAQ" },
  { href: "/#contact", label: "Contact" },
];

export function HeaderClient({ user: propUser, signOutAction }: HeaderClientProps) {
  const { data: session } = useSession();
  const sessionUser = session?.user;
  
  const user = propUser || (sessionUser ? {
    name: sessionUser.name,
    email: sessionUser.email,
    role: (sessionUser as any).role || "USER",
  } : undefined);

  const handleSignOut = async () => {
    if (signOutAction) {
      await signOutAction();
    } else {
      await clientSignOut({ callbackUrl: "/" });
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
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
          ? "bg-white/95 dark:bg-[#0d0d0f]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/30"
          : "bg-white dark:bg-[#0d0d0f] border-b border-gray-200 dark:border-white/10"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shadow-md">
              <Shield className="h-4 w-4 text-white dark:text-black fill-white/10 dark:fill-black/10" />
            </div>
            <div className="leading-tight block">
              <p className="text-gray-900 dark:text-white font-extrabold text-xs sm:text-sm tracking-tight leading-none">POKÉMON GO</p>
              <p className="text-gray-500 dark:text-gray-400 font-bold text-[8px] sm:text-[10px] tracking-widest leading-none">AUCTION</p>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    window.location.href = `/auctions?search=${encodeURIComponent(search.trim())}`;
                  }
                }}
                placeholder="Search for accounts, items & more..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-gray-400/50 transition-all"
              />
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {navLinks.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors relative group"
              >
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-gray-900 dark:bg-white transition-all group-hover:w-full" />
              </Link>
            ))}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors">
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/profile" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  {user.name || user.email}
                </Link>
                <button
                  onClick={() => handleSignOut()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/5 px-3 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 dark:border-white/15 bg-transparent px-4 text-xs font-semibold text-gray-800 dark:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-8 items-center justify-center rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 px-4 text-xs font-bold text-white dark:text-black transition-all active:scale-95 shadow-md"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex items-center justify-center rounded-lg h-8 w-8 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={toggleMenu}
              className="flex items-center justify-center rounded-lg h-9 w-9 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white cursor-pointer"
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
            className="md:hidden border-t border-gray-200 dark:border-white/10 bg-white/98 dark:bg-[#0d0d0f]/98 backdrop-blur-xl overflow-hidden"
          >
            {/* Mobile search */}
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && search.trim()) {
                      setIsOpen(false); // Close mobile drawer
                      window.location.href = `/auctions?search=${encodeURIComponent(search.trim())}`;
                    }
                  }}
                  placeholder="Search accounts, items..."
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400/50"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            <div className="space-y-0.5 px-4 py-3">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={toggleMenu}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-950 dark:hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  onClick={toggleMenu}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Admin Control
                </Link>
              )}

              <div className="border-t border-gray-200 dark:border-white/10 mt-3 pt-3">
                {user ? (
                  <div className="space-y-2 px-2">
                    <Link href="/profile" onClick={toggleMenu} className="block text-xs text-gray-500 dark:text-gray-400 py-1">
                      {user.name || user.email} ({user.role})
                    </Link>
                    <button
                      onClick={() => { toggleMenu(); handleSignOut(); }}
                      className="flex w-full h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-sm font-medium text-gray-800 dark:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-2">
                    <Link
                      href="/login"
                      onClick={toggleMenu}
                      className="flex h-10 items-center justify-center rounded-lg border border-gray-200 dark:border-white/15 bg-gray-100 dark:bg-white/5 text-sm font-semibold text-gray-800 dark:text-white"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={toggleMenu}
                      className="flex h-10 items-center justify-center rounded-lg bg-gray-900 dark:bg-white text-sm font-bold text-white dark:text-black"
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

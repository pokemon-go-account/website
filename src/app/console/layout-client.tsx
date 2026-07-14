"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Users,
  Gavel,
  Banknote,
  CreditCard,
  ShoppingBag,
  FolderTree,
  Package2,
  KeyRound,
  MessageSquare,
  MessageCircle,
  ChevronDown,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Platform",
    items: [
      { href: "/console", label: "Overview", icon: LayoutDashboard },
      { href: "/console/users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/console/auctions", label: "Auctions", icon: Gavel },
      { href: "/console/registrations", label: "Registrations", icon: CreditCard },
      { href: "/console/orders", label: "Orders", icon: ShoppingBag },
      { href: "/console/payments", label: "UPI Payments", icon: IndianRupee },
      { href: "/console/rent", label: "Rent Manager", icon: Banknote },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/console/categories", label: "Categories", icon: FolderTree },
      { href: "/console/products", label: "Products", icon: Package2 },
    ],
  },
  {
    label: "Support",
    items: [
      { href: "/console/recovery", label: "Recovery", icon: KeyRound },

      { href: "/console/custom-requests", label: "Custom Requests", icon: MessageSquare },
      { href: "/console/contact", label: "Contact", icon: MessageSquare },
      { href: "/console/chat", label: "Live Chat", icon: MessageCircle },
    ],
  },
];

interface ConsoleLayoutClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function ConsoleLayoutClient({ children, user }: ConsoleLayoutClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() ?? "SA";

  const isActive = (href: string) =>
    href === "/console" ? pathname === "/console" : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-zinc-200 dark:border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
            <span className="text-white dark:text-zinc-900 text-[9px] font-black tracking-tight">SA</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none">Console</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                      active
                        ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] font-normal"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-zinc-200 dark:border-white/[0.06] px-3 py-3 space-y-1">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-900 dark:text-white truncate leading-none">
              {user.name ?? "Administrator"}
            </p>
            <p className="text-[10px] text-zinc-400 truncate mt-0.5 leading-none">{user.email}</p>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Exit Console</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-transparent text-zinc-900 dark:text-zinc-100">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] shrink-0 border-r border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] flex-col h-full">
        <SidebarContent />
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-14 shrink-0 border-b border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden -ml-1 h-8 w-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
              <span>Console</span>
              {pathname !== "/console" && (
                <>
                  <ChevronDown className="h-3 w-3 -rotate-90" />
                  <span className="text-zinc-900 dark:text-white font-medium capitalize">
                    {pathname.split("/").at(-1)?.replace(/-/g, " ")}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: user identity */}
          <div className="flex items-center gap-3">
            <div className="h-px w-px" /> {/* spacer */}
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center text-[10px] font-semibold text-white dark:text-zinc-900">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-zinc-900 dark:text-white leading-none">
                  {user.name ?? "Administrator"}
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 leading-none">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={cn("flex-1 bg-transparent", pathname === "/console/chat" ? "flex flex-col overflow-hidden h-[calc(100vh-3.5rem)]" : "overflow-y-auto")}>
          <div className={cn("max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full", pathname === "/console/chat" ? "flex-1 flex flex-col min-h-0" : "")}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[240px] bg-white dark:bg-[#111111] border-r border-zinc-200 dark:border-white/[0.06] flex flex-col lg:hidden shadow-xl"
            >
              {/* Drawer header with close */}
              <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-6 w-6 rounded bg-zinc-900 dark:bg-white flex items-center justify-center shrink-0">
                    <span className="text-white dark:text-zinc-900 text-[9px] font-black">SA</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">Console</p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-3">
                {navGroups.map((group) => (
                  <div key={group.label} className="mb-4">
                    <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-2 mb-1">
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map(({ href, label, icon: Icon }) => {
                        const active = isActive(href);
                        return (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setDrawerOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors",
                              active
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-medium"
                                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Footer */}
              <div className="shrink-0 border-t border-zinc-200 dark:border-white/[0.06] px-3 py-3 space-y-1">
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-900 dark:text-white truncate leading-none">
                      {user.name ?? "Administrator"}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate mt-0.5 leading-none">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.04] transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Exit Console</span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

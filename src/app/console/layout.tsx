import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { ShieldAlert, Users, Gavel, Banknote, FolderTree, Package2, LogOut } from "lucide-react";

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const navLinks = [
    { href: "/console", label: "Overview", icon: ShieldAlert },
    { href: "/console/users", label: "Promote Users", icon: Users },
    { href: "/console/auctions", label: "Auction Approvals", icon: Gavel },
    { href: "/console/rent", label: "Rent Manager", icon: Banknote },
    { href: "/console/categories", label: "Categories", icon: FolderTree },
    { href: "/console/products", label: "Products", icon: Package2 },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/[0.05] bg-zinc-950/80 backdrop-blur-md flex flex-col justify-between h-full">
        <div className="p-5 flex flex-col gap-5">
          {/* Brand */}
          <div className="flex items-center gap-2 border-b border-white/[0.05] pb-4">
            <div className="h-7 w-7 rounded bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <ShieldAlert className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-white uppercase tracking-widest leading-none">Root Console</p>
              <p className="text-[8px] text-zinc-600 mt-0.5 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent hover:border-white/[0.04] transition-all"
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-5">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-xl border border-white/[0.06] text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-white/[0.03]"
          >
            <LogOut className="h-3 w-3" />
            Exit Console
          </Link>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="flex-1 overflow-y-auto h-full p-8 space-y-8">
        {children}
      </main>
    </div>
  );
}

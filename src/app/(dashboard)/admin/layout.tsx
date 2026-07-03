import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import { Shield, FolderTree, Package2, ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-black dark:bg-[#09090B] text-white">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/[0.05] bg-zinc-950/60 backdrop-blur-md flex flex-col justify-between shrink-0 h-full">
        <div className="flex flex-col gap-6 p-6">
          {/* Brand header */}
          <Link href="/admin" className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded bg-red-600/10 border border-red-500/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <p className="font-extrabold text-xs tracking-wider uppercase text-white leading-none">Console Center</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Admin Session</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 text-xs">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold bg-white/[0.02] border border-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Shield className="h-4 w-4 text-zinc-400" />
              Overview Control
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold bg-white/[0.02] border border-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <FolderTree className="h-4 w-4 text-zinc-400" />
              Manage Categories
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold bg-white/[0.02] border border-white/[0.04] text-zinc-300 hover:text-white hover:bg-white/[0.05] transition-all"
            >
              <Package2 className="h-4 w-4 text-zinc-400" />
              Manage Products
            </Link>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-6">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full h-9 rounded-xl border border-white/[0.08] hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-bold transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Exit Console
          </Link>
        </div>
      </aside>

      {/* Main Content Workspace viewport */}
      <main className="flex-1 overflow-y-auto h-full p-8 sm:p-12 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}

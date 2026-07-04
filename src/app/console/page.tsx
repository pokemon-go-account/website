import { getAllAdmins, getPendingAuctionListings } from "@/features/console/actions";
import { ShieldAlert, Users, Gavel, Banknote, AlertTriangle } from "lucide-react";

export default async function ConsolePage() {
  const [adminsRes, listingsRes] = await Promise.all([
    getAllAdmins(),
    getPendingAuctionListings(),
  ]);

  const admins = adminsRes.admins || [];
  const listings = listingsRes.listings || [];
  const expiredAdmins = admins.filter(
    (a: any) => !a.adminRentPaidUntil || new Date(a.adminRentPaidUntil) < new Date()
  );

  const stats = [
    { label: "Active ADMINs", value: admins.length, icon: Users, color: "text-violet-400" },
    { label: "Pending Listings", value: listings.length, icon: Gavel, color: "text-amber-400" },
    { label: "Rent Overdue", value: expiredAdmins.length, icon: Banknote, color: "text-red-400" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border-b border-zinc-200 dark:border-white/[0.05] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-violet-500 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-950 dark:text-white">Root Console</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Platform-wide control — hidden from all standard users</p>
          </div>
        </div>
      </div>

      {expiredAdmins.length > 0 && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3 text-xs text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">{expiredAdmins.length} ADMIN(s) have overdue rent.</span>{" "}
            Visit the Rent Manager to review and update their access.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.04] dark:bg-white/[0.01] p-6 space-y-3 shadow-xs">
            <Icon className={`h-5 w-5 ${color}`} />
            <div>
              <p className="text-3xl font-black text-zinc-955 dark:text-white">{value}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

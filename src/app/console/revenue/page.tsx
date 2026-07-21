import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { RevenueClient } from "@/app/console/revenue/revenue-client";
import { getRevenueAnalyticsAction } from "@/features/analytics/revenue-actions";
import { getLiveExchangeRates } from "@/features/store/currency-actions";

export const revalidate = 0;

export default async function RevenueConsolePage() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const [revRes, rateRes] = await Promise.all([
    getRevenueAnalyticsAction(),
    getLiveExchangeRates(),
  ]);

  const initialData = revRes.success && revRes.data ? revRes.data : undefined;
  const initialRates = rateRes.success && rateRes.rates ? rateRes.rates : undefined;

  return <RevenueClient initialData={initialData} initialRates={initialRates} />;
}

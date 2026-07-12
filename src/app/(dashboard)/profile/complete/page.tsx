import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "./complete-form";

export const revalidate = 0; // Dynamic route

export default async function ProfileCompletePage() {
  let session = null;
  try {
    session = await auth();
  } catch (error) {
    console.error("ProfileCompletePage session retrieval error:", error);
  }

  const user = session?.user;

  // If already onboarded, redirect away from the completion route
  if (user && (user as any).isOnboarded) {
    redirect("/auctions");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-white px-4 py-16 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="relative w-full max-w-md space-y-6 border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-8 rounded-lg shadow-xs transition-colors duration-300 text-left">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400">
            Please provide your name, communication handle, and role to continue.
          </p>
        </div>

        <CompleteProfileForm />
      </div>
    </div>
  );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "./complete-form";

export const revalidate = 0; // Dynamic route

export default async function ProfileCompletePage() {
  const session = await auth();

  // If not logged in, redirect to login page
  if (!session?.user) {
    redirect("/login");
  }

  // If already onboarded, redirect away from the completion route
  if ((session.user as any).isOnboarded) {
    redirect("/auctions");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-card/30 backdrop-blur-md p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent">
            Complete Your Profile
          </h2>
          <p className="text-xs text-muted-foreground">
            Please provide your name, communication handle, and role to continue.
          </p>
        </div>

        <CompleteProfileForm />
      </div>
    </div>
  );
}

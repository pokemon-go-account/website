import { NewListingForm } from "./listing-form";

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-2 pb-6 border-b border-zinc-200 dark:border-white/[0.06]">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">Create New Asset Listing</h1>
        <p className="text-xs text-zinc-500">
          Fill out comprehensive account telemetry indicators. Your listing remains hidden until authenticated by system admins.
        </p>
      </div>
      <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-[#111111] p-6 sm:p-8 shadow-xs transition-colors duration-300">
        <NewListingForm />
      </div>
    </div>
  );
}
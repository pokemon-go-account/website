import { NewListingForm } from "./listing-form";

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-2 pb-8 border-b border-border">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Create New Asset Listing</h1>
        <p className="text-sm text-muted-foreground">
          Fill out comprehensive account telemetry indicators. Your listing remains hidden until authenticated by system admins.
        </p>
      </div>
      <div className="mt-8">
        <NewListingForm />
      </div>
    </div>
  );
}
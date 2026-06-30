"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ListingValidationSchema } from "@/models/Listing.validation";
import { createListing } from "@/features/auctions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormData = z.infer<typeof ListingValidationSchema>;

export function NewListingForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ListingValidationSchema),
    defaultValues: {
      team: "NONE",
      screenshots: ["https://placeholder-image-url.com/asset.png"], // Temporary until Cloudinary milestone
      shinyCount: 0,
      legendaryCount: 0,
      mythicalCount: 0,
      xp: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    setServerError(null);

    const result = await createListing(data);

    if (!result.success) {
      setServerError(result.error);
      setIsPending(false);
    } else {
      router.push("/dashboard/seller?success=true");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive">
          {serverError}
        </div>
      )}

      {/* Section 1: Core Information */}
      <div className="space-y-4 border-b border-border pb-6">
        <h3 className="text-sm font-medium text-foreground tracking-tight">Core Asset Identification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="title">Listing Title</Label>
            <Input id="title" {...register("title")} placeholder="Level 50 Account - Rare Shinies" className="bg-muted/30" />
            {errors.title && <p className="text-[11px] text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="telegramUsername">Your Telegram Handle (Private)</Label>
            <Input id="telegramUsername" {...register("telegramUsername")} placeholder="@sourav_jha" className="bg-muted/30" />
            {errors.telegramUsername && <p className="text-[11px] text-destructive">{errors.telegramUsername.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Comprehensive Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Outline specific metadata records, exceptional items..." className="bg-muted/30 min-h-[100px]" />
          {errors.description && <p className="text-[11px] text-destructive">{errors.description.message}</p>}
        </div>
      </div>

      {/* Section 2: In-Game Metrics Grid */}
      <div className="space-y-4 border-b border-border pb-6">
        <h3 className="text-sm font-medium text-foreground tracking-tight">In-Game Asset Analytics</h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="level">Trainer Level</Label>
            <Input id="level" type="number" {...register("level", { valueAsNumber: true })} className="bg-muted/30" />
            {errors.level && <p className="text-[11px] text-destructive">{errors.level.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="stardust">Stardust Balance</Label>
            <Input id="stardust" type="number" {...register("stardust", { valueAsNumber: true })} className="bg-muted/30" />
            {errors.stardust && <p className="text-[11px] text-destructive">{errors.stardust.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="team">Faction Team</Label>
            <Select onValueChange={(val: any) => setValue("team", val)}>
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="MYSTIC">Mystic (Blue)</SelectItem>
                <SelectItem value="VALOR">Valor (Red)</SelectItem>
                <SelectItem value="INSTINCT">Instinct (Yellow)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="region">Account Region</Label>
            <Input id="region" {...register("region")} placeholder="Asia / Global" className="bg-muted/30" />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="shinyCount">Shiny Count</Label>
            <Input id="shinyCount" type="number" {...register("shinyCount", { valueAsNumber: true })} className="bg-muted/30" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="legendaryCount">Legendary Count</Label>
            <Input id="legendaryCount" type="number" {...register("legendaryCount", { valueAsNumber: true })} className="bg-muted/30" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mythicalCount">Mythical Count</Label>
            <Input id="mythicalCount" type="number" {...register("mythicalCount", { valueAsNumber: true })} className="bg-muted/30" />
          </div>
        </div>
      </div>

      {/* Section 3: Financial Pricing Structures */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground tracking-tight">Auction Economics & Timeline</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="startingBid">Starting Bid (₹)</Label>
            <Input id="startingBid" type="number" {...register("startingBid", { valueAsNumber: true })} placeholder="1999" className="bg-muted/30" />
            {errors.startingBid && <p className="text-[11px] text-destructive">{errors.startingBid.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="reservePrice">Reserve Price (₹)</Label>
            <Input id="reservePrice" type="number" {...register("reservePrice", { valueAsNumber: true })} placeholder="4999" className="bg-muted/30" />
            {errors.reservePrice && <p className="text-[11px] text-destructive">{errors.reservePrice.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="minIncrement">Min Increment (₹)</Label>
            <Input id="minIncrement" type="number" {...register("minIncrement", { valueAsNumber: true })} placeholder="100" className="bg-muted/30" />
            {errors.minIncrement && <p className="text-[11px] text-destructive">{errors.minIncrement.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="durationHours">Duration (Hours)</Label>
            <Input id="durationHours" type="number" {...register("durationHours", { valueAsNumber: true })} placeholder="24" className="bg-muted/30" />
            {errors.durationHours && <p className="text-[11px] text-destructive">{errors.durationHours.message}</p>}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto px-8 font-medium">
        {isPending ? "Submitting Application..." : "Submit Listing for Verification"}
      </Button>
    </form>
  );
}
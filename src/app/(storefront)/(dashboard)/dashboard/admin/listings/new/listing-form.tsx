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
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Controlled states for Base UI Select components
  const [accountType, setAccountType] = useState<string>("Google");
  const [team, setTeam] = useState<string>("NONE");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(ListingValidationSchema),
    defaultValues: {
      team: "NONE",
      screenshots: [],
      shinyCount: 0,
      legendaryCount: 0,
      mythicalCount: 0,
      xp: 0,
      pokedexCompleted: 0,
      bestBuddyCount: 0,
      pokeCoins: 0,
      startDate: "Early 2020",
      accountType: "Google",
      accountStatus: "Safe (No Strikes)",
      weeklyDistance: 0,
      topPokemon: "",
      rareCandy: 0,
      fastTm: 0,
      chargedTm: 0,
      eliteFastTm: 0,
      eliteChargedTm: 0,
      incubators: 0,
      luckyEggs: 0,
      lureModules: 0,
      premiumRaidPass: 0,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setServerError(null);

    const newUrls = [...uploadedImages];

    try {
      const { uploadImageAction } = await import("@/features/auctions/actions");
      
      for (const file of files) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);
        const base64Data = await base64Promise;

        const res = await uploadImageAction(base64Data);
        if (res.success && res.url) {
          newUrls.push(res.url);
        } else {
          setServerError(res.error || "Failed to upload image.");
        }
      }

      setUploadedImages(newUrls);
      setValue("screenshots", newUrls, { shouldValidate: true });
    } catch (err: any) {
      console.error("Upload error:", err);
      setServerError("An error occurred during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newUrls = uploadedImages.filter((_, idx) => idx !== indexToRemove);
    setUploadedImages(newUrls);
    setValue("screenshots", newUrls, { shouldValidate: true });
  };

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    setServerError(null);

    const result = await createListing(data);

    if (!result.success) {
      setServerError(result.error);
      setIsPending(false);
    } else {
      router.push("/dashboard/admin?success=true");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 text-left">
      {serverError && (
        <div className="rounded-md bg-red-500/5 border border-red-500/10 p-3.5 text-xs text-red-550">
          {serverError}
        </div>
      )}

      {/* Section 1: Core Information */}
      <div className="space-y-4 border-b border-zinc-200 dark:border-white/[0.06] pb-6">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Core Asset Identification</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Listing Title</Label>
            <Input id="title" {...register("title")} placeholder="Level 50 Account - Rare Shinies" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.title && <p className="text-[10px] text-red-500 font-semibold">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telegramUsername" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Your Telegram Handle (Private)</Label>
            <Input id="telegramUsername" {...register("telegramUsername")} placeholder="@trainer_handle" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.telegramUsername && <p className="text-[10px] text-red-500 font-semibold">{errors.telegramUsername.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Comprehensive Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Outline specific metadata records, exceptional items..." className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white rounded-md focus-visible:ring-zinc-900/10 min-h-[100px] leading-relaxed resize-none" />
          {errors.description && <p className="text-[10px] text-red-500 font-semibold">{errors.description.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="accountType" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Link Type</Label>
            <Select value={accountType} onValueChange={(val: any) => { setAccountType(val); setValue("accountType", val); }}>
              <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md w-full">
                <SelectValue placeholder="Select Account Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Google">Google (Gmail)</SelectItem>
                <SelectItem value="PTC">PTC (Pokemon Trainer Club)</SelectItem>
                <SelectItem value="Nintendo">Nintendo Account</SelectItem>
                <SelectItem value="Facebook">Facebook Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accountStatus" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Standing Status</Label>
            <Input id="accountStatus" {...register("accountStatus")} placeholder="Safe (No Strikes)" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.accountStatus && <p className="text-[10px] text-red-500 font-semibold">{errors.accountStatus.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Start Date</Label>
            <Input id="startDate" {...register("startDate")} placeholder="Early 2019" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.startDate && <p className="text-[10px] text-red-500 font-semibold">{errors.startDate.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="topPokemon" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Top Pokémon Highlights (Comma-separated name + CP)</Label>
          <Textarea id="topPokemon" {...register("topPokemon")} placeholder="Mewtwo (CP 4724), Rayquaza (CP 4335), Kyogre (CP 4115)" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white rounded-md focus-visible:ring-zinc-900/10 min-h-[60px] leading-relaxed resize-none" />
          {errors.topPokemon && <p className="text-[10px] text-red-500 font-semibold">{errors.topPokemon.message}</p>}
        </div>

        {/* Screenshots File Uploader */}
        <div className="space-y-2 pt-2">
          <Label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Screenshots / Gallery Images</Label>
          <div className="border border-dashed border-zinc-200 dark:border-white/[0.08] rounded-md p-6 bg-zinc-50 dark:bg-[#111111]/30 flex flex-col items-center justify-center gap-3">
            <input
              type="file"
              multiple
              accept="image/*"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isUploading ? "Uploading to Cloud..." : "Choose Image Screenshots"}
            </label>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold">Select one or multiple account screenshots (PNG, JPG, up to 10MB)</p>
          </div>
          {errors.screenshots && <p className="text-[10px] text-red-500 font-semibold">{errors.screenshots.message}</p>}

          {/* Image Preview Grid */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-3">
              {uploadedImages.map((url, idx) => (
                <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#111111]">
                  <img src={url} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-red-400 hover:text-red-300 transition-opacity duration-150 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: In-Game Metrics Grid */}
      <div className="space-y-4 border-b border-zinc-200 dark:border-white/[0.06] pb-6">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">In-Game Asset Analytics</h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="level" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Trainer Level</Label>
            <Input id="level" type="number" {...register("level", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.level && <p className="text-[10px] text-red-500 font-semibold">{errors.level.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stardust" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Stardust Balance</Label>
            <Input id="stardust" type="number" {...register("stardust", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.stardust && <p className="text-[10px] text-red-500 font-semibold">{errors.stardust.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="team" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Faction Team</Label>
            <Select value={team} onValueChange={(val: any) => { setTeam(val); setValue("team", val); }}>
              <SelectTrigger className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md w-full">
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
          <div className="space-y-1.5">
            <Label htmlFor="region" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Region</Label>
            <Input id="region" {...register("region")} placeholder="Asia / Global" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="shinyCount" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Shiny Count</Label>
            <Input id="shinyCount" type="number" {...register("shinyCount", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legendaryCount" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Legendary Count</Label>
            <Input id="legendaryCount" type="number" {...register("legendaryCount", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mythicalCount" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Mythical Count</Label>
            <Input id="mythicalCount" type="number" {...register("mythicalCount", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="xp" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Total XP</Label>
            <Input id="xp" type="number" {...register("xp", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.xp && <p className="text-[10px] text-red-500 font-semibold">{errors.xp.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pokedexCompleted" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Pokedex Completed %</Label>
            <Input id="pokedexCompleted" type="number" {...register("pokedexCompleted", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.pokedexCompleted && <p className="text-[10px] text-red-500 font-semibold">{errors.pokedexCompleted.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bestBuddyCount" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Best Buddy Count</Label>
            <Input id="bestBuddyCount" type="number" {...register("bestBuddyCount", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.bestBuddyCount && <p className="text-[10px] text-red-500 font-semibold">{errors.bestBuddyCount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pokeCoins" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">PokeCoins Balance</Label>
            <Input id="pokeCoins" type="number" {...register("pokeCoins", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.pokeCoins && <p className="text-[10px] text-red-500 font-semibold">{errors.pokeCoins.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weeklyDistance" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Weekly Distance (km)</Label>
            <Input id="weeklyDistance" type="number" {...register("weeklyDistance", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.weeklyDistance && <p className="text-[10px] text-red-500 font-semibold">{errors.weeklyDistance.message}</p>}
          </div>
        </div>
      </div>
      {/* Section 3: In-Game Inventory & Resources */}
      <div className="space-y-4 border-b border-zinc-200 dark:border-white/[0.06] pb-6">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Items & Resource Inventory</h3>
        <div className="grid gap-4 grid-cols-3 sm:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor="rareCandy" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Rare Candy</Label>
            <Input id="rareCandy" type="number" {...register("rareCandy", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fastTm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Fast TM</Label>
            <Input id="fastTm" type="number" {...register("fastTm", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chargedTm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Charged TM</Label>
            <Input id="chargedTm" type="number" {...register("chargedTm", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eliteFastTm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Elite Fast TM</Label>
            <Input id="eliteFastTm" type="number" {...register("eliteFastTm", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eliteChargedTm" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Elite Charged TM</Label>
            <Input id="eliteChargedTm" type="number" {...register("eliteChargedTm", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="incubators" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Incubators</Label>
            <Input id="incubators" type="number" {...register("incubators", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="luckyEggs" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Lucky Eggs</Label>
            <Input id="luckyEggs" type="number" {...register("luckyEggs", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lureModules" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Lure Modules</Label>
            <Input id="lureModules" type="number" {...register("lureModules", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="premiumRaidPass" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Premium Raid Pass</Label>
            <Input id="premiumRaidPass" type="number" {...register("premiumRaidPass", { valueAsNumber: true })} className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
          </div>
        </div>
      </div>

      {/* Section 4: Financial Pricing Structures */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Auction Economics & Timeline</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="startingBid" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Starting Bid ($)</Label>
            <Input id="startingBid" type="number" {...register("startingBid", { valueAsNumber: true })} placeholder="1999" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.startingBid && <p className="text-[10px] text-red-500 font-semibold">{errors.startingBid.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reservePrice" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Reserve Price ($)</Label>
            <Input id="reservePrice" type="number" {...register("reservePrice", { valueAsNumber: true })} placeholder="4999" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.reservePrice && <p className="text-[10px] text-red-500 font-semibold">{errors.reservePrice.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minIncrement" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Min Increment ($)</Label>
            <Input id="minIncrement" type="number" {...register("minIncrement", { valueAsNumber: true })} placeholder="100" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.minIncrement && <p className="text-[10px] text-red-500 font-semibold">{errors.minIncrement.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationHours" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Duration (Hours)</Label>
            <Input id="durationHours" type="number" {...register("durationHours", { valueAsNumber: true })} placeholder="24" className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus-visible:ring-zinc-900/10" />
            {errors.durationHours && <p className="text-[10px] text-red-500 font-semibold">{errors.durationHours.message}</p>}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="h-8 px-6 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-semibold flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer mt-4 w-full sm:w-auto">
        {isPending ? "Submitting Application..." : "Submit Listing for Verification"}
      </Button>
    </form>
  );
}
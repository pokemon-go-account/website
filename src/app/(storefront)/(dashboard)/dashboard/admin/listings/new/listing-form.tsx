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
      stardust: 0,
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

      // New stats defaults
      platinumMedals: 0,
      legendaryPoses: 0,
      shinyPokemons: 0,
      shinyMythical: 0,
      shinyUltrabeasts: 0,
      shinyLegendaries: 0,
      legendaryPokemons: 0,
      ultrabeasts: 0,
      mythicalPokemons: 0,
      hundoMythicalLegendaryUltrabeast: 0,
      shundoLegendaryMythicalUltrabeast: 0,
      shundoPokemons: 0,
      hundoPokemons: 0,
      costumeShinies: 0,
      hatchedShinies: 0,
      luckyPokemons: 0,
      luckyLegendaries: 0,
      shinyLuckyLegendaries: 0,
      locationBackgroundLegendaryShiny: 0,
      specialBackgroundLegendaryShiny: 0,
      candyXlPokemons: 0,
      candyXlLegendaries: 0,
      bestBuddies: 0,
      dualMovePokemons: 0,
      shadowShinyPokemons: 0,
      pokemonStorage: 0,
      itemBagStorage: 0,
      masterBalls: 0,
      raidPasses: 0,
      superRocketRadar: 0,
      pokedexRegisteredNumber: 0,
      bansCount: 0,
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
            <Input id="title" {...register("title")} placeholder="Level 50 Account - Rare Shinies" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.title && <p className="text-[10px] text-red-500 font-semibold">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telegramUsername" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Your Telegram Handle (Private)</Label>
            <Input id="telegramUsername" {...register("telegramUsername")} placeholder="@trainer_handle" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.telegramUsername && <p className="text-[10px] text-red-500 font-semibold">{errors.telegramUsername.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Comprehensive Description</Label>
          <Textarea id="description" {...register("description")} placeholder="Outline specific metadata records, exceptional items..." className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white min-h-[100px] leading-relaxed resize-none transition-all" />
          {errors.description && <p className="text-[10px] text-red-500 font-semibold">{errors.description.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="accountType" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Link Type</Label>
            <Select value={accountType} onValueChange={(val: any) => { setAccountType(val); setValue("accountType", val); }}>
              <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md w-full focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all">
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
            <Input id="accountStatus" {...register("accountStatus")} placeholder="Safe (No Strikes)" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.accountStatus && <p className="text-[10px] text-red-500 font-semibold">{errors.accountStatus.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Start Date</Label>
            <Input id="startDate" {...register("startDate")} placeholder="Early 2019" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.startDate && <p className="text-[10px] text-red-500 font-semibold">{errors.startDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Account Region</Label>
            <Input id="region" {...register("region")} placeholder="Asia / Global" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.region && <p className="text-[10px] text-red-500 font-semibold">{errors.region.message}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="team" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Faction Team</Label>
            <Select value={team} onValueChange={(val: any) => { setTeam(val); setValue("team", val); }}>
              <SelectTrigger className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md w-full focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all">
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
            <Label htmlFor="topPokemon" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Top Pokémon Highlights (Comma-separated)</Label>
            <Input id="topPokemon" {...register("topPokemon")} placeholder="Mewtwo (CP 4724), Rayquaza (CP 4335)" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
          </div>
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

      {/* Section 2: Pokémon In-Game Statistics & Inventory */}
      <div className="space-y-4 border-b border-zinc-200 dark:border-white/[0.06] pb-6">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Pokémon In-Game Stats & Metrics</h3>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { id: "level", label: "Level *" },
            { id: "stardust", label: "Stardust *" },
            { id: "xp", label: "XP *" },
            { id: "pokeCoins", label: "PokeCoins *" },
            { id: "platinumMedals", label: "Platinum Medals" },
            { id: "legendaryPoses", label: "Legendary Poses" },
            { id: "shinyPokemons", label: "Shiny Pokemons" },
            { id: "shinyMythical", label: "Shiny Mythical" },
            { id: "shinyUltrabeasts", label: "Shiny Ultrabeasts" },
            { id: "shinyLegendaries", label: "Shiny Legendaries" },
            { id: "legendaryPokemons", label: "Legendary Pokemons" },
            { id: "ultrabeasts", label: "Ultrabeasts" },
            { id: "mythicalPokemons", label: "Mythical Pokemons" },
            { id: "hundoMythicalLegendaryUltrabeast", label: "Hundo Mythical/Leg/UB" },
            { id: "shundoLegendaryMythicalUltrabeast", label: "Shundo Legendary/Mythical/UB" },
            { id: "shundoPokemons", label: "Shundo Pokemons" },
            { id: "hundoPokemons", label: "Hundo Pokemons" },
            { id: "costumeShinies", label: "Costume Shinies" },
            { id: "hatchedShinies", label: "Hatched Shinies" },
            { id: "luckyPokemons", label: "Lucky Pokemons" },
            { id: "luckyLegendaries", label: "Lucky Legendaries" },
            { id: "shinyLuckyLegendaries", label: "Shiny Lucky Legendaries" },
            { id: "locationBackgroundLegendaryShiny", label: "Location BG Leg Shiny" },
            { id: "specialBackgroundLegendaryShiny", label: "Special BG Leg Shiny" },
            { id: "candyXlPokemons", label: "CandyXL Pokemons" },
            { id: "candyXlLegendaries", label: "CandyXL Legendaries" },
            { id: "bestBuddies", label: "Best Buddies" },
            { id: "dualMovePokemons", label: "Dual Move Pokemons" },
            { id: "shadowShinyPokemons", label: "Shadow Shiny Pokemons" },
            { id: "pokemonStorage", label: "Pokemon Storage" },
            { id: "itemBagStorage", label: "Item Bag Storage" },
            { id: "masterBalls", label: "Master Balls" },
            { id: "raidPasses", label: "Raid Passes" },
            { id: "superRocketRadar", label: "Super Rocket Radar" },
            { id: "pokedexRegisteredNumber", label: "Pokedex Registered #" },
            { id: "bansCount", label: "Bans Count" },
          ].map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {field.label}
              </Label>
              <Input
                id={field.id}
                type="number"
                placeholder="0"
                {...register(field.id as any, { valueAsNumber: true })}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all"
              />
              {(errors as any)[field.id] && (
                <p className="text-[10px] text-red-500 font-semibold">
                  {(errors as any)[field.id].message}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Financial Pricing Structures */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Auction Economics & Timeline</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="startingBid" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Starting Bid ($)</Label>
            <Input id="startingBid" type="number" {...register("startingBid", { valueAsNumber: true })} placeholder="1999" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.startingBid && <p className="text-[10px] text-red-500 font-semibold">{errors.startingBid.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reservePrice" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Reserve Price ($)</Label>
            <Input id="reservePrice" type="number" {...register("reservePrice", { valueAsNumber: true })} placeholder="4999" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.reservePrice && <p className="text-[10px] text-red-500 font-semibold">{errors.reservePrice.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minIncrement" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Min Increment ($)</Label>
            <Input id="minIncrement" type="number" {...register("minIncrement", { valueAsNumber: true })} placeholder="100" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
            {errors.minIncrement && <p className="text-[10px] text-red-500 font-semibold">{errors.minIncrement.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationHours" className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Duration (Hours)</Label>
            <Input id="durationHours" type="number" {...register("durationHours", { valueAsNumber: true })} placeholder="24" className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-xs text-zinc-900 dark:text-white h-8 px-3 rounded-md focus:outline-none focus:border-zinc-950 dark:focus:border-white focus:ring-1 focus:ring-zinc-950 dark:focus:ring-white transition-all" />
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
"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  amountInUSD: number;
  className?: string;
}

export function PriceDisplay({ amountInUSD, className }: PriceDisplayProps) {
  const { convert, isConverting } = useCurrencyStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>${Math.round(amountInUSD).toLocaleString()}</span>;
  }

  const { formatted } = convert(amountInUSD);

  if (isConverting) {
    return (
      <span className={cn("inline-flex items-center gap-1 opacity-70 animate-pulse", className)}>
        <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />
        <span className="bg-zinc-200 dark:bg-zinc-800 rounded px-1.5 min-w-[30px] h-4 inline-block" />
      </span>
    );
  }

  return <span className={className}>{formatted}</span>;
}

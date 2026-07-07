"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked, onCheckedChange, className, disabled }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "h-4 w-4 shrink-0 rounded border transition-all duration-150 flex items-center justify-center cursor-pointer",
          "border-zinc-300 dark:border-white/20 bg-transparent",
          "hover:border-zinc-400 dark:hover:border-white/40",
          checked && "bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {checked && (
          <Check className="h-2.5 w-2.5 text-white dark:text-black" strokeWidth={3} />
        )}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
}

export function PasswordStrength({ password = "" }: PasswordStrengthProps) {
  const requirements = useMemo(() => {
    return [
      {
        id: "min-length",
        label: "At least 8 characters",
        isValid: password.length >= 8,
      },
      {
        id: "has-letter",
        label: "Contains a letter",
        isValid: /[a-zA-Z]/.test(password),
      },
      {
        id: "has-number",
        label: "Contains a number or symbol",
        isValid: /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      },
    ];
  }, [password]);

  const score = useMemo(() => {
    if (!password) return 0;
    return requirements.filter((r) => r.isValid).length;
  }, [password, requirements]);

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      {/* Strength indicator bar */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex gap-1">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              score === 0 && "w-1/12 bg-red-500",
              score === 1 && "w-1/3 bg-amber-500",
              score === 2 && "w-2/3 bg-amber-500",
              score === 3 && "w-full bg-emerald-600 dark:bg-emerald-500"
            )}
          />
        </div>
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 capitalize">
          {score === 0 && "Weak"}
          {score === 1 && "Weak"}
          {score === 2 && "Fair"}
          {score === 3 && "Strong"}
        </span>
      </div>

      {/* Checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
        {requirements.map((req) => (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-1.5 font-medium transition-colors",
              req.isValid
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-400 dark:text-zinc-500"
            )}
          >
            {req.isValid ? (
              <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
            ) : (
              <X className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

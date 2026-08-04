"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormattedChatMessageProps {
  text: string;
  isOutgoing?: boolean;
  className?: string;
}

/**
 * Parses chat message text and renders URLs/links as clickable <a> or <Link> elements
 * with target="_blank" and rel="noopener noreferrer".
 */
export function FormattedChatMessage({
  text,
  isOutgoing = false,
  className,
}: FormattedChatMessageProps) {
  if (!text) return null;

  // URL matching regex: Matches http://, https://, or www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

  const parts = text.split(urlRegex);

  return (
    <p
      className={cn(
        "whitespace-pre-wrap break-words [word-break:break-word] max-w-full overflow-hidden leading-relaxed",
        className
      )}
    >
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // Re-test to ensure accurate regex match for current segment
          const href = part.startsWith("www.") ? `https://${part}` : part;
          const isInternal = part.includes(
            typeof window !== "undefined" ? window.location.hostname : "pokemongoservices.com"
          ) || part.startsWith("/");

          return (
            <a
              key={index}
              href={href}
              target={isInternal ? "_self" : "_blank"}
              rel={isInternal ? undefined : "noopener noreferrer"}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "inline-flex items-center gap-0.5 underline font-bold transition-all cursor-pointer break-all",
                isOutgoing
                  ? "text-purple-200 hover:text-white dark:text-purple-300 dark:hover:text-white"
                  : "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              )}
            >
              <span>{part}</span>
              {!isInternal && <ExternalLink className="h-3 w-3 shrink-0 inline ml-0.5" />}
            </a>
          );
        }

        // Plain text segment
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </p>
  );
}

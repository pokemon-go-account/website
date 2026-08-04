import { describe, it, expect } from "vitest";

/**
 * Pure link parser logic matching FormattedChatMessage
 */
export interface LinkSegment {
  type: "text" | "link";
  content: string;
  href?: string;
}

export function parseChatLinks(text: string): LinkSegment[] {
  if (!text) return [];

  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const matches = Array.from(text.matchAll(urlRegex));

  if (matches.length === 0) {
    return [{ type: "text", content: text }];
  }

  const segments: LinkSegment[] = [];
  let lastIndex = 0;

  for (const match of matches) {
    const matchedUrl = match[0];
    const startIndex = match.index!;

    // Push text before the link
    if (startIndex > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, startIndex),
      });
    }

    // Push the link segment
    const href = matchedUrl.startsWith("www.") ? `https://${matchedUrl}` : matchedUrl;
    segments.push({
      type: "link",
      content: matchedUrl,
      href,
    });

    lastIndex = startIndex + matchedUrl.length;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

describe("Chat Clickable Links Parser", () => {
  it("should return single text segment when no URLs are present", () => {
    const text = "Hello admin, I need help with my Level 80 account.";
    const result = parseChatLinks(text);
    expect(result).toEqual([
      { type: "text", content: "Hello admin, I need help with my Level 80 account." },
    ]);
  });

  it("should extract http and https links cleanly from text", () => {
    const text = "Check out our store at https://pokemongoservices.com/store for details!";
    const result = parseChatLinks(text);
    expect(result).toEqual([
      { type: "text", content: "Check out our store at " },
      {
        type: "link",
        content: "https://pokemongoservices.com/store",
        href: "https://pokemongoservices.com/store",
      },
      { type: "text", content: " for details!" },
    ]);
  });

  it("should automatically prepend https:// for www URLs", () => {
    const text = "Visit www.example.com today.";
    const result = parseChatLinks(text);
    expect(result).toEqual([
      { type: "text", content: "Visit " },
      { type: "link", content: "www.example.com", href: "https://www.example.com" },
      { type: "text", content: " today." },
    ]);
  });

  it("should handle multiple URLs in a single chat message", () => {
    const text = "Telegram: https://t.me/pokemon_go or website: https://pokemongoservices.com";
    const result = parseChatLinks(text);
    expect(result).toHaveLength(4);
    expect(result[1]).toEqual({
      type: "link",
      content: "https://t.me/pokemon_go",
      href: "https://t.me/pokemon_go",
    });
    expect(result[3]).toEqual({
      type: "link",
      content: "https://pokemongoservices.com",
      href: "https://pokemongoservices.com",
    });
  });
});

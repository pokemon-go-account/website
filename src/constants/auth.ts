export const HEAR_ABOUT_US_OPTIONS = [
  "Instagram",
  "Telegram",
  "Discord",
  "Reddit",
  "YouTube",
  "Google Search",
  "Friend / Word of mouth",
  "Other",
] as const;

export type HearAboutUsOption = (typeof HEAR_ABOUT_US_OPTIONS)[number];

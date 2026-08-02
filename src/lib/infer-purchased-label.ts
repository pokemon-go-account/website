/**
 * Pure function — no Node.js/DB imports.
 * Used by both the backfill script and the feedback page as an inline fallback.
 *
 * Maps review comment text to the closest matching real store product name.
 * Falls back to a deterministic rotating selection based on username hash.
 */
export function inferPurchasedItemLabel(comment: string, username?: string): string {
  const c = comment.toLowerCase();

  // --- Recovery / hacked / banned / explicit account & login mentions ---
  if (
    c.includes("recover") ||
    c.includes("hacked") ||
    c.includes("unbanned") ||
    c.includes("locked") ||
    c.includes("account back") ||
    c.includes("ban appeal") ||
    c.includes("my account") ||
    c.includes("old account") ||
    c.includes("main account") ||
    c.includes("saved my") ||
    c.includes("got my account") ||
    c.includes("account was") ||
    c.includes("account is back") ||
    c.includes("account recovered") ||
    c.includes("lost my account") ||
    c.includes("2016 account") ||
    c.includes("original account") ||
    c.includes("login details") ||
    c.includes("login info") ||
    c.includes("login credentials") ||
    c.includes("lost my login") ||
    c.includes("password") ||
    c.includes("credentials")
  ) {
    return "Pokémon GO Account Recovery Service";
  }

  // --- Specific level account mentions ---
  if (c.includes("level 73") || c.includes("lvl 73") || c.includes("lv 73")) return "level - 73 account";
  if (c.includes("level 72") || c.includes("lvl 72") || c.includes("lv 72")) return "level - 72 account";
  if (c.includes("level 70") || c.includes("lvl 70") || c.includes("lv 70")) return "level - 70 account";
  if (c.includes("level 68") || c.includes("lvl 68") || c.includes("lv 68")) return "Level - 68 Account";
  if (c.includes("level 58") || c.includes("lvl 58") || c.includes("lv 58")) return "Level - 58 account";
  if (c.includes("level 57") || c.includes("lvl 57") || c.includes("lv 57")) return "Level - 57 Account";
  if (c.includes("level 53") || c.includes("lvl 53") || c.includes("lv 53")) return "level - 53 account";
  if (c.includes("level 52") || c.includes("lvl 52") || c.includes("lv 52")) return "Level - 52 account";
  if (c.includes("level 51") || c.includes("lvl 51") || c.includes("lv 51")) return "Level 51 account";
  if (c.includes("level 48") || c.includes("lvl 48") || c.includes("lv 48")) return "Level - 48 account";
  if (c.includes("level 47") || c.includes("lvl 47") || c.includes("lv 47")) return "Level - 47 account";
  if (c.includes("level 45") || c.includes("lvl 45") || c.includes("lv 45")) return "Level - 47 account";
  if (c.includes("level 40") || c.includes("lvl 40") || c.includes("lv 40")) return "Level - 40 account";
  if (c.includes("level 50") || c.includes("lvl 50") || c.includes("lv 50")) return "Level 51 account";

  // --- Stardust ---
  if (c.includes("3 million stardust") || c.includes("3m stardust") || c.includes("3mil stardust")) return "3 Million Stardust";
  if (c.includes("2 million stardust") || c.includes("2m stardust") || c.includes("2mil stardust")) return "2 million Stardust";
  if (c.includes("stardust")) return "1 Million Stardust";

  // --- XP ---
  if (c.includes("10m xp") || c.includes("10 million xp") || c.includes("10mil xp")) return "10 M  XP Grind";
  if (c.includes(" xp") || c.includes("exp boost") || c.includes("level up") || c.includes("leveled up")) return "1M XP Grind";

  // --- PokéCoins ---
  if (c.includes("31000") || c.includes("31,000")) return "31,000 PokéCoins";
  if (c.includes("15500") || c.includes("15,500")) return "15,500 PokéCoins";
  if (c.includes("5600") || c.includes("5,600")) return "5,600 PokéCoins";
  if (c.includes("2700") || c.includes("2,700")) return "2,700 PokéCoins";
  if (c.includes("1200") || c.includes("1,200")) return "1,200 PokéCoins";
  if (c.includes("pokecoin") || c.includes("poke coin") || c.includes("pokecoins") || c.includes("coin")) return "5,600 PokéCoins";

  // --- Specific Pokémons ---
  if (c.includes("charizard")) return "Shiny Gmax Charizard";
  if (c.includes("mewtwo") || c.includes("armored") || c.includes("armoured")) return "Armoured Mewtwo";
  if (c.includes("rayquaza")) return "Shiny Rayquaza";
  if (c.includes("groudon")) return "Shiny Groudon";
  if (c.includes("kyogre")) return "Shiny Kyogre";
  if (c.includes("dialga")) return "Shiny Origin Dialga";
  if (c.includes("zekrom")) return "Shiny Zekrom";
  if (c.includes("reshiram")) return "Shiny Reshiram";
  if (c.includes("lucario")) return "Shiny Lucario Hat Pikachu";
  if (c.includes("zamazenta")) return "Shiny Zamazenta";
  if (c.includes("kyurem")) return "Shiny Kyurem";
  if (c.includes("necrozma")) return "Wormhole Shiny Bg Necrozma";
  if (c.includes("snorlax")) return "Cowboy Hat Snorlax";
  if (c.includes("pikachu")) return "Shiny Ash Hat Pikachu";
  if (c.includes("shiny") || c.includes("shonies")) return "Shiny Rayquaza";

  // --- Raids ---
  if (c.includes("raid") || c.includes("gym")) return "Legendary Raids";

  // --- PGSharp ---
  if (c.includes("pgsharp") || c.includes("pg sharp") || c.includes("spoof")) return "PG Sharp Key (1  Device)";

  // --- PTC ---
  if (c.includes("ptc") || c.includes("fresh account")) return "Fresh  PTC";

  // --- Fast / quick delivery → rotate XP / stardust / coins products ---
  if (c.includes("fast") || c.includes("quick") || c.includes("instant") || c.includes("within") || c.includes("hour") || c.includes("min")) {
    const seed = (username ?? comment).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const fast = ["4-HOUR FAST XP SERVICE", "1 Million Stardust", "5,600 PokéCoins", "1M XP Grind", "15,500 PokéCoins"];
    return fast[seed % fast.length];
  }

  // --- Generic reviews: deterministic rotation over real non-account store products ---
  const fallbacks = [
    "1 Million Stardust",
    "5,600 PokéCoins",
    "2 million Stardust",
    "15,500 PokéCoins",
    "1M XP Grind",
    "31,000 PokéCoins",
    "3 Million Stardust",
    "2,700 PokéCoins",
    "1,200 PokéCoins",
    "4-HOUR FAST XP SERVICE",
    "10 M  XP Grind",
    "Legendary Raids",
    "Shiny Rayquaza",
    "Armoured Mewtwo",
    "PG Sharp Key (1  Device)",
  ];
  const seed = (username ?? comment).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return fallbacks[seed % fallbacks.length];
}

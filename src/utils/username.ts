import User from "@/models/User";

const ADJECTIVES = [
  "Vibrant", "Swift", "Funny", "Clever", "Wild", "Silent", "Brave", 
  "Shiny", "Mystic", "Valor", "Instinct", "Tricky", "Jolly", "Bold", 
  "Cool", "Daring", "Misty", "Sturdy", "Fierce", "Lively", "Quiet",
  "Snazzy", "Epic", "Sparky", "Cosmic", "Glacial", "Volcanic", "Gravely",
  "Mighty", "Radiant", "Furious", "Calm", "Wicked", "Sneaky", "Proud",
  "Loyal", "Keen", "Grand", "Glorious", "Fabulous", "Elite", "Dazzling",
  "Breezy", "Bright", "Bouncy", "Bitter", "Crisp", "Crafty", "Crazy",
  "Dark", "Deep", "Eager", "Electric", "Elegant", "Faint", "Fancy",
  "Fluffy", "Fuzzy", "Giant", "Golden", "Graceful", "Hidden", "Hollow",
  "Hyper", "Icy", "Jumping", "Kooky", "Lucky", "Lunar", "Magic",
  "Massive", "Mega", "Merry", "Neon", "Nimble", "Noble", "Odd",
  "Phantom", "Playful", "Plump", "Prime", "Quick", "Quirky", "Rapid",
  "Rebel", "Rich", "Rough", "Royal", "Savage", "Secret", "Shady",
  "Sharp", "Silver", "Slick", "Smart", "Solar", "Solid", "Spooky",
  "Stellar", "Stormy", "Strong", "Super", "Sweet", "Toxic", "Ultra",
  "Vast", "Vivid", "Wacky", "Warm", "Wild", "Wise", "Zany", "Zealous"
];

const POKEMON = [
  "Pikachu", "Charizard", "Bulbasaur", "Squirtle", "Eevee", "Mewtwo", 
  "Snorlax", "Dragonite", "Gengar", "Lucario", "Lugia", "Togepi",
  "Lapras", "Arcanine", "Gyarados", "Mew", "Rayquaza", "Articuno",
  "Zapdos", "Moltres", "Cyndaquil", "Totodile", "Chikorita", "Eeveelution",
  "Venusaur", "Blastoise", "Alakazam", "Machamp", "Golem", "Rapidash",
  "Slowbro", "Magneton", "Dodrio", "Dewgong", "Muk", "Cloyster",
  "Onix", "Hypno", "Kingler", "Electrode", "Exeggutor", "Marowak",
  "Hitmonlee", "Hitmonchan", "Weezing", "Rhydon", "Chansey", "Tangela",
  "Kangaskhan", "Seadra", "Starmie", "MrMime", "Scyther", "Jynx",
  "Electabuzz", "Magmar", "Pinsir", "Tauros", "Ditto", "Porygon",
  "Omastar", "Kabutops", "Aerodactyl", "Meganium", "Typhlosion", "Feraligatr",
  "Crobat", "Pichu", "Cleffa", "Igglybuff", "Ampharos", "Bellossom",
  "Politoed", "Espeon", "Umbreon", "Slowking", "Scizor", "Heracross",
  "Skarmory", "Houndoom", "Kingdra", "Donphan", "Porygon2", "Smeargle",
  "Tyranitar", "HoOh", "Celebi", "Sceptile", "Blaziken", "Swampert",
  "Gardevoir", "Slaking", "Aggron", "Medicham", "Flygon", "Altaria",
  "Milotic", "Salamence", "Metagross", "Latias", "Latios", "Kyogre",
  "Groudon", "Deoxys", "Infernape", "Empoleon", "Staraptor", "Luxray",
  "Garchomp", "Lucario", "Togekiss", "Gallade", "Dialga", "Palkia"
];

/**
 * Generates a unique, randomized Reddit-like username: Adjective-Pokemon-1234
 */
export async function generateRandomUsername(): Promise<string> {
  let username = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 15) {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const pokemon = POKEMON[Math.floor(Math.random() * POKEMON.length)];
    const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    username = `${adjective}-${pokemon}-${number}`;

    // Perform case-insensitive check
    const existing = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, "i") } });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  // Fallback if loop exceeds attempts
  if (!isUnique) {
    username = `Trainer-${Math.floor(100000 + Math.random() * 900000)}`;
  }

  return username;
}

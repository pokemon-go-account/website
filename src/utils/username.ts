import User from "@/models/User";

const ADJECTIVES = [
  "Vibrant", "Swift", "Funny", "Clever", "Wild", "Silent", "Brave", 
  "Shiny", "Mystic", "Valor", "Instinct", "Tricky", "Jolly", "Bold", 
  "Cool", "Daring", "Misty", "Sturdy", "Fierce", "Lively", "Quiet",
  "Snazzy", "Epic", "Sparky", "Cosmic", "Glacial", "Volcanic", "Gravely"
];

const POKEMON = [
  "Pikachu", "Charizard", "Bulbasaur", "Squirtle", "Eevee", "Mewtwo", 
  "Snorlax", "Dragonite", "Gengar", "Lucario", "Lugia", "Togepi",
  "Lapras", "Arcanine", "Gyarados", "Mew", "Rayquaza", "Articuno",
  "Zapdos", "Moltres", "Cyndaquil", "Totodile", "Chikorita", "Eeveelution"
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

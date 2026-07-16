import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

import Listing from "../src/models/Listing";
import Auction from "../src/models/Auction";

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB.");
  
  // Force evaluation of Listing to register it on connection
  console.log("Listing model name:", Listing.modelName);
  console.log("Registered models:", mongoose.modelNames());

  try {
    const auctions = await Auction.find({
      status: "LIVE"
    })
      .populate("listingId")
      .lean();
    console.log("Success populating!");
    console.log(JSON.stringify(auctions, null, 2));
  } catch (err) {
    console.error("Populate failed:", err);
  }

  await mongoose.disconnect();
}

main().catch(console.error);

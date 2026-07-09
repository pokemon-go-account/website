import mongoose from "mongoose";
import connectDB from "../../lib/db";
import Feedback from "../../models/Feedback";
import User from "../../models/User";

async function run() {
  try {
    console.log("Starting username migration...");
    await connectDB();
    console.log("Connected to MongoDB.");

    const feedbacks = await Feedback.find();
    console.log(`Inspecting ${feedbacks.length} feedback records...`);

    let updatedCount = 0;
    for (const item of feedbacks) {
      let resolvedUsername = item.username || "";
      let updated = false;

      if (item.userId) {
        const user = await User.findById(item.userId);
        if (user) {
          if (user.username) {
            resolvedUsername = user.username;
            updated = true;
          } else if (user.telegramUsername) {
            resolvedUsername = user.telegramUsername.replace("@", "");
            updated = true;
          } else if (user.name) {
            resolvedUsername = user.name.replace(/\s+/g, "");
            updated = true;
          }
        }
      }

      // If username is a raw Mongo ID or empty, mask it nicely
      if (/^[0-9a-fA-F]{24}$/.test(resolvedUsername) || !resolvedUsername) {
        const idStr = item.userId?.toString() || item._id.toString();
        resolvedUsername = `Trainer_${idStr.substring(0, 6)}`;
        updated = true;
      }

      if (updated || item.username !== resolvedUsername) {
        console.log(`Updating Feedback ID: ${item._id} | "${item.username}" -> "${resolvedUsername}"`);
        item.username = resolvedUsername;
        await item.save();
        updatedCount++;
      }
    }

    console.log(`Migration complete. Successfully updated ${updatedCount} records.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

run();

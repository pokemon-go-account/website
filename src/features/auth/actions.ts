
"usesrv"
"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email layout address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  telegramUsername: z.string().optional(),
});

export async function registerUser(prevState: any, formData: FormData) {
  try {
    await connectDB();

    const rawFields = Object.fromEntries(formData.entries());
    const validated = RegisterSchema.safeParse(rawFields);

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, email, password, telegramUsername } = validated.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      telegramUsername: telegramUsername || undefined,
      role: "USER", // Hardcoded baseline fallback security default
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("Registration engine error:", error);
    return { success: false, error: "Internal platform error occurred." };
  }
}
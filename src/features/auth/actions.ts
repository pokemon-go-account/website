"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email layout address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  telegramUsername: z.string().min(2, "Telegram username must be at least 2 characters"),
  role: z.enum(["USER", "SELLER"]).default("USER"),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const rawFields = Object.fromEntries(formData.entries());
    const validated = LoginSchema.safeParse(rawFields);

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { email, password } = validated.data;
    const callbackUrl = formData.get("callbackUrl") as string | null;

    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });

    return { success: true, error: null };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid credentials." };
        default:
          return { success: false, error: "Something went wrong." };
      }
    }
    throw error;
  }
}

export async function registerUser(prevState: any, formData: FormData) {
  try {
    await connectDB();

    const rawFields = Object.fromEntries(formData.entries());
    const validated = RegisterSchema.safeParse(rawFields);

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { name, email, password, telegramUsername, role } = validated.data;

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
      role: role || "USER",
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("Registration engine error:", error);
    return { success: false, error: "Internal platform error occurred." };
  }
}

/**
 * Server Action: Update user's Telegram username
 */
export async function updateUserProfileTelegram(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const telegramUsername = formData.get("telegramUsername") as string | null;
    if (!telegramUsername || telegramUsername.trim().length < 2) {
      return { success: false, error: "Telegram username must be at least 2 characters long." };
    }

    await connectDB();
    const formattedHandle = telegramUsername.trim().startsWith("@") 
      ? telegramUsername.trim() 
      : `@${telegramUsername.trim()}`;

    await User.findByIdAndUpdate(session.user.id, {
      telegramUsername: formattedHandle,
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { success: false, error: "Failed to update Telegram coordinate details." };
  }
}
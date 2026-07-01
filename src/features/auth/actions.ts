"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { verifyRecaptchaToken } from "@/lib/recaptcha";

const RegisterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function loginUser(prevState: any, formData: FormData) {
  try {
    const recaptchaToken = formData.get("g-recaptcha-response") as string | null;
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "LOGIN");
    if (!recaptchaResult.success) {
      return { success: false, error: recaptchaResult.error };
    }

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
    const recaptchaToken = formData.get("g-recaptcha-response") as string | null;
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, "REGISTER");
    if (!recaptchaResult.success) {
      return { success: false, error: recaptchaResult.error };
    }

    await connectDB();

    const rawFields = Object.fromEntries(formData.entries());
    const validated = RegisterSchema.safeParse(rawFields);

    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    const { email, password } = validated.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return { success: false, error: "An account with this email already exists." };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "USER",
      isOnboarded: false,
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

const CompleteProfileSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  telegramUsername: z.string().min(2, "Telegram username must be at least 2 characters"),
  role: z.enum(["USER", "SELLER"]),
});

export async function completeUserProfile(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const name = formData.get("name") as string;
    const telegramUsername = formData.get("telegramUsername") as string;
    const role = formData.get("role") as string;

    const validated = CompleteProfileSchema.safeParse({ name, telegramUsername, role });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectDB();
    const formattedHandle = telegramUsername.trim().startsWith("@")
      ? telegramUsername.trim()
      : `@${telegramUsername.trim()}`;

    await User.findByIdAndUpdate(session.user.id, {
      name: name.trim(),
      telegramUsername: formattedHandle,
      role: role as "USER" | "SELLER",
      isOnboarded: true,
    });

    return { success: true, role: role as "USER" | "SELLER", error: null };
  } catch (error: any) {
    console.error("Profile onboarding error:", error);
    return { success: false, error: "Failed to finalize profile." };
  }
}

/**
 * Server Action: Mock OAuth simulation for Google / Apple
 */
export async function loginMockOAuth(provider: "google" | "apple") {
  try {
    await connectDB();
    const mockEmail = `oauth_${provider}_${Math.floor(100000 + Math.random() * 900000)}@gmail.com`;
    
    // Create new mock OAuth user in database
    const user = await User.create({
      name: `Mock ${provider === 'google' ? 'Google' : 'Apple'} User`,
      email: mockEmail,
      role: "USER",
      isOnboarded: false,
    });

    const mockPass = "mock-secure-oauth-pass-123456";
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(mockPass, salt);
    await user.save();

    await signIn("credentials", {
      email: mockEmail,
      password: mockPass,
      redirectTo: "/profile/complete",
    });

    return { success: true, error: null };
  } catch (error) {
    console.error("Mock OAuth Error:", error);
    return { success: false, error: "Mock OAuth simulation failed." };
  }
}

/**
 * Server Action: Process Firebase Client ID Token validation
 */
export async function loginWithFirebaseIdToken(idToken: string) {
  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    
    await connectDB();
    
    // Find user by phone OR email
    let user = null;
    if (decoded.email) {
      user = await User.findOne({ email: decoded.email.toLowerCase() });
    }
    if (!user && decoded.phone) {
      user = await User.findOne({ phone: decoded.phone });
    }
    
    if (!user) {
      // Create new user profile with onboarding flag false
      user = await User.create({
        name: decoded.name || undefined,
        email: decoded.email?.toLowerCase() || undefined,
        phone: decoded.phone || undefined,
        role: "USER",
        isOnboarded: false,
      });
    }

    if (user.isSuspended) {
      return { success: false, error: "This account has been suspended by administration." };
    }

    // Sign in via NextAuth credentials provider bypass
    await signIn("credentials", {
      firebaseUid: user._id.toString(),
      isFirebase: "true",
      redirectTo: user.isOnboarded ? "/auctions" : "/profile/complete",
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Firebase auth verification error:", error);
    return { success: false, error: error.message || "Failed to process Firebase authentication." };
  }
}

/**
 * Server Action: Dev-mode local phone login simulation
 */
export async function loginMockPhone(phone: string) {
  try {
    await connectDB();
    
    let user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      user = await User.create({
        phone: phone.trim(),
        role: "USER",
        isOnboarded: false,
      });
    }

    if (user.isSuspended) {
      return { success: false, error: "This account is suspended." };
    }

    await signIn("credentials", {
      firebaseUid: user._id.toString(),
      isFirebase: "true",
      redirectTo: user.isOnboarded ? "/auctions" : "/profile/complete",
    });

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Mock phone login error:", error);
    return { success: false, error: "Mock phone login failed." };
  }
}
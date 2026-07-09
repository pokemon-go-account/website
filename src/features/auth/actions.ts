"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";
import { verifyFirebaseIdToken } from "@/lib/firebase-admin";
import { verifyRecaptchaToken } from "@/lib/recaptcha";
import { generateRandomUsername } from "@/utils/username";

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

    const username = await generateRandomUsername();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
      role: "USER",
      isOnboarded: false,
      isEmailVerified: false,
      verificationOtp: otp,
      verificationOtpExpires: otpExpires,
      lastOtpSentAt: new Date(),
      otpAttempts: 0,
    });

    console.log(`\n========================================\n[OTP Sandbox Register Debug] OTP for ${email}: ${otp}\n========================================\n`);

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'verify account <noreply@forgotpass.pokemongoservices.com>',
          to: email.toLowerCase(),
          subject: 'Verify your email address - Pokemon GO Services',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 30px auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 12px; background-color: #fffbeb; border-radius: 50%; margin-bottom: 12px;">
                  <span style="font-size: 24px;">✉️</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #18181b; margin: 0; letter-spacing: -0.5px;">Verification Code</h2>
                <p style="font-size: 13px; color: #71717a; margin: 4px 0 0 0;">Confirm your registration</p>
              </div>

              <div style="height: 1px; background-color: #f4f4f5; margin: 20px 0;"></div>

              <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 16px 0;">
                Hello Trainer,
              </p>
              <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for registering. Please enter the following 6-digit verification code in your browser to complete your registration and activate your account:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #f59e0b; background-color: #fffbeb; padding: 12px 32px; border-radius: 12px; border: 1.5px solid #fef3c7; text-align: center; font-family: monospace;">
                  ${otp}
                </div>
                <p style="font-size: 11px; color: #a1a1aa; font-weight: 700; margin: 12px 0 0 0; text-transform: uppercase; tracking-wider;">
                  Expires in 24 hours
                </p>
              </div>

              <div style="height: 1px; background-color: #f4f4f5; margin: 28px 0 20px 0;"></div>

              <div style="text-align: center;">
                <p style="font-size: 11px; color: #a1a1aa; margin: 0 0 4px 0;">
                  Pokémon GO Marketplace & Services Group
                </p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send verification OTP email via Resend:", emailErr);
    }

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
  preferredContactMethod: z.string().min(1, "Preferred contact method is required"),
  preferredContactId: z.string().min(2, "Username or Profile Link must be at least 2 characters"),
  alternateContact: z.string().optional(),
});

export async function completeUserProfile(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const name = formData.get("name") as string;
    const preferredContactMethod = formData.get("preferredContactMethod") as string;
    const preferredContactId = formData.get("preferredContactId") as string;
    const alternateContact = (formData.get("alternateContact") as string) || "";

    const validated = CompleteProfileSchema.safeParse({
      name,
      preferredContactMethod,
      preferredContactId,
      alternateContact,
    });
    if (!validated.success) {
      return { success: false, error: validated.error.issues[0].message };
    }

    await connectDB();
    const formattedHandle = (preferredContactMethod === "telegram" && !preferredContactId.trim().startsWith("@"))
      ? `@${preferredContactId.trim()}`
      : (preferredContactMethod === "reddit" && !preferredContactId.trim().startsWith("u/"))
      ? `u/${preferredContactId.trim()}`
      : preferredContactId.trim();

    await User.findByIdAndUpdate(session.user.id, {
      name: name.trim(),
      telegramUsername: formattedHandle, // compatibility with rest of app
      preferredContactMethod,
      preferredContactId: formattedHandle,
      alternateContact: alternateContact.trim() || undefined,
      role: "USER", // Always USER — ADMIN/SUPER_ADMIN only assigned by SUPER_ADMIN via /console
      isOnboarded: true,
    });

    return { success: true, role: "USER", error: null };
  } catch (error: any) {
    console.error("Profile onboarding error:", error);
    return { success: false, error: "Failed to finalize profile." };
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
      const username = await generateRandomUsername();
      user = await User.create({
        username,
        name: decoded.name || undefined,
        email: decoded.email?.toLowerCase() || undefined,
        phone: decoded.phone || undefined,
        role: "USER",
        isOnboarded: false,
        isEmailVerified: !!decoded.email, // OAuth providers verify the email
      });
    } else if (decoded.email && !user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save();
    }

    if (user.isSuspended) {
      return { success: false, error: "This account has been suspended by administration." };
    }

    // Sign in via NextAuth credentials provider bypass
    try {
      await signIn("credentials", {
        firebaseUid: user._id.toString(),
        isFirebase: "true",
        redirectTo: user.isOnboarded ? "/auctions" : "/profile/complete",
      });
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT" || error.digest?.startsWith("NEXT_REDIRECT")) {
        const parts = (error.digest || "").split(";");
        const redirectTo = parts[2] || (user.isOnboarded ? "/auctions" : "/profile/complete");
        return { success: true, redirectTo, error: null };
      }
      throw error;
    }

    return { success: true, redirectTo: user.isOnboarded ? "/auctions" : "/profile/complete", error: null };
  } catch (error: any) {
    console.error("Firebase social login action error:", error);
    return { success: false, error: "Authentication failed." };
  }
}

/** Request Password Reset OTP */
export async function requestPasswordResetOtp(email: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "Email address is required." };
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return { success: false, error: "No account with this email address exists." };
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetOtp = otp;
    user.resetOtpExpires = expires;
    await user.save();

    // Log to terminal console for local sandbox dev environment
    console.log(`\n========================================\n[OTP Sandbox Debug] Password reset requested for: ${email}\nYour OTP is: ${otp}\n========================================\n`);

    // Send email using Resend
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);
        const { data, error: sendError } = await resend.emails.send({
          from: 'verify account <noreply@forgotpass.pokemongoservices.com>',
          to: email.trim().toLowerCase(),
          subject: 'Your Password Reset OTP Code',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 30px auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
              
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 12px; background-color: #f3efff; border-radius: 50%; margin-bottom: 12px;">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6133e1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none"></path>
                  </svg>
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #18181b; margin: 0; letter-spacing: -0.5px;">Verification Code</h2>
                <p style="font-size: 13px; color: #71717a; margin: 4px 0 0 0;">Confirm your request to reset credentials</p>
              </div>

              <div style="height: 1px; background-color: #f4f4f5; margin: 20px 0;"></div>

              <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 16px 0;">
                Hello Trainer,
              </p>
              <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px 0;">
                We received a security request to update your account password. Please enter the following 6-digit verification code in your browser to proceed:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #6133e1; background-color: #f8f6ff; padding: 12px 32px; border-radius: 12px; border: 1.5px solid #dcd3ff; text-align: center; font-family: monospace;">
                  ${otp}
                </div>
                <p style="font-size: 11px; color: #a1a1aa; font-weight: 700; margin: 12px 0 0 0; text-transform: uppercase; tracking-wider;">
                  Expires in 15 minutes
                </p>
              </div>

              <div style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 24px 0 0 0; padding: 12px 16px; border-radius: 8px; background-color: #fafafa; border: 1px solid #f4f4f5;">
                <strong>⚠️ Security Warning:</strong> If you did not request this update, please ignore this email. Your password is safe and no changes will be made until this code is verified.
              </div>

              <div style="height: 1px; background-color: #f4f4f5; margin: 28px 0 20px 0;"></div>

              <div style="text-align: center;">
                <p style="font-size: 11px; color: #a1a1aa; margin: 0 0 4px 0;">
                  Pokémon GO Marketplace & Services Group
                </p>
                <p style="font-size: 10px; color: #d4d4d8; margin: 0;">
                  Secure Middleman Systems
                </p>
              </div>

            </div>
          `,
        });

        if (sendError) {
          console.error("Resend API delivery error:", sendError);
        } else {
          console.log("Resend API delivery success:", data);
        }
      } else {
        console.warn("RESEND_API_KEY is not defined in environment variables. Email sending skipped; OTP logged to console.");
      }
    } catch (emailErr) {
      console.error("Failed to send OTP email via Resend:", emailErr);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to request password reset OTP:", error);
    return { success: false, error: error.message || "Failed to send OTP." };
  }
}

/** Verify Password Reset OTP */
export async function verifyPasswordResetOtp(email: string, otp: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "Email is required." };
    }
    if (!otp || !otp.trim()) {
      return { success: false, error: "OTP is required." };
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.resetOtp !== otp.trim() || !user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return { success: false, error: "Invalid or expired OTP." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to verify password reset OTP:", error);
    return { success: false, error: error.message || "Failed to verify OTP." };
  }
}

/** Reset Password using Verified OTP */
export async function resetPasswordWithOtp(email: string, otp: string, newPassword: string) {
  try {
    if (!email || !email.trim()) {
      return { success: false, error: "Email is required." };
    }
    if (!otp || !otp.trim()) {
      return { success: false, error: "OTP validation session required." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters." };
    }

    await connectDB();

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.resetOtp !== otp.trim() || !user.resetOtpExpires || new Date() > user.resetOtpExpires) {
      return { success: false, error: "Session expired or invalid OTP verification." };
    }

    // Hash the new password using the same standard bcrypt config
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    await user.save();

    return { success: true };
  } catch (error: any) {
    console.error("Failed to reset password:", error);
    return { success: false, error: error.message || "Failed to update password." };
  }
}

/** Verify Registration OTP */
export async function verifyRegisterOtp(prevState: any, formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    const otp = formData.get("otp") as string | null;
    if (!otp || !otp.trim() || otp.trim().length !== 6) {
      return { success: false, error: "Please enter a valid 6-digit OTP code." };
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.isEmailVerified) {
      return { success: true, error: null };
    }

    // Lock check: if they have exceeded 15 failed attempts, block verification
    if (user.otpAttempts >= 15) {
      user.isSuspended = true;
      await user.save();
      return { success: false, error: "Maximum verification attempts exceeded. Your account has been locked. Please contact support." };
    }

    if (user.verificationOtp !== otp.trim() || !user.verificationOtpExpires || new Date() > user.verificationOtpExpires) {
      user.otpAttempts += 1;
      
      if (user.otpAttempts >= 15) {
        user.isSuspended = true;
        await user.save();
        return { success: false, error: "Maximum verification attempts exceeded. Your account has been locked. Please contact support." };
      }
      
      await user.save();
      const remainingAttempts = 15 - user.otpAttempts;
      return { success: false, error: `Invalid or expired OTP code. ${remainingAttempts} attempts remaining before account lock.` };
    }

    user.isEmailVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    user.otpAttempts = 0; // reset attempts
    await user.save();

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to verify registration OTP:", error);
    return { success: false, error: error.message || "Failed to verify OTP." };
  }
}

/** Resend Registration OTP */
export async function resendRegisterOtp() {
  try {
    const session = await auth();
    if (!session?.user || !session.user.id || !session.user.email) {
      return { success: false, error: "Unauthorized. Please sign in." };
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return { success: false, error: "User not found." };
    }

    if (user.isEmailVerified) {
      return { success: false, error: "Email is already verified." };
    }

    // Lock check
    if (user.otpAttempts >= 15) {
      return { success: false, error: "Maximum verification attempts exceeded. Your account has been locked. Please contact support." };
    }

    // Rate limiting: 1 OTP per 5 minutes
    const now = new Date();
    if (user.lastOtpSentAt) {
      const timeDiff = now.getTime() - user.lastOtpSentAt.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      if (minutesDiff < 5) {
        const remainingSeconds = Math.ceil((5 - minutesDiff) * 60);
        return { 
          success: false, 
          error: `Please wait ${remainingSeconds} seconds before requesting a new code.` 
        };
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.verificationOtp = otp;
    user.verificationOtpExpires = otpExpires;
    user.lastOtpSentAt = now;
    await user.save();

    console.log(`\n========================================\n[OTP Sandbox Resend Debug] New OTP for ${session.user.email}: ${otp}\n========================================\n`);

    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (resendApiKey) {
        const { Resend } = await import("resend");
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: 'verify account <noreply@forgotpass.pokemongoservices.com>',
          to: session.user.email.toLowerCase(),
          subject: 'Verify your email address - Pokemon GO Services',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 30px auto; padding: 32px; border: 1px solid #e4e4e7; border-radius: 20px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.02);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 12px; background-color: #fffbeb; border-radius: 50%; margin-bottom: 12px;">
                  <span style="font-size: 24px;">✉️</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #18181b; margin: 0; letter-spacing: -0.5px;">Verification Code</h2>
                <p style="font-size: 13px; color: #71717a; margin: 4px 0 0 0;">Confirm your registration</p>
              </div>

              <div style="height: 1px; background-color: #f4f4f5; margin: 20px 0;"></div>

              <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 16px 0;">
                Hello Trainer,
              </p>
              <p style="font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 24px 0;">
                Please enter the following 6-digit verification code in your browser to complete your registration and activate your account:
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #f59e0b; background-color: #fffbeb; padding: 12px 32px; border-radius: 12px; border: 1.5px solid #fef3c7; text-align: center; font-family: monospace;">
                  ${otp}
                </div>
                <p style="font-size: 11px; color: #a1a1aa; font-weight: 700; margin: 12px 0 0 0; text-transform: uppercase; tracking-wider;">
                  Expires in 24 hours
                </p>
              </div>

              <div style="height: 1px; background-color: #f4f4f5; margin: 28px 0 20px 0;"></div>

              <div style="text-align: center;">
                <p style="font-size: 11px; color: #a1a1aa; margin: 0 0 4px 0;">
                  Pokémon GO Marketplace & Services Group
                </p>
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send verification OTP email via Resend:", emailErr);
    }

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Failed to resend verification OTP:", error);
    return { success: false, error: error.message || "Failed to resend verification OTP." };
  }
}
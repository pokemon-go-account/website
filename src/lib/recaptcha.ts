/**
 * Helper to verify Google reCAPTCHA Enterprise tokens on the server
 */
export async function verifyRecaptchaToken(token: string | null, action: string): Promise<{ success: boolean; error: string | null }> {
  const projectId = process.env.RECAPTCHA_PROJECT_ID;
  const apiKey = process.env.RECAPTCHA_API_KEY;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LfTJD4tAAAAAHsKOZikKbkNQRahOzidVC8tHKL8";

  // Check if reCAPTCHA verification is configured
  const isConfigured = !!projectId && !!apiKey && apiKey !== "key_placeholder";

  if (!isConfigured) {
    console.warn("reCAPTCHA Enterprise not fully configured (missing project ID or API key). Simulating sandbox verification.");
    if (!token) {
      return { success: false, error: "Please complete the security check (reCAPTCHA is required)." };
    }
    return { success: true, error: null };
  }

  if (!token) {
    return { success: false, error: "Security check is missing. Please complete the reCAPTCHA challenge." };
  }

  try {
    const response = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: {
            token: token,
            siteKey: siteKey,
            expectedAction: action,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error(`reCAPTCHA Enterprise verification endpoint returned error: ${response.statusText}`);
      return { success: false, error: "Failed to connect to security validation server." };
    }

    const data = await response.json();

    // Check validity
    if (!data.tokenProperties || !data.tokenProperties.valid) {
      const reason = data.tokenProperties?.invalidReason || "Unknown verification issue";
      console.error(`reCAPTCHA token invalid: ${reason}`);
      return { success: false, error: `Security check failed: ${reason}` };
    }

    // Check action matches
    if (data.tokenProperties.action !== action) {
      console.error(`reCAPTCHA action mismatch: expected ${action}, got ${data.tokenProperties.action}`);
      return { success: false, error: "Security check action context mismatch." };
    }

    // Optional score verification (default to 0.5 threshold if risk analysis is returned)
    if (data.riskAnalysis && typeof data.riskAnalysis.score === "number") {
      if (data.riskAnalysis.score < 0.5) {
        console.warn(`reCAPTCHA rejected due to low score: ${data.riskAnalysis.score}`);
        return { success: false, error: "Suspicious activity detected. Please try again." };
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("reCAPTCHA validation logic error:", error);
    return { success: false, error: "Internal security validation error occurred." };
  }
}

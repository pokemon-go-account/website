import { test, expect } from "@playwright/test";

test.describe("Authentication System - Laptop & Mobile", () => {
  // Test both login and registration pages
  const paths = ["/login", "/register"];

  for (const path of paths) {
    test(`Visual layout responsiveness on ${path}`, async ({ page, isMobile }) => {
      await page.goto(path);

      // Verify page wraps inside the beautiful dark container
      const container = page.locator(".max-w-md").first();
      await expect(container).toBeVisible();

      // Verify logo badge "Gaming Marketplace" is present and styled
      const badge = page.locator("text=Gaming Marketplace");
      await expect(badge).toBeVisible();

      // Verify Google and Apple social sign-in buttons exist
      const googleButton = page.locator('button:has-text("Google")');
      const appleButton = page.locator('button:has-text("Apple")');
      await expect(googleButton).toBeVisible();
      await expect(appleButton).toBeVisible();

      // Verify email and password inputs exist
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Verify form submit button exists
      const submitText = path === "/login" ? "Sign In with Password" : "Sign Up with Password";
      const submitButton = page.locator(`button:has-text("${submitText}")`);
      await expect(submitButton).toBeVisible();

      // Ensure elements fit nicely within viewport without horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBe(false);
    });
  }

  test("Local Credentials Validation Edge Cases (Login Form)", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button:has-text("Sign In with Password")');

    // 1. Submit empty email/password
    await submitButton.click();
    
    // HTML5 validation triggers or recaptcha prevents execution
    const isFormValid = await page.evaluate(() => {
      const form = document.querySelector("form");
      return form ? form.checkValidity() : true;
    });
    expect(isFormValid).toBe(false);

    // 2. Submit invalid email format
    await emailInput.fill("not-an-email");
    await passwordInput.fill("securepass123");
    await submitButton.click();

    const isEmailValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isEmailValid).toBe(false);
  });

  test("Firebase Google Auth popup trigger", async ({ page }) => {
    await page.goto("/login");

    // We catch the popup window opened when Google is clicked
    const popupPromise = page.waitForEvent("popup");
    const googleButton = page.locator('button:has-text("Google")');
    await googleButton.click();

    const popup = await popupPromise;
    expect(popup).toBeTruthy();

    // Verify popup URL connects to firebase / google auth domain
    const url = popup.url();
    expect(url).toContain("pokemongo-auction");
    
    await popup.close();
  });

  test("Firebase Apple Auth popup trigger", async ({ page }) => {
    await page.goto("/login");

    // We catch the popup window opened when Apple is clicked
    const popupPromise = page.waitForEvent("popup");
    const appleButton = page.locator('button:has-text("Apple")');
    await appleButton.click();

    const popup = await popupPromise;
    expect(popup).toBeTruthy();

    // Verify popup URL connects to firebase / apple oauth
    const url = popup.url();
    expect(url).toContain("pokemongo-auction");

    await popup.close();
  });
});

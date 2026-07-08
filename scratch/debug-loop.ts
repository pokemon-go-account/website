import { chromium } from "@playwright/test";
import { exec } from "child_process";

async function main() {
  console.log("Starting next dev server on port 3005...");
  const serverProcess = exec("npm run dev", { env: { ...process.env, PORT: "3005" } });
  
  // Wait 10 seconds for server to start
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Mock /api/auth/session to return a logged-in ADMIN session
  await page.route("**/api/auth/session", async (route) => {
    console.log("[Playwright Mock] Intercepted /api/auth/session request");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          name: "Test Admin",
          email: "admin@test.com",
          role: "ADMIN",
          id: "6a4cb7d73f39ada1b08e2d76",
          isOnboarded: true,
          adminRentPaidUntil: null,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });

  // Listen to console events
  page.on("console", (msg) => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  // Listen to page errors
  page.on("pageerror", (err) => {
    console.error(`[Browser PageError]`, err);
  });

  // Listen to request/navigation events
  page.on("request", (req) => {
    if (req.url().includes("localhost:3005")) {
      console.log(`[Browser Request] ${req.method()} ${req.url()}`);
    }
  });

  page.on("framenavigated", (frame) => {
    console.log(`[Browser FrameNavigated] ${frame.url()}`);
  });

  console.log("Navigating to http://localhost:3005/auctions...");
  try {
    await page.goto("http://localhost:3005/auctions", { timeout: 20000 });
    console.log("Loaded! Waiting 10 seconds for loops...");
    await new Promise((resolve) => setTimeout(resolve, 10000));
  } catch (err) {
    console.error("Navigation error:", err);
  } finally {
    console.log("Tearing down browser and server...");
    await browser.close();
    serverProcess.kill();
  }
}

main().catch(console.error);

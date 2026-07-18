import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL &&
    !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : "https://pokemongoservices.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/console/",
          "/api/",
          "/dashboard/",
          "/profile/",
          "/orders/",
          "/chat/",
          "/login",
          "/register",
          "/verify-otp",
          "/forgot-password",
          "/auth-error",
          "/rent-due",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

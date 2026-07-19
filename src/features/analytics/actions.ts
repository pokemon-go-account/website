"use server";

export async function fetchAnalyticsData() {
  return {
    success: true,
    data: {
      range: "24h",
      totalViews: 0,
      totalUniqueVisitors: 0,
      countryStats: [],
      pageStats: [],
      deviceStats: [],
      timeline: [],
    },
  };
}

export async function fetchActivePresence() {
  return {
    success: true,
    activeSessions: [],
  };
}

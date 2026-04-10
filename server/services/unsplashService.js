const axios = require("axios");

/**
 * Fetch a single eco-themed image URL from Unsplash.
 * Requires env: UNSPLASH_ACCESS_KEY
 * If key is missing or request fails -> returns empty string (safe fallback).
 *
 * This version LOGS the reason when it fails (so you can fix it fast).
 */
async function fetchEcoImageUrl(query = "nature eco badge") {
  const key = process.env.UNSPLASH_ACCESS_KEY;

  if (!key) {
    console.warn("[Unsplash] UNSPLASH_ACCESS_KEY is NOT set in server/.env");
    return "";
  }

  try {
    const resp = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 10, // better than 1
        orientation: "squarish",
      },
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
      timeout: 8000,
    });

    const results = resp?.data?.results || [];
    if (!results.length) {
      console.warn(`[Unsplash] No results for query="${query}"`);
      return "";
    }

    // pick random image
    const pick = results[Math.floor(Math.random() * results.length)];
    const url = pick?.urls?.small || pick?.urls?.regular || "";

    if (!url) {
      console.warn("[Unsplash] Result has no urls.small/urls.regular");
      return "";
    }

    return url;
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.warn(
      `[Unsplash] Request failed. status=${status || "?"} message=${
        data?.errors ? JSON.stringify(data.errors) : err.message
      }`
    );

    return "";
  }
}

/**
 * Fetch a single image URL from Unsplash by page number.
 * Each page returns a different image — used for the "Next" swipe in the badge image picker.
 * Returns { url, totalPages } so the client knows when to wrap around.
 */
async function fetchEcoImageByPage(query = "nature eco badge", page = 1) {
  const key = process.env.UNSPLASH_ACCESS_KEY;

  if (!key) {
    console.warn("[Unsplash] UNSPLASH_ACCESS_KEY is NOT set in server/.env");
    return { url: "", totalPages: 0 };
  }

  try {
    const resp = await axios.get("https://api.unsplash.com/search/photos", {
      params: {
        query,
        per_page: 1,      // one image per request
        page,
        orientation: "squarish",
      },
      headers: {
        Authorization: `Client-ID ${key}`,
        "Accept-Version": "v1",
      },
      timeout: 8000,
    });

    const results = resp?.data?.results || [];
    const totalPages = resp?.data?.total_pages || 0;

    if (!results.length) {
      console.warn(`[Unsplash] No results for query="${query}" page=${page}`);
      return { url: "", totalPages };
    }

    const pick = results[0];
    const url = pick?.urls?.small || pick?.urls?.regular || "";

    return { url, totalPages };
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.warn(
      `[Unsplash] Request failed. status=${status || "?"} message=${
        data?.errors ? JSON.stringify(data.errors) : err.message
      }`
    );

    return { url: "", totalPages: 0 };
  }
}

module.exports = { fetchEcoImageUrl, fetchEcoImageByPage };
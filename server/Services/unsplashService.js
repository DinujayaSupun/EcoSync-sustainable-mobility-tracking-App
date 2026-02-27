const axios = require("axios");

/**
 * Fetch a single eco-themed image URL from Unsplash.
 * Requires env: UNSPLASH_ACCESS_KEY
 * If key is missing or request fails -> returns empty string (safe fallback).
 */
async function fetchEcoImageUrl(query = "nature eco badge") {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return "";

  try {
    const resp = await axios.get("https://api.unsplash.com/search/photos", {
      params: { query, per_page: 1, orientation: "squarish" },
      headers: { Authorization: `Client-ID ${key}` },
      timeout: 8000,
    });

    const first = resp?.data?.results?.[0];
    return first?.urls?.small || first?.urls?.regular || "";
  } catch (err) {
    return "";
  }
}

module.exports = { fetchEcoImageUrl };
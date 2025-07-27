// github-api.js

const WEEKS = 53;
const DAYS_IN_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_IN_WEEK;

/**
 * Ensures the contribution data array has exactly TOTAL_DAYS (371) entries,
 * padding with zero-contribution days if necessary. This makes it fit the grid perfectly.
 * @param {Array<object>} contributions - The array of contribution data from the API.
 * @returns {Array<object>} A sanitized array with exactly TOTAL_DAYS entries.
 */
function padContributionData(contributions) {
  const today = new Date();
  const endDate = new Date(today);
  // Go back TOTAL_DAYS - 1 days to find the start date for our grid
  const startDate = new Date(today.setDate(today.getDate() - (TOTAL_DAYS - 1)));

  // Create a map for quick lookups: 'YYYY-MM-DD' -> count
  const dataMap = new Map(contributions.map((c) => [c.date, c.count]));

  const paddedData = [];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const dateString = currentDate.toISOString().split("T")[0];
    const count = dataMap.get(dateString) || 0;

    paddedData.push({
      date: dateString,
      count: count,
    });
  }
  return paddedData;
}

/**
 * Fetches contribution data for a specific user from a public proxy API.
 * @param {string} username The GitHub username.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of contribution data.
 */
export async function fetchContributions(username) {
  if (!username) {
    throw new Error("Username is required.");
  }
  // Use a reliable, public, CORS-enabled proxy for GitHub contributions
  const url = `https://github-contributions-api.jogruber.de/v4/${username}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(
          `Could not find contribution data for user "${username}".`,
        );
      }
      throw new Error(`API request failed with status: ${response.status}`);
    }
    const data = await response.json();

    // The API returns an object with a 'contributions' array.
    // We pad it to ensure it always matches our 53x7 grid size.
    if (!data.contributions || data.contributions.length === 0) {
      throw new Error(`No contribution data found for "${username}".`);
    }

    return padContributionData(data.contributions);
  } catch (error) {
    console.error("API Fetch Error:", error);
    // Re-throw the error to be caught by the UI
    throw error;
  }
}

/**
 * Generates a random set of contribution data for placeholder/initial display.
 * @returns {Array<object>} An array of fake contribution data.
 */
export function generateFakeData() {
  const data = [];
  const today = new Date();
  const startDate = new Date();
  // Go back the total number of days minus one to get the start date
  startDate.setDate(today.getDate() - (TOTAL_DAYS - 1));

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    data.push({
      date: currentDate.toISOString().split("T")[0],
      count: Math.random() > 0.25 ? Math.floor(Math.random() * 35) : 0,
    });
  }
  return data;
}

// src/api.js

const WEEKS = 53;
const DAYS_IN_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_IN_WEEK; // 371

/**
 * Creates a 371-day data array for a specific calendar year to fit the 53x7 grid.
 * The grid starts on the Sunday of the week containing January 1st of that year.
 * @param {Array<object>} yearContributions - Contributions for a single calendar year.
 * @param {string} year - The year (e.g., "2023").
 * @returns {Array<object>} A sanitized array with exactly TOTAL_DAYS entries.
 */
export function padYearData(yearContributions, year) {
  const yearInt = parseInt(year, 10);
  const janFirst = new Date(yearInt, 0, 1);
  const dayOfWeek = janFirst.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // The grid starts on the Sunday of the week containing Jan 1st.
  const gridStartDate = new Date(janFirst);
  gridStartDate.setDate(janFirst.getDate() - dayOfWeek);

  const dataMap = new Map(yearContributions.map((c) => [c.date, c.count]));
  const paddedData = [];

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const currentDate = new Date(gridStartDate);
    currentDate.setDate(gridStartDate.getDate() + i);

    const dateString = currentDate.toISOString().split("T")[0];
    // Only include contributions from the target year.
    // Days on the grid outside the calendar year will have 0 contributions.
    const count =
      currentDate.getFullYear() === yearInt ? dataMap.get(dateString) || 0 : 0;

    paddedData.push({
      date: dateString,
      count: count,
    });
  }

  return paddedData;
}

/**
 * Fetches ALL contribution data for a specific user from a public proxy API.
 * The API returns data for all available years.
 * @param {string} username The GitHub username.
 * @returns {Promise<object>} A promise that resolves to the full API response object,
 *                            containing 'years' and 'contributions' arrays.
 */
export async function fetchContributions(username) {
  if (!username) {
    throw new Error("Username is required.");
  }
  // Use `y=all` to get all available years of data
  const url = `https://github-contributions-api.jogruber.de/v4/${username}?y=all`;

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

    if (!data.contributions || data.contributions.length === 0) {
      throw new Error(`No contribution data found for "${username}".`);
    }

    // Return the whole object, which includes the 'years' array and all contributions
    return data;
  } catch (error) {
    console.error("API Fetch Error:", error);
    // Re-throw the error to be caught by the UI
    throw error;
  }
}

/**
 * Generates a random set of contribution data for placeholder/initial display.
 * This represents the last year of activity.
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

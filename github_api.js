// github_api.js

const WEEKS = 53;
const DAYS_IN_WEEK = 7;
const TOTAL_DAYS = WEEKS * DAYS_IN_WEEK; // 371

/**
 * Creates a data array for a specific calendar year to fit the grid.
 * The grid starts on the Sunday of the week containing January 1st of that year.
 * For past years, it ends on December 31st. For the current year, it ends on
 * the current date to avoid showing future days.
 * @param {Array<object>} yearContributions - Contributions for a single calendar year.
 * @param {string} year - The year (e.g., "2023").
 * @returns {Array<object>} A sanitized array with entries from the grid start date to the correct end date.
 */
export function padYearData(yearContributions, year) {
  const yearInt = parseInt(year, 10);

  // To test with a specific date (like in your example), you can use the line below.
  // const today = new Date("2025-08-01T12:00:00Z");
  const today = new Date();

  const currentYear = today.getFullYear();

  const janFirst = new Date(yearInt, 0, 1);

  // Determine the end date for the grid.
  // If the selected year is the current year, end on today's date.
  // Otherwise, for past years, end on December 31st.
  let gridEndDate;
  if (yearInt === currentYear) {
    gridEndDate = today;
  } else {
    // For past years, show the full year.
    gridEndDate = new Date(yearInt, 11, 31);
  }

  // The grid starts on the Sunday of the week containing Jan 1st.
  const dayOfWeek = janFirst.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const gridStartDate = new Date(janFirst);
  gridStartDate.setDate(janFirst.getDate() - dayOfWeek);

  const dataMap = new Map(yearContributions.map((c) => [c.date, c.count]));
  const paddedData = [];

  // Loop from the calculated grid start date until the grid end date.
  let currentDate = new Date(gridStartDate);
  while (currentDate <= gridEndDate) {
    const dateString = currentDate.toISOString().split("T")[0];

    // Days on the grid that fall before the start of the year have 0 contributions.
    const count =
      currentDate.getFullYear() === yearInt ? dataMap.get(dateString) || 0 : 0;

    paddedData.push({
      date: dateString,
      count: count,
    });

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
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
  const startDate = new Date(); // CORRECTED: Use 'new Date()'
  // Go back the total number of days minus one to get the start date
  startDate.setDate(today.getDate() - (TOTAL_DAYS - 1));

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const currentDate = new Date(startDate); // CORRECTED: Create a copy of the start date
    currentDate.setDate(startDate.getDate() + i);
    data.push({
      date: currentDate.toISOString().split("T")[0],
      count: Math.random() > 0.25 ? Math.floor(Math.random() * 35) : 0,
    });
  }
  return data;
}

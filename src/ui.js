// src/ui.js
import { updateBackgroundTheme } from "./backgrounds/index.js";

// CHANGE A: Removed hardcoded SVG icon strings.

/**
 * Gathers and returns all necessary DOM element references.
 * @returns {object} An object containing DOM element references.
 */
export function getDOMElements() {
  const elements = {
    usernameInput: document.getElementById("usernameInput"),
    searchButton: document.getElementById("searchButton"),
    // CHANGE A: Add icon spans for toggling loading state
    searchIconSpan: document.getElementById("searchIconSpan"),
    loadingIconSpan: document.getElementById("loadingIconSpan"),
    copyLinkButton: document.getElementById("copyLinkButton"),
    styleSelector: document.getElementById("styleSelector"),
    tooltip: document.getElementById("tooltip"),
    settingsButton: document.getElementById("settingsButton"),
    settingsMenu: document.getElementById("settingsMenu"),
    disableRotationCheckbox: document.getElementById("disableRotationCheckbox"),
    themeToggleButton: document.getElementById("themeToggleButton"),
    sunIcon: document.getElementById("sunIcon"),
    moonIcon: document.getElementById("moonIcon"),
    yearSelectorWrapper: document.getElementById("yearSelectorWrapper"),
    yearSelector: document.getElementById("yearSelector"),
  };
  // CHANGE A: No longer need to set innerHTML for the search button.
  return elements;
}

/**
 * Toggles the loading state of the search button.
 * @param {boolean} isLoading - Whether to show the loading spinner.
 * @param {object} ui - The UI elements object from getDOMElements.
 */
export function setLoading(isLoading, ui) {
  ui.searchButton.disabled = isLoading;
  if (isLoading) {
    ui.searchIconSpan.classList.add("hidden");
    ui.loadingIconSpan.classList.remove("hidden");
  } else {
    ui.searchIconSpan.classList.remove("hidden");
    ui.loadingIconSpan.classList.add("hidden");
  }
}

/**
 * Populates the year selector dropdown with available years.
 * @param {HTMLSelectElement} yearSelector - The select element.
 * @param {string[]} years - An array of years to add as options.
 */
export function populateYearSelector(yearSelector, years) {
  yearSelector.innerHTML = "";
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearSelector.appendChild(option);
  });
}

export function showYearSelector(wrapper) {
  wrapper.classList.remove("hidden");
}
export function hideYearSelector(wrapper) {
  wrapper.classList.add("hidden");
}

/**
 * Updates the theme of the application (dark/light).
 * @param {string} theme - The theme to set ('light' or 'dark').
 * @param {object} ui - The UI elements object from getDOMElements.
 * @param {object} lights - The lights object from the scene.
 * @param {THREE.Mesh} backgroundPlane - The 3D background plane mesh.
 */
export function setTheme(theme, ui, lights, backgroundPlane) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    ui.sunIcon.classList.add("hidden");
    ui.moonIcon.classList.remove("hidden");
    // CHANGE: Increased dark mode light intensities
    lights.ambientLight.intensity = 0.5; // Upped from 0.3
    lights.spotLight1.intensity = 0.8; // Upped from 0.4
    lights.spotLight2.intensity = 0.5; // Upped from 0.2
  } else {
    document.documentElement.classList.remove("dark");
    ui.sunIcon.classList.remove("hidden");
    ui.moonIcon.classList.add("hidden");
    // CHANGE: Increased light mode light intensities
    lights.ambientLight.intensity = 0.8; // Upped from 0.6
    lights.spotLight1.intensity = 1.2; // Upped from 0.7
    lights.spotLight2.intensity = 0.9; // Upped from 0.5
  }
  updateBackgroundTheme(backgroundPlane, theme);
}

/**
 * Updates the tooltip's content and position.
 * @param {HTMLElement} tooltip - The tooltip element.
 * @param {string} text - The HTML content to display.
 * @param {number} x - The clientX position.
 * @param {number} y - The clientY position.
 */
export function updateTooltip(tooltip, text, x, y) {
  tooltip.innerHTML = text;
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y + 10}px`;
  tooltip.classList.remove("hidden");
}

/**
 * Hides the tooltip.
 * @param {HTMLElement} tooltip - The tooltip element.
 */
export function hideTooltip(tooltip) {
  tooltip.classList.add("hidden");
}

/**
 * Updates the enabled/disabled state of the theme toggle button.
 * @param {boolean} enabled - Whether the button should be enabled.
 * @param {object} ui - The UI elements object from getDOMElements.
 */
export function updateThemeToggleUI(enabled, ui) {
  ui.themeToggleButton.disabled = !enabled;
}

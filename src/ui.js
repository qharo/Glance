// src/ui.js
import { updateBackgroundTheme } from "./backgrounds/index.js";

const searchIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>`;
const loadingSpinnerSVG = `<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

/**
 * Gathers and returns all necessary DOM element references.
 * @returns {object} An object containing DOM element references.
 */
export function getDOMElements() {
  const elements = {
    usernameInput: document.getElementById("usernameInput"),
    searchButton: document.getElementById("searchButton"),
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
    // --- FIX --- The plane is a THREE.Mesh, not a DOM element, so it's removed from here.
  };
  elements.searchButton.innerHTML = searchIconSVG;
  return elements;
}

/**
 * Toggles the loading state of the search button.
 * @param {boolean} isLoading - Whether to show the loading spinner.
 * @param {HTMLElement} searchButton - The search button element.
 */
export function setLoading(isLoading, searchButton) {
  searchButton.disabled = isLoading;
  searchButton.innerHTML = isLoading ? loadingSpinnerSVG : searchIconSVG;
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
    lights.hemisphereLight.intensity = 0.5;
    lights.mainDirectionalLight.intensity = 0.4;
    lights.fillDirectionalLight.intensity = 0.1;
  } else {
    document.documentElement.classList.remove("dark");
    ui.sunIcon.classList.remove("hidden");
    ui.moonIcon.classList.add("hidden");
    lights.hemisphereLight.intensity = 1.0;
    lights.mainDirectionalLight.intensity = 0.8;
    lights.fillDirectionalLight.intensity = 0.3;
  }
  // --- FIX --- Pass the plane object directly to the theme update function.
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

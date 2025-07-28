// visualizer.js
import * as THREE from "three";
import {
  fetchContributions,
  generateFakeData,
  padYearData,
} from "./src/api.js";
import {
  initScene,
  createGrid,
  voxelGroup,
  animate,
  getControls,
  getRaycaster,
  triggerVoxelAnimation,
} from "./src/scene.js";
import {
  getDOMElements,
  populateYearSelector,
  setLoading,
  setTheme,
  updateTooltip,
  hideTooltip,
  showYearSelector,
  hideYearSelector,
} from "./src/ui.js";
import { updateVoxelMaterials } from "./src/styles/index.js";

// --- State ---
let currentStyle = "clay";
let currentTheme = "light";
let allUserContributions = null; // Full API response for a user
let hoveredVoxel = null;

// --- DOM & Scene Elements ---
const ui = getDOMElements();
// --- FIX --- Capture backgroundPlane from initScene's return value
const { scene, camera, renderer, lights, backgroundPlane } = initScene(
  document.body,
);

// --- Core Logic ---

/**
 * Sets the application's theme and updates all relevant components.
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  currentTheme = theme;
  // --- FIX --- Pass the backgroundPlane object to setTheme
  setTheme(theme, ui, lights, backgroundPlane);
}

/**
 * Displays contributions for a specific year.
 * @param {string} year - The year to display.
 */
function displayYear(year) {
  if (!allUserContributions) return;
  const yearContributions = allUserContributions.contributions.filter((c) =>
    c.date.startsWith(year),
  );
  const paddedData = padYearData(yearContributions, year);
  createGrid(paddedData);
  updateVoxelMaterials(voxelGroup, currentStyle);
}

/**
 * Fetches user data, populates the grid, and updates the UI.
 */
async function handleSearch() {
  const username = ui.usernameInput.value.trim();
  if (!username) {
    alert("Please enter a GitHub username.");
    return;
  }
  setLoading(true, ui.searchButton);
  hideYearSelector(ui.yearSelectorWrapper);

  try {
    const data = await fetchContributions(username);
    allUserContributions = data;

    const years = Object.keys(allUserContributions.total).sort((a, b) => b - a);
    populateYearSelector(ui.yearSelector, years);
    showYearSelector(ui.yearSelectorWrapper);

    displayYear(years[0]); // Display the most recent year first
  } catch (error) {
    alert(error.message);
    allUserContributions = null;
    hideYearSelector(ui.yearSelectorWrapper);
    createGrid(generateFakeData());
    updateVoxelMaterials(voxelGroup, currentStyle);
  } finally {
    setLoading(false, ui.searchButton);
  }
}

// --- Event Handlers ---

function onMouseMove(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
  );
  const raycaster = getRaycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(voxelGroup.children);

  if (intersects.length > 0) {
    const newHovered = intersects[0].object;
    if (hoveredVoxel !== newHovered) {
      if (hoveredVoxel) {
        gsap.to(hoveredVoxel.material.emissive, {
          r: 0,
          g: 0,
          b: 0,
          duration: 0.3,
        });
      }
      hoveredVoxel = newHovered;
      gsap.to(hoveredVoxel.material.emissive, {
        r: 0.3,
        g: 0.3,
        b: 0.3,
        duration: 0.3,
      });
    }
    const { count, date } = hoveredVoxel.userData;
    const text = `<strong>${count} contributions</strong> on ${date}`;
    updateTooltip(ui.tooltip, text, event.clientX, event.clientY);
  } else {
    if (hoveredVoxel) {
      gsap.to(hoveredVoxel.material.emissive, {
        r: 0,
        g: 0,
        b: 0,
        duration: 0.3,
      });
    }
    hoveredVoxel = null;
    hideTooltip(ui.tooltip);
  }
}

function onWindowClick(event) {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
  );
  const raycaster = getRaycaster();
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(voxelGroup.children);

  if (intersects.length > 0) {
    const clickedVoxel = intersects[0].object;
    if (clickedVoxel.userData.count > 0) {
      triggerVoxelAnimation(clickedVoxel);
    }
  }
}

function setupEventListeners() {
  ui.searchButton.addEventListener("click", handleSearch);
  ui.usernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSearch();
  });

  ui.yearSelector.addEventListener("change", (event) => {
    displayYear(event.target.value);
  });

  ui.styleSelector.addEventListener("change", (event) => {
    currentStyle = event.target.value;
    updateVoxelMaterials(voxelGroup, currentStyle);
  });

  ui.copyLinkButton.addEventListener("click", () => {
    const username = ui.usernameInput.value.trim();
    if (!username) {
      ui.copyLinkButton.textContent = "Enter user!";
      setTimeout(() => (ui.copyLinkButton.textContent = "Copy <iframe>"), 2000);
      return;
    }
    const style = ui.styleSelector.value;
    const rotationDisabled = ui.disableRotationCheckbox.checked;

    const baseUrl =
      window.location.origin +
      window.location.pathname.replace("visualizer.html", "index.html");
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("style", style);
    if (rotationDisabled) params.append("rotation", "false");
    if (currentTheme === "dark") params.append("theme", "dark");

    const embedSrc = `${baseUrl.replace("index.html", "visualizer.html")}?${params.toString()}`;
    const embedCode = `<iframe src="${embedSrc}" width="100%" height="450" title="3D Contribution Visualizer" style="border:none; border-radius: 8px;"></iframe>`;

    navigator.clipboard.writeText(embedCode).then(() => {
      ui.copyLinkButton.textContent = "Copied!";
      setTimeout(() => (ui.copyLinkButton.textContent = "Copy <iframe>"), 2000);
    });
  });

  ui.settingsButton.addEventListener("click", () =>
    ui.settingsMenu.classList.toggle("hidden"),
  );
  ui.disableRotationCheckbox.addEventListener(
    "change",
    () => (getControls().autoRotate = !ui.disableRotationCheckbox.checked),
  );
  ui.themeToggleButton.addEventListener("click", () =>
    applyTheme(currentTheme === "light" ? "dark" : "light"),
  );

  window.addEventListener("click", (event) => {
    if (
      !ui.settingsMenu.classList.contains("hidden") &&
      !ui.settingsButton.contains(event.target) &&
      !ui.settingsMenu.contains(event.target)
    ) {
      ui.settingsMenu.classList.add("hidden");
    }
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("click", onWindowClick, false);
}

// --- Initialization ---

function initialLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const usernameFromUrl = urlParams.get("username");
  const styleFromUrl = urlParams.get("style");
  const rotationParam = urlParams.get("rotation");
  const themeParam = urlParams.get("theme");

  // Theme setup
  if (
    themeParam === "dark" ||
    (!themeParam && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  ) {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }

  // Controls setup
  if (rotationParam === "false") {
    getControls().autoRotate = false;
    ui.disableRotationCheckbox.checked = true;
  }

  // Style setup
  if (styleFromUrl && ["clay", "jelly"].includes(styleFromUrl)) {
    ui.styleSelector.value = styleFromUrl;
    currentStyle = styleFromUrl;
  }

  // Data setup
  if (usernameFromUrl) {
    ui.usernameInput.value = usernameFromUrl;
    handleSearch();
  } else {
    const initialData = generateFakeData();
    createGrid(initialData);
    updateVoxelMaterials(voxelGroup, currentStyle);
  }
}

// --- Start ---
setupEventListeners();
initialLoad();
animate(scene, camera, renderer);

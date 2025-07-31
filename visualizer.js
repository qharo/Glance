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
  updateThemeToggleUI,
} from "./src/ui.js";
import { getStyle } from "./src/styles/index.js";

// --- State ---
let currentStyle = "clay";
let currentTheme = "light"; // This tracks the user's preferred theme
let allUserContributions = null;
let hoveredVoxel = null;

// --- DOM & Scene Elements ---
const ui = getDOMElements();
const { scene, camera, renderer, lights, backgroundPlane } = initScene(
  document.body,
);

// --- Core Logic ---

function applyTheme(theme) {
  // This function updates the user's preferred theme and applies it.
  currentTheme = theme;
  setTheme(theme, ui, lights, backgroundPlane);
}

function displayYear(year) {
  if (!allUserContributions) return;
  const yearContributions = allUserContributions.contributions.filter((c) =>
    c.date.startsWith(year),
  );
  const paddedData = padYearData(yearContributions, year);
  createGrid(paddedData, currentStyle, backgroundPlane);
}

async function handleSearch(initialYear = null) {
  const username = ui.usernameInput.value.trim();
  if (!username) {
    alert("Please enter a GitHub username.");
    return;
  }
  setLoading(true, ui);
  hideYearSelector(ui.yearSelectorWrapper);

  try {
    const data = await fetchContributions(username);
    allUserContributions = data;

    const years = Object.keys(allUserContributions.total).sort((a, b) => b - a);
    populateYearSelector(ui.yearSelector, years);
    showYearSelector(ui.yearSelectorWrapper);

    const yearToDisplay =
      initialYear && years.includes(initialYear) ? initialYear : years[0];

    ui.yearSelector.value = yearToDisplay;
    displayYear(yearToDisplay);
  } catch (error) {
    alert(error.message);
    allUserContributions = null;
    hideYearSelector(ui.yearSelectorWrapper);
    createGrid(generateFakeData(), currentStyle, backgroundPlane);
  } finally {
    setLoading(false, ui);
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

  const style = getStyle(currentStyle);

  if (intersects.length > 0) {
    const newHovered = intersects[0].object;
    if (hoveredVoxel !== newHovered) {
      if (hoveredVoxel && style.onHoverEnd) {
        style.onHoverEnd(hoveredVoxel);
      }
      hoveredVoxel = newHovered;
      if (style.onHoverStart) {
        style.onHoverStart(hoveredVoxel);
      }
    }
    const { count, date } = hoveredVoxel.userData;
    const text = `<strong>${count} contributions</strong> on ${date}`;
    updateTooltip(ui.tooltip, text, event.clientX, event.clientY);
  } else {
    if (hoveredVoxel && style.onHoverEnd) {
      style.onHoverEnd(hoveredVoxel);
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
    triggerVoxelAnimation(clickedVoxel, currentStyle);
  }
}

function setupEventListeners() {
  ui.searchButton.addEventListener("click", () => handleSearch());
  ui.usernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSearch();
  });

  ui.yearSelector.addEventListener("change", (event) => {
    displayYear(event.target.value);
  });

  ui.styleSelector.addEventListener("change", (event) => {
    currentStyle = event.target.value;
    const style = getStyle(currentStyle);

    if (style.forcedTheme) {
      setTheme(style.forcedTheme, ui, lights, backgroundPlane);
      updateThemeToggleUI(false, ui);
    } else {
      setTheme(currentTheme, ui, lights, backgroundPlane);
      updateThemeToggleUI(true, ui);
    }

    if (allUserContributions) {
      displayYear(ui.yearSelector.value);
    } else {
      createGrid(generateFakeData(), currentStyle, backgroundPlane);
    }
  });

  // CHANGE 1: The "Copy" button now adds `embed=true` to the URL.
  ui.copyLinkButton.addEventListener("click", () => {
    const username = ui.usernameInput.value.trim();
    if (!username) {
      ui.copyLinkButton.textContent = "Enter user!";
      setTimeout(() => (ui.copyLinkButton.textContent = "Copy <iframe>"), 2000);
      return;
    }
    const style = ui.styleSelector.value;
    const rotationDisabled = ui.disableRotationCheckbox.checked;
    const styleDef = getStyle(style);
    const displayedTheme = styleDef.forcedTheme || currentTheme;

    const embedUrlBase = "https://qharo.github.io/Glance/visualizer.html";
    const params = new URLSearchParams();
    params.append("username", username);
    params.append("style", style);

    if (allUserContributions) {
      params.append("year", ui.yearSelector.value);
    }
    if (rotationDisabled) params.append("rotation", "false");
    if (displayedTheme === "dark") params.append("theme", "dark");

    // Add the embed parameter to signal a UI-less view
    params.append("embed", "true");

    const embedSrc = `${embedUrlBase}?${params.toString()}`;
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
  const yearFromUrl = urlParams.get("year");
  const isEmbed = urlParams.get("embed") === "true"; // Check for embed mode

  // CHANGE 2: If in embed mode, hide the UI elements.
  if (isEmbed) {
    document.getElementById("ui-top-left").classList.add("hidden");
    document.getElementById("ui-top-right").classList.add("hidden");
    document.getElementById("ui-bottom-right").classList.add("hidden");
  }

  if (styleFromUrl && ["clay", "jelly", "hologram"].includes(styleFromUrl)) {
    ui.styleSelector.value = styleFromUrl;
    currentStyle = styleFromUrl;
  }

  const preferredTheme =
    themeParam === "dark" ||
    (!themeParam && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light";

  currentTheme = preferredTheme;

  const style = getStyle(currentStyle);
  if (style.forcedTheme) {
    setTheme(style.forcedTheme, ui, lights, backgroundPlane);
    updateThemeToggleUI(false, ui);
  } else {
    setTheme(currentTheme, ui, lights, backgroundPlane);
    updateThemeToggleUI(true, ui);
  }

  if (rotationParam === "false") {
    getControls().autoRotate = false;
    ui.disableRotationCheckbox.checked = true;
  }

  if (usernameFromUrl) {
    ui.usernameInput.value = usernameFromUrl;
    handleSearch(yearFromUrl);
  } else {
    const initialData = generateFakeData();
    createGrid(initialData, currentStyle, backgroundPlane);
  }
}

// --- Start ---
setupEventListeners();
initialLoad();
animate(scene, camera, renderer);

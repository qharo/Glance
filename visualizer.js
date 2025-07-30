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
import { getStyle } from "./src/styles/index.js";

// --- State ---
let currentStyle = "clay";
let currentTheme = "light";
let allUserContributions = null;
let hoveredVoxel = null;

// --- DOM & Scene Elements ---
const ui = getDOMElements();
const { scene, camera, renderer, lights, backgroundPlane } = initScene(
  document.body,
);

// --- Core Logic ---

function applyTheme(theme) {
  currentTheme = theme;
  setTheme(theme, ui, lights, backgroundPlane);
}

function displayYear(year) {
  if (!allUserContributions) return;
  const yearContributions = allUserContributions.contributions.filter((c) =>
    c.date.startsWith(year),
  );
  const paddedData = padYearData(yearContributions, year);
  createGrid(paddedData, currentStyle);
}

async function handleSearch() {
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

    displayYear(years[0]);
  } catch (error) {
    alert(error.message);
    allUserContributions = null;
    hideYearSelector(ui.yearSelectorWrapper);
    createGrid(generateFakeData(), currentStyle);
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
      // End hover on the old voxel
      if (hoveredVoxel && style.onHoverEnd) {
        style.onHoverEnd(hoveredVoxel);
      }
      hoveredVoxel = newHovered;
      // Start hover on the new voxel
      if (style.onHoverStart) {
        style.onHoverStart(hoveredVoxel);
      }
    }
    const { count, date } = hoveredVoxel.userData;
    const text = `<strong>${count} contributions</strong> on ${date}`;
    updateTooltip(ui.tooltip, text, event.clientX, event.clientY);
  } else {
    // End hover if mouse leaves all voxels
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
  ui.searchButton.addEventListener("click", handleSearch);
  ui.usernameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSearch();
  });

  ui.yearSelector.addEventListener("change", (event) => {
    displayYear(event.target.value);
  });

  ui.styleSelector.addEventListener("change", (event) => {
    currentStyle = event.target.value;
    if (allUserContributions) {
      displayYear(ui.yearSelector.value);
    } else {
      createGrid(generateFakeData(), currentStyle);
    }
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

  if (
    themeParam === "dark" ||
    (!themeParam && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  ) {
    applyTheme("dark");
  } else {
    applyTheme("light");
  }

  if (rotationParam === "false") {
    getControls().autoRotate = false;
    ui.disableRotationCheckbox.checked = true;
  }

  if (styleFromUrl && ["clay", "jelly", "hologram"].includes(styleFromUrl)) {
    ui.styleSelector.value = styleFromUrl;
    currentStyle = styleFromUrl;
  }

  if (usernameFromUrl) {
    ui.usernameInput.value = usernameFromUrl;
    handleSearch();
  } else {
    const initialData = generateFakeData();
    createGrid(initialData, currentStyle);
  }
}

// --- Start ---
setupEventListeners();
initialLoad();
animate(scene, camera, renderer);

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { fetchContributions, generateFakeData } from "./github_api.js";

// --- DOM Elements & State ---
const usernameInput = document.getElementById("usernameInput");
const searchButton = document.getElementById("searchButton");
const copyLinkButton = document.getElementById("copyLinkButton");
const styleSelector = document.getElementById("styleSelector");
const tooltip = document.getElementById("tooltip");
const settingsButton = document.getElementById("settingsButton");
const settingsMenu = document.getElementById("settingsMenu");
const disableRotationCheckbox = document.getElementById(
  "disableRotationCheckbox",
);
// CHANGE A: New theme elements
const themeToggleButton = document.getElementById("themeToggleButton");
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");

let currentStyle = "clay";
let currentTheme = "light"; // 'light' or 'dark'

const searchIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" /></svg>`;
const loadingSpinnerSVG = `<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
searchButton.innerHTML = searchIconSVG;

// --- Scene Setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 35, 35);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.minDistance = 20;
controls.maxDistance = 80;
controls.maxPolarAngle = Math.PI / 2.1;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6;

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 15);
scene.add(directionalLight);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredVoxel = null;

// --- Grid Logic ---
const DAYS = 7;
const WEEKS = 53;
const mainGroup = new THREE.Group();
scene.add(mainGroup);

let voxelGroup = new THREE.Group();
mainGroup.add(voxelGroup);

const colorEmpty = new THREE.Color("#ebedf0");
const colorLow = new THREE.Color("#9be9a8");
const colorHigh = new THREE.Color("#216e39");

// Plane for the ground
const planeGeometry = new THREE.PlaneGeometry(WEEKS * 1.2 + 4, DAYS * 1.2 + 4);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0xffffff, // Light mode color
  roughness: 0.9,
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
mainGroup.add(plane);

function updateVoxelMaterials() {
  voxelGroup.children.forEach((voxel) => {
    const material = voxel.material;
    if (currentStyle === "clay") {
      material.roughness = 0.8;
      material.metalness = 0.1;
      material.transmission = 0;
      material.transparent = false;
      material.opacity = 1.0;
    } else {
      // jelly
      material.roughness = 0.1;
      material.metalness = 0.2;
      material.transmission = 0.95;
      material.thickness = 1.5;
      material.transparent = true;
      material.opacity = 0.85;
    }
    material.needsUpdate = true;
  });
}

function createGrid(contributionData) {
  voxelGroup.clear();
  const VoxelSize = 1;
  const Spacing = 1.2;
  const MaxHeight = 8;
  const maxContributions = Math.max(1, ...contributionData.map((d) => d.count));

  for (let week = 0; week < WEEKS; week++) {
    for (let day = 0; day < DAYS; day++) {
      const index = week * DAYS + day;
      const contribution = contributionData[index];
      if (!contribution) continue;

      const normalizedCount = contribution.count / maxContributions;
      const height =
        contribution.count > 0 ? 0.1 + normalizedCount * MaxHeight : 0.01;
      const geometry = new THREE.BoxGeometry(VoxelSize, height, VoxelSize);
      geometry.translate(0, height / 2, 0);

      const material = new THREE.MeshPhysicalMaterial({
        emissive: new THREE.Color(0x000000),
      });
      if (contribution.count === 0) {
        material.color.set(colorEmpty);
      } else {
        material.color.lerpColors(colorLow, colorHigh, normalizedCount);
      }
      const voxel = new THREE.Mesh(geometry, material);
      const x = (week - (WEEKS - 1) / 2) * Spacing;
      const z = (day - (DAYS - 1) / 2) * Spacing;
      voxel.position.set(x, 0, z);
      voxel.userData = {
        count: contribution.count,
        date: contribution.date,
      };
      voxelGroup.add(voxel);
    }
  }
  updateVoxelMaterials();
}

// --- Theme Logic (CHANGE A) ---
function setTheme(theme) {
  currentTheme = theme;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
    sunIcon.classList.add("hidden");
    moonIcon.classList.remove("hidden");
    plane.material.color.set(0x1e293b); // slate-800
    ambientLight.intensity = 0.4;
  } else {
    document.documentElement.classList.remove("dark");
    sunIcon.classList.remove("hidden");
    moonIcon.classList.add("hidden");
    plane.material.color.set(0xffffff);
    ambientLight.intensity = 0.7;
  }
  plane.material.needsUpdate = true;
}

// --- Event Listeners ---
async function handleSearch() {
  const username = usernameInput.value.trim();
  if (!username) {
    alert("Please enter a GitHub username.");
    return;
  }
  searchButton.disabled = true;
  searchButton.innerHTML = loadingSpinnerSVG;
  try {
    const data = await fetchContributions(username);
    createGrid(data);
  } catch (error) {
    alert(error.message);
  } finally {
    searchButton.disabled = false;
    searchButton.innerHTML = searchIconSVG;
  }
}
searchButton.addEventListener("click", handleSearch);
usernameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleSearch();
});
styleSelector.addEventListener("change", (event) => {
  currentStyle = event.target.value;
  updateVoxelMaterials();
});

copyLinkButton.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) {
    copyLinkButton.textContent = "Enter user!";
    setTimeout(() => {
      copyLinkButton.textContent = "Copy <iframe>";
    }, 2000);
    return;
  }
  const style = styleSelector.value;
  const rotationDisabled = disableRotationCheckbox.checked;

  const baseUrl =
    window.location.origin +
    window.location.pathname.replace("visualizer.html", "index.html");
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("style", style);
  if (rotationDisabled) {
    params.append("rotation", "false");
  }
  // CHANGE A: Add theme to the iframe URL
  if (currentTheme === "dark") {
    params.append("theme", "dark");
  }

  const embedSrc = `${baseUrl.replace("index.html", "visualizer.html")}?${params.toString()}`;
  const embedCode = `<iframe src="${embedSrc}" width="100%" height="450" title="3D Contribution Visualizer" style="border:none; border-radius: 8px;"></iframe>`;

  navigator.clipboard.writeText(embedCode).then(() => {
    copyLinkButton.textContent = "Copied!";
    setTimeout(() => {
      copyLinkButton.textContent = "Copy <iframe>";
    }, 2000);
  });
});

settingsButton.addEventListener("click", () => {
  settingsMenu.classList.toggle("hidden");
});

disableRotationCheckbox.addEventListener("change", () => {
  controls.autoRotate = !disableRotationCheckbox.checked;
});

// CHANGE A: Add theme toggle event listener
themeToggleButton.addEventListener("click", () => {
  setTheme(currentTheme === "light" ? "dark" : "light");
});

window.addEventListener("click", (event) => {
  if (
    !settingsMenu.classList.contains("hidden") &&
    !settingsButton.contains(event.target) &&
    !settingsMenu.contains(event.target)
  ) {
    settingsMenu.classList.add("hidden");
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("mousemove", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
      const { count, date } = hoveredVoxel.userData;
      tooltip.innerHTML = `<strong>${count} contributions</strong> on ${date}`;
      tooltip.classList.remove("hidden");
    }
    tooltip.style.left = `${event.clientX + 10}px`;
    tooltip.style.top = `${event.clientY + 10}px`;
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
    tooltip.classList.add("hidden");
  }
});

function triggerVoxelAnimation(voxel) {
  if (gsap.isTweening(voxel.position)) return;
  const jumpHeight = 5,
    launchDuration = 0.3,
    fallDuration = 1.2;
  const tl = gsap.timeline();
  tl.to(voxel.position, {
    y: jumpHeight,
    duration: launchDuration,
    ease: "power2.out",
  });
  tl.to(voxel.position, { y: 0, duration: fallDuration, ease: "bounce.out" });
}

window.addEventListener(
  "click",
  (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(voxelGroup.children);
    if (intersects.length > 0) {
      const clickedVoxel = intersects[0].object;
      if (clickedVoxel.userData.count > 0) {
        triggerVoxelAnimation(clickedVoxel);
      }
    }
  },
  false,
);

// --- Initial Load & Animation ---
function initialLoad() {
  const urlParams = new URLSearchParams(window.location.search);
  const usernameFromUrl = urlParams.get("username");
  const styleFromUrl = urlParams.get("style");
  const rotationParam = urlParams.get("rotation");
  const themeParam = urlParams.get("theme"); // CHANGE A: Read theme from URL

  // CHANGE A: Apply theme from URL or system preference
  if (themeParam === "dark") {
    setTheme("dark");
  } else if (
    !themeParam &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  if (rotationParam === "false") {
    controls.autoRotate = false;
    disableRotationCheckbox.checked = true;
  }
  if (styleFromUrl && ["clay", "jelly"].includes(styleFromUrl)) {
    styleSelector.value = styleFromUrl;
    currentStyle = styleFromUrl;
  }

  if (usernameFromUrl) {
    usernameInput.value = usernameFromUrl;
    handleSearch();
  } else {
    const initialData = generateFakeData();
    createGrid(initialData);
  }
}

const animate = () => {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
};

initialLoad();
animate();

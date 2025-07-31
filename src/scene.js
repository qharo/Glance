// src/scene.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  createBackgroundPlane,
  updateBackgroundPlaneSize,
} from "./backgrounds/index.js";
import { getStyle } from "./styles/index.js";

// Constants
const DAYS = 7;
// WEEKS constant is no longer authoritative for grid creation.

// Scene objects
let controls, raycaster, clock;
export const mainGroup = new THREE.Group();
export const voxelGroup = new THREE.Group();

/**
 * Initializes the entire Three.js scene.
 * @param {HTMLElement} container - The element to append the canvas to.
 * @returns {object} An object containing the scene, camera, renderer, lights, and backgroundPlane.
 */
export function initScene(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 35, 35);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);
  controls.minDistance = 20;
  controls.maxDistance = 80;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;

  raycaster = new THREE.Raycaster();
  clock = new THREE.Clock(); // For shader animations

  // CHANGE: Increased default light intensities for a brighter scene
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Upped from 0.6
  scene.add(ambientLight);

  const spotLight1 = new THREE.SpotLight(
    0xffffff,
    1.2, // Upped from 0.7
    150,
    Math.PI / 4,
    0.5,
    1,
  );
  spotLight1.position.set(30, 40, 20);
  spotLight1.target.position.set(0, 0, 0);
  scene.add(spotLight1);
  scene.add(spotLight1.target);

  const spotLight2 = new THREE.SpotLight(
    0xffffff,
    0.9, // Upped from 0.5
    150,
    Math.PI / 5,
    0.3,
    1,
  );
  spotLight2.position.set(-30, 30, -20);
  spotLight2.target.position.set(0, 0, 0);
  scene.add(spotLight2);
  scene.add(spotLight2.target);

  const backgroundPlane = createBackgroundPlane();
  mainGroup.add(backgroundPlane);

  mainGroup.add(voxelGroup);
  scene.add(mainGroup);

  return {
    scene,
    camera,
    renderer,
    lights: { ambientLight, spotLight1, spotLight2 },
    backgroundPlane,
  };
}

/**
 * Creates the grid of voxels based on contribution data and a visual style.
 * @param {Array<object>} contributionData - The array of contribution objects.
 * @param {string} styleName - The name of the style to use.
 * @param {THREE.Mesh} backgroundPlane - The background plane to resize.
 */
export function createGrid(contributionData, styleName, backgroundPlane) {
  voxelGroup.clear(); // Clear existing voxels
  const style = getStyle(styleName);
  const Spacing = 1.2;
  const MaxHeight = 8;
  const maxContributions = Math.max(1, ...contributionData.map((d) => d.count));

  // The total number of weeks in the grid is the total number of days divided by 7, rounded up.
  const totalWeeks = Math.ceil(contributionData.length / DAYS);
  updateBackgroundPlaneSize(backgroundPlane, totalWeeks);

  contributionData.forEach((contribution, index) => {
    // Calculate week and day from the flat array index
    const week = Math.floor(index / DAYS);
    const day = index % DAYS;

    const normalizedCount = contribution.count / maxContributions;
    const height =
      contribution.count > 0 ? 0.1 + normalizedCount * MaxHeight : 0.05;

    const dataPayload = { ...contribution, normalizedCount };

    const geometry = style.getGeometry(height, dataPayload);
    geometry.translate(0, height / 2, 0);

    const material = style.createMaterial(dataPayload);
    const voxel = new THREE.Mesh(geometry, material);

    // Center the grid by offsetting by half the total number of weeks/days
    const x = (week - (totalWeeks - 1) / 2) * Spacing;
    const z = (day - (DAYS - 1) / 2) * Spacing;
    voxel.position.set(x, 0, z);
    voxel.userData = {
      ...dataPayload,
      // Add a flag to identify voxels that need time updates for shaders
      needsTimeUpdate: !!style.needsTimeUpdate,
    };
    voxelGroup.add(voxel);
  });
}

/**
 * Triggers a style-specific animation on a voxel.
 * @param {THREE.Mesh} voxel - The voxel to animate.
 * @param {string} styleName - The name of the current style.
 */
export function triggerVoxelAnimation(voxel, styleName) {
  const style = getStyle(styleName);
  const timeline = style.getAnimationTimeline(voxel);
  if (timeline) {
    timeline.play();
  }
}

/**
 * The main animation loop.
 */
export function animate(scene, camera, renderer) {
  requestAnimationFrame(() => animate(scene, camera, renderer));

  const elapsedTime = clock.getElapsedTime();

  // Update shaders that need a time uniform (like hologram)
  for (const voxel of voxelGroup.children) {
    if (voxel.userData.needsTimeUpdate && voxel.material.uniforms) {
      voxel.material.uniforms.u_time.value = elapsedTime;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

// Getters for private module variables
export const getControls = () => controls;
export const getRaycaster = () => raycaster;

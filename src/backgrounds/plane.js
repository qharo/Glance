// src/backgrounds/plane.js
import * as THREE from "three";

const WEEKS = 53;
const DAYS = 7;

/**
 * Creates and returns the background plane mesh.
 * @returns {THREE.Mesh} The background plane.
 */
export function createBackgroundPlane() {
  const planeGeometry = new THREE.PlaneGeometry(
    WEEKS * 1.2 + 4,
    DAYS * 1.2 + 4,
  );
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Default light theme
    roughness: 0.9,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  return plane;
}

/**
 * Resizes the background plane to fit the grid.
 * @param {THREE.Mesh} plane - The plane to update.
 * @param {number} totalWeeks - The total number of weeks to display.
 */
export function updateBackgroundPlaneSize(plane, totalWeeks) {
  if (!plane) return;

  const Spacing = 1.2; // Should match spacing in createGrid
  const Padding = 4;
  const width = totalWeeks * Spacing + Padding;
  const height = DAYS * Spacing + Padding;

  // Create new geometry and dispose of the old one to avoid distortion
  plane.geometry.dispose();
  plane.geometry = new THREE.PlaneGeometry(width, height);
}

/**
 * Updates the background plane's color based on the selected theme.
 * @param {THREE.Mesh} plane - The plane to update.
 * @param {string} theme - The theme ('light' or 'dark').
 */
export function updateBackgroundTheme(plane, theme) {
  if (!plane) return; // Guard against the plane not being found
  if (theme === "dark") {
    plane.material.color.set(0x1e293b); // slate-800
  } else {
    plane.material.color.set(0xffffff);
  }
  plane.material.needsUpdate = true;
}

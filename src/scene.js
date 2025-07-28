// src/scene.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createBackgroundPlane } from "./backgrounds/index.js";

// Constants
const DAYS = 7;
const WEEKS = 53;

// Scene objects
let controls, raycaster;
export const mainGroup = new THREE.Group();
export const voxelGroup = new THREE.Group();

// Colors
const colorEmpty = new THREE.Color("#ebedf0");
const colorLow = new THREE.Color("#9be9a8");
const colorHigh = new THREE.Color("#216e39");

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

  const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  scene.add(hemisphereLight);

  const mainDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  mainDirectionalLight.position.set(20, 30, 10);
  scene.add(mainDirectionalLight);

  const fillDirectionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillDirectionalLight.position.set(-20, 15, -10);
  scene.add(fillDirectionalLight);

  const backgroundPlane = createBackgroundPlane();
  // The line `backgroundPlane.dataset.role = "background-plane";` was incorrect and has been removed.
  mainGroup.add(backgroundPlane);

  mainGroup.add(voxelGroup);
  scene.add(mainGroup);

  return {
    scene,
    camera,
    renderer,
    lights: { hemisphereLight, mainDirectionalLight, fillDirectionalLight },
    backgroundPlane, // <-- FIX: Return the plane object
  };
}

/**
 * Creates the grid of voxels based on contribution data.
 * @param {Array<object>} contributionData - The array of contribution objects.
 */
export function createGrid(contributionData) {
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
}

export function triggerVoxelAnimation(voxel) {
  if (gsap.isTweening(voxel.position)) return;
  const jumpHeight = 5,
    launchDuration = 0.3,
    fallDuration = 1.2;
  gsap
    .timeline()
    .to(voxel.position, {
      y: jumpHeight,
      duration: launchDuration,
      ease: "power2.out",
    })
    .to(voxel.position, { y: 0, duration: fallDuration, ease: "bounce.out" });
}

/**
 * The main animation loop.
 */
export function animate(scene, camera, renderer) {
  requestAnimationFrame(() => animate(scene, camera, renderer));
  controls.update();
  renderer.render(scene, camera);
}

// Getters for private module variables
export const getControls = () => controls;
export const getRaycaster = () => raycaster;

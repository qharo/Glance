// src/styles/jelly.js

/**
 * Applies properties for a 'jelly' look to a material.
 * @param {THREE.MeshPhysicalMaterial} material - The material to modify.
 */
export function applyJellyStyle(material) {
  material.roughness = 0.1;
  material.metalness = 0.2;
  material.transmission = 0.95;
  material.thickness = 1.5; // Required for transmission
  material.transparent = true;
  material.opacity = 0.85;
  material.needsUpdate = true;
}

// src/styles/clay.js

/**
 * Applies properties for a 'clay' look to a material.
 * @param {THREE.MeshPhysicalMaterial} material - The material to modify.
 */
export function applyClayStyle(material) {
  material.roughness = 0.8;
  material.metalness = 0.1;
  material.transmission = 0;
  material.transparent = false;
  material.opacity = 1.0;
  material.needsUpdate = true;
}

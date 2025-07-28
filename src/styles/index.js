// src/styles/index.js
import { applyClayStyle } from "./clay.js";
import { applyJellyStyle } from "./jelly.js";

const styles = {
  clay: applyClayStyle,
  jelly: applyJellyStyle,
};

/**
 * Applies a named visual style to all voxels in a group.
 * @param {THREE.Group} voxelGroup - The group containing voxel meshes.
 * @param {string} styleName - The name of the style to apply ('clay' or 'jelly').
 */
export function updateVoxelMaterials(voxelGroup, styleName) {
  const styleFn = styles[styleName];
  if (!styleFn) {
    console.warn(`Unknown style: ${styleName}`);
    return;
  }

  voxelGroup.children.forEach((voxel) => {
    styleFn(voxel.material);
  });
}

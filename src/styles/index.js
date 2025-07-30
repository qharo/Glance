// src/styles/index.js
import { clayStyle } from "./clay.js";
import { jellyStyle } from "./jelly.js";
import { hologramStyle } from "./hologram.js";

const styles = {
  clay: clayStyle,
  jelly: jellyStyle,
  hologram: hologramStyle,
};

/**
 * Gets the full style definition object for a given style name.
 * @param {string} styleName - The name of the style ('clay', 'jelly', or 'hologram').
 * @returns {object} The style definition object.
 */
export function getStyle(styleName) {
  const style = styles[styleName];
  if (!style) {
    console.warn(`Unknown style: ${styleName}, defaulting to clay.`);
    return styles.clay;
  }
  return style;
}

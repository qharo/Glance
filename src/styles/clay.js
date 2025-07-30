// src/styles/clay.js
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import * as THREE from "three";

const colorLow = new THREE.Color("#9be9a8");
const colorHigh = new THREE.Color("#216e39");
const colorEmpty = new THREE.Color("#ebedf0");

export const clayStyle = {
  createMaterial: (data) => {
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.8,
      metalness: 0.1,
      transmission: 0,
      emissive: new THREE.Color(0x000000),
    });

    if (data.count === 0) {
      material.color.set(colorEmpty);
    } else {
      material.color.lerpColors(colorLow, colorHigh, data.normalizedCount);
    }

    return material;
  },

  getGeometry: (height, data) => {
    return new RoundedBoxGeometry(1, height, 1, 4, 0.1);
  },

  getAnimationTimeline: (voxel) => {
    if (voxel.userData.count === 0) return gsap.timeline();
    if (gsap.isTweening(voxel.position)) return gsap.timeline();

    const jumpHeight = 2;
    const duration = 0.4;

    return gsap
      .timeline()
      .to(voxel.position, {
        y: jumpHeight,
        duration: duration / 2,
        ease: "power2.out",
      })
      .to(voxel.position, {
        y: 0,
        duration: duration,
        ease: "power3.in",
      });
  },

  onHoverStart: (voxel) => {
    if (!voxel.material.emissive) return;
    gsap.to(voxel.material.emissive, {
      r: 0.3,
      g: 0.3,
      b: 0.3,
      duration: 0.3,
    });
  },

  onHoverEnd: (voxel) => {
    if (!voxel.material.emissive) return;
    gsap.to(voxel.material.emissive, {
      r: 0,
      g: 0,
      b: 0,
      duration: 0.3,
    });
  },
};

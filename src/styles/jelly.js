// src/styles/jelly.js
import * as THREE from "three";

const colorLow = new THREE.Color("#9be9a8");
const colorHigh = new THREE.Color("#216e39");
const colorEmpty = new THREE.Color("#ebedf0");

export const jellyStyle = {
  createMaterial: (data) => {
    const material = new THREE.MeshPhysicalMaterial({
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.95,
      thickness: 1.5,
      transparent: true,
      opacity: 0.85,
      emissive: new THREE.Color(0x000000),
    });

    if (data.count === 0) {
      material.color.set(colorEmpty);
      material.transmission = 0;
      material.opacity = 1.0;
    } else {
      material.color.lerpColors(colorLow, colorHigh, data.normalizedCount);
    }

    return material;
  },

  getGeometry: (height, data) => {
    return new THREE.BoxGeometry(1, height, 1);
  },

  getAnimationTimeline: (voxel) => {
    if (voxel.userData.count === 0) return gsap.timeline();
    if (gsap.isTweening(voxel.scale) || gsap.isTweening(voxel.position)) {
      return gsap.timeline();
    }

    const jumpHeight = 5;
    const launchDuration = 0.3;
    const fallDuration = 0.4;
    const tl = gsap.timeline();

    tl.to(voxel.position, {
      y: jumpHeight,
      duration: launchDuration,
      ease: "power2.out",
    });
    tl.to(voxel.position, {
      y: 0,
      duration: fallDuration,
      ease: "power2.in",
    });
    tl.to(
      voxel.scale,
      { y: 0.6, x: 1.3, z: 1.3, duration: 0.15, ease: "power2.in" },
      "-=0.05",
    );
    tl.to(voxel.scale, {
      y: 1,
      x: 1,
      z: 1,
      duration: 0.8,
      ease: "elastic.out(1, 0.5)",
    });

    return tl;
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

// src/styles/hologram.js
import * as THREE from "three";

const hologramVertexShader = `
  varying vec3 vWorldPosition;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const hologramFragmentShader = `
  uniform float u_time;
  uniform vec3 u_color;
  uniform float u_pulse_position; // 0.0 to 1.0 (bottom to top)
  uniform float u_pulse_intensity; // Strength of the pulse
  uniform float u_hover_intensity; // 0.0 to 1.0, for hover effect

  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // --- Base Color & Transparency ---
    float opacity = 0.5;
    vec3 color = u_color;

    // --- Scan Lines ---
    float scanline_speed = 4.0;
    float scanline_density = 25.0;
    // Use vUv.y for consistent lines regardless of bar height
    float scanline = sin((vUv.y * scanline_density) + (u_time * scanline_speed));
    scanline = smoothstep(0.9, 1.0, scanline);
    opacity *= (1.0 - scanline * 0.3); // Make scanlines slightly more transparent

    // --- Glow / Bloom (faked with fresnel) ---
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(cross(dFdx(vWorldPosition), dFdy(vWorldPosition))); // Flat shading normal
    float fresnel = 1.0 - dot(viewDirection, normal);
    fresnel = pow(fresnel, 2.0); // Power for sharpness
    color += fresnel * u_color * 0.8; // Additive glow on edges
    opacity += fresnel * 0.2;

    // --- Click Pulse ---
    if (u_pulse_intensity > 0.0) {
      float pulse_width = 0.15;
      float pulse = smoothstep(u_pulse_position - pulse_width, u_pulse_position, vUv.y) -
                    smoothstep(u_pulse_position, u_pulse_position + pulse_width, vUv.y);

      vec3 pulse_color = vec3(1.0, 1.0, 1.0); // White pulse
      color += pulse * pulse_color * u_pulse_intensity;
      opacity += pulse * u_pulse_intensity * 0.5;
    }

    // --- Hover Effect ---
    // Make it brighter and more opaque on hover
    color += u_hover_intensity * 0.5;
    opacity += u_hover_intensity * 0.2;

    gl_FragColor = vec4(color, opacity);
  }
`;

const projectorFlickerTimeline = (material) => {
  const tl = gsap.timeline({
    repeat: -1,
    yoyo: true,
  });
  tl.to(material, {
    opacity: 0.1,
    duration: Math.random() * 0.5 + 0.1,
    ease: "power1.inOut",
  }).to(material, {
    opacity: 0.4,
    duration: Math.random() * 0.8 + 0.2,
    ease: "power1.inOut",
  });
  return tl;
};

export const hologramStyle = {
  createMaterial: (data) => {
    if (data.count === 0) {
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.3,
      });
      projectorFlickerTimeline(material);
      return material;
    }

    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0 },
        u_color: { value: new THREE.Color(0x00ffff) },
        u_pulse_position: { value: -1.0 },
        u_pulse_intensity: { value: 0.0 },
        u_hover_intensity: { value: 0.0 }, // Add new uniform for hover
      },
      vertexShader: hologramVertexShader,
      fragmentShader: hologramFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return material;
  },

  getGeometry: (height, data) => {
    if (data.count === 0) {
      return new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
    }
    return new THREE.BoxGeometry(1, height, 1);
  },

  getAnimationTimeline: (voxel) => {
    if (voxel.userData.count === 0) {
      const tl = gsap.timeline();
      tl.to(voxel.material, { opacity: 1.0, duration: 0.1 });
      tl.to(voxel.material, { opacity: 0.3, duration: 0.4 });
      return tl;
    }

    const material = voxel.material;
    if (gsap.isTweening(material.uniforms.u_pulse_position)) {
      return gsap.timeline();
    }

    const maxContributionsForPulse = 50;
    const intensity =
      Math.min(1.0, voxel.userData.count / maxContributionsForPulse) * 1.5 +
      0.5;

    const tl = gsap.timeline({
      onStart: () => {
        material.uniforms.u_pulse_intensity.value = intensity;
      },
      onComplete: () => {
        material.uniforms.u_pulse_position.value = -1.0;
        material.uniforms.u_pulse_intensity.value = 0.0;
      },
    });

    tl.fromTo(
      material.uniforms.u_pulse_position,
      { value: 0.0 },
      { value: 1.0, duration: 0.6, ease: "power2.out" },
    );

    return tl;
  },

  onHoverStart: (voxel) => {
    if (voxel.material.uniforms?.u_hover_intensity) {
      gsap.to(voxel.material.uniforms.u_hover_intensity, {
        value: 1.0,
        duration: 0.3,
      });
    } else if (voxel.userData.count === 0) {
      // For projector bases, just pop the opacity
      gsap.to(voxel.material, { opacity: 0.8, duration: 0.3 });
    }
  },

  onHoverEnd: (voxel) => {
    if (voxel.material.uniforms?.u_hover_intensity) {
      gsap.to(voxel.material.uniforms.u_hover_intensity, {
        value: 0.0,
        duration: 0.3,
      });
    } else if (voxel.userData.count === 0) {
      // Return projector bases to their flickering state
      gsap.to(voxel.material, { opacity: 0.3, duration: 0.3 });
    }
  },

  forcedTheme: "dark",

  needsTimeUpdate: true,
};

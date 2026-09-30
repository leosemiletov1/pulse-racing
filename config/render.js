/* ==========================================================================
   RENDER SETTINGS: how the car looks.
   Save and refresh the page to see a change (serve.py disables caching).

   Coordinates are the SAME as in Onshape, in millimetres:
     X = across the car, Y = along the car (nose is at -Y), Z = up.
   The car is about 228 mm long, runs from y = -88 (nose) to y = 141 (tail),
   and sits on the ground at z = -24.8.
   ========================================================================== */

export default {
  model: {
    file: 'assets/car.glb',   // re-export with: py tools/export_from_onshape.py
    unitScale: 1000,          // Onshape exports metres; x1000 = millimetres
  },

  /* ------------------------------------------------------------ PAINT
     Which paint scheme the site uses. Try any scheme without editing this file
     by adding ?paint=<name> to the address, e.g. http://localhost:8080/?paint=pulse-green */
  paint: 'pulse-green',

  // Which Onshape parts each scheme colours. `*` = wildcard; a list means any of them.
  parts: {
    body: ['car_body', 'Part 1'],
    wheels: 'wheel*',
    helmet: ['Solid1', 'Helmet*'],
    cartridge: ['cartridge*', 'CO2*'],
  },

  // Used by every scheme unless the scheme sets its own.
  defaultMaterials: {
    cartridge: { color: '#b9bec6', metalness: 0.9, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.1 }, // same as liquid-silver
  },

  /* Wheel finishes. A scheme can say  wheels: 'black'  instead of listing a material,
     and you can preview any finish with ?wheels=<name>, e.g. /?wheels=gold */
  wheelFinishes: {
    white: { color: '#f2f4f7', roughness: 0.4, clearcoat: 0.4 },
    black: { color: '#15171b', metalness: 0.2, roughness: 0.3, clearcoat: 0.8 },
    gunmetal: { color: '#4a4f57', metalness: 0.8, roughness: 0.3, clearcoat: 0.5 },
    silver: { color: '#c3c8cf', metalness: 0.95, roughness: 0.18, clearcoat: 0.6 },
    gold: { color: '#d4a33b', metalness: 0.95, roughness: 0.25, clearcoat: 0.6 },
    lime: { color: '#9bd40f', roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.08 },
  },

  /* Each scheme sets a material for body / wheels / helmet. Any three.js
     MeshPhysicalMaterial property works: color, metalness (0 plastic .. 1 metal),
     roughness (0 mirror .. 1 matte), clearcoat (glossy lacquer layer), emissive (glow) ...
     Optional scene tweaks per scheme:
       environment  strength of the studio reflections
       exposure     overall brightness
       floorGlow    colour of the light pool under the car
       lights       { lightId: { color, intensity } } to adjust lights listed further down */
  paintSchemes: {
    'pastel-blue': {
      body: { color: '#2f5fd0', metalness: 0.15, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 },
      wheels: { color: '#e9ecf0', roughness: 0.45, clearcoat: 0.3 },
      helmet: { color: '#12c95a', roughness: 0.4, clearcoat: 0.6, emissive: '#04521f' },
      environment: 0.55,
      floorGlow: '#1b2340',
      lights: { key: { intensity: 2.6 }, fill: { intensity: 0.7 }, rimLeft: { color: '#7fa6ff', intensity: 9 }, rimRight: { intensity: 6 }, top: { intensity: 0 }, ambient: { intensity: 0.35 } },
    },
    'pulse-green': {
      body: { color: '#13b857', metalness: 0.25, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 },
      wheels: 'black',
      helmet: { color: '#101215', metalness: 0.3, roughness: 0.25, clearcoat: 1 },
      environment: 0.45,
      floorGlow: '#10301f',
      lights: { rimLeft: { color: '#ffffff' }, top: { intensity: 1.5 }, ambient: { intensity: 0.2 } },
    },
    'pastel-mint': {
      body: { color: '#46c996', metalness: 0.15, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06 },
      wheels: { color: '#e9ecf0', roughness: 0.45, clearcoat: 0.3 },
      helmet: { color: '#101215', metalness: 0.3, roughness: 0.25, clearcoat: 1 },
      environment: 0.55,
      floorGlow: '#12301f',
      lights: { key: { intensity: 2.6 }, fill: { intensity: 0.7 }, rimLeft: { color: '#b8ffd9', intensity: 9 }, rimRight: { intensity: 6 }, top: { intensity: 0 }, ambient: { intensity: 0.35 } },
    },
    'pearl-white': {
      body: { color: '#e6e8ec', metalness: 0.05, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.04 },
      wheels: { color: '#15171b', metalness: 0.2, roughness: 0.35, clearcoat: 0.5 },
      helmet: { color: '#12c95a', roughness: 0.4, clearcoat: 0.6, emissive: '#04521f' },
      environment: 0.45,
      exposure: 0.85,
      floorGlow: '#10301f',
      lights: { top: { intensity: 0 }, ambient: { intensity: 0.15 } },
    },
    'liquid-silver': {
      body: { color: '#b9bec6', metalness: 0.9, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.1 },
      wheels: { color: '#15171b', metalness: 0.2, roughness: 0.35, clearcoat: 0.5 },
      helmet: { color: '#12c95a', roughness: 0.4, clearcoat: 0.6, emissive: '#04521f' },
      environment: 0.9,
      floorGlow: '#1a1f26',
      lights: { rimLeft: { color: '#ffffff' }, top: { intensity: 2 }, ambient: { intensity: 0.2 } },
    },
    'gloss-black': {
      body: { color: '#0d0f12', metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 },
      wheels: { color: '#f2f4f7', roughness: 0.4, clearcoat: 0.4 },
      helmet: { color: '#12c95a', roughness: 0.4, clearcoat: 0.6, emissive: '#04521f' },
      environment: 0.7,
      floorGlow: '#10301f',
    },
  },

  background: '#000000',

  renderer: {
    toneMapping: 'aces',      // 'aces' | 'agx' | 'neutral' | 'none'
    exposure: 1.0,            // overall brightness (a paint scheme can override it)
    maxPixelRatio: 2,         // lower to 1.5 if phones struggle
  },

  // Studio reflections. This is what makes paint look glossy.
  environment: {
    enabled: true,
    intensity: 0.5,           // a paint scheme can override this
    rotation: 0,              // degrees; spins the reflections around the car
  },

  /* Lights. Positions are in mm, Onshape coordinates (see top of file).
     type: 'directional' | 'spot' | 'point' | 'ambient' | 'hemisphere'
     `id` lets a paint scheme adjust a light. */
  lights: [
    // Key light: soft white from above-front-left, casts the floor shadow
    { id: 'key', type: 'directional', color: '#ffffff', intensity: 2.2, position: [180, -220, 420], castShadow: true },
    // Fill from the other side so the shadowed side isn't pitch black
    { id: 'fill', type: 'directional', color: '#b9c8ff', intensity: 0.4, position: [-300, 60, 160] },
    // Rim lights behind the car so its outline separates from the black background
    { id: 'rimLeft', type: 'spot', color: '#7dffb4', intensity: 10, position: [-260, 420, 120], target: [0, 30, 0], angle: 35, penumbra: 0.8 },
    { id: 'rimRight', type: 'spot', color: '#ffffff', intensity: 8, position: [300, 380, 90], target: [0, 30, 0], angle: 35, penumbra: 0.8 },
    // Soft top light to show the shape of dark bodywork
    { id: 'top', type: 'spot', color: '#ffffff', intensity: 5, position: [0, 20, 500], target: [0, 20, 0], angle: 30, penumbra: 1 },
    { id: 'ambient', type: 'hemisphere', color: '#ffffff', groundColor: '#0a0a12', intensity: 0.12 },
  ],

  /* Extra parts kept in their own Onshape Part Studio, placed onto the car
     (not needed while the car is exported from the assembly). Example:
     { name: 'helmet', file: 'assets/helmet.glb', position: [0, -20, 4], rotation: [0, 0, 0] }
       position = where the part's bottom-centre sits (mm), rotation = [x, y, z] degrees */
  extraModels: [],

  shadows: {
    enabled: true,
    mapSize: 2048,            // sharper shadow = bigger number (costs speed)
    softness: 6,
  },

  // A faint pool of light on the floor under the car
  floor: {
    enabled: true,
    glowColor: '#10301f',     // a paint scheme's floorGlow overrides this
    glowRadius: 420,          // mm
    glowStrength: 0.9,
    shadowOpacity: 0.75,
  },
};

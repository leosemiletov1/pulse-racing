// Scroll-driven 3D car tour. You normally don't need to edit this file:
// the look lives in config/render.js and the camera path/popups in config/tour.js.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import RENDER from '../config/render.js';
import TOUR from '../config/tour.js';
import { buildPopup, layoutPhotos } from './popups.js';
import { startCountdown } from './countdown.js';

// Onshape is Z-up. Keeping Z-up here means every coordinate in the config
// files is exactly what Onshape shows (in mm).
THREE.Object3D.DEFAULT_UP.set(0, 0, 1);

const $ = (id) => document.getElementById(id);
const deg = THREE.MathUtils.degToRad;
const clamp = THREE.MathUtils.clamp;
const PARAMS = new URLSearchParams(location.search);
const EDIT = PARAMS.has('edit');
// Paint scheme: ?paint=<name> previews another scheme without editing config/render.js
const PAINT_NAME = PARAMS.get('paint') || RENDER.paint;
const PAINT = RENDER.paintSchemes?.[PAINT_NAME] ?? {};
if (RENDER.paintSchemes && !RENDER.paintSchemes[PAINT_NAME]) console.warn(`Unknown paint scheme "${PAINT_NAME}"`);
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = TOUR.defaults;

// ------------------------------------------------------------------ branding
document.documentElement.style.setProperty('--accent', TOUR.brand.accent);
{ // black or white text on accent-coloured buttons, whichever reads better
  const c = new THREE.Color(TOUR.brand.accent);
  document.documentElement.style.setProperty('--accent-ink', 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b > 0.35 ? '#000' : '#fff');
}
document.title = `${TOUR.brand.teamName} · ${TOUR.brand.tagline}`;
$('brand').textContent = TOUR.brand.teamName;
$('loader-title').textContent = TOUR.brand.teamName;
startCountdown($('countdown'), TOUR.countdown);

// ------------------------------------------------------------------ renderer
const canvas = $('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, RENDER.renderer.maxPixelRatio ?? 2));
renderer.toneMapping = {
  aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping,
  neutral: THREE.NeutralToneMapping, none: THREE.NoToneMapping,
}[RENDER.renderer.toneMapping ?? 'aces'];
renderer.toneMappingExposure = PAINT.exposure ?? RENDER.renderer.exposure ?? 1;
renderer.shadowMap.enabled = !!RENDER.shadows?.enabled;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(RENDER.background);
const camera = new THREE.PerspectiveCamera(30, 1, 1, 20000);

if (RENDER.environment?.enabled !== false) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = PAINT.environment ?? RENDER.environment.intensity ?? 1;
  // RoomEnvironment is Y-up: tip it onto Z-up, then spin by the configured angle.
  scene.environmentRotation.set(Math.PI / 2, 0, deg(RENDER.environment.rotation ?? 0), 'ZYX');
}

// ------------------------------------------------------------------ lights
const shadowLights = [];
for (const base of RENDER.lights) {
  const l = { ...base, ...(PAINT.lights?.[base.id] ?? {}) };
  let light;
  switch (l.type) {
    case 'ambient': light = new THREE.AmbientLight(l.color, l.intensity); break;
    case 'hemisphere': light = new THREE.HemisphereLight(l.color, l.groundColor, l.intensity); break;
    case 'directional': light = new THREE.DirectionalLight(l.color, l.intensity); break;
    case 'point': light = new THREE.PointLight(l.color, l.intensity, 0, l.decay ?? 0); break;
    case 'spot':
      light = new THREE.SpotLight(l.color, l.intensity, 0, deg(l.angle ?? 30), l.penumbra ?? 0.5, l.decay ?? 0);
      break;
    default: console.warn('Unknown light type', l); continue;
  }
  if (l.position) light.position.set(...l.position);
  if (light.target) {
    light.target.position.set(...(l.target ?? [0, 0, 0]));
    scene.add(light.target);
  }
  if (l.castShadow && RENDER.shadows?.enabled && light.shadow) {
    light.castShadow = true;
    light.shadow.mapSize.setScalar(RENDER.shadows.mapSize ?? 2048);
    light.shadow.radius = RENDER.shadows.softness ?? 4;
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.3;
    const c = light.shadow.camera;
    c.near = 1; c.far = 4000;
    if (c.isOrthographicCamera) { c.left = c.bottom = -260; c.right = c.top = 260; }
    shadowLights.push({ light, cfg: l });
  }
  scene.add(light);
}

// ------------------------------------------------------------------ timeline
// Each stop owns [start, end] (the hold), followed by `move` screens of travel.
const stops = TOUR.stops.map((s) => ({ ...s, hold: s.hold ?? D.hold, move: s.move ?? D.move, drift: s.drift ?? 0 }));
{
  let t = 0;
  stops.forEach((s, i) => {
    s.start = t;
    s.end = t + s.hold;
    t = s.end + (i < stops.length - 1 ? s.move : 0);
  });
}
const total = stops.at(-1).end;

const EASE = {
  linear: (k) => k,
  inOutSine: (k) => 0.5 - Math.cos(Math.PI * k) / 2,
  inOutCubic: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2),
  inOutQuint: (k) => (k < 0.5 ? 16 * k ** 5 : 1 - (-2 * k + 2) ** 5 / 2),
};
const ease = EASE[D.easing] ?? EASE.inOutCubic;
const isPortrait = () => innerWidth / innerHeight < 0.9;

// Where the car sits on screen so it isn't hidden behind the popup.
function screenShift(s) {
  const p = s.popup;
  if (isPortrait()) return p ? [0, p.style === 'hero' ? 0.1 : 0.2] : [0, 0];
  if (s.carOnScreen) return s.carOnScreen;
  if (!p) return [0, 0];
  if (p.style === 'hero') return [0.14, 0.14];
  return p.side === 'right' ? [-0.17, 0] : [0.17, 0];
}

function stopPose(s, local = 0.5) {
  const c = s.camera;
  return {
    target: [...c.target],
    azimuth: c.azimuth + s.drift * (local - 0.5),
    elevation: c.elevation,
    distance: c.distance,
    fov: c.fov ?? 30,
    shift: screenShift(s),
  };
}

const lerp = THREE.MathUtils.lerp;
function lerpPose(a, b, k) {
  return {
    target: a.target.map((v, i) => lerp(v, b.target[i], k)),
    azimuth: lerp(a.azimuth, b.azimuth, k),
    elevation: lerp(a.elevation, b.elevation, k),
    distance: Math.exp(lerp(Math.log(a.distance), Math.log(b.distance), k)), // zoom evenly
    fov: lerp(a.fov, b.fov, k),
    shift: a.shift.map((v, i) => lerp(v, b.shift[i], k)),
  };
}

// Camera pose for a scroll position measured in screen-heights.
function poseAt(p) {
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i], next = stops[i + 1];
    if (p <= s.end || !next) return stopPose(s, clamp((p - s.start) / s.hold, 0, 1));
    if (p < next.start) return lerpPose(stopPose(s, 1), stopPose(next, 0), ease((p - s.end) / s.move));
  }
}

const _t = new THREE.Vector3();
function applyShift(shift) {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return;
  camera.setViewOffset(w, h, -shift[0] * w, shift[1] * h, w, h);
  camera.updateProjectionMatrix();
}
// Tall/narrow screens get the camera pulled back so the whole car still fits.
const zoomFactor = () => {
  const aspect = innerWidth / innerHeight;
  return aspect > 0 ? Math.pow(Math.max(1, 1.4 / aspect), D.mobileZoomOut ?? 0) : 1;
};
function applyPose(pose) {
  const dist = pose.distance * zoomFactor();
  const az = deg(pose.azimuth), el = deg(clamp(pose.elevation, -89, 89));
  _t.set(...pose.target);
  camera.position.set(-Math.sin(az) * Math.cos(el), -Math.cos(az) * Math.cos(el), Math.sin(el))
    .multiplyScalar(dist).add(_t);
  camera.lookAt(_t);
  camera.fov = pose.fov;
  applyShift(pose.shift);
}
// Inverse of applyPose (used by the ?edit tools).
function poseFromCamera(target) {
  const off = camera.position.clone().sub(target);
  const d = off.length();
  return {
    target: target.toArray(),
    azimuth: THREE.MathUtils.radToDeg(Math.atan2(-off.x, -off.y)),
    elevation: THREE.MathUtils.radToDeg(Math.asin(off.z / d)),
    distance: d / zoomFactor(),
    fov: camera.fov,
  };
}

// ------------------------------------------------------------------ DOM: popups + nav
const popupLayer = $('popups');
const popupEls = stops.map((s) => (s.popup ? popupLayer.appendChild(buildPopup(s)) : null));
const nav = $('stop-nav');
const navEls = stops.map((s, i) => {
  const b = document.createElement('button');
  b.innerHTML = `<span>${s.label ?? s.id}</span><i></i>`;
  b.setAttribute('aria-label', s.label ?? s.id);
  b.addEventListener('click', () => goToStop(i));
  nav.append(b);
  return b;
});
function goToStop(i) {
  const s = stops[i];
  scrollTo({ top: (s.start + s.hold * 0.5) * unit, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
}
$('brand').addEventListener('click', (e) => { e.preventDefault(); goToStop(0); });

const hotspot = $('hotspot');
const leader = $('leader');
const leaderLine = leader.querySelector('polyline');
const _p = new THREE.Vector3();
let activeIndex = -1;

function updateUI(p, forced) {
  $('progress').style.width = `${clamp(p / total, 0, 1) * 100}%`;
  const idx = forced ?? stops.findIndex((s) => p >= s.start - 0.2 && p <= s.end + 0.2);
  if (idx !== activeIndex) {
    popupEls.forEach((el, i) => el?.classList.toggle('is-active', i === idx));
    if (popupEls[idx]) layoutPhotos(popupEls[idx]);
    navEls.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    activeIndex = idx;
  }
  // Pin + leader line from the car feature to the popup
  const s = stops[idx];
  let on = false;
  if (s?.anchor && model) {
    _p.set(...s.anchor).project(camera);
    if (_p.z < 1) {
      const x = (_p.x + 1) / 2 * innerWidth, y = (1 - _p.y) / 2 * innerHeight;
      hotspot.style.transform = `translate(${x}px, ${y}px)`;
      on = true;
      const r = popupEls[idx]?.getBoundingClientRect();
      if (r && r.width) {
        const ex = clamp(x, r.left, r.right), ey = clamp(y, r.top, r.bottom);
        const side = ex === r.left || ex === r.right;
        const bx = side ? ex + (x > ex ? 28 : -28) : ex;
        const by = side ? ey : ey + (y > ey ? 28 : -28);
        const inside = x > r.left && x < r.right && y > r.top && y < r.bottom;
        leaderLine.setAttribute('points', inside ? '' : `${x},${y} ${bx},${by} ${ex},${ey}`);
      }
    }
  }
  hotspot.classList.toggle('is-on', on);
  leader.classList.toggle('is-on', on);
}

// ------------------------------------------------------------------ sizing
let unit = innerHeight || 1; // one "screen-height" of scrolling, in px
let lastW = 0;
function resize() {
  const w = innerWidth, h = innerHeight;
  if (!w || !h) return;        // hidden tab/iframe: wait for a real size
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  // Mobile browsers change innerHeight while scrolling; only re-measure on real resizes.
  if (w !== lastW || Math.abs(h - unit) > 150) {
    const ratio = scrollY / unit;
    unit = h;
    lastW = w;
    $('scroll-space').style.height = `${total * unit + h}px`;
    scrollTo(0, ratio * unit);
  }
  leader.setAttribute('viewBox', `0 0 ${w} ${h}`);
  popupEls.forEach((el) => el && layoutPhotos(el));
}
addEventListener('resize', resize);
resize();
document.fonts?.ready.then(resize); // card sizes change once the web font arrives

// ------------------------------------------------------------------ model
let model = null;
function glob(pattern, name) {
  const norm = (s) => s.replace(/[\s_]+/g, ' ').trim().toLowerCase();
  const re = new RegExp('^' + norm(pattern).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return re.test(norm(name));
}
function makeMaterial(mesh) {
  const names = [mesh.userData.name, mesh.name, mesh.parent?.userData.name, mesh.parent?.name].filter(Boolean);
  const matches = (pattern) => [].concat(pattern).some((p) => names.some((n) => glob(p, n)));
  const role = Object.keys(RENDER.parts ?? {}).find((r) => matches(RENDER.parts[r]));
  let spec = role && ((role === 'wheels' && PARAMS.get('wheels')) || PAINT[role] || RENDER.defaultMaterials?.[role]);
  if (typeof spec === 'string') spec = RENDER.wheelFinishes?.[spec]; // e.g. wheels: 'black'
  const { color, ...props } = spec || { roughness: 0.5 }; // unlisted parts keep their Onshape colour
  const src = mesh.material;
  const m = new THREE.MeshPhysicalMaterial({
    color: color ? new THREE.Color(color) : src.color.clone(),
    metalness: src.metalness ?? 0,
    roughness: src.roughness ?? 0.5,
  });
  m.setValues(props);
  return m;
}

function buildFloor(box) {
  const f = RENDER.floor;
  if (!f?.enabled) return;
  const z = box.min.z;
  const c = box.getCenter(new THREE.Vector3());
  // Soft light pool
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  const col = new THREE.Color(PAINT.floorGlow ?? f.glowColor);
  grad.addColorStop(0, `rgba(${col.r * 255},${col.g * 255},${col.b * 255},1)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const size = (f.glowRadius ?? 400) * 2;
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: f.glowStrength ?? 1, toneMapped: false }),
  );
  glow.position.set(c.x, c.y, z - 0.2);
  glow.renderOrder = -1;
  scene.add(glow);
  if (RENDER.shadows?.enabled) {
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), new THREE.ShadowMaterial({ opacity: f.shadowOpacity ?? 0.6 }));
    catcher.position.set(c.x, c.y, z);
    catcher.receiveShadow = true;
    scene.add(catcher);
  }
}

const loader = new GLTFLoader();
function prepare(root, nameOverride) {
  root.scale.setScalar(RENDER.model.unitScale ?? 1);
  root.traverse((o) => {
    if (!o.isMesh) return;
    if (nameOverride) o.userData.name = nameOverride;
    o.material = makeMaterial(o);
    o.castShadow = o.receiveShadow = !!RENDER.shadows?.enabled;
  });
  return root;
}

// Separate parts placed on the car from config/render.js `extraModels`
// (e.g. a helmet kept in its own Part Studio).
function loadExtra(x) {
  loader.load(x.file, (gltf) => {
    const holder = new THREE.Group();
    holder.add(prepare(gltf.scene, x.name));
    holder.rotation.set(...(x.rotation ?? [0, 0, 0]).map(deg));
    // Sit the part's bottom-centre on the `position` point.
    const pivot = new THREE.Group();
    pivot.add(holder);
    const b = new THREE.Box3().setFromObject(pivot);
    const c = b.getCenter(new THREE.Vector3());
    holder.position.set(-c.x, -c.y, -b.min.z);
    pivot.position.set(...x.position);
    pivot.scale.setScalar(x.scale ?? 1);
    model.add(pivot);
    renderer.shadowMap.needsUpdate = true;
  }, undefined, (err) => console.error(`Couldn't load ${x.file}`, err));
}

loader.load(
  RENDER.model.file,
  (gltf) => {
    model = new THREE.Group(); // car + any extra parts
    model.add(prepare(gltf.scene));
    scene.add(model);
    (RENDER.extraModels ?? []).filter((x) => x.enabled !== false).forEach(loadExtra);
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    // Keep shadow-casting lights aimed at the car, wherever their position is.
    for (const { light, cfg } of shadowLights) {
      if (!cfg.target && light.target) light.target.position.copy(centre);
    }
    buildFloor(box);
    // Car and lights never move, so the shadow only needs drawing once (halves GPU work).
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    app.model = model;
    app.bounds = box;
    renderer.compile(scene, camera);
    requestAnimationFrame(() => $('loader').classList.add('is-done'));
    document.documentElement.classList.add('model-ready');
  },
  (e) => {
    if (!e.total) return;
    const pct = Math.round((e.loaded / e.total) * 100);
    $('loader-fill').style.width = `${pct}%`;
    $('loader-pct').textContent = `${pct}%`;
  },
  (err) => {
    console.error(err);
    $('loader-pct').textContent = `Couldn't load ${RENDER.model.file}. Check the path in config/render.js.`;
  },
);

// ------------------------------------------------------------------ loop
const app = {
  THREE, scene, camera, renderer, canvas, stops, model: null, bounds: null,
  freeCam: false,          // true while the ?edit orbit controls own the camera
  previewStop: null,       // force a popup to show (edit mode)
  stopPose, applyPose, applyShift, poseFromCamera, goToStop,
  get pose() { return cur; },
  set pose(v) { cur = v; },
  onFrame: null,
};

// ?stop=<id> opens the page at that section, e.g. /?stop=team
// Add &still to freeze it there with no animation (for screenshots / portfolio images).
const startStop = stops.find((s) => s.id === PARAMS.get('stop'));
const STILL = startStop && PARAMS.has('still');
if (STILL) document.documentElement.classList.add('still');
if (startStop && !STILL) {
  history.scrollRestoration = 'manual';
  scrollTo(0, (startStop.start + startStop.hold / 2) * unit);
}

let cur = null;
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const p = STILL ? startStop.start + startStop.hold / 2 : scrollY / unit;
  if (!app.freeCam) {
    const want = poseAt(p);
    const k = REDUCED_MOTION ? 1 : 1 - Math.exp(-dt / Math.max(D.smoothing, 0.001));
    cur = cur ? lerpPose(cur, want, k) : want;
    applyPose(cur);
  }
  app.onFrame?.(dt);
  updateUI(p, app.previewStop ?? undefined);
  renderer.render(scene, camera);
});

if (EDIT) {
  window.app = app; // for poking around in the browser console
  import('./editor.js').then((m) => m.startEditor(app));
}

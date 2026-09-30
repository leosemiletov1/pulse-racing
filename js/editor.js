// Camera tuning tool: open the site with ?edit on the end of the URL.
//   Orbit: left-drag   Pan: right-drag   Zoom: wheel
//   Click the car      -> copy an `anchor` point for the popup pin
//   Double-click car   -> orbit around that point
//   "Copy camera"      -> paste over a stop's camera line in config/tour.js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const r1 = (v) => Math.round(v * 10) / 10;

export function startEditor(app) {
  const { THREE, camera, canvas, stops } = app;

  const css = document.createElement('style');
  css.textContent = `
    .ed { position: fixed; left: 16px; top: 64px; z-index: 40; width: 300px; padding: 14px; font: 13px/1.4 ui-monospace, Consolas, monospace;
      color: #e8ecf3; background: rgba(14,16,22,.94); border: 1px solid rgba(255,255,255,.14); border-radius: 10px; }
    .ed h3 { margin: 0 0 8px; font: 700 12px/1 system-ui; letter-spacing: .15em; text-transform: uppercase; color: var(--accent); }
    .ed label { display: flex; align-items: center; gap: 8px; margin: 6px 0; }
    .ed select, .ed input[type=range] { flex: 1; }
    .ed select { background: #0b0d12; color: inherit; border: 1px solid #333; border-radius: 6px; padding: 4px; }
    .ed pre { margin: 8px 0; padding: 8px; background: #07080b; border-radius: 6px; white-space: pre-wrap; word-break: break-all; font-size: 12px; }
    .ed button { cursor: pointer; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--accent); background: transparent; color: #fff; font: 600 12px system-ui; }
    .ed button:hover { background: var(--accent); }
    .ed small { color: #8b93a3; display: block; margin-top: 8px; }
    .ed .row { display: flex; gap: 6px; flex-wrap: wrap; }
  `;
  document.head.append(css);

  const panel = document.createElement('div');
  panel.className = 'ed';
  panel.innerHTML = `
    <h3>Camera editor</h3>
    <label><input type="checkbox" id="ed-free"> Free camera (orbit)</label>
    <label>Stop <select id="ed-stop"><option value="">— follow scroll —</option>${stops
      .map((s, i) => `<option value="${i}">${i + 1}. ${s.label ?? s.id}</option>`).join('')}</select></label>
    <label>FOV <input type="range" id="ed-fov" min="10" max="70" step="1"><span id="ed-fov-v"></span></label>
    <pre id="ed-cam"></pre>
    <div class="row"><button id="ed-copy-cam">Copy camera</button></div>
    <pre id="ed-anchor">Click the car to pick an anchor point</pre>
    <div class="row"><button id="ed-copy-anchor">Copy anchor</button></div>
    <small>Drag to orbit, right-drag to pan, wheel to zoom. Double-click the car to orbit around that spot.
    Paste into config/tour.js, save, refresh.</small>`;
  document.body.append(panel);
  const q = (id) => panel.querySelector(id);

  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.zoomToCursor = true;

  function setFree(on) {
    q('#ed-free').checked = on;
    controls.enabled = on;
    if (on && !app.freeCam) controls.target.set(...(app.pose?.target ?? [0, 0, 0]));
    if (!on && app.freeCam) {
      // Hand the current view back to the scroll animation so it glides home.
      app.pose = { ...app.poseFromCamera(controls.target), shift: app.pose?.shift ?? [0, 0] };
      app.previewStop = null;
      q('#ed-stop').value = '';
    }
    app.freeCam = on;
  }
  q('#ed-free').addEventListener('change', (e) => setFree(e.target.checked));

  q('#ed-stop').addEventListener('change', (e) => {
    if (e.target.value === '') return setFree(false);
    const i = +e.target.value;
    const pose = app.stopPose(stops[i]);
    setFree(true);
    app.applyPose(pose);
    app.pose = pose;
    controls.target.set(...pose.target);
    app.previewStop = i;
  });

  q('#ed-fov').addEventListener('input', (e) => {
    if (!app.freeCam) setFree(true);
    camera.fov = +e.target.value;
    camera.updateProjectionMatrix();
  });

  let camText = '';
  let anchorText = '';
  const copy = (text, btn) => {
    const done = () => { const t = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => (btn.textContent = t), 900); };
    navigator.clipboard?.writeText(text).then(done, () => prompt('Copy this:', text)) ?? prompt('Copy this:', text);
  };
  q('#ed-copy-cam').addEventListener('click', (e) => copy(camText, e.target));
  q('#ed-copy-anchor').addEventListener('click', (e) => copy(anchorText, e.target));

  // ---- picking points on the car
  const ray = new THREE.Raycaster();
  const marker = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12), new THREE.MeshBasicMaterial({ color: 0xff3366, depthTest: false }));
  marker.renderOrder = 10;
  marker.visible = false;
  app.scene.add(marker);

  function pick(ev) {
    if (!app.model) return null;
    const r = canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camera);
    return ray.intersectObject(app.model, true)[0]?.point ?? null;
  }
  let down = null;
  canvas.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
    const p = pick(e);
    if (!p) return;
    marker.position.copy(p);
    marker.visible = true;
    anchorText = `anchor: [${r1(p.x)}, ${r1(p.y)}, ${r1(p.z)}],`;
    q('#ed-anchor').textContent = anchorText;
  });
  canvas.addEventListener('dblclick', (e) => {
    const p = pick(e);
    if (!p) return;
    setFree(true);
    controls.target.copy(p);
  });

  // ---- live readout
  const target = new THREE.Vector3();
  app.onFrame = () => {
    if (app.freeCam) controls.update();
    target.copy(app.freeCam ? controls.target : new THREE.Vector3(...(app.pose?.target ?? [0, 0, 0])));
    const p = app.poseFromCamera(target);
    camText = `camera: { target: [${p.target.map(r1).join(', ')}], azimuth: ${r1(p.azimuth)}, elevation: ${r1(p.elevation)}, distance: ${Math.round(p.distance)}, fov: ${Math.round(p.fov)} },`;
    q('#ed-cam').textContent = camText;
    q('#ed-fov-v').textContent = Math.round(camera.fov);
    if (document.activeElement !== q('#ed-fov')) q('#ed-fov').value = camera.fov;
  };
}

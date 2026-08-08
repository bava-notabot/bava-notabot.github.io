/* ============================================
   R BAVADHARANI — PORTFOLIO
   3D Hero Background — Three.js
   A full-bleed animated network field that fills
   the entire hero rectangle edge to edge, like a
   living backdrop rather than a floating object.
   ============================================ */

(function () {
  const container = document.getElementById('hero-canvas');
  if (!container || typeof THREE === 'undefined') return;

  try {

  const COLOR_INDIGO = 0x6366f1;
  const COLOR_CYAN = 0x06b6d4;
  const COLOR_VIOLET = 0x818cf8;

  let W = container.clientWidth;
  let H = container.clientHeight;

  /* ---------- renderer / scene / camera ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 200);
  camera.position.set(0, 0, 26);
  camera.lookAt(0, 0, 0);

  /* ---------- lighting ---------- */
  const ambient = new THREE.AmbientLight(0x404060, 1.4);
  scene.add(ambient);

  /* ---------- full-bleed node field ---------- */
  const FIELD_W = 60;
  const FIELD_H = 34;
  const LAYERS = 3;
  const NODES_PER_LAYER = 70;

  const allNodes = [];
  const nodeGroup = new THREE.Group();
  scene.add(nodeGroup);

  const nodeGeo = new THREE.SphereGeometry(0.045, 8, 8);

  for (let layer = 0; layer < LAYERS; layer++) {
    const z = -layer * 6;
    const scaleFactor = 1 + layer * 0.35;
    const depthOpacity = 1 - layer * 0.28;

    for (let i = 0; i < NODES_PER_LAYER; i++) {
      const x = (Math.random() - 0.5) * FIELD_W * scaleFactor;
      const y = (Math.random() - 0.5) * FIELD_H * scaleFactor;

      const roll = Math.random();
      const color = roll < 0.15 ? COLOR_CYAN : roll < 0.3 ? COLOR_VIOLET : COLOR_INDIGO;

      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85 * depthOpacity
      });
      const node = new THREE.Mesh(nodeGeo, mat);
      node.position.set(x, y, z);
      node.userData = {
        baseX: x,
        baseY: y,
        baseZ: z,
        driftSeed: Math.random() * Math.PI * 2,
        driftSpeed: 0.15 + Math.random() * 0.25,
        driftAmp: 0.4 + Math.random() * 0.6,
        layer
      };
      nodeGroup.add(node);
      allNodes.push(node);
    }
  }

  /* ---------- connecting lines: nearest-neighbor within each layer ---------- */
  const lineGroup = new THREE.Group();
  scene.add(lineGroup);

  const lineSegments = [];
  const MAX_CONNECT_DIST = 5.2;

  function buildConnections() {
    lineSegments.forEach((l) => {
      lineGroup.remove(l);
      l.geometry.dispose();
    });
    lineSegments.length = 0;

    for (let layer = 0; layer < LAYERS; layer++) {
      const layerNodes = allNodes.filter((n) => n.userData.layer === layer);
      const positions = [];

      for (let i = 0; i < layerNodes.length; i++) {
        for (let j = i + 1; j < layerNodes.length; j++) {
          const a = layerNodes[i].position;
          const b = layerNodes[j].position;
          const d = a.distanceTo(b);
          if (d < MAX_CONNECT_DIST) {
            positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          }
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: layer === 0 ? COLOR_INDIGO : COLOR_VIOLET,
        transparent: true,
        opacity: layer === 0 ? 0.22 : 0.12 - layer * 0.02
      });
      const lines = new THREE.LineSegments(geo, mat);
      lineGroup.add(lines);
      lineSegments.push(lines);
    }
  }
  buildConnections();

  let connectTimer = 0;
  const CONNECT_REBUILD_INTERVAL = 0.6;

  /* ---------- traveling pulse packets across layer-0 connections ---------- */
  const PULSE_COUNT = 10;
  const pulses = [];
  const pulseGeo = new THREE.SphereGeometry(0.07, 8, 8);

  function pickLayer0Pair() {
    const layer0 = allNodes.filter((n) => n.userData.layer === 0);
    const a = layer0[Math.floor(Math.random() * layer0.length)];
    let b = layer0[Math.floor(Math.random() * layer0.length)];
    let tries = 0;
    while (a.position.distanceTo(b.position) > 9 && tries < 10) {
      b = layer0[Math.floor(Math.random() * layer0.length)];
      tries++;
    }
    return [a, b];
  }

  function makePulse() {
    const [a, b] = pickLayer0Pair();
    const color = Math.random() < 0.5 ? COLOR_CYAN : COLOR_INDIGO;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(pulseGeo, mat);
    scene.add(mesh);
    return { mesh, a, b, progress: Math.random(), speed: 0.25 + Math.random() * 0.25 };
  }

  for (let i = 0; i < PULSE_COUNT; i++) pulses.push(makePulse());

  /* ---------- starfield (very faint, far back) ---------- */
  const STAR_COUNT = 400;
  const starGeo = new THREE.BufferGeometry();
  const starPositions = new Float32Array(STAR_COUNT * 3);
  for (let i = 0; i < STAR_COUNT; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 90;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 55;
    starPositions[i * 3 + 2] = -25 - Math.random() * 30;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x8a90c0,
    size: 0.05,
    transparent: true,
    opacity: 0.35,
    sizeAttenuation: true
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  /* ---------- resize: keep field covering full rectangle at any ratio ---------- */
  function onResize() {
    W = container.clientWidth;
    H = container.clientHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  }
  window.addEventListener('resize', onResize);

  /* ---------- mouse parallax ---------- */
  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ---------- animation loop ---------- */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    allNodes.forEach((n) => {
      const u = n.userData;
      n.position.x = u.baseX + Math.sin(elapsed * u.driftSpeed + u.driftSeed) * u.driftAmp;
      n.position.y = u.baseY + Math.cos(elapsed * u.driftSpeed * 0.8 + u.driftSeed) * u.driftAmp;
    });

    allNodes.forEach((n, i) => {
      const base = 0.55 + (1 - n.userData.layer * 0.28) * 0.3;
      n.material.opacity = base + Math.sin(elapsed * 1.6 + i) * 0.15;
    });

    connectTimer += delta;
    if (connectTimer > CONNECT_REBUILD_INTERVAL) {
      buildConnections();
      connectTimer = 0;
    }

    pulses.forEach((p) => {
      p.progress += delta * p.speed * 0.3;
      let opacity = 1;
      if (p.progress < 0.1) opacity = p.progress / 0.1;
      else if (p.progress > 0.9) opacity = (1 - p.progress) / 0.1;
      p.mesh.material.opacity = Math.max(0, Math.min(1, opacity));
      p.mesh.position.lerpVectors(p.a.position, p.b.position, Math.min(1, p.progress));

      if (p.progress >= 1) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        const fresh = makePulse();
        Object.assign(p, fresh, { progress: 0 });
      }
    });

    camera.position.x += (mouseX * 1.4 - camera.position.x) * 0.025;
    camera.position.y += (-mouseY * 0.9 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, -8);

    stars.position.x = Math.sin(elapsed * 0.02) * 1.5;

    renderer.render(scene, camera);
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    renderer.render(scene, camera);
  } else {
    animate();
  }

  } catch (err) {
    /* 3D scene failed for any reason (WebGL unsupported, CDN
       blocked, etc.) — remove the canvas container so it doesn't
       sit there empty/broken. The hero still works fine without it. */
    console.error('Hero 3D scene failed to initialize:', err);
    if (container && container.parentNode) {
      container.innerHTML = '';
    }
  }
})();

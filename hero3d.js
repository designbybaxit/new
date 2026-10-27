/* ============================================================
   Design by Baxit — soft 3D hero (Three.js, CDN) for redesign-light

   A small cluster of glossy, clay-like pastel shapes (sphere, torus,
   capsule, coin, and an indigo accent bead) that float gently, lean
   toward the pointer, and swell slightly when hovered. Lit by a soft
   studio environment generated in code (no extra downloads). Pauses
   off-screen / in hidden tabs, renders one still frame under
   prefers-reduced-motion. If anything fails, the CSS fallback stays.
   ============================================================ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const mount = document.querySelector('[data-hero3d]');
const hero = mount && mount.closest('.hero');
const variant = mount ? (mount.dataset.hero3d || 'home') : 'home';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => innerWidth < 1024;

if (mount && hero) {
  try { init(); } catch (err) { console.warn('[hero3d] disabled:', err); }
}

/* Soft "photo studio" environment: a pale gradient dome with a few
   bright softboxes, pre-filtered with PMREM for glossy reflections. */
function studioEnv(renderer) {
  const env = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y*0.5+0.5; vec3 top = vec3(1.0,0.99,1.0); vec3 bot = vec3(0.80,0.80,0.92); gl_FragColor = vec4(mix(bot, top, smoothstep(0.0,1.0,h)), 1.0); }',
    })
  );
  env.add(dome);
  const box = (w, h, x, y, z, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(i, i, i), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  box(10, 6, 6, 9, 6, 4.5);    // key softbox, top right
  box(8, 4, -9, 3, 4, 2.2);    // fill, left
  box(12, 2, 0, -2, -12, 1.6); // rim, behind
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(env, 0.035);
  pm.dispose();
  return rt.texture;
}

/* Soft contact shadow texture (radial falloff) */
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(40,36,110,0.38)'); grd.addColorStop(0.55, 'rgba(40,36,110,0.12)'); grd.addColorStop(1, 'rgba(40,36,110,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmall() ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 13);

  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 6); scene.add(key);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d6f5, 0.55));

  const rig = new THREE.Group(); scene.add(rig);
  const cluster = new THREE.Group(); rig.add(cluster);

  const clay = (color, rough = 0.42) => new THREE.MeshPhysicalMaterial({
    color, roughness: rough, metalness: 0, clearcoat: 0.85, clearcoatRoughness: 0.22, sheen: 0.6, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.6,
  });

  const seg = isSmall() ? 48 : 72;
  const defs = variant === 'home' ? [
    { geo: new THREE.SphereGeometry(1.05, seg, seg / 2), mat: clay('#aaa2ff'), pos: [-0.35, 0.25, 0], rot: [0, 0, 0], spd: 0.55, amp: 0.14 },
    { geo: new THREE.TorusGeometry(0.62, 0.27, 40, 96), mat: clay('#ffb790'), pos: [1.25, -0.85, 0.6], rot: [1.0, 0.4, 0.3], spd: 0.7, amp: 0.18, spin: [0.15, 0.22, 0] },
    { geo: new THREE.CapsuleGeometry(0.3, 0.85, 12, 36), mat: clay('#8edbbd'), pos: [1.35, 1.15, -0.4], rot: [0.3, 0, -0.75], spd: 0.62, amp: 0.16, spin: [0, 0.18, 0] },
    { geo: new THREE.CylinderGeometry(0.5, 0.5, 0.18, 64, 1), mat: clay('#8fc4ff'), pos: [-1.55, -1.1, 0.5], rot: [1.15, 0.2, 0.35], spd: 0.8, amp: 0.15, spin: [0, 0, 0.25] },
    { geo: new THREE.SphereGeometry(0.32, 48, 24), mat: clay('#4f46e5', 0.28), pos: [0.55, 1.35, 0.9], rot: [0, 0, 0], spd: 0.9, amp: 0.2 },
    { geo: new THREE.SphereGeometry(0.2, 32, 16), mat: clay('#ffd66b', 0.35), pos: [-1.6, 1.25, -0.6], rot: [0, 0, 0], spd: 1.0, amp: 0.2 },
  ] : [
    { geo: new THREE.SphereGeometry(0.8, seg, seg / 2), mat: clay('#aaa2ff'), pos: [0, 0.2, 0], rot: [0, 0, 0], spd: 0.55, amp: 0.12 },
    { geo: new THREE.TorusGeometry(0.45, 0.2, 32, 80), mat: clay('#ffb790'), pos: [0.95, -0.7, 0.5], rot: [1.0, 0.4, 0.3], spd: 0.7, amp: 0.15, spin: [0.15, 0.22, 0] },
    { geo: new THREE.SphereGeometry(0.26, 40, 20), mat: clay('#4f46e5', 0.28), pos: [-0.9, -0.75, 0.6], rot: [0, 0, 0], spd: 0.9, amp: 0.16 },
  ];

  const shapes = defs.map((d, i) => {
    const m = new THREE.Mesh(d.geo, d.mat);
    m.position.set(...d.pos); m.rotation.set(...d.rot);
    m.userData = { base: new THREE.Vector3(...d.pos), rot0: new THREE.Euler(...d.rot), spd: d.spd, amp: d.amp, spin: d.spin || [0, 0, 0], ph: i * 1.7, s: 1, sT: 1 };
    cluster.add(m); return m;
  });

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, variant === 'home' ? -2.05 : -1.45, 0);
  shadow.scale.set(variant === 'home' ? 5.2 : 3.4, variant === 'home' ? 2.2 : 1.5, 1);
  cluster.add(shadow);

  /* Place the cluster over a DOM target (.hero-space on home, right
     side on desktop subpages, top corner on mobile subpages). */
  function layout() {
    const w = mount.clientWidth || innerWidth, h = mount.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    const mr = mount.getBoundingClientRect();
    let cx, cy, size;
    const space = hero.querySelector('.hero-space');
    if (variant === 'home' && space && space.offsetHeight) {
      const r = space.getBoundingClientRect();
      cx = r.left + r.width / 2 - mr.left; cy = r.top + r.height / 2 - mr.top;
      size = Math.min(r.width, r.height * 1.1);
    } else if (!isSmall()) {
      cx = w * 0.84; cy = h * 0.5; size = Math.min(h * 0.6, 290);
    } else {
      cx = w - 40; cy = 70; size = 150;
    }
    rig.position.set((cx / w - 0.5) * visW, (0.5 - cy / h) * visH, 0);
    const worldPerPx = visH / h, unit = variant === 'home' ? 4.6 : 2.9;
    rig.scale.setScalar((size * worldPerPx) / unit);
  }
  layout();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { layout(); if (reduced) render(1.2); }, 120); });

  /* Pointer: cluster leans toward the cursor; hovered shape swells. */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(-9, -9);
  let pointerIn = false;
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = (e.clientY / innerHeight) * 2 - 1;
    const r = mount.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointerIn = e.clientY >= r.top && e.clientY <= r.bottom;
  }, { passive: true });

  let scrollP = 0;
  const onScroll = () => { const r = hero.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const clock = new THREE.Clock();
  let visible = true, raf = 0;
  function render(t) {
    cur.x += (target.x - cur.x) * 0.04; cur.y += (target.y - cur.y) * 0.04;
    cluster.rotation.y = cur.x * 0.35 + Math.sin(t * 0.2) * 0.06;
    cluster.rotation.x = cur.y * 0.18;
    cluster.position.y = scrollP * 0.9;

    let hit = null;
    if (pointerIn && !reduced) {
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(shapes, false);
      hit = hits.length ? hits[0].object : null;
    }
    shapes.forEach((m) => {
      const u = m.userData;
      m.position.x = u.base.x + cur.x * 0.12 * (1 + u.base.z);
      m.position.y = u.base.y + Math.sin(t * u.spd + u.ph) * u.amp - cur.y * 0.08 * (1 + u.base.z);
      m.rotation.x = u.rot0.x + t * u.spin[0] + Math.sin(t * 0.4 + u.ph) * 0.08;
      m.rotation.y = u.rot0.y + t * u.spin[1];
      m.rotation.z = u.rot0.z + t * u.spin[2];
      u.sT = m === hit ? 1.12 : 1;
      u.s += (u.sT - u.s) * 0.08;
      m.scale.setScalar(u.s);
    });
    renderer.render(scene, camera);
  }
  function loop() { raf = requestAnimationFrame(loop); render(clock.getElapsedTime()); }
  function start() { if (!raf && visible && !document.hidden) loop(); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  if (reduced) {
    render(1.2);
  } else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); hero.classList.remove('webgl-on'); mount.classList.remove('is-ready'); });
  requestAnimationFrame(() => { mount.classList.add('is-ready'); hero.classList.add('webgl-on'); });
}

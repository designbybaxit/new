/* ============================================================
   Design by Baxit — playful 3D hero (Three.js, CDN) for redesign-bold

   Glossy candy-coloured blobs that wobble (GPU vertex displacement),
   a donut, a squiggle, a chunky star and a bouncing ball. Everything
   springs toward the pointer with overshoot, hovered pieces jiggle
   and swell, and a click/tap on the hero makes them all "boing".
   Lit by a colourful in-code studio environment. Pauses off-screen /
   in hidden tabs; one still frame under prefers-reduced-motion. If
   anything fails, the CSS blob fallback stays visible.
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

function studioEnv(renderer) {
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(
    new THREE.SphereGeometry(20, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y*0.5+0.5; gl_FragColor = vec4(mix(vec3(1.0,0.86,0.72), vec3(1.0,0.98,0.95), smoothstep(0.1,0.9,h)), 1.0); }',
    })
  ));
  const panel = (w, h, x, y, z, c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(9, 6, 6, 9, 7, new THREE.Color(5, 5, 5));
  panel(6, 6, -10, 2, 2, new THREE.Color(0.4, 1.4, 3.0));   // blue fill
  panel(8, 3, 2, -6, -9, new THREE.Color(3.0, 0.6, 1.4));   // pink rim
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(env, 0.03).texture;
  pm.dispose();
  return tex;
}

/* Glossy candy material; blobs get GPU wobble via onBeforeCompile */
function candy(color, wobble) {
  const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 });
  if (wobble) {
    mat.userData.u = { uTime: { value: 0 }, uAmp: { value: wobble.amp }, uFreq: { value: wobble.freq }, uSeed: { value: wobble.seed } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, mat.userData.u);
      sh.vertexShader = 'uniform float uTime, uAmp, uFreq, uSeed;\n' +
        'vec3 wob(vec3 p){ vec3 q = p*uFreq + uSeed; float n = sin(q.x + uTime*1.3)*sin(q.y*1.2 + uTime*1.7)*sin(q.z*0.9 + uTime*1.1)' +
        ' + 0.5*sin(q.x*2.1 - uTime*2.0 + q.z*1.7); return p + normalize(p)*n*uAmp; }\n' + sh.vertexShader;
      sh.vertexShader = sh.vertexShader.replace('#include <beginnormal_vertex>', `
        vec3 nrm0 = normalize(position);
        vec3 tg = normalize(cross(nrm0, abs(nrm0.y) < 0.99 ? vec3(0.0,1.0,0.0) : vec3(1.0,0.0,0.0)));
        vec3 bt = normalize(cross(nrm0, tg));
        float rad = length(position);
        vec3 wp = wob(position);
        vec3 wt = wob(normalize(position + tg*0.02*rad)*rad);
        vec3 wb = wob(normalize(position + bt*0.02*rad)*rad);
        vec3 objectNormal = normalize(cross(wt - wp, wb - wp));
        if (dot(objectNormal, nrm0) < 0.0) objectNormal = -objectNormal;
      `);
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = wp;');
    };
  }
  return mat;
}

function starGeometry(r1, r2, depth) {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r2 : r1, a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 6, curveSegments: 4 });
  g.center(); return g;
}

function squiggleGeometry() {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push(new THREE.Vector3((t - 0.5) * 2.4, Math.sin(t * Math.PI * 3) * 0.32, Math.cos(t * Math.PI * 3) * 0.12)); }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.13, 20, false);
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmall() ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 13);
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(3, 6, 6); scene.add(key);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const rig = new THREE.Group(); scene.add(rig);
  const cluster = new THREE.Group(); rig.add(cluster);

  const seg = isSmall() ? 56 : 96;
  const blob = (r) => new THREE.SphereGeometry(r, seg, seg / 2);
  const home = variant === 'home';
  const defs = home ? [
    { geo: blob(1.0), mat: candy('#ff4f8b', { amp: 0.13, freq: 1.6, seed: 0.0 }), pos: [-0.2, 0.15, 0], k: 1.0 },
    { geo: blob(0.62), mat: candy('#3d5afe', { amp: 0.1, freq: 2.0, seed: 3.0 }), pos: [1.35, 1.05, -0.4], k: 1.3 },
    { geo: blob(0.5), mat: candy('#1fc98a', { amp: 0.09, freq: 2.2, seed: 6.0 }), pos: [-1.5, -1.0, 0.5], k: 1.5 },
    { geo: new THREE.TorusGeometry(0.48, 0.21, 32, 80), mat: candy('#ffd23f'), pos: [1.3, -0.95, 0.7], rot: [0.9, 0.3, 0], spin: [0.5, 0.7, 0], k: 1.2 },
    { geo: starGeometry(0.5, 0.24, 0.16), mat: candy('#ff7a2f'), pos: [-1.45, 1.2, 0.3], rot: [0, 0, 0.3], spin: [0, 0.9, 0.2], k: 1.4 },
    { geo: squiggleGeometry(), mat: candy('#8b5cf6'), pos: [0.15, -1.75, 0.4], rot: [0.2, 0, -0.15], spin: [0.6, 0, 0], k: 0.9, scale: 0.75 },
    { geo: new THREE.SphereGeometry(0.22, 32, 16), mat: candy('#ffd23f'), pos: [0.55, 1.6, 0.8], bounce: true, k: 1.6 },
  ] : [
    { geo: blob(0.75), mat: candy('#ff4f8b', { amp: 0.11, freq: 1.8, seed: 0.0 }), pos: [0, 0.15, 0], k: 1.0 },
    { geo: new THREE.TorusGeometry(0.36, 0.16, 28, 64), mat: candy('#3d5afe'), pos: [0.95, -0.65, 0.5], rot: [0.9, 0.3, 0], spin: [0.5, 0.7, 0], k: 1.3 },
    { geo: starGeometry(0.38, 0.18, 0.12), mat: candy('#1fc98a'), pos: [-0.95, -0.6, 0.4], spin: [0, 0.9, 0.2], k: 1.4 },
  ];

  const shapes = defs.map((d, i) => {
    const m = new THREE.Mesh(d.geo, d.mat);
    const sc = d.scale || 1;
    m.position.set(...d.pos); if (d.rot) m.rotation.set(...d.rot); m.scale.setScalar(sc);
    m.userData = {
      base: new THREE.Vector3(...d.pos), rot0: new THREE.Euler(...(d.rot || [0, 0, 0])), spin: d.spin || [0, 0.2, 0],
      k: d.k, ph: i * 1.3, bounce: !!d.bounce, sc,
      vel: new THREE.Vector3(), s: sc, sv: 0, jig: 0,
    };
    cluster.add(m); return m;
  });

  function layout() {
    const w = mount.clientWidth || innerWidth, h = mount.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    const mr = mount.getBoundingClientRect();
    let cx, cy, size;
    const space = hero.querySelector('.hero-space');
    if (home && space && space.offsetHeight) {
      const r = space.getBoundingClientRect();
      cx = r.left + r.width / 2 - mr.left; cy = r.top + r.height / 2 - mr.top; size = Math.min(r.width, r.height * 1.1);
    } else if (!isSmall()) {
      cx = w * 0.84; cy = h * 0.5; size = Math.min(h * 0.6, 290);
    } else {
      cx = w - 42; cy = 74; size = 150;
    }
    rig.position.set((cx / w - 0.5) * visW, (0.5 - cy / h) * visH, 0);
    rig.scale.setScalar((size * (visH / h)) / (home ? 4.4 : 2.9));
  }
  layout();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { layout(); if (reduced) render(1.0); }, 120); });

  const ptr = { x: 0, y: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(-9, -9);
  let pointerIn = false, hovered = null;
  addEventListener('pointermove', (e) => {
    ptr.x = (e.clientX / innerWidth) * 2 - 1; ptr.y = (e.clientY / innerHeight) * 2 - 1;
    const r = mount.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointerIn = e.clientY >= r.top && e.clientY <= r.bottom;
  }, { passive: true });
  hero.addEventListener('pointerdown', () => { shapes.forEach((m, i) => { m.userData.sv += 0.09 + i * 0.01; m.userData.jig = 1; }); });

  let scrollP = 0;
  const onScroll = () => { const r = hero.getBoundingClientRect(); scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height))); };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  const clock = new THREE.Clock();
  const tmp = new THREE.Vector3();
  let visible = true, raf = 0, last = 0;
  function render(t) {
    const dt = Math.min(0.05, t - last || 0.016); last = t;
    if (pointerIn && !reduced) {
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObjects(shapes, false);
      const h = hits.length ? hits[0].object : null;
      if (h && h !== hovered) { h.userData.sv += 0.06; h.userData.jig = 1; }
      hovered = h;
    } else hovered = null;

    cluster.rotation.y = Math.sin(t * 0.3) * 0.12 + ptr.x * 0.15;
    cluster.position.y = scrollP * 1.1;

    shapes.forEach((m) => {
      const u = m.userData;
      /* springy follow: target = base + pointer offset scaled by depth */
      tmp.set(u.base.x + ptr.x * 0.22 * u.k, u.base.y - ptr.y * 0.16 * u.k + Math.sin(t * 1.1 + u.ph) * 0.1, u.base.z);
      if (u.bounce) tmp.y = u.base.y - 0.2 + Math.abs(Math.sin(t * 2.6)) * 0.55;
      u.vel.addScaledVector(tmp.sub(m.position), 0.09 * u.k).multiplyScalar(0.84);
      m.position.add(u.vel);
      /* springy scale (squash on bounce, swell on hover) */
      const sT = u.sc * (m === hovered ? 1.18 : 1);
      u.sv += (sT - u.s) * 0.12; u.sv *= 0.82; u.s += u.sv;
      let sy = u.s, sxz = u.s;
      if (u.bounce) { const g = Math.abs(Math.sin(t * 2.6)); if (g < 0.18) { sy *= 0.8 + g; sxz *= 1.12 - g * 0.6; } }
      m.scale.set(sxz, sy, sxz);
      u.jig *= 0.94;
      m.rotation.x = u.rot0.x + t * u.spin[0] + Math.sin(t * 9) * 0.25 * u.jig;
      m.rotation.y = u.rot0.y + t * u.spin[1];
      m.rotation.z = u.rot0.z + t * u.spin[2] + Math.cos(t * 11) * 0.25 * u.jig;
      const mu = m.material.userData.u;
      if (mu) { mu.uTime.value = t; mu.uAmp.value += ((m === hovered ? 0.24 : 0.11) + u.jig * 0.15 - mu.uAmp.value) * 0.08; }
    });
    renderer.render(scene, camera);
  }
  function loop() { raf = requestAnimationFrame(loop); render(clock.getElapsedTime()); }
  function start() { if (!raf && visible && !document.hidden) loop(); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  if (reduced) {
    shapes.forEach((m) => m.position.copy(m.userData.base));
    render(1.0); render(1.0);
  } else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); hero.classList.remove('webgl-on'); mount.classList.remove('is-ready'); });
  requestAnimationFrame(() => { mount.classList.add('is-ready'); hero.classList.add('webgl-on'); });
}

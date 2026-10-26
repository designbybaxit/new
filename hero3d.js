/* ============================================================
   Design by Baxit — interactive glowing 3D hero (Three.js, CDN)

   A morphing neon core (noise-displaced icosphere with a fresnel
   glow shader), a wireframe shell, two orbit rings and a particle
   field. It follows the pointer, reacts to scroll, pauses when the
   hero is off-screen or the tab is hidden, and renders one still
   frame under prefers-reduced-motion. If anything fails the CSS orb
   fallback simply stays visible.
   ============================================================ */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const mount = document.querySelector('[data-hero3d]');
const hero = mount && mount.closest('.hero');
const variant = mount ? (mount.dataset.hero3d || 'home') : 'home';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isSmall = () => innerWidth < 1024;

if (mount) {
  try { init(); } catch (err) { console.warn('[hero3d] disabled:', err); }
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmall() ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  mount.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const rig = new THREE.Group();      // follows layout (position/scale)
  const spin = new THREE.Group();     // follows pointer + time
  rig.add(spin); scene.add(rig);

  /* ---- Core: noise-displaced sphere with neon fresnel ---- */
  const noise = `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }`;

  const coreUniforms = {
    uTime: { value: 0 }, uAmp: { value: 0.22 }, uHover: { value: 0 },
    uC1: { value: new THREE.Color('#22d3ee') }, uC2: { value: new THREE.Color('#8b5cf6') }, uC3: { value: new THREE.Color('#e879f9') },
  };
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, isSmall() ? 40 : 64),
    new THREE.ShaderMaterial({
      uniforms: coreUniforms, transparent: true,
      vertexShader: noise + `
        uniform float uTime, uAmp, uHover;
        varying vec3 vN; varying vec3 vView; varying float vD;
        void main(){
          float d = snoise(normal*1.6 + vec3(uTime*0.25)) * (uAmp + uHover*0.22);
          d += snoise(normal*4.0 - vec3(uTime*0.4)) * 0.05;
          vD = d;
          vec3 pos = position + normal*d;
          vec4 mv = modelViewMatrix*vec4(pos,1.0);
          vN = normalize(normalMatrix*normal); vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix*mv;
        }`,
      fragmentShader: `
        uniform vec3 uC1, uC2, uC3; uniform float uTime;
        varying vec3 vN; varying vec3 vView; varying float vD;
        void main(){
          float f = pow(1.0 - max(dot(vN, vView), 0.0), 2.2);
          float t = clamp(vD*1.8 + 0.5 + 0.15*sin(uTime*0.6 + vN.y*3.0), 0.0, 1.0);
          vec3 base = mix(uC1, uC2, smoothstep(0.0, 0.6, t));
          base = mix(base, uC3, smoothstep(0.55, 1.0, t));
          vec3 col = base*0.28 + base*f*1.9 + vec3(1.0)*pow(f,5.0)*0.6;
          // fine scanlines for a techy look
          float scan = 0.88 + 0.12*sin(gl_FragCoord.y*1.2 + uTime*6.0);
          gl_FragColor = vec4(col*scan, 0.92);
        }`,
    })
  );
  spin.add(core);

  /* ---- Wireframe shell ---- */
  const shell = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.05, 1)),
    new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  spin.add(shell);
  const shellDots = new THREE.Points(
    new THREE.IcosahedronGeometry(2.05, 1),
    new THREE.PointsMaterial({ color: 0xa5f3fc, size: 0.07, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  spin.add(shellDots);

  /* ---- Orbit rings ---- */
  const ringMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.012, 8, 160), ringMat(0x8b5cf6, 0.9));
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.008, 8, 160), ringMat(0xe879f9, 0.6));
  ring1.rotation.set(1.2, 0.3, 0); ring2.rotation.set(-0.9, 0.8, 0);
  const sat1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), ringMat(0xffffff, 1));
  const sat2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 16), ringMat(0xa5f3fc, 1));
  ring1.add(sat1); ring2.add(sat2);
  rig.add(ring1, ring2);

  /* ---- Halo glow behind the core ---- */
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: coreUniforms.uTime },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main(){ float d=distance(vUv,vec2(0.5)); float g=smoothstep(0.5,0.0,d);
          vec3 c=mix(vec3(0.13,0.83,0.93), vec3(0.55,0.36,0.96), 0.5+0.5*sin(uTime*0.5));
          gl_FragColor=vec4(c, pow(g,2.6)*0.55); }`,
    })
  );
  halo.position.z = -1.2;
  rig.add(halo);

  /* ---- Particle field ---- */
  const N = isSmall() ? 450 : 1100;
  const pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = 3.4 + Math.random() * 6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.6;
    pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    pos[i * 3 + 2] = r * Math.cos(ph) - 2;
    seed[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const particles = new THREE.Points(pGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: coreUniforms.uTime, uPR: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float aSeed; uniform float uTime, uPR; varying float vA; varying float vS;
      void main(){ vec3 p=position; p.y+=sin(uTime*0.3+aSeed*20.0)*0.25;
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
        gl_PointSize=(8.0+aSeed*14.0)*uPR/(-mv.z); vA=0.35+0.65*abs(sin(uTime*0.8+aSeed*40.0)); vS=aSeed; }`,
    fragmentShader: `varying float vA; varying float vS;
      void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard;
        vec3 c=mix(vec3(0.13,0.83,0.93), vec3(0.91,0.47,0.98), vS);
        gl_FragColor=vec4(c, smoothstep(0.5,0.0,d)*vA); }`,
  }));
  scene.add(particles);

  /* ---- Layout: right side on desktop home, centered elsewhere ---- */
  function layout() {
    const w = mount.clientWidth || innerWidth, h = mount.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visW = visH * camera.aspect;
    if (variant === 'home' && !isSmall()) {
      rig.position.set(visW * 0.24, 0, 0); rig.scale.setScalar(Math.min(1.05, visH / 7.2));
    } else if (variant === 'home') {
      rig.position.set(0, visH * 0.12, -1); rig.scale.setScalar(Math.min(0.95, visW / 6.2));
    } else {
      // subpages: off to the right on desktop, small and centred on mobile
      if (!isSmall()) { rig.position.set(visW * 0.44, -visH * 0.04, -1.5); rig.scale.setScalar(Math.min(0.75, visH / 7.5)); }
      else { rig.position.set(0, 0, -2.5); rig.scale.setScalar(Math.min(0.8, visW / 7)); }
    }
  }
  layout();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { layout(); if (reduced) render(0); }, 120); });

  /* ---- Pointer + scroll input ---- */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let hoverTarget = 0, lastMove = 0;
  addEventListener('pointermove', (e) => {
    target.x = (e.clientX / innerWidth) * 2 - 1;
    target.y = (e.clientY / innerHeight) * 2 - 1;
    hoverTarget = 1; lastMove = performance.now();
  }, { passive: true });
  let scrollP = 0;
  const onScroll = () => {
    const r = hero.getBoundingClientRect();
    scrollP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---- Render loop (paused when off-screen / hidden) ---- */
  const clock = new THREE.Clock();
  let visible = true, raf = 0;
  function render(t) {
    coreUniforms.uTime.value = t;
    cur.x += (target.x - cur.x) * 0.05; cur.y += (target.y - cur.y) * 0.05;
    if (performance.now() - lastMove > 1200) hoverTarget = 0;
    coreUniforms.uHover.value += (hoverTarget - coreUniforms.uHover.value) * 0.03;

    spin.rotation.y = t * 0.18 + cur.x * 0.7 + scrollP * 2.2;
    spin.rotation.x = t * 0.07 + cur.y * 0.45;
    shell.rotation.y = -t * 0.12; shellDots.rotation.y = -t * 0.12;
    ring1.rotation.z = t * 0.35; ring2.rotation.z = -t * 0.22;
    sat1.position.set(Math.cos(t * 0.9) * 2.7, Math.sin(t * 0.9) * 2.7, 0);
    sat2.position.set(Math.cos(-t * 0.6 + 2) * 3.1, Math.sin(-t * 0.6 + 2) * 3.1, 0);
    particles.rotation.y = t * 0.02 + cur.x * 0.15; particles.rotation.x = cur.y * 0.08;
    camera.position.x = cur.x * 0.35; camera.position.y = -cur.y * 0.25 + scrollP * 1.2;
    camera.lookAt(rig.position.x * 0.3, scrollP * 0.8, 0);
    renderer.render(scene, camera);
  }
  function loop() { raf = requestAnimationFrame(loop); render(clock.getElapsedTime()); }
  function start() { if (!raf && visible && !document.hidden) loop(); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  if (reduced) {
    render(1.5);
  } else {
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    start();
  }
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); hero.classList.remove('webgl-on'); mount.classList.remove('is-ready'); });

  requestAnimationFrame(() => { mount.classList.add('is-ready'); hero.classList.add('webgl-on'); });
}

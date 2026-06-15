/* ============================================================
   Adnan Abdul Salam — Portfolio interactions
   1) Three.js hero: a glowing NEURAL / DATA NETWORK — drifting
      gold nodes linked like a constellation (modern tech vibe).
   2) Sticky-nav  3) Scroll-reveal  4) Stat count-up.
   Uses the global THREE (r128) so it runs from file:// too.
   ============================================================ */

/* ---------- 1. Three.js hero: neural network ---------- */
(function initHero() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 14;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const GOLD = new THREE.Color("#e8b53e");
  const GOLD_BRIGHT = new THREE.Color("#ffd87a");
  const CORE_HOT = new THREE.Color("#fff2cf");

  const glowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d");
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,228,160,1)");
    g.addColorStop(0.28, "rgba(232,181,62,0.8)");
    g.addColorStop(1, "rgba(232,181,62,0)");
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const group = new THREE.Group();
  scene.add(group);

  /* --- node cloud inside a soft sphere region --- */
  const N = 56, REGION = 4.6, LINK = 2.3;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    // random point inside a sphere (rejection-free via cube-root radius)
    const u = Math.random(), v = Math.random(), w = Math.random();
    const r = REGION * Math.cbrt(Math.random());
    const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
    nodes.push(new THREE.Vector3(
      Math.sin(ph) * Math.cos(th) * r,
      Math.cos(ph) * r * 1.05,
      Math.sin(ph) * Math.sin(th) * r
    ));
  }

  /* --- links between nearby nodes (constellation/neural mesh) --- */
  const linePts = [];
  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (nodes[i].distanceTo(nodes[j]) < LINK) {
        linePts.push(nodes[i], nodes[j]);
      }
    }
  }
  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(linePts),
    new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22 })
  ));

  /* --- glowing nodes + bright cores --- */
  const glowGeo = new THREE.BufferGeometry().setFromPoints(nodes);
  const glowMat = new THREE.PointsMaterial({
    map: glowTex, color: GOLD_BRIGHT, size: 0.58, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.6, depthWrite: false,
  });
  group.add(new THREE.Points(glowGeo, glowMat));
  const glowMat2 = new THREE.PointsMaterial({
    map: glowTex, color: GOLD, size: 1.5, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.12, depthWrite: false,
  });
  group.add(new THREE.Points(glowGeo, glowMat2));
  const coreMat = new THREE.MeshBasicMaterial({ color: CORE_HOT });
  nodes.forEach((n) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.052, 8, 8), coreMat);
    s.position.copy(n); group.add(s);
  });

  /* --- drifting particle field --- */
  const COUNT = 380;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT * 3; i++) pos[i] = (Math.random() - 0.5) * 48;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const field = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: GOLD, size: 0.05, transparent: true, opacity: 0.16 }));
  scene.add(field);

  /* --- interaction & motion --- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / window.innerWidth - 0.5;
    mouse.ty = e.clientY / window.innerHeight - 0.5;
  });

  const targetOffsetX = () => (window.innerWidth > 1200 ? 7.2 : window.innerWidth > 860 ? 5.4 : 0);

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const sway = reduce ? 0 : 1;
    group.position.x = targetOffsetX();
    group.position.y = Math.sin(t * 0.5) * 0.12 * sway;
    group.rotation.y = t * 0.1 * sway + mouse.x * 0.5;
    group.rotation.x = -mouse.y * 0.22 + Math.sin(t * 0.4) * 0.05 * sway;

    const pulse = reduce ? 1 : (1 + Math.sin(t * 1.6) * 0.15);
    glowMat.size = 0.54 * pulse;
    glowMat.opacity = reduce ? 0.5 : 0.45 + Math.abs(Math.sin(t * 1.6)) * 0.2;
    glowMat2.opacity = reduce ? 0.12 : 0.10 + Math.abs(Math.sin(t * 1.6 + 0.5)) * 0.08;

    field.rotation.y = t * 0.02 * sway;
    field.position.y = Math.sin(t * 0.1) * 0.4;

    camera.position.x += (mouse.x * 0.12 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 0.25 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

/* ---------- 2. Nav scroll state ---------- */
(function initNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ---------- 3. Scroll reveal ---------- */
(function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-in")); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((entry, i) => {
      if (entry.isIntersecting) { setTimeout(() => entry.target.classList.add("is-in"), (i % 6) * 70); io.unobserve(entry.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  items.forEach((el) => io.observe(el));
})();

/* ---------- 4. Stat count-up ---------- */
(function initCounters() {
  const nums = document.querySelectorAll(".stat__num[data-count]");
  if (!nums.length) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const run = (el) => {
    const target = parseFloat(el.dataset.count);
    const m = el.textContent.trim().match(/^(\D*)(\d[\d.]*)(\D*)$/);
    const pre = m ? m[1] : "", suf = m ? m[3] : "";
    if (reduce || isNaN(target)) return;
    const dur = 1300, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = pre + Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.5 });
  nums.forEach((el) => io.observe(el));
})();

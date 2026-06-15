/* ============================================================
   Adnan Abdul Salam — Portfolio interactions
   1) Three.js hero: a refined, faceted 3D stag-head emblem with
      a mature branching antler rack, built from slim gold tubes.
   2) Sticky-nav state on scroll.
   3) Scroll-reveal for sections (IntersectionObserver).
   Uses the global THREE (r128) so it runs from file:// too.
   ============================================================ */

/* ---------- 1. Three.js hero: refined 3D stag emblem ---------- */
(function initHero() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 13;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const GOLD = new THREE.Color("#e8b53e");
  const GOLD_BRIGHT = new THREE.Color("#ffd87a");
  const CORE_HOT = new THREE.Color("#fff2cf");
  const mat = new THREE.MeshBasicMaterial({ color: GOLD });
  const coreMat = new THREE.MeshBasicMaterial({ color: CORE_HOT }); // hot lit node cores

  // soft radial sprite → glowing circuit nodes
  const glowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const x = c.getContext("2d");
    const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,228,160,1)");
    grd.addColorStop(0.28, "rgba(232,181,62,0.8)");
    grd.addColorStop(1, "rgba(232,181,62,0)");
    x.fillStyle = grd; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const S = 0.68, CY = 1.1, R = 0.034; // scale, vertical centre, stroke radius (slimmer = circuit traces)
  const group = new THREE.Group();
  scene.add(group);

  // points: [x, y] or [x, y, z]  (z gives the emblem real depth)
  const P = {
    // --- centre line (x = 0) ---
    c_crown:   [0,  1.90, 0.10],
    c_brow:    [0,  1.05, 0.25],
    c_eyes:    [0,  0.50, 0.32],
    c_noseTop: [0, -0.20, 0.55],
    c_noseTip: [0, -1.70, 1.05],
    c_chin:    [0, -3.45, 0.70],
    // --- right face ---
    r_crownSide: [1.10, 1.70, 0.05],
    r_brow:      [1.32, 0.95, 0.12],
    r_eyeTop:    [0.95, 0.62, 0.18],
    r_eyeBot:    [0.66, 0.30, 0.22],
    r_cheekHigh: [1.58, 0.45, 0.00],
    r_cheekLow:  [1.26, -0.55, 0.20],
    r_jaw:       [0.86, -1.70, 0.42],
    r_muzzle:    [0.54, -1.55, 0.72],
    // --- right ear ---
    r_earIn:  [1.18, 1.32, -0.05],
    r_earTip: [2.18, 1.18, -0.16],
    r_earLow: [1.46, 0.60, -0.05],
    // --- right antler beam ---
    ab0: [0.98, 1.95, 0.05], ab1: [1.55, 2.65, 0.00], ab2: [1.95, 3.45, -0.05],
    ab3: [2.12, 4.35, -0.05], ab4: [1.98, 5.25, 0.02], ab5: [2.28, 6.00, 0.06],
    // --- right antler tines ---
    t_brow: [0.98, 3.35, 0.34], t_bez: [2.92, 3.60, -0.04], t_trez: [3.06, 4.55, -0.04],
    t_cIn: [1.40, 5.80, 0.05], t_cMid: [2.58, 5.70, 0.00], t_cTip: [2.62, 6.40, 0.06],
  };
  const E = [
    // forehead / crown
    ["c_crown","r_crownSide"], ["c_crown","c_brow"], ["r_crownSide","c_brow"],
    ["r_crownSide","r_brow"], ["c_brow","r_brow"], ["c_brow","c_eyes"],
    // eyes
    ["c_brow","r_eyeTop"], ["r_brow","r_eyeTop"], ["r_brow","r_cheekHigh"],
    ["r_eyeTop","r_eyeBot"], ["r_eyeTop","c_eyes"], ["r_eyeBot","c_eyes"],
    ["r_eyeBot","r_cheekHigh"], ["c_eyes","c_noseTop"], ["r_eyeBot","c_noseTop"],
    // cheek / jaw
    ["r_cheekHigh","r_cheekLow"], ["r_cheekLow","r_jaw"], ["r_cheekLow","c_noseTop"],
    ["r_cheekLow","r_muzzle"],
    // muzzle / nose / chin
    ["c_noseTop","c_noseTip"], ["r_muzzle","c_noseTip"], ["r_muzzle","c_noseTop"],
    ["r_jaw","r_muzzle"], ["r_jaw","c_chin"], ["c_noseTip","c_chin"], ["r_muzzle","c_chin"],
    // ears
    ["r_crownSide","r_earIn"], ["r_earIn","r_earTip"], ["r_earTip","r_earLow"],
    ["r_earLow","r_earIn"], ["r_earLow","r_cheekHigh"],
    // antler beam
    ["c_crown","ab0"], ["ab0","ab1"], ["ab1","ab2"], ["ab2","ab3"], ["ab3","ab4"], ["ab4","ab5"],
    // antler tines
    ["ab1","t_brow"], ["ab2","t_bez"], ["ab3","t_trez"],
    ["ab4","t_cIn"], ["ab4","t_cMid"], ["ab5","t_cTip"],
  ];

  const isRight = (n) => n.startsWith("r_") || n.startsWith("ab") || n.startsWith("t_");
  const toV = (p) => new THREE.Vector3(p[0] * S, (p[1] - CY) * S, (p[2] || 0) * S);
  const cap = (v) => {
    const s = new THREE.Mesh(new THREE.SphereGeometry(R * 1.25, 8, 8), coreMat);
    s.position.copy(v);
    group.add(s);
  };
  const seg = (v1, v2) => {
    const curve = new THREE.LineCurve3(v1, v2);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 1, R, 8, false), mat));
  };

  const usedKeys = new Set();
  for (const [n1, n2] of E) {
    const centerOnly = !isRight(n1) && !isRight(n2);
    const signs = centerOnly ? [1] : [1, -1];
    for (const s of signs) {
      const a = P[n1].slice(), b = P[n2].slice();
      if (isRight(n1)) a[0] *= s;
      if (isRight(n2)) b[0] *= s;
      seg(toV(a), toV(b));
      usedKeys.add(`${n1}|${isRight(n1) ? s : 1}`);
      usedKeys.add(`${n2}|${isRight(n2) ? s : 1}`);
    }
  }
  // bright node cores + collect positions for the glowing circuit nodes
  const nodePts = [];
  usedKeys.forEach((k) => {
    const [name, s] = k.split("|");
    const p = P[name].slice();
    if (isRight(name)) p[0] *= Number(s);
    const v = toV(p);
    cap(v);
    nodePts.push(v);
  });

  // glowing circuit-node halos (additive neon glow, pulses in animate())
  const glowGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
  // tight bright halo
  const glowMat = new THREE.PointsMaterial({
    map: glowTex, color: GOLD_BRIGHT, size: 0.34, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.55, depthWrite: false,
  });
  group.add(new THREE.Points(glowGeo, glowMat));
  // wide soft underglow (fake bloom) — second layer, offset phase
  const glowMat2 = new THREE.PointsMaterial({
    map: glowTex, color: GOLD, size: 0.95, sizeAttenuation: true,
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.16, depthWrite: false,
  });
  group.add(new THREE.Points(glowGeo, glowMat2));

  /* --- drifting particle field --- */
  const COUNT = 460;
  const pos = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT * 3; i++) pos[i] = (Math.random() - 0.5) * 46;
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const field = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: GOLD, size: 0.05, transparent: true, opacity: 0.18 }));
  scene.add(field);

  /* --- interaction & motion --- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX / window.innerWidth - 0.5;
    mouse.ty = e.clientY / window.innerHeight - 0.5;
  });

  // sit further to the right so the deer owns the right side, clear of the headline
  const targetOffsetX = () => (window.innerWidth > 1200 ? 7.2 : window.innerWidth > 860 ? 5.6 : 0);
  const BASE_Y = -1.05;

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    const sway = reduce ? 0 : 1;
    // keep the delightful mouse parallax; calm the idle motion
    group.rotation.y = mouse.x * 0.5 + Math.sin(t * 0.35) * 0.12 * sway;
    group.rotation.x = -mouse.y * 0.22 + Math.sin(t * 0.5) * 0.04 * sway;
    group.position.x = targetOffsetX(); // start & stay in place — never slides across the name
    group.position.y = BASE_Y + Math.sin(t * 0.6) * 0.08 * sway;
    group.scale.setScalar(1 + Math.sin(t * 0.9) * 0.014);

    // circuit-node glow: a slow heartbeat via opacity (not a strobe)
    const pulse = reduce ? 1 : (1 + Math.sin(t * 1.6) * 0.12);
    glowMat.size = 0.34 * pulse;
    glowMat.opacity = reduce ? 0.5 : 0.42 + Math.abs(Math.sin(t * 1.6)) * 0.22;
    glowMat2.opacity = reduce ? 0.14 : 0.12 + Math.abs(Math.sin(t * 1.6 + 0.5)) * 0.10;

    field.rotation.y = t * 0.02 * sway;
    field.position.y = Math.sin(t * 0.1) * 0.4; // slow data drift

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
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add("is-in"), (i % 6) * 70);
          io.unobserve(entry.target);
        }
      });
    },
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
    const pre = m ? m[1] : "";
    const suf = m ? m[3] : "";
    if (reduce || isNaN(target)) { return; }
    const dur = 1300, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = pre + Math.round(target * eased) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window)) { nums.forEach(run); return; }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
    }),
    { threshold: 0.5 }
  );
  nums.forEach((el) => io.observe(el));
})();

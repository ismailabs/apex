/* maps.js — Apex GP map registry (SEED).
 * Data, loop generator and weather system are final. buildXxx(ctx) are
 * intentionally small stubs: implement each per MAPS_HANDOFF.md.
 * Loaded by index.html BEFORE the main <script>. Works in browser and Node (tests). */
const APEX_MAPS = (() => {
  // ---- Circuit loop generator -------------------------------------------
  // Star-shaped polar loop r(theta) = 1 + sum(a_k cos(k*theta + phi_k)).
  // As long as sum|a_k| < 0.55 the loop can never self-intersect.
  // Output is normalised to [-1,1]; index.html scales it with sc/ox/oy
  // (match the Classic circuit's scale so physics/AI stay consistent).
  function loop(n, harmonics, aspect = 1.4, rot = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2 + rot;
      let r = 1;
      for (const [k, a, ph] of harmonics) r += a * Math.cos(k * th + ph);
      pts.push([Math.cos(th) * r * aspect, Math.sin(th) * r]);
    }
    return pts;
  }

  const CLASSIC_CP = [[900,300],[1500,260],[2200,300],[2700,520],[2800,1000],[2500,1300],[2000,1200],[1700,1500],[1900,1750],[1300,1800],[700,1650],[400,1200],[600,800],[1000,900],[1100,600]];

  // ---- Map definitions ---------------------------------------------------
  const LIST = [
    { id: 'classic', name: 'Classic', desc: 'Countryside circuit, grandstands and pines.',
      difficulty: 'Easy', weatherLabel: 'Clear', cp: CLASSIC_CP, sc: 0.28, ox: 1600, oy: 1030,
      sky: { horizon: 0xbfd8ee, top: 0x4a8fd8, sunColor: 0xfff2d0, sunDir: [-0.5, 0.8, -0.3], sunIntensity: 1.2,
             hemiSky: 0xcfe6ff, hemiGround: 0x4a6b3a, hemiIntensity: 0.6, ambientIntensity: 0.3, fogNear: 200, fogFar: 900, nightMode: false },
      ground: { base: 0x3f7d36, particle: [90, 130, 60], road: 0x2a2a2e, curb: [0xd61f1f, 0xf4f4f4], barrier: 0xcccccc },
      weather: { type: 'none', count: 0, color: 0xffffff, size: 1, speed: 0 } },

    { id: 'city', name: 'City', desc: 'Neon skyline, overpasses and glowing billboards.',
      difficulty: 'Hard', weatherLabel: 'Night',
      cp: loop(14, [[2, .18, 0], [3, .14, 1.2], [5, .07, .4]], 1.5, 0.3), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0x1a1030, top: 0x05060f, sunColor: 0x8899ff, sunDir: [0.3, 0.5, 0.6], sunIntensity: 0.35,
             hemiSky: 0x3a3a6a, hemiGround: 0x15151f, hemiIntensity: 0.55, ambientIntensity: 0.35, fogNear: 120, fogFar: 650, nightMode: true },
      ground: { base: 0x1b1c22, particle: [70, 70, 85], road: 0x17171b, curb: [0x00e5ff, 0xff2bd6], barrier: 0x2b2d38 },
      weather: { type: 'mist', count: 120, color: 0x8899cc, size: 3, speed: 0.4 } },

    { id: 'desert', name: 'Desert', desc: 'Canyons, mesas and rock arches under a scorching sun.',
      difficulty: 'Medium', weatherLabel: 'Dust',
      cp: loop(16, [[2, .12, .5], [3, .2, 2.0], [4, .1, 0]], 1.6, 1.1), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0xf3c98b, top: 0x5aa8e0, sunColor: 0xffc060, sunDir: [0.6, 0.45, -0.4], sunIntensity: 1.5,
             hemiSky: 0xffdca0, hemiGround: 0xa0592b, hemiIntensity: 0.7, ambientIntensity: 0.3, fogNear: 150, fogFar: 750, nightMode: false },
      ground: { base: 0xd9a35b, particle: [217, 163, 91], road: 0x3a342d, curb: [0xe8d9b0, 0xb5522a], barrier: 0xc7a06a },
      weather: { type: 'dust', count: 350, color: 0xe7c48a, size: 1.6, speed: 6 } },

    { id: 'glacier', name: 'Glacier', desc: 'Frozen lakes, icebergs and tunnels of ice.',
      difficulty: 'Expert', weatherLabel: 'Snow',
      cp: loop(18, [[2, .1, 2], [3, .12, .3], [6, .09, 1]], 1.3, 2.0), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0xcfe8f7, top: 0x6fa8dc, sunColor: 0xeaf6ff, sunDir: [-0.4, 0.55, 0.5], sunIntensity: 1.0,
             hemiSky: 0xd8ecff, hemiGround: 0x9fb8cc, hemiIntensity: 0.8, ambientIntensity: 0.4, fogNear: 130, fogFar: 700, nightMode: false },
      ground: { base: 0xeaf4fb, particle: [230, 240, 250], road: 0x3b4a58, curb: [0x7fd4ff, 0xffffff], barrier: 0xaad8f0 },
      weather: { type: 'snow', count: 600, color: 0xffffff, size: 1.2, speed: 4 } },

    { id: 'volcano', name: 'Volcano', desc: 'Lava rivers, glowing cracks and erupting cones.',
      difficulty: 'Expert', weatherLabel: 'Embers',
      cp: loop(15, [[2, .2, 1], [3, .1, 2.6], [5, .1, .8]], 1.35, 0.7), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0x5a2410, top: 0x150808, sunColor: 0xff7a30, sunDir: [0.0, 0.3, -0.8], sunIntensity: 0.9,
             hemiSky: 0x7a3020, hemiGround: 0x1a0a08, hemiIntensity: 0.55, ambientIntensity: 0.3, fogNear: 100, fogFar: 600, nightMode: false },
      ground: { base: 0x1a1412, particle: [60, 40, 30], road: 0x201c1c, curb: [0xff5a1a, 0x222222], barrier: 0x3a2a26 },
      weather: { type: 'embers', count: 400, color: 0xff8a30, size: 1.4, speed: -3 } },

    { id: 'forest', name: 'Forest', desc: 'Dense woodland, timber bridges and dappled sun.',
      difficulty: 'Medium', weatherLabel: 'Sunbeams',
      cp: loop(17, [[2, .14, 0], [3, .16, 1.5], [4, .08, 3]], 1.4, 2.6), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0xcfe0c0, top: 0x5b9ccf, sunColor: 0xffe6a8, sunDir: [-0.35, 0.7, 0.3], sunIntensity: 1.3,
             hemiSky: 0xcde8b8, hemiGround: 0x2f4a22, hemiIntensity: 0.65, ambientIntensity: 0.3, fogNear: 110, fogFar: 600, nightMode: false },
      ground: { base: 0x2f5a26, particle: [70, 100, 50], road: 0x38352f, curb: [0x8a5a2b, 0xd8c9a0], barrier: 0x6b4a2a },
      weather: { type: 'mist', count: 150, color: 0xfff2c0, size: 2.5, speed: 0.3 } },

    { id: 'jungle', name: 'Jungle', desc: 'Palms, giant ferns, waterfalls and tropical rain.',
      difficulty: 'Hard', weatherLabel: 'Rain',
      cp: loop(16, [[2, .16, 2.4], [3, .12, .2], [5, .1, 1.7]], 1.3, 1.6), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0x9fc0a8, top: 0x4f8f9a, sunColor: 0xfff0c0, sunDir: [0.2, 0.6, 0.4], sunIntensity: 0.9,
             hemiSky: 0xa8d0b0, hemiGround: 0x123a1c, hemiIntensity: 0.7, ambientIntensity: 0.35, fogNear: 90, fogFar: 520, nightMode: false },
      ground: { base: 0x14502a, particle: [30, 80, 40], road: 0x2c2a26, curb: [0xffd23a, 0x1b6b2a], barrier: 0x4a5a3a },
      weather: { type: 'rain', count: 600, color: 0xbfe0ff, size: 0.8, speed: 28 } },

    { id: 'coastal', name: 'Coastal', desc: 'Cliff-top roads, beaches, lighthouse and turquoise sea.',
      difficulty: 'Easy', weatherLabel: 'Sunny',
      cp: loop(15, [[2, .13, 1.1], [3, .13, 0], [4, .07, 2]], 1.55, 3.4), sc: null, ox: 0, oy: 0,
      sky: { horizon: 0xcfeaf5, top: 0x3d9be0, sunColor: 0xfff5d8, sunDir: [-0.2, 0.8, -0.5], sunIntensity: 1.4,
             hemiSky: 0xd0eaff, hemiGround: 0xd8c690, hemiIntensity: 0.7, ambientIntensity: 0.3, fogNear: 220, fogFar: 1000, nightMode: false },
      ground: { base: 0xe3cf94, particle: [227, 207, 148], road: 0x34343a, curb: [0xffffff, 0x1aa6c8], barrier: 0xf2f2f2 },
      weather: { type: 'none', count: 0, color: 0xffffff, size: 1, speed: 0 } },
  ];

  // ---- Shared track surface & furniture helper ----------------------------
  function buildCommonTrack(ctx, opts = {}) {
    const { THREE, scene, track, tex, speckle, lam, ribbon, wall, gantry, brakingBoards, disposeList, mapDef } = ctx;
    const { N, HW, WALL, CURB, GRAVEL } = track;
    const gCol = '#' + mapDef.ground.base.toString(16).padStart(6, '0');
    const rCol = '#' + mapDef.ground.road.toString(16).padStart(6, '0');
    const cA = '#' + (opts.curbA !== undefined ? opts.curbA : mapDef.ground.curb[0]).toString(16).padStart(6, '0');
    const cB = '#' + (opts.curbB !== undefined ? opts.curbB : mapDef.ground.curb[1]).toString(16).padStart(6, '0');

    const groundTex = opts.groundTex || tex(256, 256, speckle(gCol, 2200, 'rgba(255,255,255,.10)', 'rgba(0,0,0,.16)', 3), 220, 220);
    const tarTex = tex(256, 256, speckle(rCol, 5200, 'rgba(255,255,255,.08)', 'rgba(0,0,0,.22)', 2), 1, 1);

    const gMat = opts.groundMat || new THREE.MeshLambertMaterial({ map: groundTex });
    const gGeo = new THREE.PlaneGeometry(2400, 2400);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; ground.receiveShadow = true;
    scene.add(ground);
    disposeList.push(gGeo, gMat);

    const shoulderA = opts.shoulderA || gCol;
    const shoulderB = opts.shoulderB || gCol;
    if (opts.shoulderA) ribbon(-WALL, WALL, -0.02, { color: i => (i >> 2) % 2 ? shoulderA : shoulderB, layer: 1 });
    if (opts.runoffTex) {
      for (const s of [-1, 1]) ribbon(s * (HW + CURB), s * (WALL - 0.2), 0.0, { map: opts.runoffTex, when: i => GRAVEL[i] === s, layer: 2 });
    }
    ribbon(-HW, HW, 0.02, { map: tarTex, layer: 3 });
    ribbon(-3.4, 3.4, 0.024, { tint: 0x000000, opacity: 0.1, layer: 4 });
    for (const s of [-1, 1]) {
      ribbon(s * (HW - 0.45), s * (HW - 0.1), 0.03, { tint: opts.edgeLine || 0xf2f2f2, layer: 5 });
      ribbon(s * HW, s * (HW + CURB), 0.045, { sub: 2, color: i => i % 2 ? cB : cA, layer: 6 });
    }
    ribbon(-0.09, 0.09, 0.03, { tint: opts.dashLine || 0xaab0ba, when: i => i % 3 === 0, layer: 5 });

    wall(1, opts.wallOpts);
    wall(-1, opts.wallOpts);
    gantry(opts.gantryOpts);
    brakingBoards();
    return [ground];
  }

  // ---- Classic builder (exact original countryside circuit) ---------------
  function buildClassic(ctx) {
    const { THREE, scene, track, tex, speckle, instanced, box, lam, ribbon, wall, gantry, brakingBoards, disposeList, rand } = ctx;
    const { P, N, T, NR, GRAVEL, HW, CURB, WALL, at, clearOf } = track;
    const HORIZON = ctx.mapDef.sky.horizon;
    const added = [];

    // Distant hills ring on the horizon.
    for (const [r, h, col] of [[820, 70, 0x6f93a8], [640, 40, 0x56805f]]) {
      const n = 96, pos = [], hs = [];
      for (let i = 0; i < n; i++) hs.push(h * (0.35 + rand() * 0.65));
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2, j = (i + 1) % n;
        const A = [Math.cos(a) * r, -2, Math.sin(a) * r], B = [Math.cos(b) * r, -2, Math.sin(b) * r], C = [B[0], hs[j], B[2]], D = [A[0], hs[i], A[2]];
        pos.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(col).lerp(new THREE.Color(HORIZON), 0.35), side: THREE.DoubleSide, fog: false });
      const mesh = new THREE.Mesh(g, m); scene.add(mesh); added.push(mesh); disposeList.push(g, m);
    }

    const grassTex = tex(256, 256, speckle('#3f7a35', 2600, 'rgba(180,220,110,.16)', 'rgba(0,30,0,.18)', 3), 220, 220);
    const gravTex = tex(128, 128, speckle('#b39a6c', 1500, 'rgba(255,240,200,.35)', 'rgba(60,40,15,.35)', 3), 1, 1);

    buildCommonTrack(ctx, {
      groundTex: grassTex,
      runoffTex: gravTex,
      shoulderA: '#4d8c3d',
      shoulderB: '#427d36',
      curbA: 0xd61f1f,
      curbB: 0xf4f4f4
    });

    // Grandstands with instanced crowd
    const crowd = [], colors = [0xe33b3b, 0xffc83d, 0x3d7bff, 0xffffff, 0x2fc28a, 0xff8000, 0x9b6bff, 0x20242c];
    const base = lam(0x8c929c), roof = lam(0xd8262f), post = lam(0x3a3f47), placed = [];
    for (const [idx, side] of [[6, 1], [18, 1], [N - 12, 1], [6, -1], [N - 12, -1], [30, 1], [Math.floor(N * 0.17), -1], [Math.floor(N * 0.33), -1], [Math.floor(N * 0.5), 1], [Math.floor(N * 0.66), 1], [Math.floor(N * 0.82), -1]]) {
      const i = ((idx % N) + N) % N, c = at(i, side * (WALL + 8.5)), a = T[i], fx = Math.cos(a), fz = Math.sin(a), nx = NR[i][0] * side, nz = NR[i][1] * side;
      let ok = true;
      for (let u = -20; u <= 20; u += 5) for (let v = -4.5; v <= 4.5; v += 4.5) if (clearOf(c[0] + fx * u * 0.5 + nx * v, c[1] + fz * u * 0.5 + nz * v) < WALL + 2.5) ok = false;
      if (!ok || placed.some(q => Math.hypot(q[0] - c[0], q[1] - c[1]) < 22)) continue;
      placed.push(c);
      const g = new THREE.Group(); g.position.set(c[0], 0, c[1]); g.rotation.y = -a; scene.add(g); added.push(g);
      for (let r = 0; r < 5; r++) {
        box(20, 0.8 + r * 0.9, 1.5, base, 0, (0.8 + r * 0.9) / 2, side * (-3.2 + r * 1.5), g);
        for (let k = 0; k < 26; k++) {
          if (rand() < 0.14) continue;
          const u = -9.6 + k * 0.77 + rand() * 0.2, v = -3.2 + r * 1.5, y = 0.8 + r * 0.9 + 0.38;
          crowd.push({ x: c[0] + fx * u + nx * v, y, z: c[1] + fz * u + nz * v, r: -a, c: colors[Math.floor(rand() * colors.length)] });
        }
      }
      for (const u of [-9.6, 0, 9.6]) box(0.25, 8, 0.25, post, u, 4, side * 4.4, g);
      box(21, 0.3, 9, roof, 0, 8, side * 0.5, g);
    }
    added.push(instanced(new THREE.BoxGeometry(0.45, 0.75, 0.45), lam(0xffffff), crowd, false));

    // Light poles
    const poles = [], arms = [], lamps = [];
    for (let i = 5, k = 0; i < N; i += 11, k++) {
      const s = k % 2 ? 1 : -1, p = at(i, s * (WALL + 1.4)); if (clearOf(p[0], p[1]) < WALL + 1) continue;
      const dx = -NR[i][0] * s, dz = -NR[i][1] * s, r = Math.atan2(-dz, dx);
      poles.push({ x: p[0], y: 5, z: p[1] }); arms.push({ x: p[0] + dx * 1.3, y: 9.9, z: p[1] + dz * 1.3, r }); lamps.push({ x: p[0] + dx * 2.6, y: 9.75, z: p[1] + dz * 2.6, r });
    }
    added.push(
      instanced(new THREE.CylinderGeometry(0.13, 0.2, 10, 6), lam(0x565d68), poles, true),
      instanced(new THREE.BoxGeometry(2.8, 0.14, 0.14), lam(0x565d68), arms, false),
      instanced(new THREE.BoxGeometry(0.8, 0.2, 0.5), lam(0xfff6d0, 0x77704a), lamps, false)
    );

    // Trees
    const trunk = [], leafA = [], leafB = [], greens = [0x2f6b2c, 0x3b7a2e, 0x25592a, 0x4a8434];
    let tries = 0;
    while (trunk.length < 850 && tries++ < 7000) {
      const x = -470 + rand() * 940, z = -360 + rand() * 720, d = clearOf(x, z);
      if (d < WALL + 5 || (d > 90 && rand() < 0.55)) continue;
      if (d < WALL + 22 && Math.abs(x - P[0][0]) < 80 && Math.abs(z - P[0][1]) < 40) continue;
      const s = 0.75 + rand() * 0.8, c = greens[Math.floor(rand() * 4)], r = rand() * 6;
      trunk.push({ x, y: 1 * s, z, s }); leafA.push({ x, y: 3.6 * s, z, s, r, c }); leafB.push({ x, y: 5.6 * s, z, s, r, c });
    }
    const lm = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, shininess: 0, specular: 0x000000 });
    disposeList.push(lm);
    added.push(
      instanced(new THREE.CylinderGeometry(0.28, 0.4, 2, 5), lam(0x6a4a2c), trunk, true),
      instanced(new THREE.ConeGeometry(2.3, 3.8, 7), lm, leafA, true),
      instanced(new THREE.ConeGeometry(1.6, 3.2, 7), lm, leafB, true)
    );
    return added;
  }

  // ---- Env builder stubs --------------------------------------------------
  const stub = (id) => (ctx) => { buildCommonTrack(ctx); console.warn('[maps] biome props stub:', id); return []; };
  for (const m of LIST) m.buildEnv = m.id === 'classic' ? buildClassic : stub(m.id);

  // ---- Weather particles (final) ------------------------------------------
  const MAX_WEATHER = 600, BOX = 90; // camera-relative volume half-size
  function makeWeather(THREE, scene) {
    const pos = new Float32Array(MAX_WEATHER * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 1, transparent: true, opacity: 0.8, depthWrite: false, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false; pts.visible = false; scene.add(pts);
    let cfg = { type: 'none', count: 0, speed: 0 };
    const rnd = () => (Math.random() * 2 - 1) * BOX;
    return {
      set(w) {
        cfg = w; pts.visible = w.type !== 'none' && w.count > 0;
        mat.color.setHex(w.color || 0xffffff); mat.size = w.size || 1;
        for (let i = 0; i < MAX_WEATHER; i++) { pos[i*3] = rnd(); pos[i*3+1] = Math.random() * BOX; pos[i*3+2] = rnd(); }
        geo.attributes.position.needsUpdate = true;
      },
      // cam = THREE.Vector3 camera position, dt in seconds. Particles wrap around the camera.
      update(cam, dt) {
        if (!pts.visible) return;
        const n = Math.min(cfg.count, MAX_WEATHER), s = cfg.speed;
        for (let i = 0; i < n; i++) {
          let x = pos[i*3], y = pos[i*3+1], z = pos[i*3+2];
          y -= s * dt;
          if (cfg.type === 'snow') { x += Math.sin(y * .3 + i) * dt * 1.5; }
          if (cfg.type === 'dust') { x += s * dt * 1.2; y = Math.max(0.5, Math.min(25, y + Math.sin(i + x) * dt)); }
          if (y < 0) y += BOX; if (y > BOX) y -= BOX;
          if (x > BOX) x -= 2*BOX; if (x < -BOX) x += 2*BOX;
          if (z > BOX) z -= 2*BOX; if (z < -BOX) z += 2*BOX;
          pos[i*3] = x; pos[i*3+1] = y; pos[i*3+2] = z;
        }
        geo.setDrawRange(0, n);
        geo.attributes.position.needsUpdate = true;
        pts.position.set(cam.x, Math.max(0, cam.y - 10), cam.z);
      },
      dispose() { scene.remove(pts); geo.dispose(); mat.dispose(); },
    };
  }

  // ---- buildTrackData(mapDef) ---------------------------------------------
  function buildTrackData(mapDef) {
    const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
    const lerp = (a, b, t) => a + (b - a) * t;
    const dA = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
    const CP = mapDef.cp || CLASSIC_CP;
    const SC = mapDef.sc || 245;
    const OX = mapDef.ox || 0;
    const OY = mapDef.oy || 0;

    function cr(a, b, c, d, t) {
      const t2 = t * t, t3 = t2 * t;
      return [0, 1].map(i => 0.5 * (2 * b[i] + (-a[i] + c[i]) * t + (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * t2 + (-a[i] + 3 * b[i] - 3 * c[i] + d[i]) * t3));
    }
    function resample(pts, step) {
      const m = pts.length, L = [0];
      for (let i = 1; i <= m; i++) {
        const a = pts[i - 1], b = pts[i % m];
        L.push(L[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
      }
      const tot = L[m], n = Math.round(tot / step), out = [];
      for (let i = 0, j = 0; i < n; i++) {
        const d = i * tot / n;
        while (L[j + 1] < d) j++;
        const a = pts[j], b = pts[(j + 1) % m], t = (d - L[j]) / (L[j + 1] - L[j] || 1);
        out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
      }
      return out;
    }
    const turnAt = (p, i, k) => {
      const n = p.length, a = p[(i + n - k) % n], b = p[i], c = p[(i + k) % n];
      return dA(Math.atan2(c[1] - b[1], c[0] - b[0]), Math.atan2(b[1] - a[1], b[0] - a[0]));
    };

    const raw = [], nCP = CP.length;
    for (let i = 0; i < nCP; i++) {
      for (let k = 0; k < 20; k++) {
        const pt = cr(CP[(i + nCP - 1) % nCP], CP[i], CP[(i + 1) % nCP], CP[(i + 2) % nCP], k / 20);
        raw.push([(pt[0] - OX) * SC, (pt[1] - OY) * SC]);
      }
    }
    let p = resample(raw, 4);
    for (let it = 0; it < 600; it++) {
      const hot = new Set();
      for (let i = 0; i < p.length; i++) {
        if (Math.abs(turnAt(p, i, 2)) > 8 / 22) {
          for (let k = -3; k <= 3; k++) hot.add((i + k + p.length) % p.length);
        }
      }
      if (!hot.size) break;
      const q = p.map(v => v.slice());
      hot.forEach(i => {
        const a = p[(i + p.length - 1) % p.length], b = p[(i + 1) % p.length];
        q[i] = [p[i][0] * 0.5 + (a[0] + b[0]) * 0.25, p[i][1] * 0.5 + (a[1] + b[1]) * 0.25];
      });
      p = q;
      if (it % 10 === 9) p = resample(p, 4);
    }
    p = resample(p, 4);

    let shift = 0;
    if (mapDef.id === 'classic') {
      shift = 65;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < p.length; i++) {
        let s = 0;
        for (let k = -24; k <= 4; k++) s += Math.abs(turnAt(p, (i + k + p.length) % p.length, 2));
        if (s < bestScore) { bestScore = s; shift = i; }
      }
    }
    const P = p.slice(shift).concat(p.slice(0, shift));
    const N = P.length;
    let LEN = 0;
    for (let i = 0; i < N; i++) LEN += Math.hypot(P[(i + 1) % N][0] - P[i][0], P[(i + 1) % N][1] - P[i][1]);
    const SEG = LEN / N;
    const T = P.map((_, i) => {
      const a = P[(i + N - 1) % N], b = P[(i + 1) % N];
      return Math.atan2(b[1] - a[1], b[0] - a[0]);
    });
    const NR = T.map(a => [-Math.sin(a), Math.cos(a)]);
    const smooth = (arr, r) => arr.map((_, i) => {
      let s = 0;
      for (let k = -r; k <= r; k++) s += arr[(i + k + N) % N];
      return s / (2 * r + 1);
    });
    const CURV = smooth(T.map((_, i) => dA(T[(i + 2) % N], T[(i + N - 2) % N]) / (4 * SEG)), 3);
    const VL = CURV.map(k => clamp(Math.sqrt(25 / (Math.abs(k) + 1e-5)), 17, 90));
    const LINE = smooth(CURV.map(k => clamp(k * 170, -5, 5)), 7);
    const GRAVEL = (() => {
      const g = new Array(N).fill(0);
      for (let i = 0; i < N; i++) if (Math.abs(CURV[i]) > 1 / 55) for (let k = -3; k <= 5; k++) g[(i + k + N) % N] = -Math.sign(CURV[i]);
      return g;
    })();
    const BX = [Math.min(...P.map(pt => pt[0])), Math.max(...P.map(pt => pt[0]))];
    const BZ = [Math.min(...P.map(pt => pt[1])), Math.max(...P.map(pt => pt[1]))];
    const at = (i, lat) => { i = ((i % N) + N) % N; return [P[i][0] + NR[i][0] * lat, P[i][1] + NR[i][1] * lat]; };
    const clearOf = (x, z) => {
      let b = 1e18;
      for (let i = 0; i < N; i++) { const d = (P[i][0] - x) ** 2 + (P[i][1] - z) ** 2; if (d < b) b = d; }
      return Math.sqrt(b);
    };
    return { P, N, LEN, SEG, T, NR, CURV, VL, LINE, GRAVEL, BX, BZ, at, clearOf };
  }

  const api = { LIST, loop, makeWeather, buildTrackData, MAX_WEATHER };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();

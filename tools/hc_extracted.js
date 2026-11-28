const HC = (() => {

const PH = (c, o) => new THREE.MeshPhongMaterial(Object.assign({ color: c, shininess: 60, specular: 0x333333, flatShading: true, side: THREE.DoubleSide }, o || {}));
const BA = c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
const discMat = PH(0x4a4f58, { shininess: 80 });
const helmMat = PH(0xf2f2f2, { shininess: 90 });
const metal = PH(0xa4aab4, { shininess: 130, specular: 0xdddddd });

/* ---------- wheel: tyre + 5 (or 5 paired) spokes + brake disc, caliper kept off the spin group ---------- */
function wheel(r, w, side, o) {
  const spin = new THREE.Group(), face = side * (w / 2 + .006);
  const flip = m => { if (side < 0) m.rotation.y = Math.PI; return m; };
  const cyl = (rad, len, m, n = 24) => { const q = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, n), m); q.rotation.x = Math.PI / 2; spin.add(q); return q; };
  cyl(r, w * .84, tyreMat).castShadow = true;
  for (const s of [-1, 1]) {
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(s > 0 ? r * .9 : r, s > 0 ? r : r * .9, w * .08, 24), tyreMat);
    sh.rotation.x = Math.PI / 2; sh.position.z = s * w * .46; spin.add(sh);
  }
  cyl(r * .52, w * .1, discMat, 18).position.z = side * w * .2;
  const disc = flip(new THREE.Mesh(new THREE.CircleGeometry(r * .7, 24), o.back || discMat)); disc.position.z = face - side * .01; spin.add(disc);
  const lip = flip(new THREE.Mesh(new THREE.RingGeometry(r * .7, r * .79, 28), o.rim)); lip.position.z = face; spin.add(lip);
  const n = o.n || 5, dbl = !!o.dbl;
  for (let k = 0; k < n; k++) {
    for (const d of dbl ? [-.16, .16] : [0]) {
      const a = k * Math.PI * 2 / n + d + (o.rot || 0);
      const sp = new THREE.Mesh(new THREE.BoxGeometry(r * .62, dbl ? r * .075 : r * .15, .035), o.rim);
      sp.position.set(Math.cos(a) * r * .38, Math.sin(a) * r * .38, face + side * .014); sp.rotation.z = a; spin.add(sp);
    }
  }
  const cap = flip(new THREE.Mesh(new THREE.CircleGeometry(r * .15, 14), o.cap)); cap.position.z = face + side * .028; spin.add(cap);
  const cal = new THREE.Mesh(new THREE.BoxGeometry(r * .5, r * .28, .085), o.cal);
  cal.position.set(r * .27, r * .33, side * w * .3); cal.rotation.z = -.7;
  return { spin, cal };
}

/* ---------- profile-driven body toolkit (smooth polylines, 8-pt loft, wheel-arch cuts) ---------- */
function evalProfile(pts, x) {
  const n = pts.length;
  if (x <= pts[0][0]) return pts[0][1];
  if (x >= pts[n - 1][0]) return pts[n - 1][1];
  let i = 0;
  while (i < n - 2 && x > pts[i + 1][0]) i++;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
  const dx = p2[0] - p1[0];
  if (dx <= 1e-6) return p1[1];
  const t = (x - p1[0]) / dx, t2 = t * t, t3 = t2 * t;
  const m1 = i === 0 ? (p2[1] - p1[1]) / dx : (p2[1] - p0[1]) / (p2[0] - p0[0]);
  const m2 = i + 1 === n - 1 ? (p2[1] - p1[1]) / dx : (p3[1] - p1[1]) / (p3[0] - p1[0]);
  return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * dx * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * dx * m2;
}
function profileSamples(x0, x1, step, arches) {
  const xs = [], addX = v => { if (v >= x0 - 1e-5 && v <= x1 + 1e-5) xs.push(Math.max(x0, Math.min(x1, v))); };
  for (let x = x0; x < x1 - 1e-4; x += step) addX(x);
  addX(x1);
  if (arches) for (const [ax, r] of arches) {
    const ar = r + .1;
    for (const k of [-1, -.78, -.48, 0, .48, .78, 1]) addX(ax + k * ar);
  }
  xs.sort((a, b) => a - b);
  return xs.filter((v, i) => i === 0 || v - xs[i - 1] > .018);
}
function loft8(secs, mat) {
  const pos = [], ring = s => {
    const [x, w, y0, y1, tw = w * .62, sh = .74] = s, h = y1 - y0;
    const yL = y0 + h * .3, yS = y0 + h * sh, ws = w * .52 + tw * .48;
    return [
      [x, y0, -w * .82], [x, yL, -w * .99], [x, yS, -ws], [x, y1, -tw],
      [x, y1, tw], [x, yS, ws], [x, yL, w * .99], [x, y0, w * .82]
    ];
  };
  const R = secs.map(ring), tri = (a, b, c) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < R.length - 1; i++) for (let k = 0; k < 8; k++) {
    const j = (k + 1) % 8;
    tri(R[i][k], R[i + 1][k], R[i + 1][j]);
    tri(R[i][k], R[i + 1][j], R[i][j]);
  }
  for (let k = 1; k < 7; k++) {
    tri(R[0][0], R[0][k], R[0][k + 1]);
    const e = R[R.length - 1];
    tri(e[0], e[k + 1], e[k]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.castShadow = true; m.receiveShadow = true;
  return m;
}
function makeBodyProfile(topPts, botPts, widPts, arches) {
  const topY = x => evalProfile(topPts, x);
  const halfWidth = x => evalProfile(widPts, x);
  const bottomY = x => {
    let y = evalProfile(botPts, x);
    if (arches) for (const [ax, r] of arches) {
      const ar = r + .1, d = Math.abs(x - ax);
      if (d < ar) {
        const u = d / ar, archY = (2 * r - .02) * Math.pow(Math.max(0, 1 - u * u), .55);
        y = Math.max(y, Math.min(topY(x) - .06, archY));
      }
    }
    return y;
  };
  const build = (mat, x0, x1, step, twFn, shFn) => {
    const xs = profileSamples(x0, x1, step || .15, arches);
    return loft8(xs.map(x => {
      const w = halfWidth(x), y0 = bottomY(x), y1 = topY(x);
      return [x, w, y0, y1, twFn ? twFn(x, w) : w * .68, shFn ? shFn(x) : .74];
    }), mat);
  };
  return { topY, bottomY, halfWidth, build };
}
function cabinGlass(roofPts, roofWPts, baseYPts, x0, x1, mat) {
  const xs = profileSamples(x0, x1, .14);
  return loft8(xs.map(x => {
    const w = evalProfile(roofWPts, x), y0 = evalProfile(baseYPts, x), y1 = evalProfile(roofPts, x);
    return [x, w, y0, Math.max(y0 + .03, y1), w * .72, .65];
  }), mat);
}

/* ---------- shared chassis: wheels, seats, driver, mirrors ---------- */
function chassis(L, o) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const M = PH(L.m, { shininess: 110, specular: 0x888888 }), D = PH(L.d, { shininess: 55, specular: 0x333333 }), A = PH(L.a, { shininess: 80, specular: 0x555555 });
  const G = new THREE.MeshPhongMaterial({ color: 0x0c1a2a, shininess: 170, specular: 0xaac8ff, flatShading: true, transparent: true, opacity: .74, depthWrite: false, side: THREE.DoubleSide });
  const add = (secs, mat, z) => { const m = loft(secs, mat); if (z) m.position.z = z; body.add(m); return m; };
  const b = (w, h, d, mat, x, y, z) => box(w, h, d, mat, x, y, z, body);
  const wheels = [], pivots = [];
  for (const [ax, ra, wd, front] of [[o.fx, o.fr, o.fw, true], [o.rx, o.rr, o.rw, false]]) for (const s of [-1, 1]) {
    const piv = new THREE.Group(); piv.position.set(ax, ra, s * o.track); g.add(piv);
    const wh = wheel(ra, wd, s, o.wheel);
    wh.spin.userData.r = ra; wh.spin.userData.rear = !front; // rear flag: lets syncModel lock rear wheels under handbrake
    piv.add(wh.spin); piv.add(wh.cal); wheels.push(wh.spin); if (front) pivots.push(piv);
  }
  const seatM = PH(o.seat, { shininess: 20 });
  for (const s of [-1, 1]) {
    b(.36, .1, .36, seatM, o.seatX, .44, s * .3);
    b(.08, .44, .36, seatM, o.seatX - .2, .68, s * .3).rotation.z = -.25;
  }
  b(.04, .2, .24, D, o.seatX + .55, .8, -.3).rotation.z = .5;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.13, 14, 10), helmMat); helmet.position.set(o.seatX - .06, .96, -.3); body.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.134, 14, 8, -.9 + Math.PI, 1.8, 1.15, .5), visorMat); visor.position.copy(helmet.position); body.add(visor);
  const mirror = (x, y, mat) => { for (const s of [-1, 1]) { strut([x, y - .06, s * .82], [x + .03, y, s * .98], .018, D, body); b(.09, .06, .15, mat || M, x + .03, y, s * 1.02); } };
  return { g, body, M, D, A, G, add, b, wheels, pivots, helmet, visor, mirror };
}

/* ---------- small helpers for details ---------- */
const lampStrip = (c, w, h, d, mat, x, y, z) => c.b(w, h, d, mat, x, y, z);
function tailpipes(c, xs, y, zs, rad, len) {
  for (const z of zs) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * .9, len, 12), metal); p.rotation.z = Math.PI / 2; p.position.set(xs, y, z); c.body.add(p);
    const h = new THREE.Mesh(new THREE.CircleGeometry(rad * .72, 12), PH(0x050505)); h.rotation.y = -Math.PI / 2; h.position.set(xs - len / 2 - .002, y, z); c.body.add(h);
  }
}
function finish(c, tcam, extra) {
  c.body.add(c.helmet, c.visor);
  const rain = BA(0x4a0000), run = BA(0xb01414);
  extra(rain, run);
  const out = {
    group: c.g, body: c.body, wheels: c.wheels, pivots: c.pivots, helmet: c.helmet, visor: c.visor, rain,
    tcam,
    setLivery: l => { c.M.color.set(l.m); c.D.color.set(l.d); c.A.color.set(l.a); }
  };
  scene.add(c.g);
  return out;
}

/* ======================================================================
   FERRARI LaFerrari  - low, cab-forward, black roof, round tail lamps, quad pipes
   ====================================================================== */
function laferrari(L) {
  const c = chassis(L, { fx: 1.10, fr: .33, fw: .26, rx: -1.68, rr: .357, rw: .34, track: .82, seat: 0x9c1010, seatX: -.2,
    wheel: { n: 5, rim: PH(0xcfd3da, { shininess: 120, specular: 0xffffff }), cap: BA(0xf2c200), cal: PH(0xd01010, { shininess: 80 }) } });
  const { M, D, A, G, b, body } = c;
  const arches = [[1.10, .33], [-1.68, .357]];
  const bp = makeBodyProfile(
    [[-2.52, .73], [-2.10, .86], [-1.68, .92], [-1.15, .88], [-.55, .79], [.25, .73], [.75, .71], [1.10, .74], [1.60, .57], [1.96, .43], [2.18, .32]],
    [[-2.52, .32], [-2.15, .20], [-1.20, .17], [.65, .17], [1.65, .19], [2.18, .22]],
    [[-2.52, .54], [-2.20, .86], [-1.68, .97], [-1.10, .92], [-.35, .84], [.55, .85], [1.10, .94], [1.60, .72], [1.96, .52], [2.18, .33]],
    arches
  );
  body.add(bp.build(M, -2.52, 2.18, .15, (x, w) => w * (x < -1.2 ? .72 : x > 1.3 ? .60 : .78)));
  // dark lower sill & tucked front splitter
  const sp = makeBodyProfile(
    [[-2.48, .28], [-2.0, .23], [-1.2, .22], [.7, .21], [1.6, .22], [2.16, .24]],
    [[-2.48, .17], [-1.2, .16], [.7, .16], [2.16, .19]],
    [[-2.48, .50], [-1.68, .72], [-.5, .81], [.7, .82], [1.6, .66], [2.16, .34]],
    arches
  );
  body.add(sp.build(D, -2.48, 2.16, .2, (x, w) => w * .90));
  b(.18, .022, .90, D, 1.98, .185, 0);
  b(.10, .10, .05, M, 2.12, .25, 0);
  // recessed dark hood duct + thin nose emblem
  b(.54, .014, .40, D, 1.48, bp.topY(1.48) - .002, 0).rotation.z = -.24;
  b(.07, .010, .07, A, 2.04, bp.topY(2.04) + .004, 0).rotation.z = -.26;
  // cabin glass & black roof panel + red A-pillars
  const rY = [[-1.42, .81], [-.95, .97], [-.45, 1.09], [-.05, 1.11], [.40, 1.03], [.78, .85], [1.06, .70]];
  const rW = [[-1.42, .26], [-.95, .42], [-.45, .47], [-.05, .47], [.40, .45], [.78, .43], [1.06, .39]];
  const gBase = [[-1.42, .75], [-.6, .70], [.3, .66], [1.06, .66]];
  body.add(cabinGlass(rY, rW, gBase, -1.42, 1.06, G));
  // black roof cap (raised slightly above glass to avoid z-fighting)
  const roofCap = makeBodyProfile([[-.62, 1.095], [-.25, 1.125], [.10, 1.115], [.34, 1.05]], [[-.62, 1.04], [-.25, 1.07], [.10, 1.06], [.34, 1.01]], [[-.62, .33], [-.25, .37], [.10, .37], [.34, .34]]);
  body.add(roofCap.build(D, -.62, .34, .14, (x, w) => w * .84));
  // red A-pillars, swept side intakes, flush headlamps
  for (const s of [-1, 1]) {
    strut([1.02, .70, s * .42], [.34, 1.04, s * .35], .024, M, body);
    const intake = makeBodyProfile([[-1.12, .62], [-.82, .60], [-.50, .54]], [[-1.12, .34], [-.82, .35], [-.50, .38]], [[-1.12, .02], [-.82, .03], [-.50, .02]]);
    const im = intake.build(D, -1.12, -.50, .15, (x, w) => w);
    im.position.z = s * (bp.halfWidth(-.82) - .005); body.add(im);
    const hl = b(.20, .020, .11, BA(0xdbe8f5), 1.66, bp.topY(1.66) - .002, s * .52);
    hl.rotation.y = s * .22; hl.rotation.z = -.24;
  }
  // rear: mesh grille, low rear lip, diffuser fins, quad exhausts
  b(.03, .20, .86, D, -2.51, .50, 0);
  b(.14, .024, 1.02, M, -2.45, .735, 0).rotation.z = -.08;
  tailpipes(c, -2.45, .28, [-.58, -.45, .45, .58], .046, .14);
  for (let i = 0; i < 6; i++) b(.36, .12, .02, D, -2.34, .21, -.45 + i * .18);
  c.mirror(.68, .73);
  return finish(c, [-.50, 1.32, 0], (rain, run) => {
    for (const s of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.CircleGeometry(.09, 16), run); l.rotation.y = -Math.PI / 2; l.position.set(-2.525, .62, s * .50); body.add(l);
      const l2 = new THREE.Mesh(new THREE.CircleGeometry(.065, 16), rain); l2.rotation.y = -Math.PI / 2; l2.position.set(-2.53, .62, s * .50); body.add(l2);
    }
    b(.02, .06, .14, rain, -2.52, .34, 0);
  });
}

/* ======================================================================
   BUGATTI Chiron  - tall, two-tone, horseshoe grille, C-line, LED tail bar, big wing
   livery: m = front/lower blue, d = dark navy rear/roof, a = silver C-line and trim
   ====================================================================== */
function chiron(L) {
  const c = chassis(L, { fx: 1.03, fr: .34, fw: .28, rx: -1.68, rr: .356, rw: .36, track: .82, seat: 0xb85a1e, seatX: -.25,
    wheel: { n: 5, dbl: true, rim: PH(0x525a68, { shininess: 110, specular: 0xbbbbbb }), cap: BA(0xb02020), cal: PH(0xc01818, { shininess: 60 }) } });
  const { M, D, A, G, b, body } = c;
  const arches = [[1.03, .34], [-1.68, .356]];
  const topPts = [[-2.50, .82], [-2.10, .92], [-1.68, .96], [-1.05, .94], [-.35, .89], [.35, .86], [1.03, .82], [1.53, .70], [1.88, .56], [2.05, .40]];
  const botPts = [[-2.50, .30], [-2.10, .20], [-1.20, .17], [.65, .17], [1.60, .19], [2.05, .22]];
  const widPts = [[-2.50, .58], [-2.15, .88], [-1.68, .99], [-1.05, .96], [-.30, .94], [.40, .95], [1.03, .97], [1.53, .78], [1.88, .58], [2.05, .40]];
  const bp = makeBodyProfile(topPts, botPts, widPts, arches);
  // two-tone body: dark navy rear (-2.50..0.12) and bright blue front (0.12..2.05)
  body.add(bp.build(D, -2.50, .14, .15, (x, w) => w * (x < -1.3 ? .74 : .78)));
  body.add(bp.build(M, .12, 2.05, .15, (x, w) => w * (x > 1.3 ? .64 : .78)));
  // blue lower sill under the C-line + tucked front splitter
  const sill = makeBodyProfile([[-.38, .42], [-.10, .42], [.14, .42]], [[-.38, .19], [-.10, .19], [.14, .19]], [[-.38, .92], [-.10, .935], [.14, .945]], arches);
  body.add(sill.build(M, -.38, .14, .14, (x, w) => w * .98));
  b(.18, .025, .92, D, 1.90, .19, 0);
  // cabin glass & dark roof panel
  const rY = [[-1.50, .86], [-1.00, 1.06], [-.40, 1.19], [.05, 1.21], [.45, 1.13], [.82, .94], [1.06, .80]];
  const rW = [[-1.50, .32], [-1.00, .46], [-.40, .52], [.05, .52], [.45, .50], [.82, .46], [1.06, .42]];
  const gBase = [[-1.50, .80], [-.50, .76], [.40, .74], [1.06, .74]];
  body.add(cabinGlass(rY, rW, gBase, -1.50, 1.06, G));
  const roofCap = makeBodyProfile([[-.82, 1.12], [-.35, 1.205], [.10, 1.215], [.40, 1.14]], [[-.82, 1.06], [-.35, 1.15], [.10, 1.16], [.40, 1.09]], [[-.82, .38], [-.35, .44], [.10, .44], [.40, .40]]);
  body.add(roofCap.build(D, -.82, .40, .15, (x, w) => w * .84));
  // flat inset silver C-line crescent + 4-LED headlamps
  for (const s of [-1, 1]) {
    strut([1.02, .78, s * .44], [.38, 1.14, s * .40], .024, D, body);
    b(.38, .30, .016, D, -.14, .56, s * (bp.halfWidth(-.14) - .006));
    for (let k = 0; k < 12; k++) {
      const am = Math.PI * (.54 + (k + .5) / 12 * .92);
      const cx = .20 + Math.cos(am) * .38, cy = .60 + Math.sin(am) * .22;
      const zSurf = bp.halfWidth(cx) * (cy > .74 ? .92 : .99);
      const seg = b(.10, .036, .014, A, cx, cy, s * (zSurf + .006));
      seg.rotation.z = am + Math.PI / 2;
    }
    // 4-dot LED headlamp bar flush on nose
    b(.035, .05, .18, D, 1.80, bp.topY(1.80) - .04, s * .39).rotation.y = s * .28;
    for (let i = 0; i < 4; i++) b(.025, .026, .026, BA(0xeaf4ff), 1.822 - i * .011, bp.topY(1.80) - .04, s * (.32 + i * .042));
  }
  // flush horseshoe grille on rounded nose
  const gd = PH(0x0b0e14, { shininess: 20 });
  b(.03, .18, .26, gd, 2.045, .31, 0);
  b(.035, .020, .20, A, 2.048, .405, 0);
  for (const s of [-1, 1]) {
    const q = b(.035, .17, .022, A, 2.048, .305, s * .13); q.rotation.x = -s * .07;
    const cTop = b(.035, .05, .022, A, 2.048, .39, s * .115); cTop.rotation.x = s * .65;
  }
  // sleek retractable rear wing, central quad exhaust, diffuser
  b(.34, .025, 1.28, D, -2.34, .95, 0).rotation.z = -.08;
  for (const s of [-1, 1]) strut([-2.22, .85, s * .36], [-2.32, .94, s * .36], .022, D, body);
  tailpipes(c, -2.47, .30, [-.18, -.06, .06, .18], .044, .14);
  for (let i = 0; i < 6; i++) b(.38, .12, .02, D, -2.35, .21, -.45 + i * .18);
  c.mirror(.68, .78);
  return finish(c, [-.60, 1.48, 0], (rain, run) => {
    b(.02, .08, 1.06, PH(0x0b0e14), -2.495, .64, 0);
    b(.025, .032, 1.04, run, -2.502, .64, 0);
    b(.02, .045, .30, rain, -2.505, .56, 0);
  });
}

/* ======================================================================
   KOENIGSEGG Jesko  - teardrop cabin, huge wing on swan-neck struts, carbon splitter, centre exhaust
   livery: m = white, d = carbon, a = lime
   ====================================================================== */
function jesko(L) {
  const c = chassis(L, { fx: 1.12, fr: .34, fw: .26, rx: -1.68, rr: .357, rw: .34, track: .82, seat: 0x1b1d22, seatX: -.2,
    wheel: { n: 5, rim: PH(0x3a3f4a, { shininess: 100, specular: 0x999999 }), cap: BA(0x9dff1a), cal: PH(L.a, { shininess: 80 }) } });
  const { M, D, A, G, b, body } = c;
  const arches = [[1.12, .34], [-1.68, .357]];
  const bp = makeBodyProfile(
    [[-2.46, .76], [-2.05, .88], [-1.68, .92], [-1.10, .88], [-.40, .80], [.35, .75], [.85, .74], [1.12, .75], [1.62, .57], [1.96, .42], [2.14, .32]],
    [[-2.46, .30], [-2.05, .20], [-1.20, .17], [.65, .17], [1.65, .19], [2.14, .22]],
    [[-2.46, .54], [-2.10, .86], [-1.68, .97], [-1.05, .93], [-.30, .88], [.55, .88], [1.12, .94], [1.62, .71], [1.96, .52], [2.14, .34]],
    arches
  );
  body.add(bp.build(M, -2.46, 2.14, .15, (x, w) => w * (x < -1.2 ? .72 : x > 1.3 ? .60 : .78)));
  // carbon side skirts & tucked front splitter with lime ticks
  const sk = makeBodyProfile(
    [[-2.42, .26], [-1.95, .22], [-1.15, .21], [.75, .21], [1.65, .22], [2.18, .23]],
    [[-2.42, .16], [-1.15, .16], [.75, .16], [2.18, .18]],
    [[-2.42, .50], [-1.68, .72], [-.50, .89], [.75, .89], [1.65, .68], [2.18, .36]],
    arches
  );
  body.add(sk.build(D, -2.42, 2.18, .2, (x, w) => w * .92));
  b(.24, .022, .96, D, 2.04, .185, 0);
  b(.16, .016, .04, A, 2.12, .192, 0);
  // recessed hood vent outlined in lime
  b(.44, .014, .46, D, 1.16, bp.topY(1.16) - .002, 0).rotation.z = -.20;
  b(.03, .012, .48, A, 1.38, bp.topY(1.38) + .002, 0).rotation.z = -.22;
  for (const s of [-1, 1]) {
    b(.38, .012, .025, A, 1.18, bp.topY(1.18) + .002, s * .23).rotation.z = -.20;
    b(.14, .015, .04, A, 2.04, .195, s * .43);
    b(.22, .015, .035, A, -1.16, .20, s * .88);
  }
  // teardrop cabin glass + white roof with dark sunroof panel
  const rY = [[-1.30, .86], [-.85, 1.06], [-.40, 1.18], [-.05, 1.21], [.35, 1.13], [.78, .92], [1.08, .74]];
  const rW = [[-1.30, .28], [-.85, .40], [-.40, .46], [-.05, .46], [.35, .44], [.78, .42], [1.08, .38]];
  const gBase = [[-1.30, .78], [-.50, .74], [.35, .72], [1.08, .72]];
  body.add(cabinGlass(rY, rW, gBase, -1.30, 1.08, G));
  const roofCap = makeBodyProfile([[-.75, 1.09], [-.35, 1.195], [.05, 1.215], [.35, 1.14]], [[-.75, 1.04], [-.35, 1.14], [.05, 1.16], [.35, 1.09]], [[-.75, .30], [-.35, .38], [.05, .39], [.35, .35]]);
  body.add(roofCap.build(M, -.75, .35, .14, (x, w) => w * .84));
  b(.42, .016, .42, D, -.12, 1.212, 0);
  // side intake recess + flush headlamps
  for (const s of [-1, 1]) {
    strut([1.04, .74, s * .40], [.35, 1.12, s * .34], .022, M, body);
    const intake = makeBodyProfile([[-1.08, .62], [-.76, .60], [-.46, .54]], [[-1.08, .32], [-.76, .34], [-.46, .38]], [[-1.08, .02], [-.76, .03], [-.46, .02]]);
    const im = intake.build(D, -1.08, -.46, .15, (x, w) => w);
    im.position.z = s * (bp.halfWidth(-.76) - .005); body.add(im);
    const hl = b(.22, .020, .09, BA(0xeaf4ff), 1.68, bp.topY(1.68) - .002, s * .48);
    hl.rotation.y = s * .24; hl.rotation.z = -.24;
  }
  // rear: deep diffuser with fins, big central exhaust, large swan-neck wing
  for (let i = 0; i < 7; i++) b(.44, .14, .022, D, -2.30, .22, -.54 + i * .18);
  tailpipes(c, -2.42, .38, [0], .092, .18);
  const wing = b(.48, .030, 1.82, M, -2.26, 1.36, 0); wing.rotation.z = -.10;
  const flap = b(.20, .025, 1.82, A, -2.52, 1.42, 0); flap.rotation.z = -.32;
  for (const s of [-1, 1]) {
    // swept slim endplates
    const ep = b(.48, .20, .03, D, -2.30, 1.36, s * .91); ep.rotation.z = -.16;
    // swan-neck pylons from engine deck up and over wing
    strut([-1.58, .88, s * .32], [-1.96, 1.24, s * .40], .032, D, body);
    strut([-1.96, 1.24, s * .40], [-2.22, 1.38, s * .40], .032, D, body);
  }
  c.mirror(.68, .75);
  return finish(c, [-.55, 1.48, 0], (rain, run) => {
    for (const s of [-1, 1]) {
      const tl = b(.025, .035, .26, run, -2.445, .68, s * .34); tl.rotation.y = -s * .18;
    }
    b(.025, .04, .24, rain, -2.46, .58, 0);
  });
}

/* ---------- registry used by the game's car selector ---------- */
const DEFS = [
  { id: 'laferrari', name: 'LaFerrari', build: laferrari, ui: '#e10600', liv: { m: '#d40000', d: '#101010', a: '#f2c200' } },
  { id: 'chiron',    name: 'Chiron',    build: chiron,    ui: '#2f7bff', liv: { m: '#1f5fd0', d: '#22366b', a: '#d8dde6' } },
  { id: 'jesko',     name: 'Jesko',     build: jesko,     ui: '#9dff1a', liv: { m: '#eef1f4', d: '#15181d', a: '#9dff1a' } }
];
return { DEFS, laferrari, chiron, jesko };
})();
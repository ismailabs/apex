/* ======================================================================
   HYPERCARS  -  Ferrari LaFerrari, Bugatti Chiron, Koenigsegg Jesko
   Procedural Three.js (r128) models for Apex GP. Same conventions as buildCar():
     +X = forward, +Y = up, Z = across the car, origin on the ground.
     Rear axle sits at x = -1.68 and rear track is 0.82 (matches skid-mark code in fx()).
   Needs these game globals (already defined in index.html):
     THREE, UP, box(), loft(), strut(), tyreMat, visorMat, scene
   Every builder returns the same shape as buildCar():
     { group, body, wheels, pivots, setLivery, rain, helmet, visor, tcam }
   ====================================================================== */
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

/* ---------- shared chassis: wheels, wheel-arch pods, seats, driver, mirrors ---------- */
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
  // fender pod over each wheel: a narrow loft band, centred on the wheel, that hides the top of the tyre
  const pod = (ax, ra, yt, len, mat) => {
    const w = .18, yb = 2 * ra - .1;
    for (const s of [-1, 1]) add([[ax - len, w * .7, yb, yt - .08, w * .4], [ax - len * .4, w, yb, yt, w * .8], [ax + len * .4, w, yb, yt, w * .8], [ax + len, w * .7, yb, yt - .08, w * .4]], mat || M, s * (o.track + .02));
  };
  const seatM = PH(o.seat, { shininess: 20 });
  for (const s of [-1, 1]) {
    b(.36, .1, .36, seatM, o.seatX, .44, s * .3);
    b(.08, .44, .36, seatM, o.seatX - .2, .68, s * .3).rotation.z = -.25;
  }
  b(.04, .2, .24, D, o.seatX + .55, .8, -.3).rotation.z = .5;
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(.13, 14, 10), helmMat); helmet.position.set(o.seatX - .06, .96, -.3); body.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(.134, 14, 8, -.9 + Math.PI, 1.8, 1.15, .5), visorMat); visor.position.copy(helmet.position); body.add(visor);
  const mirror = (x, y, mat) => { for (const s of [-1, 1]) { strut([x, y - .06, s * .86], [x + .03, y, s * 1.0], .02, D, body); b(.1, .07, .17, mat || M, x + .03, y, s * 1.04); } };
  return { g, body, M, D, A, G, add, b, pod, wheels, pivots, helmet, visor, mirror };
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
  const c = chassis(L, { fx: 1.10, fr: .33, fw: .30, rx: -1.68, rr: .357, rw: .38, track: .82, seat: 0x9c1010, seatX: -.2,
    wheel: { n: 5, rim: PH(0xcfd3da, { shininess: 120, specular: 0xffffff }), cap: BA(0xf2c200), cal: PH(0xd01010, { shininess: 80 }) } });
  const { M, D, A, G, add, b, body } = c;
  // floor and diffuser
  add([[-2.5, .68, .17, .24, .68], [-1.7, .9, .17, .24, .9], [1.1, .86, .17, .24, .86], [2.12, .5, .19, .25, .5]], D);
  // main body
  add([[-2.52, .70, .38, .86, .46], [-2.15, .88, .30, .98, .52], [-1.68, .88, .28, 1.0, .55], [-1.15, .86, .27, .90, .50], [-.55, .90, .26, .64, .70],
       [.35, .92, .25, .60, .70], [.95, .88, .26, .56, .66], [1.45, .82, .27, .48, .58], [1.85, .64, .27, .42, .44], [2.16, .42, .27, .36, .30]], M);
  c.pod(-1.68, .357, 1.02, .62); c.pod(1.10, .33, .62, .6);
  // greenhouse: tinted glass, black roof cap
  add([[-1.05, .58, .62, .95, .40], [-.55, .70, .60, 1.06, .46], [.15, .74, .60, 1.08, .46], [.72, .72, .58, .94, .50], [1.22, .66, .56, .64, .50]], G);
  add([[-.62, .44, 1.03, 1.1, .34], [-.15, .50, 1.05, 1.13, .38], [.15, .50, 1.05, 1.13, .38], [.6, .44, .96, 1.04, .34]], D);
  // side intakes and fender vents
  for (const s of [-1, 1]) {
    b(.9, .26, .05, D, -.95, .52, s * .915); b(.5, .16, .05, D, .95, .5, s * .87);
    b(.34, .03, .22, D, 1.55, .495, s * .3); // hood vents
  }
  b(.7, .035, .5, D, 1.2, .565, 0);
  // nose splitter and headlamps
  b(.34, .035, 1.5, D, 2.0, .2, 0);
  for (const s of [-1, 1]) b(.22, .045, .18, BA(0xdbe8f5), 1.74, .43, s * .6).rotation.y = s * .3;
  // rear: mesh grille, tail flap, round lamps, quad pipes, diffuser fins
  b(.05, .22, .8, D, -2.53, .58, 0); b(.4, .03, 1.2, M, -2.38, .97, 0).rotation.z = -.12;
  tailpipes(c, -2.5, .33, [-.5, -.34, .34, .5], .055, .18);
  for (let i = 0; i < 6; i++) b(.5, .13, .025, D, -2.3, .21, -.5 + i * .2);
  c.mirror(.75, .7);
  return finish(c, [-.55, 1.38, 0], (rain, run) => {
    for (const s of [-1, 1]) {
      const l = new THREE.Mesh(new THREE.CircleGeometry(.1, 16), run); l.rotation.y = -Math.PI / 2; l.position.set(-2.535, .66, s * .62); body.add(l);
      const l2 = new THREE.Mesh(new THREE.CircleGeometry(.075, 16), rain); l2.rotation.y = -Math.PI / 2; l2.position.set(-2.54, .66, s * .62); body.add(l2);
    }
    b(.02, .07, .18, rain, -2.54, .46, 0);
  });
}

/* ======================================================================
   BUGATTI Chiron  - tall, two-tone, horseshoe grille, C-line, LED tail bar, big wing
   livery: m = front/lower blue, d = dark navy rear/roof, a = silver C-line and trim
   ====================================================================== */
function chiron(L) {
  const c = chassis(L, { fx: 1.03, fr: .34, fw: .32, rx: -1.68, rr: .356, rw: .38, track: .82, seat: 0xb85a1e, seatX: -.25,
    wheel: { n: 5, dbl: true, rim: PH(0x383d48, { shininess: 110, specular: 0xaaaaaa }), cap: BA(0xb02020), cal: PH(0xc01818, { shininess: 60 }) } });
  const { M, D, A, G, add, b, body } = c;
  add([[-2.5, .66, .17, .24, .66], [-1.7, .92, .17, .24, .92], [1.03, .88, .17, .24, .88], [2.0, .5, .19, .25, .5]], D);
  // rear half in dark navy
  add([[-2.55, .74, .34, .98, .62], [-2.2, .96, .30, 1.05, .72], [-1.68, .96, .28, 1.04, .74], [-1.1, .96, .27, .98, .74], [-.5, .96, .26, .92, .74], [.15, .94, .26, .82, .78]], D);
  // front half in blue
  add([[.15, .94, .26, .82, .78], [.6, .93, .26, .78, .76], [1.03, .88, .27, .70, .70], [1.5, .80, .27, .64, .62], [1.82, .68, .27, .60, .52], [2.0, .50, .27, .56, .40]], M);
  add([[-.55, 1.0, .26, .50, .96], [.15, 1.0, .26, .50, .96]], M); // blue sill
  c.pod(-1.68, .356, 1.07, .64, D); c.pod(1.03, .34, .72, .6, M);
  // greenhouse
  add([[-1.6, .60, .86, .96, .34], [-1.0, .80, .84, 1.12, .50], [-.3, .86, .80, 1.2, .56], [.3, .84, .78, 1.19, .55], [.92, .76, .74, .82, .5]], G);
  add([[-1.0, .40, 1.09, 1.15, .30], [-.3, .50, 1.17, 1.23, .38], [.3, .50, 1.16, 1.22, .38], [.55, .44, 1.1, 1.15, .34]], D);
  // C-line on each side (arc bulging to the rear)
  for (const s of [-1, 1]) {
    let prev = null;
    for (let k = 0; k <= 8; k++) {
      const a = Math.PI * (.5 + k / 8), p = [.2 + Math.cos(a) * .46, .66 + Math.sin(a) * .2, s * .985];
      if (prev) strut(prev, p, .03, A, body); prev = p;
    }
    b(.08, .07, .5, D, -.62, .58, s * .9); // rear side intake
    for (let i = 0; i < 4; i++) b(.045, .05, .05, BA(0xeaf4ff), 1.74 - i * .02, .56, s * (.42 + i * .1));
  }
  // horseshoe grille
  b(.05, .32, .5, D, 2.02, .42, 0);
  b(.06, .04, .5, A, 2.025, .59, 0);
  for (const s of [-1, 1]) { const q = b(.06, .36, .04, A, 2.025, .41, s * .3); q.rotation.x = -s * .12; }
  b(.4, .035, 1.5, D, 1.95, .2, 0);
  // rear wing, pylons, central quad exhaust
  const w = b(.55, .04, 1.55, D, -2.38, 1.12, 0); w.rotation.z = -.1;
  for (const s of [-1, 1]) { b(.6, .26, .035, D, -2.38, 1.12, s * .78); strut([-2.15, .98, s * .4], [-2.3, 1.1, s * .4], .03, D, body); }
  tailpipes(c, -2.56, .4, [-.2, -.07, .07, .2], .05, .18);
  for (let i = 0; i < 6; i++) b(.5, .15, .025, D, -2.35, .22, -.5 + i * .2);
  c.mirror(.72, .78);
  return finish(c, [-.7, 1.62, 0], (rain, run) => {
    b(.03, .05, 1.3, run, -2.56, .66, 0);
    for (const s of [-1, 1]) b(.03, .1, .26, run, -2.56, .66, s * .6);
    b(.03, .05, .5, rain, -2.565, .6, 0);
  });
}

/* ======================================================================
   KOENIGSEGG Jesko  - teardrop cabin, huge wing on swan-neck struts, carbon splitter, centre exhaust
   livery: m = white, d = carbon, a = lime
   ====================================================================== */
function jesko(L) {
  const c = chassis(L, { fx: 1.12, fr: .34, fw: .30, rx: -1.68, rr: .357, rw: .38, track: .82, seat: 0x1b1d22, seatX: -.2,
    wheel: { n: 5, rim: PH(0x3a3f4a, { shininess: 100, specular: 0x999999 }), cap: BA(0x9dff1a), cal: PH(L.a, { shininess: 80 }) } });
  const { M, D, A, G, add, b, body } = c;
  add([[-2.45, .62, .17, .24, .62], [-1.7, .9, .17, .24, .9], [1.12, .86, .17, .24, .86], [2.1, .46, .19, .25, .46]], D);
  add([[-2.45, .72, .34, .78, .5], [-2.0, .90, .30, .96, .60], [-1.55, .94, .28, 1.0, .66], [-.95, .92, .27, .94, .62], [-.3, .92, .26, .68, .66],
       [.4, .92, .25, .62, .66], [1.0, .88, .26, .56, .60], [1.5, .78, .27, .46, .50], [1.85, .58, .27, .38, .38], [2.1, .38, .28, .32, .26]], M);
  c.pod(-1.68, .357, 1.0, .62); c.pod(1.12, .34, .64, .6);
  // teardrop greenhouse with body-colour roof and a dark glass panel
  add([[-1.2, .50, .84, .98, .30], [-.7, .70, .70, 1.18, .42], [-.1, .76, .66, 1.215, .46], [.5, .72, .62, 1.1, .42], [1.05, .62, .58, .72, .40]], G);
  add([[-.7, .40, 1.15, 1.2, .30], [-.1, .46, 1.185, 1.235, .34], [.5, .42, 1.07, 1.12, .30]], M);
  b(.5, .012, .5, D, -.12, 1.245, 0);
  // front splitter, side skirts, vents, lime accents
  b(.62, .035, 1.72, D, 2.0, .2, 0);
  for (const s of [-1, 1]) {
    b(.03, .04, .5, A, 2.3, .22, s * .62); b(1.9, .06, .06, D, 0, .23, s * .97); b(.3, .03, .05, A, .8, .21, s * .98);
    b(.7, .26, .05, D, -.75, .5, s * .935); b(.4, .03, .1, A, -.75, .66, s * .93);
    b(.46, .012, .03, A, 1.12, .55, s * .27);
    for (const q of [-.5, 0]) b(.03, .05, .06, BA(0xeaf4ff), 1.66 + q * 0, .44, s * (.6 + q * .05)).rotation.y = s * .3;
  }
  b(.5, .02, .5, D, 1.12, .545, 0);
  // rear: diffuser fins, centre pipe, slim tail lamps
  for (let i = 0; i < 7; i++) b(.55, .15, .025, D, -2.35, .22, -.6 + i * .2);
  tailpipes(c, -2.46, .42, [0], .1, .22);
  // big rear wing on swan-neck struts, tall endplates
  const wing = b(.64, .035, 1.92, M, -2.3, 1.36, 0); wing.rotation.z = -.1;
  const flap = b(.26, .03, 1.92, A, -2.62, 1.43, 0); flap.rotation.z = -.35;
  for (const s of [-1, 1]) {
    b(.75, .5, .04, D, -2.35, 1.34, s * .96);
    strut([-2.0, .94, s * .5], [-2.18, 1.2, s * .5], .035, D, body); strut([-2.18, 1.2, s * .5], [-2.3, 1.34, s * .5], .035, D, body);
  }
  c.mirror(.7, .76);
  return finish(c, [-.65, 1.62, 0], (rain, run) => {
    for (const s of [-1, 1]) b(.03, .05, .42, run, -2.45, .74, s * .52);
    b(.03, .04, .3, rain, -2.47, .66, 0);
  });
}

/* ---------- registry used by the game's car selector ---------- */
const DEFS = [
  { id: 'laferrari', name: 'LaFerrari', build: laferrari, ui: '#e10600', liv: { m: '#d40000', d: '#101010', a: '#f2c200' } },
  { id: 'chiron',    name: 'Chiron',    build: chiron,    ui: '#2f7bff', liv: { m: '#1f5fd0', d: '#1a2d5c', a: '#d8dde6' } },
  { id: 'jesko',     name: 'Jesko',     build: jesko,     ui: '#9dff1a', liv: { m: '#eef1f4', d: '#15181d', a: '#9dff1a' } }
];
return { DEFS, laferrari, chiron, jesko };
})();

// Procedural glass-cube tunnel rendered with raw WebGL2: instanced cubes, screen-space
// refraction, two-level bloom, radial zoom blur and a white-out handoff to the next scene.
import { HERO_SPLIT } from "../lib/timeline.js";
import { MEDIA } from "../config/breakpoints.ts";

export const TUNNEL_QUALITY = Object.freeze({
  high: {
    cell: 1,
    samples: 10,
    dpr: 2,
    outer: 0.85,
    layers: 2,
    disp: 1,
    bounce: 1,
    mips: 1,
  },
  mid: {
    cell: 1.2,
    samples: 7,
    dpr: 1.5,
    outer: 0.8,
    layers: 2,
    disp: 1,
    bounce: 0,
    mips: 0,
  },
  low: {
    cell: 1.5,
    samples: 5,
    dpr: 1.25,
    outer: 0.75,
    layers: 1,
    disp: 0,
    bounce: 0,
    mips: 0,
  },
});
export function buildTunnelGeometry(r = "high") {
  const e = TUNNEL_QUALITY[r];
  if (!e) throw new Error("Unknown tunnel quality: " + r);
  const t = 4,
    n = 96,
    s = 6,
    o = n - s,
    c = 0.12,
    h = 0.65,
    p = 1,
    m = 1.9,
    y = [
      [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      [
        [-1, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
      ],
      [
        [0, 1, 0],
        [0, 0, 1],
        [1, 0, 0],
      ],
      [
        [0, -1, 0],
        [1, 0, 0],
        [0, 0, 1],
      ],
      [
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, -1],
        [0, 1, 0],
        [1, 0, 0],
      ],
    ],
    v = [];
  for (const [ee, ie, oe] of y) {
    const Z = (se, ye) =>
        [0, 1, 2].map((Ce) => 0.5 * (ee[Ce] + se * ie[Ce] + ye * oe[Ce])),
      le = [Z(-1, -1), Z(1, -1), Z(1, 1), Z(-1, 1)];
    for (const se of [0, 1, 2, 0, 2, 3]) v.push(...le[se], ...ee);
  }
  let x = 1337;
  const A = () => ((x = (x * 1664525 + 1013904223) >>> 0), x / 4294967296),
    E = [],
    R = (ee, ie, oe, Z, le, se, ye, Ce, ot, dt) =>
      E.push(ee, ie, oe, Z, le, se, ye, Ce, ot, dt),
    C = (ee, ie, oe) =>
      ee === 0
        ? [ie, oe]
        : ee === 1
          ? [ie, -oe]
          : ee === 2
            ? [oe, ie]
            : [-oe, ie],
    M = e.cell,
    B = t - h - 0.15,
    I = Math.round(n / M),
    D = Math.round((2 * B) / M),
    F = (2 * B) / D,
    O = new Set();
  for (const [oe, Z] of [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]) {
    let le = 0;
    for (; le < I;) {
      if (A() < 0.42 && le + 2 <= I) {
        const Q = A() < 0.5,
          Ee = Q ? (Z > 0 ? 0 : 1) : oe > 0 ? 2 : 3,
          he = Q ? oe : Z,
          ge = he > 0 ? D - 1 : 0;
        (O.add(Ee + ":" + ge + ":" + le),
          O.add(Ee + ":" + ge + ":" + (le + 1)));
        const je = 2 * M - c,
          ft = B - F + c / 2 + 0.02,
          rt = h - A() * 0.2,
          [Xe, it] = C(Ee, he * (ft + je / 2), t + je / 2 - rt);
        (R(
          Xe,
          it,
          (le + 1) * M,
          je,
          je,
          je,
          A(),
          1 + Ee * 0.1,
          0.3 + A() * 0.7,
          A() * 0.8,
        ),
          (le += 2));
        continue;
      }
      const se = Math.min(I - le, 2 + Math.floor(A() * 3)),
        ye = se * M,
        Ce = [];
      let ot = 0;
      for (;;) {
        const Q = 0.8 + Math.pow(A(), 1.6) * 1.5999999999999999;
        if (ot + Q + c > ye) break;
        (Ce.push(Q), (ot += Q + c));
      }
      Ce.length || (Ce.push(Math.min(ye - c, 2.4)), (ot = Ce[0] + c));
      const dt = (ye - ot) / Ce.length;
      let St = le * M;
      for (const Q of Ce) {
        const Ee = Q + c + dt,
          he = Math.max(0, Math.min(0.9, Q * 0.5, 2.8 - Q)),
          ge = A() * he,
          je = Math.min(he, Math.max(0, ge + (A() - 0.5) * 0.8));
        (R(
          oe * (B + c + ge + Q / 2),
          Z * (B + c + je + Q / 2),
          St + Ee / 2,
          Q,
          Q,
          Q,
          A(),
          1.4,
          0.3 + A() * 0.7,
          A() * 0.8,
        ),
          (St += Ee));
      }
      le += se;
    }
  }
  for (let ee = 0; ee < 4; ee++) {
    const ie = D,
      oe = F,
      Z = -B,
      le = new Uint8Array(ie * I);
    for (const se of O) {
      const [ye, Ce, ot] = se.split(":").map(Number);
      ye === ee && (le[ot * ie + Ce] = 2);
    }
    for (let se = 0; se < I; se++)
      for (let ye = 0; ye < ie; ye++) {
        if (le[se * ie + ye] || A() < 0.08) continue;
        let Ce = 1;
        A() < 0.09 &&
          ye + 1 < ie &&
          se + 1 < I &&
          !le[se * ie + ye + 1] &&
          !le[(se + 1) * ie + ye] &&
          !le[(se + 1) * ie + ye + 1] &&
          ((Ce = 2),
          (le[se * ie + ye + 1] =
            le[(se + 1) * ie + ye] =
            le[(se + 1) * ie + ye + 1] =
              1));
        const ot = Ce * Math.min(M, oe) - c,
          dt = Math.min(ot, m) * (0.6 + 0.4 * A()),
          St = (ot - dt) / 2,
          Q = Z + (ye + Ce / 2) * oe + (A() * 2 - 1) * St,
          Ee = (se + Ce / 2) * M + (A() * 2 - 1) * St,
          he = A() * h,
          [ge, je] = C(ee, Q, t + dt / 2 - he),
          ft = (e.layers === 2 && he > 0.3 ? 5 : 1) + ee * 0.1;
        R(ge, je, Ee, dt, dt, dt, A(), ft, A(), A());
      }
  }
  const G = 2.4,
    H = t + 3.6,
    U = Math.round(n / G);
  for (let ee = 0; ee < 4; ee++) {
    const ie = ee < 2 ? H - 0.1 : H + G,
      oe = Math.floor((2 * ie) / G),
      Z = (-oe * G) / 2;
    for (let le = 0; le < U; le++)
      for (let se = 0; se < oe; se++) {
        if (A() > e.outer) continue;
        const ye = 1.5 + A() * 0.7,
          Ce = (G - 0.2 - ye) / 2,
          [ot, dt] = C(
            ee,
            Z + (se + 0.5) * G + (A() * 2 - 1) * Ce,
            H + ye / 2 + A() * 0.5,
          );
        R(
          ot,
          dt,
          (le + 0.5) * G + (A() * 2 - 1) * Ce,
          ye,
          ye,
          ye,
          A(),
          0,
          A(),
          A(),
        );
      }
  }
  const L = t - h - 0.2,
    W = 0.045;
  for (let ee = 4; ee < n; ee += 8) {
    const ie = A();
    (R(0, L, ee, L * 2 + W, W, W, ie, 2, 0, 0),
      R(0, -L, ee, L * 2 + W, W, W, ie, 2, 0, 0),
      R(L, 0, ee, W, L * 2 + W, W, ie, 2, 0, 0),
      R(-L, 0, ee, W, L * 2 + W, W, ie, 2, 0, 0));
  }
  R(0, 0, -o, t * 1.9, t * 1.9, 0.1, 0, 4, 0, 0);
  const q = E.length / 10;
  return {
    cube: v,
    inst: E,
    instCount: q,
    R: t,
    ZLEN: n,
    NEAR_Z: s,
    ZFAR: o,
    DMAX: p,
  };
}
const smoothstep = (r, e, t) => {
    const n = Math.max(0, Math.min(1, (t - r) / (e - r)));
    return n * n * (3 - 2 * n);
  };
export function tunnelState(r) {
  const e = smoothstep(0.83, 0.971, r);
  return {
    active: r >= HERO_SPLIT && r < 1,
    opacity: r >= HERO_SPLIT ? 1 - smoothstep(0.98, 1, r) : 0,
    flight: e,
    cameraDistance: e * 89.3,
    whiteOut: smoothstep(0.935, 0.972, r),
  };
}
export function createTunnelRenderer(r, e = {}) {
  const t = r.getContext("webgl2", {
    antialias: !1,
    alpha: !1,
    depth: !1,
    stencil: !1,
    powerPreference: "high-performance",
    preserveDrawingBuffer: !1,
  });
  if (!t) throw new Error("WebGL2 is unavailable");
  const n = new Map();
  function s(I, D) {
    if (!D) throw new Error("Cannot allocate WebGL " + I);
    return (n.has(I) || n.set(I, new Set()), n.get(I).add(D), D);
  }
  function o(I, D) {
    (t["delete" + I](D), n.get(I)?.delete(D));
  }
  function c() {
    for (const [I, D] of n) for (const F of D) t["delete" + I](F);
    n.clear();
  }
  try {
    let he = function (Ge, st) {
        const ze = s("Shader", t.createShader(Ge));
        if (
          (t.shaderSource(ze, st),
          t.compileShader(ze),
          !t.getShaderParameter(ze, t.COMPILE_STATUS))
        )
          throw new Error(t.getShaderInfoLog(ze));
        return ze;
      },
      ge = function (Ge, st, ze) {
        const Oe = s("Program", t.createProgram()),
          pt = he(t.VERTEX_SHADER, Ge),
          It = he(t.FRAGMENT_SHADER, st);
        if (
          (t.attachShader(Oe, pt),
          t.attachShader(Oe, It),
          t.linkProgram(Oe),
          !t.getProgramParameter(Oe, t.LINK_STATUS))
        )
          throw new Error(t.getProgramInfoLog(Oe));
        (o("Shader", pt), o("Shader", It));
        const en = {};
        for (const qt of ze) en[qt] = t.getUniformLocation(Oe, qt);
        return { p: Oe, u: en };
      },
      Ue = function (Ge, st, ze, Oe) {
        const pt = s("Texture", t.createTexture());
        (t.bindTexture(t.TEXTURE_2D, pt),
          Ve
            ? t.texImage2D(
                t.TEXTURE_2D,
                0,
                t.RGBA16F,
                Ge,
                st,
                0,
                t.RGBA,
                t.HALF_FLOAT,
                null,
              )
            : t.texImage2D(
                t.TEXTURE_2D,
                0,
                t.RGBA8,
                Ge,
                st,
                0,
                t.RGBA,
                t.UNSIGNED_BYTE,
                null,
              ),
          Oe && t.generateMipmap(t.TEXTURE_2D),
          t.texParameteri(
            t.TEXTURE_2D,
            t.TEXTURE_MIN_FILTER,
            Oe ? t.LINEAR_MIPMAP_LINEAR : t.LINEAR,
          ),
          t.texParameteri(t.TEXTURE_2D, t.TEXTURE_MAG_FILTER, t.LINEAR),
          t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_S, t.CLAMP_TO_EDGE),
          t.texParameteri(t.TEXTURE_2D, t.TEXTURE_WRAP_T, t.CLAMP_TO_EDGE));
        const It = s("Framebuffer", t.createFramebuffer());
        if (
          (t.bindFramebuffer(t.FRAMEBUFFER, It),
          t.framebufferTexture2D(
            t.FRAMEBUFFER,
            t.COLOR_ATTACHMENT0,
            t.TEXTURE_2D,
            pt,
            0,
          ),
          ze &&
            t.framebufferRenderbuffer(
              t.FRAMEBUFFER,
              t.DEPTH_ATTACHMENT,
              t.RENDERBUFFER,
              ze,
            ),
          t.checkFramebufferStatus(t.FRAMEBUFFER) !== t.FRAMEBUFFER_COMPLETE)
        )
          throw new Error("Incomplete tunnel framebuffer");
        return { tex: pt, fbo: It, w: Ge, h: st };
      },
      nt = function (Ge) {
        (o("Texture", Ge.tex), o("Framebuffer", Ge.fbo));
      },
      k = function () {
        const Ge = Math.min(window.devicePixelRatio || 1, U.dpr) * J,
          st = Math.max(2, Math.round(r.clientWidth * Ge)),
          ze = Math.max(2, Math.round(r.clientHeight * Ge));
        if (st === Et && ze === Ot) return;
        ((Et = st),
          (Ot = ze),
          (r.width = st),
          (r.height = ze),
          He && (Object.values(He).forEach(nt), o("Renderbuffer", ct)),
          (ct = s("Renderbuffer", t.createRenderbuffer())),
          t.bindRenderbuffer(t.RENDERBUFFER, ct),
          t.renderbufferStorage(t.RENDERBUFFER, t.DEPTH_COMPONENT24, st, ze));
        const Oe = Math.max(2, st >> 2),
          pt = Math.max(2, ze >> 2),
          It = Math.max(2, st >> 3),
          en = Math.max(2, ze >> 3);
        He = {
          sa: Ue(st, ze, ct, U.mips),
          sb: Ue(st, ze, ct, U.mips),
          a1: Ue(Oe, pt),
          a2: Ue(Oe, pt),
          b1: Ue(It, en),
          b2: Ue(It, en),
        };
      },
      _e = function (Ge, st, ze, Oe) {
        const pt = 1 / Math.tan(Ge / 2),
          It = 1 / (ze - Oe);
        return [
          pt / st,
          0,
          0,
          0,
          0,
          pt,
          0,
          0,
          0,
          0,
          (Oe + ze) * It,
          -1,
          0,
          0,
          2 * Oe * ze * It,
          0,
        ];
      },
      Ne = function (Ge, st) {
        let ze = Ge[0] - st[0],
          Oe = Ge[1] - st[1],
          pt = Ge[2] - st[2],
          It = Math.hypot(ze, Oe, pt);
        ((ze /= It), (Oe /= It), (pt /= It));
        let en = pt,
          qt = 0,
          xn = -ze;
        ((It = Math.hypot(en, qt, xn)), (en /= It), (xn /= It));
        const ni = Oe * xn - pt * qt,
          Ri = pt * en - ze * xn,
          Cr = ze * qt - Oe * en;
        return [
          en,
          ni,
          ze,
          0,
          qt,
          Ri,
          Oe,
          0,
          xn,
          Cr,
          pt,
          0,
          -(en * Ge[0] + qt * Ge[1] + xn * Ge[2]),
          -(ni * Ge[0] + Ri * Ge[1] + Cr * Ge[2]),
          -(ze * Ge[0] + Oe * Ge[1] + pt * Ge[2]),
          1,
        ];
      },
      We = function (Ge, st) {
        const ze = new Float32Array(16);
        for (let Oe = 0; Oe < 4; Oe++)
          for (let pt = 0; pt < 4; pt++)
            ze[Oe * 4 + pt] =
              Ge[pt] * st[Oe * 4] +
              Ge[4 + pt] * st[Oe * 4 + 1] +
              Ge[8 + pt] * st[Oe * 4 + 2] +
              Ge[12 + pt] * st[Oe * 4 + 3];
        return ze;
      },
      _t = function (Ge, st, ze) {
        (t.bindFramebuffer(t.FRAMEBUFFER, st ? st.fbo : null),
          t.viewport(0, 0, st ? st.w : Et, st ? st.h : Ot),
          t.useProgram(Ge.p),
          ze(Ge.u),
          t.drawArrays(t.TRIANGLES, 0, 3));
      },
      lt = function (Ge, st) {
        (t.activeTexture(t.TEXTURE0 + Ge), t.bindTexture(t.TEXTURE_2D, st));
      },
      Rt = function (Ge, st) {
        (t.bindFramebuffer(t.READ_FRAMEBUFFER, Ge.fbo),
          t.bindFramebuffer(t.DRAW_FRAMEBUFFER, st.fbo),
          t.blitFramebuffer(
            0,
            0,
            Et,
            Ot,
            0,
            0,
            Et,
            Ot,
            t.COLOR_BUFFER_BIT,
            t.NEAREST,
          ));
      },
      we = function (Ge, st = {}) {
        if (Nt || t.isContextLost()) return;
        const ze = Bt === null ? 16.67 : Ge - Bt;
        Bt = Ge;
        const Oe = Math.min(ze, 100) / 1e3;
        ((tt += Oe * pe), (mt += Oe * 2.2 * pe));
        const pt = tunnelState(st.page ?? 0),
          It = st.pointer || { x: 0, y: 0, z: 0 };
        ((Me.energy = Math.min(
          1,
          Me.energy + Math.hypot(It.x - Me.tx, It.y - Me.ty) * 2.5,
        )),
          (Me.tx = It.x),
          (Me.ty = It.y),
          (Me.targetActive = It.z || 0),
          ze < 200 && (At += (ze - At) * 0.05),
          ++gt % 45 === 0 &&
            gt > 60 &&
            (At > 21 && J > 0.5
              ? (J = Math.max(0.5, J - 0.125))
              : At < 11 &&
                J < 1 &&
                zt < 3 &&
                ((J = Math.min(1, J + 0.125)), zt++),
            (r.dataset.fps = (1e3 / At).toFixed(0)),
            (r.dataset.renderScale = J.toFixed(2)),
            (r.dataset.bufferSize = `${Et}×${Ot}`)),
          k());
        const en = 1 - Math.exp(-Oe * 7);
        ((Me.x += (Me.tx - Me.x) * en),
          (Me.y += (Me.ty - Me.y) * en),
          (Me.active +=
            (Me.targetActive - Me.active) * (1 - Math.exp(-Oe * 4))),
          (Me.energy *= Math.exp(-Oe * 1.4)));
        const qt = Me.active * (0.6 + 0.4 * Me.energy),
          xn = Et / Ot,
          ni = (62 * Math.PI) / 180,
          Ri = xn >= 1 ? ni : 2 * Math.atan(Math.tan(ni / 2) / xn),
          Cr = 1 - pt.flight,
          Wi = [
            (Me.x * 0.55 + Math.sin(tt * 0.23) * 0.12) * Cr,
            (Me.y * 0.4 + Math.cos(tt * 0.19) * 0.1) * Cr,
            -pt.cameraDistance,
          ],
          Ga = Math.min(Ri, 2.3),
          Gi = We(_e(Ga, xn, 0.1, 220), Ne(Wi, [0, 0, -le])),
          er = (2 * Math.tan(Ga / 2)) / Math.max(1, r.clientHeight),
          jt = Gi[11] * -le + Gi[15],
          tr = ((Gi[8] * -le + Gi[12]) / jt) * 0.5 + 0.5,
          aa = ((Gi[9] * -le + Gi[13]) / jt) * 0.5 + 0.5,
          P = (Ae, Fe) => {
            const ut = Ae.u;
            (t.useProgram(Ae.p),
              t.uniformMatrix4fv(ut.uVP, !1, Gi),
              t.uniform1f(ut.uTime, tt),
              t.uniform1f(ut.uScroll, mt),
              t.uniform1f(ut.uAspect, xn),
              t.uniform1f(ut.uMouseK, qt),
              t.uniform1f(ut.uPxWorld, er),
              t.uniform2f(ut.uMouse, Me.x, Me.y),
              t.uniform3f(ut.uCam, Wi[0], Wi[1], Wi[2]),
              t.uniform1i(ut.uPass, Fe));
          },
          Y = () => t.drawArraysInstanced(t.TRIANGLES, 0, 36, ee),
          de = (Ae, Fe, ut) => {
            (U.mips &&
              (t.activeTexture(t.TEXTURE0),
              t.bindTexture(t.TEXTURE_2D, Fe.tex),
              t.generateMipmap(t.TEXTURE_2D)),
              Rt(Fe, Ae),
              t.bindFramebuffer(t.FRAMEBUFFER, Ae.fbo),
              P(rt, ut),
              lt(0, Fe.tex),
              t.uniform1i(rt.u.uBG, 0),
              t.uniform2f(rt.u.uRes, Et, Ot),
              Y());
          };
        (t.bindVertexArray(et),
          t.bindFramebuffer(t.FRAMEBUFFER, He.sa.fbo),
          t.viewport(0, 0, Et, Ot),
          t.clearColor(0.004, 0.02, 0.07, 1),
          t.depthMask(!0),
          t.clear(t.COLOR_BUFFER_BIT | t.DEPTH_BUFFER_BIT),
          t.enable(t.DEPTH_TEST),
          t.enable(t.CULL_FACE),
          t.disable(t.BLEND),
          P(ft, 0),
          Y(),
          de(He.sb, He.sa, 2));
        let Re = He.sb;
        (U.layers === 2 && (de(He.sa, He.sb, 3), (Re = He.sa)),
          t.disable(t.DEPTH_TEST),
          t.disable(t.CULL_FACE),
          t.bindVertexArray(Ye),
          _t(Xe, He.a1, (Ae) => {
            (lt(0, Re.tex),
              t.uniform1i(Ae.uTex, 0),
              t.uniform2f(Ae.uTexel, 1 / Et, 1 / Ot),
              t.uniform1f(Ae.uThresh, 0.6));
          }),
          _t(it, He.a2, (Ae) => {
            (lt(0, He.a1.tex),
              t.uniform1i(Ae.uTex, 0),
              t.uniform2f(Ae.uDir, 1 / He.a1.w, 0));
          }),
          _t(it, He.a1, (Ae) => {
            (lt(0, He.a2.tex),
              t.uniform1i(Ae.uTex, 0),
              t.uniform2f(Ae.uDir, 0, 1 / He.a1.h));
          }),
          _t(Xe, He.b1, (Ae) => {
            (lt(0, He.a1.tex),
              t.uniform1i(Ae.uTex, 0),
              t.uniform2f(Ae.uTexel, 0.5 / He.a1.w, 0.5 / He.a1.h),
              t.uniform1f(Ae.uThresh, 0));
          }),
          _t(it, He.b2, (Ae) => {
            (lt(0, He.b1.tex),
              t.uniform1i(Ae.uTex, 0),
              t.uniform2f(Ae.uDir, 1.6 / He.b1.w, 0));
          }),
          _t(it, He.b1, (Ae) => {
            (lt(0, He.b2.tex),
              t.uniform1i(Ae.uTex, 0),
              t.uniform2f(Ae.uDir, 0, 1.6 / He.b1.h));
          }),
          _t(ne, null, (Ae) => {
            (lt(0, Re.tex),
              lt(1, He.a1.tex),
              lt(2, He.b1.tex),
              t.uniform1i(Ae.uScene, 0),
              t.uniform1i(Ae.uBloomA, 1),
              t.uniform1i(Ae.uBloomB, 2),
              t.uniform2f(Ae.uCenter, tr, aa),
              t.uniform1f(Ae.uAspect, xn),
              t.uniform1f(Ae.uTime, tt));
            const Fe = L ? 0 : Math.min(1, (st.speed || 0) / 3) * pt.flight;
            (t.uniform1f(Ae.uZoomBlur, (0.16 + Fe * 0.14) * (L ? 0.25 : 1)),
              t.uniform1f(
                Ae.uAberration,
                (0.085 + Fe * 0.045) * (L ? 0.25 : 1),
              ),
              t.uniform1f(Ae.uWhiteOut, pt.whiteOut));
          }));
      };
    var h = he,
      p = ge,
      m = Ue,
      y = nt,
      v = k,
      x = _e,
      A = Ne,
      E = We,
      R = _t,
      C = lt,
      M = Rt,
      B = we;
    const I = matchMedia(MEDIA.coarsePointer).matches,
      D = Math.min(screen.width, screen.height),
      F = navigator.deviceMemory || 4,
      O = navigator.hardwareConcurrency || 4;
    let G = "high";
    (I && D < 600 ? (G = "low") : I && (G = "mid"),
      (F <= 2 || O <= 2) && (G = "low"));
    const H = e.tier || (location.hash.match(/stats-(high|mid|low)/) || [])[1];
    H && (G = H);
    const U = TUNNEL_QUALITY[G],
      L = matchMedia(MEDIA.reducedMotion).matches;
    r.dataset.qualityTier = G;
    const {
        cube: W,
        inst: q,
        instCount: ee,
        R: ie,
        ZLEN: oe,
        NEAR_Z: Z,
        ZFAR: le,
        DMAX: se,
      } = buildTunnelGeometry(G),
      ye = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPos;
  layout(location=1) in vec3 aNor;
  layout(location=2) in vec3 iPos;
  layout(location=3) in vec3 iScale;
  layout(location=4) in vec4 iParam;   // seed, type, seed2, phase
  uniform mat4 uVP;
  uniform vec3 uCam;
  uniform float uTime, uScroll, uAspect, uMouseK, uPxWorld;
  uniform vec2 uMouse;
  uniform int uPass;
  out vec3 vPos; out vec3 vNor; out vec3 vLocal; out vec4 vParam;
  flat out vec3 vEyeL; flat out vec4 vCS;
  const float ZLEN = ${oe.toFixed(1)}, NEAR_Z = ${Z.toFixed(1)}, DMAX = ${se.toFixed(2)};
  void main(){
    float type = iParam.y;
    int want = type < 0.5 ? 0 : type < 1.5 ? 2 : type < 4.5 ? 0 : 3;
    if (uPass != want) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
    vec3 c = iPos;
    float s = 1.0;
    bool glass = (type > 0.5 && type < 1.5) || type > 4.5;
    if (type < 2.5 || type > 4.5) {
      c.z = mod(iPos.z + uScroll, ZLEN) - ZLEN + NEAR_Z;
      s = smoothstep(0.0, 10.0, c.z + ZLEN - NEAR_Z);
    }
    if (glass) {
      // each cube only slides along its own wall normal, away from the tunnel axis,
      // so it can never run into a neighbour, a frame or the next wall
      int wall = int(floor(fract(type) * 10.0 + 0.5));
      vec3 wn = wall == 0 ? vec3(0.0, 1.0, 0.0) : wall == 1 ? vec3(0.0, -1.0, 0.0) : wall == 2 ? vec3(1.0, 0.0, 0.0) : wall == 3 ? vec3(-1.0, 0.0, 0.0) : vec3(sign(c.x), sign(c.y), 0.0) * 0.7071;   // 4 = corner cube, slides along the diagonal
      bool corner = wall >= 4;
      c += wn * sin(uTime * 0.6 + iParam.x * 40.0) * (corner ? 0.03 : 0.05);
      vec4 clip = uVP * vec4(c, 1.0);
      vec2 d = (clip.xy / max(clip.w, 0.001) - uMouse) * vec2(uAspect, 1.0);
      float infl = exp(-dot(d, d) * 5.0) * step(0.0, clip.w) * uMouseK;
      float px = infl * mix(20.0, 60.0, iParam.x);          // 20-60 CSS px per cube
      float shift = min(px * clip.w * uPxWorld, DMAX);
      // about one corner cube in four dips slightly inward instead; the limit keeps it clear of walls and frames
      if (corner && fract(iParam.x * 7.3) < 0.24) shift = -min(shift, 0.11);
      c += wn * shift;
    }
    float size = max(iScale.x * s, 0.001);
    vec3 world = c + aPos * iScale * s;
    vPos = world; vNor = aNor; vLocal = aPos; vParam = iParam;
    vCS = vec4(c, size);
    vEyeL = (uCam - c) / size;
    gl_Position = uVP * vec4(world, 1.0);
  }`,
      Ce = `#version 300 es
  precision highp float;
  in vec3 vPos; in vec3 vNor; in vec3 vLocal; in vec4 vParam;
  uniform vec3 uCam;
  uniform float uTime;
  out vec4 o;
  const float ZFAR = ${le.toFixed(1)};
  float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  void main(){
    float type = vParam.y;
    float seed = vParam.x, seed2 = vParam.z;
    vec3 V = uCam - vPos; float dist = length(V); V /= dist;
    float fog = smoothstep(22.0, ZFAR, dist);
    vec3 fogCol = vec3(0.22, 0.72, 1.0) * 1.6;

    if (type > 3.5) {                       // portal
      vec2 q = abs(vLocal.xy) * 2.0;
      float rim = smoothstep(0.86, 1.0, max(q.x, q.y));
      o = vec4(vec3(2.6, 3.4, 4.2) + rim * vec3(1.0, 2.5, 4.0), 1.0); return;
    }
    if (type > 1.5) {                       // neon frame
      vec3 col = vec3(0.45, 0.9, 1.0) * (1.7 + 0.5 * sin(uTime * 1.3 + seed * 20.0));
      o = vec4(mix(col, fogCol * 1.4, fog * 0.6) * smoothstep(1.0, -16.0, vPos.z), 1.0); return;
    }

    // opaque backing blocks behind the glass: they are what the glass refracts
    vec3 N = normalize(vNor);
    vec3 L = vec3(0.0, 0.0, -ZFAR) - vPos; float dp = length(L); L /= dp;
    float att = 1.0 / (1.0 + dp * dp * 0.0006);
    float diff = max(dot(N, L) * 0.8 + 0.2, 0.0);
    vec3 a = abs(vLocal);
    float mx = max(a.x, max(a.y, a.z)), mn = min(a.x, min(a.y, a.z));
    float edge = smoothstep(0.44, 0.5, a.x + a.y + a.z - mx - mn);
    float panel = hash(floor(vPos * 2.0 + N * 0.5));
    vec3 tint = mix(vec3(0.02, 0.16, 0.50), vec3(0.16, 0.72, 1.0), seed);
    vec3 col = tint * (0.10 + diff * att * 3.2) * (0.55 + 0.9 * panel);
    col *= mix(0.18, 1.0, step(0.25, seed2));
    col += vec3(0.35, 0.85, 1.0) * edge * (0.25 + att * 2.2);
    col = mix(col, fogCol, fog * fog);
    o = vec4(col, 1.0);
  }`,
      ot = `#version 300 es
  precision highp float;
  #define DISP ${U.disp}
  #define BOUNCE ${U.bounce}
  in vec3 vPos; in vec3 vLocal; in vec4 vParam;
  flat in vec3 vEyeL; flat in vec4 vCS;
  uniform sampler2D uBG;
  uniform mat4 uVP;
  uniform vec3 uCam;
  uniform vec2 uRes;
  out vec4 o;
  const float ZFAR = ${le.toFixed(1)};
  const float IOR = 1.5;
  const vec3 ABSORB = vec3(1.9, 0.55, 0.09);          // blue glass: red is absorbed first, blue last

  float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }

  // rounded-box normal: flat on faces, turning over the chamfer near edges
  vec3 bevelN(vec3 p){ vec3 q = min(abs(p) * 2.0, 1.0); return normalize(sign(p) * pow(q, vec3(16.0))); }

  // distance from a point inside the unit cube to where the ray leaves it
  float boxExit(vec3 ro, vec3 rd){
    rd = mix(rd, vec3(1e-4), lessThan(abs(rd), vec3(1e-4)));
    vec3 t = (sign(rd) * 0.5 - ro) / rd;
    return max(min(t.x, min(t.y, t.z)), 0.0);
  }

  // what the glass mirrors: the portal glow down the tunnel plus blocky hints of neighbouring cubes
  vec3 env(vec3 d, float att){
    float m = max(-d.z, 0.0);
    float blocks = step(0.62, hash(floor(d * 5.0 + vPos * 0.6)));
    vec3 c = (vec3(0.012, 0.06, 0.20) + vec3(0.03, 0.22, 0.55) * blocks) * (0.3 + att * 2.0);
    c += vec3(0.30, 0.78, 1.0) * (pow(m, 7.0) * 1.1 + pow(m, 90.0) * 9.0);
    return c;
  }

  void main(){
    float seed = vParam.x, seed2 = vParam.z;
    float size = vCS.w;

    // --- into the cube (cube-local space, unit box) ---
    vec3 rd = normalize(vLocal - vEyeL);
    vec3 n1 = bevelN(vLocal);
    float cosi = clamp(dot(-rd, n1), 0.0, 1.0);
    float F = 0.04 + 0.96 * pow(1.0 - cosi, 5.0);     // Schlick Fresnel
    vec3 dir = refract(rd, n1, 1.0 / IOR);
    float t = boxExit(vLocal, dir);
    vec3 pe = vLocal + dir * t;
    float thick = t;
    vec3 n2 = bevelN(pe);
    vec3 outD = refract(dir, -n2, IOR);
    #if BOUNCE
    if (dot(outD, outD) < 0.5) {                      // total internal reflection: one bounce inside
      dir = reflect(dir, -n2);
      t = boxExit(pe, dir);
      pe += dir * t; thick += t;
      n2 = bevelN(pe);
      outD = refract(dir, -n2, IOR);
    }
    #endif
    if (dot(outD, outD) < 0.5) outD = dir;

    // --- out of the cube: look up what is behind, in screen space ---
    vec3 Pw = vCS.xyz + pe * size;
    vec3 Dw = outD;
    vec4 cp = uVP * vec4(Pw + Dw * 2.5, 1.0);
    vec2 uv0 = gl_FragCoord.xy / uRes;
    vec2 uv = cp.w > 0.0 ? cp.xy / cp.w * 0.5 + 0.5 : uv0;
    vec2 dv = uv - uv0;
    float lod = step(0.84, vParam.w) * 3.5;           // a share of the cubes is frosted
    #if DISP
    vec3 refr = vec3(textureLod(uBG, uv0 + dv * 0.90, lod).r,
                     textureLod(uBG, uv0 + dv,        lod).g,
                     textureLod(uBG, uv0 + dv * 1.10, lod).b);   // dispersion
    #else
    vec3 refr = textureLod(uBG, uv, lod).rgb;
    #endif

    // --- Beer-Lambert absorption: colour comes from the path length through the glass ---
    float dens = mix(0.35, 1.5, seed) * mix(3.4, 1.0, step(0.30, seed2));
    vec3 T = exp(-ABSORB * dens * thick * size);
    vec3 col = refr * T;

    // --- lighting from the portal ---
    vec3 P = vec3(0.0, 0.0, -ZFAR);
    vec3 L = P - vPos; float dp = length(L); L /= dp;
    float att = 1.0 / (1.0 + dp * dp * 0.0006);
    col += vec3(0.02, 0.16, 0.48) * (1.0 - T.r) * att * 0.9;      // light scattered inside the volume

    vec3 Vw = normalize(vPos - uCam);
    vec3 nW = n1;
    col = mix(col, env(reflect(Vw, nW), att), F);                 // mirror-like at grazing angles
    #if BOUNCE
    col += env(reflect(dir, n2), att) * T * 0.10;          // faint inner reflection
    #endif
    vec3 H = normalize(L - Vw);
    col += vec3(0.75, 0.95, 1.0) * pow(max(dot(nW, H), 0.0), 160.0) * att * 7.0;

    float chamfer = 1.0 - max(abs(n1.x), max(abs(n1.y), abs(n1.z)));
    col += vec3(0.25, 0.75, 1.0) * smoothstep(0.02, 0.30, chamfer) * (0.10 + att * 1.3);

    float dist = length(vPos - uCam);
    float fog = smoothstep(22.0, ZFAR, dist);
    col = mix(col, vec3(0.22, 0.72, 1.0) * 1.6, fog * fog);
    o = vec4(col, 1.0);
  }`,
      dt = `#version 300 es
  out vec2 vUv;
  void main(){
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`,
      St = `#version 300 es
  precision highp float;
  in vec2 vUv; uniform sampler2D uTex; uniform vec2 uTexel; uniform float uThresh; out vec4 o;
  void main(){
    vec3 c = textureLod(uTex, vUv + uTexel * vec2(-1.0, -1.0), 0.0).rgb
           + textureLod(uTex, vUv + uTexel * vec2( 1.0, -1.0), 0.0).rgb
           + textureLod(uTex, vUv + uTexel * vec2(-1.0,  1.0), 0.0).rgb
           + textureLod(uTex, vUv + uTexel * vec2( 1.0,  1.0), 0.0).rgb;
    o = vec4(max(c * 0.25 - uThresh, 0.0), 1.0);
  }`,
      Q = `#version 300 es
  precision highp float;
  in vec2 vUv; uniform sampler2D uTex; uniform vec2 uDir; out vec4 o;
  void main(){
    vec3 c = texture(uTex, vUv).rgb * 0.2270270;
    c += (texture(uTex, vUv + uDir * 1.3846154).rgb + texture(uTex, vUv - uDir * 1.3846154).rgb) * 0.3162162;
    c += (texture(uTex, vUv + uDir * 3.2307692).rgb + texture(uTex, vUv - uDir * 3.2307692).rgb) * 0.0702703;
    o = vec4(c, 1.0);
  }`,
      Ee = `#version 300 es
  precision highp float;
  #define N ${U.samples}
  in vec2 vUv;
  uniform sampler2D uScene, uBloomA, uBloomB;
  uniform vec2 uCenter; uniform float uAspect, uTime;
  uniform float uZoomBlur, uAberration, uWhiteOut;
  out vec4 o;
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  void main(){
    vec2 d = vUv - uCenter;
    vec2 da = d * vec2(uAspect, 1.0);
    float r2 = dot(da, da);
    float jit = h21(gl_FragCoord.xy + fract(uTime) * 61.0);
    vec3 acc = vec3(0.0);
    for (int i = 0; i < N; i++) {
      float t = (float(i) + jit) / float(N);
      float s = 1.0 - uZoomBlur * r2 * t;                 // radial zoom blur toward the portal
      float ca = uAberration * r2 * (0.4 + t);             // chromatic aberration grows to the edges
      acc.r += textureLod(uScene, uCenter + d * s * (1.0 + ca), 0.0).r;
      acc.g += textureLod(uScene, uCenter + d * s, 0.0).g;
      acc.b += textureLod(uScene, uCenter + d * s * (1.0 - ca), 0.0).b;
    }
    vec3 col = acc / float(N);
    float cb = 0.06 * r2;
    vec3 bloom;
    bloom.r = texture(uBloomA, uCenter + d * (1.0 + cb)).r * 0.8 + texture(uBloomB, uCenter + d * (1.0 + cb)).r * 1.4;
    bloom.g = texture(uBloomA, vUv).g * 0.8 + texture(uBloomB, vUv).g * 1.4;
    bloom.b = texture(uBloomA, uCenter + d * (1.0 - cb)).b * 0.8 + texture(uBloomB, uCenter + d * (1.0 - cb)).b * 1.4;
    col += bloom;
    col *= 1.0 - 0.32 * min(r2, 1.4);
    col = 1.0 - exp(-col * 1.55);
    col = pow(col, vec3(1.08, 1.0, 0.94));
    col += (jit - 0.5) * 0.018;
    // The aperture and its halo merge into a full cover before canvas handoff.
    float radius = uWhiteOut * max(1.0, uAspect) * 1.1;
    float white = (1.0 - smoothstep(radius - 0.18, radius + 0.14, length(da))) * smoothstep(0.0, 0.08, uWhiteOut);
    col = mix(col, vec3(0.96, 0.99, 1.0), white);
    o = vec4(col, 1.0);
  }`,
      je = [
        "uVP",
        "uTime",
        "uScroll",
        "uAspect",
        "uMouseK",
        "uPxWorld",
        "uMouse",
        "uPass",
        "uCam",
      ],
      ft = ge(ye, Ce, je),
      rt = ge(ye, ot, [...je, "uBG", "uRes"]),
      Xe = ge(dt, St, ["uTex", "uTexel", "uThresh"]),
      it = ge(dt, Q, ["uTex", "uDir"]),
      ne = ge(dt, Ee, [
        "uScene",
        "uBloomA",
        "uBloomB",
        "uCenter",
        "uAspect",
        "uTime",
        "uZoomBlur",
        "uAberration",
        "uWhiteOut",
      ]),
      et = s("VertexArray", t.createVertexArray());
    (t.bindVertexArray(et),
      t.bindBuffer(t.ARRAY_BUFFER, s("Buffer", t.createBuffer())),
      t.bufferData(t.ARRAY_BUFFER, new Float32Array(W), t.STATIC_DRAW),
      t.enableVertexAttribArray(0),
      t.vertexAttribPointer(0, 3, t.FLOAT, !1, 24, 0),
      t.enableVertexAttribArray(1),
      t.vertexAttribPointer(1, 3, t.FLOAT, !1, 24, 12),
      t.bindBuffer(t.ARRAY_BUFFER, s("Buffer", t.createBuffer())),
      t.bufferData(t.ARRAY_BUFFER, new Float32Array(q), t.STATIC_DRAW),
      [
        [2, 3, 0],
        [3, 3, 12],
        [4, 4, 24],
      ].forEach(([Ge, st, ze]) => {
        (t.enableVertexAttribArray(Ge),
          t.vertexAttribPointer(Ge, st, t.FLOAT, !1, 40, ze),
          t.vertexAttribDivisor(Ge, 1));
      }),
      t.bindVertexArray(null));
    const Ye = s("VertexArray", t.createVertexArray()),
      Ve = !!(
        t.getExtension("EXT_color_buffer_float") ||
        t.getExtension("EXT_color_buffer_half_float")
      );
    let He = null,
      ct = null,
      Et = 0,
      Ot = 0,
      J = 1;
    const Me = {
      tx: 0,
      ty: 0,
      x: 0,
      y: 0,
      active: 0,
      targetActive: 0,
      energy: 0,
    };
    let Bt = null,
      tt = 0,
      mt = 0,
      Nt = !1,
      At = 16,
      gt = 0,
      zt = 0;
    const pe = L ? 0.25 : 1;
    return (
      (r.dataset.instances = String(ee)),
      {
        render: we,
        pause() {
          Bt = null;
        },
        dispose() {
          Nt || ((Nt = !0), c());
        },
      }
    );
  } catch (I) {
    throw (c(), I);
  }
}

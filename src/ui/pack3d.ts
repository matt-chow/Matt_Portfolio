// Lazy-loaded single foil pack for the opening page. TearPack.tsx owns input and timing; this only shapes and draws.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { PackDef } from '../engine/packs';
import { foilMaterial, paintBack, pillowZ } from './foil3d';
import { H, paintFront, W } from './ring3d';
import { hash, seam, separation, type Tear } from './tear';

export interface PackView {
  tear: Tear;
  sep: number; // seconds since the strip came free, or -1
  tiltX: number; // -1..1, pointer across the pack
  tiltY: number;
  press: { u: number; v: number; amt: number }; // a finger pushing into the body
  time: number;
}

export interface PackHandle {
  draw(v: PackView): void;
  dispose(): void;
}

const NX = 48; // columns, one per seam tooth
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

interface Sheet {
  mesh: THREE.Mesh;
  base: Float32Array; // flat x, y per vertex in pack space
  side: 1 | -1; // front puffs toward the camera, back away
}

/** A subdivided sheet spanning y0(i)..y1(i) in each column, uv'd to the whole pack so print and crinkle line up across the tear. */
function sheet(ny: number, y0: (i: number) => number, y1: (i: number) => number, side: 1 | -1, mat: THREE.Material): Sheet {
  const n = (NX + 1) * (ny + 1);
  const base = new Float32Array(n * 2);
  const uv = new Float32Array(n * 2);
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= NX; i++) {
      const k = j * (NX + 1) + i;
      const x = (i / NX - 0.5) * W;
      const y = y0(i) + (y1(i) - y0(i)) * (j / ny);
      base.set([x, y], k * 2);
      uv.set([side > 0 ? i / NX : 1 - i / NX, y / H + 0.5], k * 2);
    }
  const index: number[] = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < NX; i++) {
      const a = j * (NX + 1) + i;
      const b = a + 1;
      const c = a + NX + 1;
      const d = c + 1;
      index.push(...(side > 0 ? [a, b, d, a, d, c] : [a, d, b, a, c, d]));
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3).setUsage(THREE.DynamicDrawUsage)); // tip glow and flap shadow
  geo.setIndex(index);
  return { mesh: new THREE.Mesh(geo, mat), base, side };
}

export async function mountPack(canvas: HTMLCanvasElement, pack: PackDef): Promise<PackHandle> {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-2, 3, 4);
  scene.add(key);
  // Follows the pointer so highlights slide across the crinkles as the hand moves.
  const spot = new THREE.PointLight(0xfff4e6, 4, 5, 1.5);
  scene.add(spot);

  const front = await paintFront(pack, pack.id !== 'starter');
  const back = paintBack(pack);
  // The strip's back sheet is bare silver: curled toward the viewer it reads as the wrapper's inside, not its back print.
  const mats = [foilMaterial(front), foilMaterial(back), foilMaterial(front), foilMaterial(back, undefined, true)];
  mats.forEach((m) => (m.vertexColors = true));
  const seamV = seam(hash(pack.id), NX);
  const seamY = (i: number) => (seamV[i] - 0.5) * H;
  const rows = coarse ? 40 : 60;
  const sheets = {
    bodyF: sheet(rows, () => -H / 2, seamY, 1, mats[0]),
    bodyB: sheet(rows, () => -H / 2, seamY, -1, mats[1]),
    stripF: sheet(8, seamY, () => H / 2, 1, mats[2]),
    stripB: sheet(8, seamY, () => H / 2, -1, mats[3]),
  };
  const root = new THREE.Group();
  const body = new THREE.Group();
  const strip = new THREE.Group();
  const pivotY = H / 2 - ((1 - seamV[NX / 2]) * H) / 2; // middle of the strip: it spins and curls about here
  body.add(sheets.bodyF.mesh, sheets.bodyB.mesh);
  strip.add(sheets.stripF.mesh, sheets.stripB.mesh);
  root.add(body, strip);
  scene.add(root);

  function deform(s: Sheet, isStrip: boolean, v: PackView, sp: ReturnType<typeof separation> | null) {
    const t = v.tear;
    const dir = t.dir || 1;
    const pos = s.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const out = pos.array as Float32Array;
    const col = s.mesh.geometry.attributes.color as THREE.BufferAttribute;
    const free = sp ? smooth(0, 0.15, v.sep) : 0;
    const tipOn = t.p > 0 && !t.torn ? 1 : 0;
    const shadeOff = sp ? smooth(0, 0.3, v.sep) : 0;
    for (let k = 0; k < s.base.length / 2; k++) {
      const x = s.base[k * 2];
      const y = s.base[k * 2 + 1];
      const u = x / W + 0.5;
      const vv = y / H + 0.5;
      const sv = seamV[k % (NX + 1)];
      let z = s.side * pillowZ(u, vv);
      const d = t.p - (dir > 0 ? u : 1 - u); // > 0 behind the tear front
      const w = Math.max(d > 0 ? smooth(0, 0.2, d) : 0, free);
      // Tension: the foil ripples and stretches just around the moving tear front.
      const g = t.tension * Math.exp(-((d / 0.07) ** 2) - ((vv - sv) / 0.06) ** 2);
      z += s.side * 0.01 * g * Math.sin(x * 160 + vv * 50);
      // A narrow bright trace on the torn edge, hottest at the tip; the flap shades the lip just below it.
      const edge = (vv - sv) / 0.016;
      const glow = tipOn * (Math.exp(-((d / 0.04) ** 2) - edge * edge) * (0.7 + 0.3 * t.tension) + (d > 0 ? 0.3 * Math.exp(-d / 0.2 - edge * edge * 2) : 0));
      let shade = 1;
      let X = x;
      let Y = y;
      if (isStrip) {
        // Peel: foil freed behind the tip hinges toward the viewer about its own seam and curls along its height.
        // The bend ramps in over a short span behind the tip, so ahead of it the strip stays attached and flat.
        const sy = (sv - 0.5) * H;
        const hs = H / 2 - sy;
        const hh = (y - sy) / hs;
        const reach = Math.min(Math.max(d, 0), 0.6) / 0.6;
        const flex = Math.max(0.35, 1 + 2.6 * t.slack) * (1 + 0.25 * t.tension) * (1 + (sp ? 0.6 * sp.recoil : 0));
        const amt = t.lift * Math.max(smooth(-0.015, 0.12, d), free) * flex;
        const a0 = amt * (0.25 + 0.25 * reach);
        const kap = (amt * (0.3 + 0.9 * reach)) / hs;
        const h = y - sy;
        const a = a0 + kap * h;
        const cy = kap > 1e-4 ? (Math.sin(a) - Math.sin(a0)) / kap : h * Math.cos(a0);
        const cz = kap > 1e-4 ? (Math.cos(a0) - Math.cos(a)) / kap : h * Math.sin(a0);
        // Cantilever: behind the tip the freed foil swings up and away, bending most just behind the tip.
        const dd = Math.max(d, 0);
        const tilt = amt * 0.32;
        const along = 0.3 * Math.tanh((dd - 0.06 * (1 - Math.exp(-dd / 0.06))) / 0.3); // long flaps level off instead of levering up
        Y = sy + cy - z * Math.sin(a) + W * Math.sin(tilt) * along;
        z = cz + z * Math.cos(a) + amt * 0.03 * reach;
        X += dir * (W * (1 - Math.cos(tilt)) * along + amt * 0.015 * reach * hh);
        if (d < 0) Y += t.tension * 0.008 * Math.exp(-((d / 0.03) ** 2)) * (1 - hh);
        Y -= pivotY;
        if (sp && sp.curl > 1e-3) {
          const a = sp.curl * X;
          z += (1 - Math.cos(a)) / sp.curl;
          X = Math.sin(a) / sp.curl;
        }
      } else {
        // Lips at the opening: front bows out, back bows in, wider once the strip is gone.
        const lipK = smooth(sv - 0.14, sv, vv) ** 2;
        const lip = w * (0.3 * t.lift + (sp ? sp.open : 0));
        z += s.side * lip * lipK * 0.1;
        Y -= lip * lipK * 0.012;
        if (s.side > 0) shade = 1 - 0.45 * t.lift * smooth(-0.01, 0.1, d) * smooth(sv - 0.09, sv, vv) * (1 - shadeOff);
        if (s.side > 0 && v.press.amt > 0.001) z -= v.press.amt * 0.018 * Math.exp(-((u - v.press.u) ** 2 + ((vv - v.press.v) * 1.64) ** 2) / 0.012);
      }
      out[k * 3] = X;
      out[k * 3 + 1] = Y;
      out[k * 3 + 2] = z;
      const c = shade * (1 + 5 * glow);
      col.setXYZ(k, c, c, c * (1 - 0.06 * glow));
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    s.mesh.geometry.computeVertexNormals();
    s.mesh.geometry.computeBoundingSphere();
  }

  const setTheme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    renderer.toneMappingExposure = dark ? 0.95 : 1.05;
    scene.environmentIntensity = dark ? 0.7 : 0.6;
  };
  setTheme();
  const themeObs = new MutationObserver(setTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // The canvas overhangs the pack box by 70% each side and 30% top and bottom (see .tear-canvas), so z = 0 lines up with the DOM box.
  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, (H * 0.8) / Math.tan((15 * Math.PI) / 180));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  return {
    draw(v) {
      const dir = v.tear.dir || 1;
      const sp = v.sep >= 0 ? separation(v.sep, dir, v.tear.speed) : null;
      root.rotation.set(v.tiltY * 0.22, v.tiltX * 0.3 + 0.03 * Math.sin(v.time * 0.7), 0);
      deform(sheets.bodyF, false, v, sp);
      deform(sheets.bodyB, false, v, sp);
      deform(sheets.stripF, true, v, sp);
      deform(sheets.stripB, true, v, sp);
      strip.position.set(sp ? sp.x * W : 0, pivotY + (sp ? sp.y : 0), sp ? sp.z : 0);
      strip.rotation.set(sp ? -sp.rx * 0.5 : 0, 0, sp ? sp.rz : 0);
      mats[2].opacity = mats[3].opacity = sp ? sp.fade : 1;
      strip.visible = !sp || sp.fade > 0;
      body.scale.set(1 + (sp?.flex ?? 0) * 0.6, 1 - (sp?.flex ?? 0), 1);
      body.position.y = -(sp?.drop ?? 0) * 0.5;
      canvas.style.opacity = String(1 - (sp?.drop ?? 0));
      spot.position.set(v.tiltX * 1.3, 0.3 - v.tiltY * 0.9, 1.4);
      renderer.render(scene, camera);
    },
    dispose() {
      ro.disconnect();
      themeObs.disconnect();
      Object.values(sheets).forEach((s) => s.mesh.geometry.dispose());
      mats.forEach((m) => m.dispose());
      front.dispose();
      back.dispose();
      pmrem.dispose();
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}

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
  const mats = [foilMaterial(front), foilMaterial(back), foilMaterial(front), foilMaterial(back)];
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
    const free = sp ? smooth(0, 0.15, v.sep) : 0;
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
      let X = x;
      let Y = y;
      if (isStrip) {
        const hh = (vv - sv) / (1 - sv);
        const peel = t.lift * w;
        const reach = Math.min(Math.max(d, 0), 0.6);
        Y += peel * (0.02 + 0.08 * reach);
        z += peel * (0.03 + (0.1 + 0.25 * reach) * hh);
        X += dir * peel * 0.02 * reach;
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
        const lip = w * (0.15 * t.lift + (sp ? sp.open : 0));
        z += s.side * lip * lipK * 0.1;
        Y -= lip * lipK * 0.012;
        if (s.side > 0 && v.press.amt > 0.001) z -= v.press.amt * 0.018 * Math.exp(-((u - v.press.u) ** 2 + ((vv - v.press.v) * 1.64) ** 2) / 0.012);
      }
      out[k * 3] = X;
      out[k * 3 + 1] = Y;
      out[k * 3 + 2] = z;
    }
    pos.needsUpdate = true;
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

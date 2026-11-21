// Shared laminated-foil material for every 3D pack: crinkle normals, metallic print, silver inside.
import * as THREE from 'three';
import type { PackDef } from '../engine/packs';
import { H, PALETTE, W } from './ring3d';

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Pressurised pillow height at (u, v): full in the middle, flat into the crimps and side seals. */
export const pillowZ = (u: number, v: number) => 0.05 * Math.sqrt(Math.max(0, Math.sin(Math.PI * u))) * smooth(0.03, 0.16, v) * smooth(0.03, 0.16, 1 - v) + 0.0012;

/** A sealed wrapper as two static pillowed faces (front, and back turned to face away), for packs that never tear. */
export function pillowGeometry() {
  const front = new THREE.PlaneGeometry(W, H, 24, 40);
  const pos = front.attributes.position;
  for (let k = 0; k < pos.count; k++) pos.setZ(k, pillowZ(pos.getX(k) / W + 0.5, pos.getY(k) / H + 0.5));
  front.computeVertexNormals();
  return { front, back: front.clone().rotateY(Math.PI) };
}

let crinkleTex: THREE.DataTexture | undefined;

/** Procedural crinkle normal map, built once: soft dents, sharp creases, and crimp ridges in the top and bottom 4%. */
export function crinkle() {
  if (crinkleTex) return crinkleTex;
  const w = 256;
  const h = 420;
  const hf = new Float32Array(w * h);
  let s = 7;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  // Dents: low-frequency value noise.
  const gx = 9;
  const gy = 14;
  const grid = Array.from({ length: (gx + 1) * (gy + 1) }, rnd);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const fx = (x / w) * gx;
      const fy = (y / h) * gy;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = fx - ix;
      const ty = fy - iy;
      const at = (i: number, j: number) => grid[j * (gx + 1) + i];
      const top = at(ix, iy) * (1 - tx) + at(ix + 1, iy) * tx;
      const bot = at(ix, iy + 1) * (1 - tx) + at(ix + 1, iy + 1) * tx;
      hf[y * w + x] = (top * (1 - ty) + bot * ty) * 1.2;
    }
  // Creases: V-shaped ridges and valleys along random segments, fading at their ends.
  for (let c = 0; c < 110; c++) {
    const cx = rnd() * w;
    const cy = rnd() * h;
    const a = rnd() * Math.PI;
    const len = 12 + rnd() * 70;
    const width = 0.8 + rnd() * 2.2;
    const amp = (rnd() - 0.5) * 1.6;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const r = len + width;
    for (let y = Math.max(1, Math.floor(cy - r)); y < Math.min(h - 1, cy + r); y++)
      for (let x = Math.max(1, Math.floor(cx - r)); x < Math.min(w - 1, cx + r); x++) {
        const along = (x - cx) * ux + (y - cy) * uy;
        const across = Math.abs((x - cx) * -uy + (y - cy) * ux);
        if (Math.abs(along) > len || across > width) continue;
        hf[y * w + x] += amp * (1 - (along / len) ** 2) * (1 - across / width);
      }
  }
  // Heat-sealed crimp: rows near v = 0 and v = 1 (DataTexture rows run bottom-up).
  const band = Math.round(h * 0.042);
  for (let y = 0; y < h; y++)
    if (y < band || y >= h - band) for (let x = 0; x < w; x++) hf[y * w + x] += 2.4 * Math.abs(Math.sin((x / w) * Math.PI * 42));
  const data = new Uint8Array(w * h * 4);
  const k = 0.9;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const dx = hf[y * w + Math.min(w - 1, x + 1)] - hf[y * w + Math.max(0, x - 1)];
      const dy = hf[Math.min(h - 1, y + 1) * w + x] - hf[Math.max(0, y - 1) * w + x];
      const nx = -dx * k;
      const ny = -dy * k;
      const l = Math.hypot(nx, ny, 1);
      data[i * 4] = (nx / l) * 127.5 + 127.5;
      data[i * 4 + 1] = (ny / l) * 127.5 + 127.5;
      data[i * 4 + 2] = (1 / l) * 127.5 + 127.5;
      data[i * 4 + 3] = 255;
    }
  crinkleTex = new THREE.DataTexture(data, w, h);
  crinkleTex.generateMipmaps = true;
  crinkleTex.minFilter = THREE.LinearMipmapLinearFilter;
  crinkleTex.magFilter = THREE.LinearFilter;
  crinkleTex.needsUpdate = true;
  return crinkleTex;
}

/** Metallised film under printed ink: tinted reflections, a lacquer coat, a faint rainbow, and bare silver on the inside. */
export function foilMaterial(map: THREE.Texture, strength = 0.55) {
  const m = new THREE.MeshPhysicalMaterial({
    map,
    normalMap: crinkle(),
    normalScale: new THREE.Vector2(strength, strength),
    metalness: 0.62,
    roughness: 0.3,
    clearcoat: 0.8,
    clearcoatRoughness: 0.22,
    iridescence: 0.22,
    iridescenceIOR: 1.35,
    side: THREE.DoubleSide,
    transparent: true,
  });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\nif (!gl_FrontFacing) diffuseColor.rgb = vec3(0.8, 0.81, 0.84);');
  };
  return m;
}

/** The wrapper back: palette, crimps and a fine printed pattern. */
export function paintBack(pack: PackDef) {
  const [a, b, ink] = PALETTE[pack.id];
  const c = document.createElement('canvas');
  c.width = 250;
  c.height = 410;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(c.width, 0, 0, c.height);
  bg.addColorStop(0, a);
  bg.addColorStop(1, b);
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = ink;
  g.globalAlpha = 0.08;
  for (let x = -c.height; x < c.width; x += 10) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + c.height, c.height);
    g.stroke();
  }
  g.globalAlpha = 0.55;
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.font = '600 14px Geist, system-ui, sans-serif';
  g.fillText(`${pack.name} · ${pack.series}`, c.width / 2, c.height - 40);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

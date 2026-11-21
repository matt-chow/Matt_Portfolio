// Lazy-loaded WebGL pack carousel. The DOM in Home.tsx owns labels, links and keyboard; this only draws and handles pointer input.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { PackDef } from '../engine/packs';
import { goTo, nudge, offset, release, ring, ringStep, settled, slotOf, type Ring } from './ringPhysics';

// Wrapper palettes mirror the .pack-* rules in cards.css.
export const PALETTE: Record<string, [string, string, string]> = {
  starter: ['#f1f1ec', '#c9cbc3', '#161b1d'],
  experience: ['#3f8f6e', '#1e4f43', '#f0f4dd'],
  highlights: ['#efe6d2', '#d8c7a2', '#8c1f22'],
  skills: ['#2a3a39', '#121918', '#e4c260'],
  prototype: ['#2a5cb2', '#163a77', '#ffffff'],
  personal: ['#d3b689', '#a88457', '#3b2a12'],
};
export const W = 1;
export const H = 1.64;
const D = 0.045;

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/** Paints the wrapper front: key art (or the plain Starter face), crimps, and the pack name. */
export async function paintFront(pack: PackDef, keyArt: boolean) {
  const [a, b, ink] = PALETTE[pack.id];
  const c = document.createElement('canvas');
  c.width = 500;
  c.height = 820;
  const g = c.getContext('2d')!;
  const bg = g.createLinearGradient(0, 0, c.width, c.height);
  bg.addColorStop(0, a);
  bg.addColorStop(1, b);
  g.fillStyle = bg;
  g.fillRect(0, 0, c.width, c.height);
  const img = keyArt ? await loadImage(`art/pack-${pack.id}.webp`) : null;
  if (img) {
    const s = Math.max(c.width / img.width, c.height / img.height) * 1.14;
    g.drawImage(img, (c.width - img.width * s) / 2, (c.height - img.height * s) / 2, img.width * s, img.height * s);
    const shade = g.createLinearGradient(0, c.height * 0.45, 0, c.height);
    shade.addColorStop(0, 'rgba(8,8,16,0)');
    shade.addColorStop(1, 'rgba(8,8,16,0.75)');
    g.fillStyle = shade;
    g.fillRect(0, 0, c.width, c.height);
  } else {
    g.strokeStyle = ink;
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(40, 60, c.width - 80, c.height - 120, 16);
    g.stroke();
  }
  for (const y of [0, c.height - 34]) {
    g.fillStyle = 'rgba(255,255,255,0.25)';
    g.fillRect(0, y, c.width, 34);
    g.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < c.width; x += 12) g.fillRect(x, y, 3, 34);
  }
  await document.fonts?.load('800 66px Geist').catch(() => {});
  g.textAlign = 'center';
  g.fillStyle = img ? '#fff' : ink;
  g.shadowColor = img ? 'rgba(0,0,0,0.5)' : 'transparent';
  g.shadowBlur = 16;
  const base = img ? c.height - 92 : c.height / 2 + 40;
  g.font = '600 22px Geist, system-ui, sans-serif';
  g.fillText(pack.series, c.width / 2, base - 78);
  g.font = '800 70px Geist, system-ui, sans-serif';
  g.fillText(pack.name, c.width / 2, base, c.width - 60);
  g.font = 'italic 500 22px Geist, system-ui, sans-serif';
  g.fillText('Matthew Chow', c.width / 2, base + 38);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Vertical fade for the floor reflection: strongest where the pack meets the floor.
function fadeMap() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#000');
  grad.addColorStop(0.55, '#000');
  grad.addColorStop(1, '#666');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}

export interface RingHandle {
  step(by: number): void;
  goTo(i: number): void;
  dispose(): void;
}

export async function mountRing(
  canvas: HTMLCanvasElement,
  packs: PackDef[],
  opts: { start: number; onFocus(i: number): void; onOpen(i: number): void },
): Promise<RingHandle> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-2, 3, 4);
  scene.add(key);
  // Follows the pointer so the specular sweep tracks the hand.
  const spot = new THREE.PointLight(0xc7c4ff, 5, 6, 1.6);
  spot.position.set(0, 0.6, 2.2);
  scene.add(spot);
  const fog = new THREE.Fog(0xffffff, 4.5, 8.5);
  scene.fog = fog;

  const n = packs.length;
  const R = 1.9;
  const box = new THREE.BoxGeometry(W, H, D);
  const plane = new THREE.PlaneGeometry(W, H);
  const fade = fadeMap();
  const disposables: { dispose(): void }[] = [box, plane, fade, pmrem];
  const items = await Promise.all(
    packs.map(async (pack) => {
      const map = await paintFront(pack, pack.id !== 'starter');
      const [, b] = PALETTE[pack.id];
      const edge = new THREE.MeshStandardMaterial({ color: b, roughness: 0.5, metalness: 0.2 });
      const front = new THREE.MeshPhysicalMaterial({ map, roughness: 0.32, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.18 });
      const mirror = new THREE.MeshBasicMaterial({ map, alphaMap: fade, transparent: true, opacity: 0.32, depthWrite: false, fog: true });
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(box, [edge, edge, edge, edge, front, edge]);
      const reflection = new THREE.Mesh(plane, mirror);
      reflection.scale.y = -1;
      group.add(mesh, reflection);
      scene.add(group);
      disposables.push(map, edge, front, mirror);
      return { group, mesh, reflection };
    }),
  );

  const setTheme = () => {
    const ground = getComputedStyle(document.documentElement).getPropertyValue('--ground').trim() || '#edeff4';
    fog.color.set(ground);
    const dark = document.documentElement.dataset.theme === 'dark';
    spot.intensity = dark ? 7 : 4;
    renderer.toneMappingExposure = dark ? 0.95 : 1.05;
  };
  setTheme();
  const themeObs = new MutationObserver(setTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let state: Ring = ring(opts.start);
  let focus = opts.start;
  let hover = { x: 0, y: 0, tx: 0, ty: 0 };
  let dirty = true;

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow screens pull the camera back so neighbours stay partly in frame.
    const dist = w / h < 1 ? 5.4 : 4.5;
    camera.position.set(0, 0.3, dist);
    camera.lookAt(0, -0.12, 0);
    // Fog starts just behind the focused pack, so only the far side of the ring recedes.
    fog.near = dist + 0.6;
    fog.far = dist + 2 * R + 2.5;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  const layout = () => {
    items.forEach(({ group, mesh, reflection }, i) => {
      const o = offset(i, state.p, n);
      const theta = (o / n) * Math.PI * 2;
      const near = Math.max(0, 1 - Math.abs(o)); // 1 for the focused pack
      group.position.set(Math.sin(theta) * R, near * 0.08, Math.cos(theta) * R - R);
      group.rotation.y = theta * 0.55;
      const s = 0.84 + near * 0.16;
      group.scale.setScalar(s);
      mesh.rotation.set(hover.y * near * 0.22, hover.x * near * 0.32, 0);
      reflection.position.set(0, -H - 0.06 - near * 0.08 / s, 0);
    });
    spot.position.x = hover.x * 1.4;
    spot.position.y = 0.6 + hover.y * 0.8;
  };

  // Pointer: drag to spin, tap the focused pack to open it, tap another to bring it forward.
  const ray = new THREE.Raycaster();
  let down: { x: number; y: number; p: number; t: number; vx: number; moved: boolean } | null = null;
  const toNdc = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };
  const onDown = (e: PointerEvent) => {
    down = { x: e.clientX, y: e.clientY, p: state.p, t: performance.now(), vx: 0, moved: false };
  };
  const onMove = (e: PointerEvent) => {
    const ndc = toNdc(e);
    hover.tx = ndc.x;
    hover.ty = -ndc.y;
    dirty = true;
    if (!down) return;
    const dx = e.clientX - down.x;
    if (!down.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - down.y)) {
      down.moved = true;
      canvas.setPointerCapture(e.pointerId);
    }
    if (!down.moved) return;
    const now = performance.now();
    const p = down.p - dx / Math.min(420, Math.max(220, canvas.clientWidth * 0.32)); // px per slot
    const dt = Math.max(1, now - down.t) / 1000;
    down.vx = down.vx * 0.6 + ((p - state.p) / dt) * 0.4;
    down.t = now;
    state = { ...state, p, target: p, v: 0, dragging: true };
  };
  const onUp = (e: PointerEvent) => {
    if (!down) return;
    if (down.moved) state = release(state, down.vx);
    else {
      ray.setFromCamera(toNdc(e), camera);
      const hit = ray.intersectObjects(items.map((x) => x.mesh))[0];
      const i = items.findIndex((x) => x.mesh === hit?.object);
      if (i === focus && settled(state)) opts.onOpen(i);
      else if (i >= 0) state = goTo(state, i, n);
    }
    down = null;
    dirty = true;
  };
  const onLeave = () => {
    hover.tx = hover.ty = 0;
    dirty = true;
  };
  const onWheel = (e: WheelEvent) => {
    // Horizontal only (trackpad swipe or shift+wheel); vertical wheel keeps scrolling the page.
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    wheelAcc += e.deltaX;
    if (Math.abs(wheelAcc) > 60) {
      state = nudge(state, Math.sign(wheelAcc));
      wheelAcc = 0;
      dirty = true;
    }
  };
  let wheelAcc = 0;
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Render only while visible and something is moving.
  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    dirty = true;
  });
  io.observe(canvas);
  let frame = 0;
  let last = performance.now();
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const dt = (now - last) / 1000;
    last = now;
    if (!visible || document.hidden) return;
    const before = state;
    state = ringStep(state, dt);
    hover.x += (hover.tx - hover.x) * Math.min(1, dt * 8);
    hover.y += (hover.ty - hover.y) * Math.min(1, dt * 8);
    const hovering = Math.abs(hover.tx - hover.x) + Math.abs(hover.ty - hover.y) > 1e-3;
    if (!dirty && !hovering && before === state && settled(state)) return;
    dirty = false;
    const f = slotOf(state.p, n);
    if (f !== focus) {
      focus = f;
      opts.onFocus(f);
    }
    layout();
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);

  return {
    step(by) {
      state = nudge(state, by);
      dirty = true;
    },
    goTo(i) {
      state = goTo(state, i, n);
      dirty = true;
    },
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      themeObs.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
      disposables.forEach((d) => d.dispose());
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}

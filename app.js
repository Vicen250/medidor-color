/* =========================================================================
   app.js — Interfaz de medición
   Diseño de interacción: la mira permanece fija en el centro y la imagen se
   mueve bajo ella. En un móvil el dedo nunca tapa el punto que se mide.
   ========================================================================= */

import * as C from './color.js';
import { buildCatalogs, describeColor, parseUserCatalog } from './catalogs.js';

const helpers = {
  rgbToLab: C.rgbToLab,
  hexToRgb: C.hexToRgb,
  labToRgb: C.labToRgb,
  rgbToHex: C.rgbToHex
};

const CATALOGS = buildCatalogs(helpers);
const $ = id => document.getElementById(id);

/* ---------- Estado ---------- */

const state = {
  bitmap: null,
  src: null,          // canvas offscreen a resolución nativa
  sctx: null,
  scale: 1,
  minScale: 1,
  tx: 0,
  ty: 0,
  radius: 5,          // diámetro del parche en píxeles de imagen
  wb: null,           // balance de blancos activo
  pickingWhite: false,
  measurement: null,
  history: [],
  userCatalog: null
};

/* ---------- Carga de imagen ---------- */

async function loadFile(file) {
  if (!file) return;
  try {
    let bmp;
    try {
      bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      bmp = await createImageBitmap(file);
    }
    state.bitmap = bmp;

    const off = document.createElement('canvas');
    off.width = bmp.width;
    off.height = bmp.height;
    const sctx = off.getContext('2d', { willReadFrequently: true });
    if (!sctx) throw new Error('No se pudo crear el lienzo de trabajo');
    sctx.drawImage(bmp, 0, 0);

    // Una foto muy grande puede agotar la memoria del móvil al leer píxeles.
    // Se comprueba aquí para fallar con un mensaje claro y no en silencio.
    try {
      sctx.getImageData(0, 0, 1, 1);
    } catch {
      throw new Error('La foto es demasiado grande para este dispositivo. Prueba con menos resolución.');
    }

    state.src = off;
    state.sctx = sctx;

    $('intro').hidden = true;
    $('stage').hidden = false;
    $('toolbar').hidden = false;

    resizeCanvas();
    fitImage();
    measure();
    $('imgInfo').textContent = `${bmp.width} × ${bmp.height} px`;
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    toast('No se pudo abrir la imagen: ' + (err.message || err));
  }
}

/* ---------- Vista ---------- */

const view = $('view');
const vctx = view.getContext('2d');

function resizeCanvas() {
  const r = view.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  view.width = Math.round(r.width * dpr);
  view.height = Math.round(r.height * dpr);
  view.style.width = r.width + 'px';
  view.style.height = r.height + 'px';
  vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  view.dataset.cssw = r.width;
  view.dataset.cssh = r.height;
}

function viewSize() {
  return { w: +view.dataset.cssw || 1, h: +view.dataset.cssh || 1 };
}

function fitImage() {
  const { w, h } = viewSize();
  const b = state.bitmap;
  state.minScale = Math.min(w / b.width, h / b.height);
  state.scale = state.minScale;
  state.tx = (w - b.width * state.scale) / 2;
  state.ty = (h - b.height * state.scale) / 2;
  draw();
}

function clampPan() {
  const { w, h } = viewSize();
  const iw = state.bitmap.width * state.scale;
  const ih = state.bitmap.height * state.scale;
  const mx = w / 2, my = h / 2;
  // La mira siempre debe poder alcanzar cualquier punto de la imagen
  state.tx = Math.min(mx, Math.max(mx - iw, state.tx));
  state.ty = Math.min(my, Math.max(my - ih, state.ty));
}

function draw() {
  const { w, h } = viewSize();
  vctx.clearRect(0, 0, w, h);
  vctx.imageSmoothingEnabled = state.scale < 4;
  vctx.drawImage(
    state.bitmap,
    state.tx, state.ty,
    state.bitmap.width * state.scale,
    state.bitmap.height * state.scale
  );
}

/* Punto de imagen bajo la mira (centro del viewport) */
function crosshairPoint() {
  const { w, h } = viewSize();
  return {
    x: Math.round((w / 2 - state.tx) / state.scale),
    y: Math.round((h / 2 - state.ty) / state.scale)
  };
}

/* ---------- Gestos ---------- */

const pointers = new Map();
let pinchStart = null;
let rafPending = false;

function schedule() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    draw();
    measure();
  });
}

view.addEventListener('pointerdown', e => {
  view.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: state.scale };
  }
});

view.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  const prev = pointers.get(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pointers.size === 1) {
    state.tx += e.clientX - prev.x;
    state.ty += e.clientY - prev.y;
    clampPan();
    schedule();
  } else if (pointers.size === 2 && pinchStart) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const target = Math.max(state.minScale, Math.min(40, pinchStart.scale * (d / pinchStart.dist)));
    zoomAround(viewSize().w / 2, viewSize().h / 2, target);
    schedule();
  }
});

function endPointer(e) {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinchStart = null;
}
view.addEventListener('pointerup', endPointer);
view.addEventListener('pointercancel', endPointer);

view.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = Math.exp(-e.deltaY * 0.0015);
  zoomAround(viewSize().w / 2, viewSize().h / 2, Math.max(state.minScale, Math.min(40, state.scale * factor)));
  schedule();
}, { passive: false });

function zoomAround(cx, cy, newScale) {
  const k = newScale / state.scale;
  state.tx = cx - (cx - state.tx) * k;
  state.ty = cy - (cy - state.ty) * k;
  state.scale = newScale;
  clampPan();
}

/* Teclado: ajuste fino de un píxel */
window.addEventListener('keydown', e => {
  if ($('stage').hidden) return;
  const step = e.shiftKey ? 10 : 1;
  const map = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
  if (map[e.key]) {
    e.preventDefault();
    state.tx += map[e.key][0] * step * state.scale;
    state.ty += map[e.key][1] * step * state.scale;
    clampPan();
    schedule();
  }
});

/* ---------- Medición ---------- */

function measure() {
  if (!state.src) return;
  const p = crosshairPoint();
  const b = state.bitmap;
  if (p.x < 0 || p.y < 0 || p.x >= b.width || p.y >= b.height) return;

  const r = Math.floor(state.radius / 2);
  const x0 = Math.max(0, p.x - r);
  const y0 = Math.max(0, p.y - r);
  const w = Math.min(b.width - x0, state.radius);
  const h = Math.min(b.height - y0, state.radius);

  const data = state.sctx.getImageData(x0, y0, w, h);
  const res = C.sampleRegion(data, { wb: state.wb });
  if (!res) return;

  if (state.pickingWhite) {
    state.wb = C.buildWhiteBalance(C.sampleRegion(data, {}).rgb);
    state.pickingWhite = false;
    document.body.classList.remove('picking');
    updateWbUi();
    measure();
    return;
  }

  state.measurement = { ...res, point: p };
  renderMagnifier(p);
  renderReadout(res, p);
}

/* ---------- Lupa ---------- */

const mag = $('magnifier');
const mctx = mag.getContext('2d');
const MAG_PX = 15; // píxeles de imagen visibles a lo ancho

function renderMagnifier(p) {
  const size = mag.width;
  const cell = size / MAG_PX;
  mctx.imageSmoothingEnabled = false;
  mctx.clearRect(0, 0, size, size);
  mctx.drawImage(
    state.src,
    p.x - (MAG_PX - 1) / 2, p.y - (MAG_PX - 1) / 2, MAG_PX, MAG_PX,
    0, 0, size, size
  );

  // Marco del área realmente muestreada
  const s = state.radius * cell;
  mctx.strokeStyle = 'rgba(255,255,255,.95)';
  mctx.lineWidth = 2;
  mctx.strokeRect((size - s) / 2, (size - s) / 2, s, s);
  mctx.strokeStyle = 'rgba(0,0,0,.65)';
  mctx.lineWidth = 1;
  mctx.strokeRect((size - s) / 2 - 1.5, (size - s) / 2 - 1.5, s + 3, s + 3);
}

/* ---------- Lectura ---------- */

function renderReadout(res, p) {
  const { rgb, lab } = res;
  const lch = C.labToLch(lab.L, lab.a, lab.b);
  const hex = C.rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = C.rgbToHsl(rgb.r, rgb.g, rgb.b);
  const hsv = C.rgbToHsv(rgb.r, rgb.g, rgb.b);
  const cmyk = C.rgbToCmyk(rgb.r, rgb.g, rgb.b);

  $('swatch').style.background = hex;
  $('hexValue').textContent = hex;
  $('colorName').textContent = describeColor(lch);
  $('coords').textContent = `x ${p.x}  y ${p.y}`;

  const n = (v, d = 1) => v.toFixed(d);
  $('vRgb').textContent = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
  $('vHsl').textContent = `${n(hsl.h, 0)}°, ${n(hsl.s, 0)}%, ${n(hsl.l, 0)}%`;
  $('vHsv').textContent = `${n(hsv.h, 0)}°, ${n(hsv.s, 0)}%, ${n(hsv.v, 0)}%`;
  $('vCmyk').textContent = `${n(cmyk.c, 0)}, ${n(cmyk.m, 0)}, ${n(cmyk.y, 0)}, ${n(cmyk.k, 0)}`;
  $('vLab').textContent = `${n(lab.L)}, ${n(lab.a)}, ${n(lab.b)}`;
  $('vLch').textContent = `${n(lch.L)}, ${n(lch.C)}, ${n(lch.h, 0)}°`;

  // Fiabilidad de la muestra
  const q = $('quality');
  if (res.spread < 1.5) {
    q.textContent = `Zona uniforme · ${res.used} px usados`;
    q.dataset.level = 'ok';
  } else if (res.spread < 4) {
    q.textContent = `Ligera variación · ${res.used}/${res.total} px`;
    q.dataset.level = 'warn';
  } else {
    q.textContent = `Zona irregular — mueve la mira o reduce el área`;
    q.dataset.level = 'bad';
  }

  renderMatches(lab);
}

/* ---------- Coincidencias por catálogo ---------- */

function renderMatches(lab) {
  const box = $('matches');
  box.textContent = '';

  const cats = Object.values(CATALOGS);
  if (state.userCatalog) cats.push(state.userCatalog);

  for (const cat of cats) {
    const scored = cat.colors
      .map(c => ({ ...c, de: C.deltaE2000(lab, c.lab) }))
      .sort((a, b) => a.de - b.de)
      .slice(0, 3);

    const sec = document.createElement('section');
    sec.className = 'cat';

    const head = document.createElement('div');
    head.className = 'cat-head';
    const t = document.createElement('h3');
    t.textContent = cat.label;
    const note = document.createElement('span');
    note.textContent = cat.note || '';
    head.append(t, note);
    sec.append(head);

    scored.forEach((m, i) => {
      const q = C.deltaEQuality(m.de);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'match';
      row.dataset.rank = i === 0 ? 'first' : 'rest';
      row.title = 'Copiar ' + m.code;

      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.style.background = m.hex;

      const label = document.createElement('span');
      label.className = 'match-label';
      const code = document.createElement('strong');
      code.textContent = m.code;
      const nm = document.createElement('span');
      nm.textContent = m.name;
      label.append(code, nm);

      const de = document.createElement('span');
      de.className = 'de';
      de.dataset.level = q.level;
      de.append(Object.assign(document.createElement('b'), { textContent: 'ΔE ' + m.de.toFixed(2) }));
      de.append(Object.assign(document.createElement('span'), { textContent: q.text }));

      row.append(chip, label, de);
      row.addEventListener('click', () => copy(`${m.code} — ${m.name} (${m.hex})`, row));
      sec.append(row);
    });

    box.append(sec);
  }
}

/* ---------- Balance de blancos ---------- */

function updateWbUi() {
  const btn = $('wbBtn');
  const info = $('wbInfo');
  if (state.wb) {
    btn.textContent = 'Quitar referencia';
    btn.dataset.active = 'true';
    info.textContent = `Corrigiendo desde ${C.rgbToHex(state.wb.ref.r, state.wb.ref.g, state.wb.ref.b)}`;
    info.hidden = false;
  } else {
    btn.textContent = 'Fijar blanco de referencia';
    btn.dataset.active = 'false';
    info.hidden = true;
  }
}

$('wbBtn').addEventListener('click', () => {
  if (state.wb) {
    state.wb = null;
    updateWbUi();
    measure();
  } else {
    state.pickingWhite = true;
    document.body.classList.add('picking');
    $('wbInfo').hidden = false;
    $('wbInfo').textContent = 'Apunta a una zona blanca o gris neutra y pulsa Medir';
  }
});

/* ---------- Historial ---------- */

$('saveBtn').addEventListener('click', () => {
  if (!state.measurement) return;
  const m = state.measurement;
  const lch = C.labToLch(m.lab.L, m.lab.a, m.lab.b);
  const hex = C.rgbToHex(m.rgb.r, m.rgb.g, m.rgb.b);

  const best = {};
  const cats = Object.values(CATALOGS);
  if (state.userCatalog) cats.push(state.userCatalog);
  for (const cat of cats) {
    let top = null;
    for (const c of cat.colors) {
      const de = C.deltaE2000(m.lab, c.lab);
      if (!top || de < top.de) top = { ...c, de };
    }
    best[cat.label] = top;
  }

  state.history.unshift({
    hex, rgb: m.rgb, lab: m.lab, lch,
    point: m.point,
    wb: !!state.wb,
    time: new Date(),
    best
  });
  renderHistory();
});

function renderHistory() {
  const list = $('historyList');
  list.textContent = '';
  $('history').hidden = state.history.length === 0;
  $('historyCount').textContent = state.history.length;

  state.history.forEach((h, idx) => {
    const li = document.createElement('li');

    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = h.hex;

    const info = document.createElement('div');
    info.className = 'h-info';
    const a = document.createElement('strong');
    a.textContent = h.hex;
    const b = document.createElement('span');
    const ral = h.best['RAL Classic'];
    b.textContent = ral ? `${ral.code} · ΔE ${ral.de.toFixed(1)}` : '';
    info.append(a, b);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'icon-btn';
    del.setAttribute('aria-label', 'Eliminar medición');
    del.textContent = '×';
    del.addEventListener('click', () => {
      state.history.splice(idx, 1);
      renderHistory();
    });

    li.append(chip, info, del);
    list.append(li);
  });
}

$('exportBtn').addEventListener('click', () => {
  if (!state.history.length) return;
  const head = ['hora', 'hex', 'R', 'G', 'B', 'L', 'a', 'b', 'C', 'h', 'x', 'y', 'balance_blanco', 'RAL', 'RAL_dE', 'web', 'web_dE'];
  const rows = state.history.map(h => {
    const ral = h.best['RAL Classic'] || {};
    const css = h.best['Colores web'] || {};
    return [
      h.time.toISOString(), h.hex, h.rgb.r, h.rgb.g, h.rgb.b,
      h.lab.L.toFixed(2), h.lab.a.toFixed(2), h.lab.b.toFixed(2),
      h.lch.C.toFixed(2), h.lch.h.toFixed(1),
      h.point.x, h.point.y, h.wb ? 'si' : 'no',
      ral.code || '', ral.de != null ? ral.de.toFixed(2) : '',
      css.code || '', css.de != null ? css.de.toFixed(2) : ''
    ].join(',');
  });
  const blob = new Blob(['\uFEFF' + head.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mediciones-${Date.now()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});

/* ---------- Copiar ---------- */

async function copy(text, el) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  if (el) {
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 900);
  }
  toast('Copiado: ' + text);
}

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

document.querySelectorAll('.value').forEach(el => {
  el.addEventListener('click', () => copy(el.textContent.trim(), el));
});
$('hexValue').addEventListener('click', () => copy($('hexValue').textContent, $('hexValue')));

/* ---------- Controles ---------- */

function onPick(e) {
  const f = e.target.files[0];
  e.target.value = ''; // sin esto, elegir la misma foto dos veces no dispara nada
  loadFile(f);
}
$('fileCamera').addEventListener('change', onPick);
$('fileGallery').addEventListener('change', onPick);
$('changeBtn').addEventListener('click', () => $('fileCamera').click());

$('radius').addEventListener('input', e => {
  state.radius = +e.target.value;
  $('radiusLabel').textContent = `${state.radius} × ${state.radius} px`;
  measure();
});

$('fitBtn').addEventListener('click', () => { fitImage(); measure(); });

$('catalogFile').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  const colors = parseUserCatalog(await f.text(), helpers);
  if (!colors.length) { toast('No se leyó ningún color del archivo'); return; }
  state.userCatalog = { id: 'user', label: f.name.replace(/\.[^.]+$/, ''), note: `${colors.length} colores propios`, colors };
  toast(`Catálogo cargado: ${colors.length} colores`);
  measure();
});

window.addEventListener('resize', () => {
  if ($('stage').hidden) return;
  resizeCanvas();
  clampPan();
  draw();
  measure();
});

/* ---------- Service worker ---------- */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

updateWbUi();

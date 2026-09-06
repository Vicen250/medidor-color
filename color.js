/* =========================================================================
   color.js — Motor colorimétrico
   Todo el trabajo perceptual se hace en CIE L*a*b* (observador 2°, D65).
   Nunca se promedian ni se comparan colores en sRGB directamente.
   ========================================================================= */

export const D65 = { X: 95.047, Y: 100.0, Z: 108.883 };

/* ---------- sRGB <-> lineal ---------- */

export function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(c) {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

/* ---------- sRGB <-> XYZ ---------- */

export function rgbToXyz(r, g, b) {
  const R = srgbToLinear(r), G = srgbToLinear(g), B = srgbToLinear(b);
  return {
    X: (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) * 100,
    Y: (R * 0.2126729 + G * 0.7151522 + B * 0.0721750) * 100,
    Z: (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) * 100
  };
}

export function xyzToRgb(X, Y, Z) {
  const x = X / 100, y = Y / 100, z = Z / 100;
  return {
    r: linearToSrgb(x *  3.2404542 + y * -1.5371385 + z * -0.4985314),
    g: linearToSrgb(x * -0.9692660 + y *  1.8760108 + z *  0.0415560),
    b: linearToSrgb(x *  0.0556434 + y * -0.2040259 + z *  1.0572252)
  };
}

/* ---------- XYZ <-> Lab ---------- */

const E = 216 / 24389, K = 24389 / 27;

export function xyzToLab(X, Y, Z) {
  const f = t => (t > E ? Math.cbrt(t) : (K * t + 16) / 116);
  const fx = f(X / D65.X), fy = f(Y / D65.Y), fz = f(Z / D65.Z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

export function labToXyz(L, a, b) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = f => (f ** 3 > E ? f ** 3 : (116 * f - 16) / K);
  return { X: inv(fx) * D65.X, Y: inv(fy) * D65.Y, Z: inv(fz) * D65.Z };
}

export function rgbToLab(r, g, b) {
  const { X, Y, Z } = rgbToXyz(r, g, b);
  return xyzToLab(X, Y, Z);
}

export function labToRgb(L, a, b) {
  const { X, Y, Z } = labToXyz(L, a, b);
  return xyzToRgb(X, Y, Z);
}

/* ---------- Lab <-> LCh ---------- */

export function labToLch(L, a, b) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

/* ---------- Otros espacios de salida ---------- */

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '').trim();
  const s = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  return { r: parseInt(s.slice(0, 2), 16), g: parseInt(s.slice(2, 4), 16), b: parseInt(s.slice(4, 6), 16) };
}

export function rgbToHsl(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

export function rgbToHsv(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B), d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

/* CMYK: conversión aritmética sin perfil ICC. Sirve de orientación,
   no como separación lista para imprenta. */
export function rgbToCmyk(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const k = 1 - Math.max(R, G, B);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: ((1 - R - k) / (1 - k)) * 100,
    m: ((1 - G - k) / (1 - k)) * 100,
    y: ((1 - B - k) / (1 - k)) * 100,
    k: k * 100
  };
}

/* ---------- ΔE ---------- */

export function deltaE76(l1, l2) {
  return Math.hypot(l1.L - l2.L, l1.a - l2.a, l1.b - l2.b);
}

/* CIEDE2000 — Sharma, Wu & Dalal (2005). kL=kC=kH=1 */
export function deltaE2000(lab1, lab2) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));

  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);

  const hp = (b, ap) => {
    if (b === 0 && ap === 0) return 0;
    let h = Math.atan2(b, ap) * deg;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(b1, a1p), h2p = hp(b2, a2p);

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);

  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;

  let hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else {
    const d = Math.abs(h1p - h2p);
    if (d <= 180) hbp = (h1p + h2p) / 2;
    else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }

  const T = 1
    - 0.17 * Math.cos((hbp - 30) * rad)
    + 0.24 * Math.cos(2 * hbp * rad)
    + 0.32 * Math.cos((3 * hbp + 6) * rad)
    - 0.20 * Math.cos((4 * hbp - 63) * rad);

  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;

  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)
  );
}

/* ---------- Balance de blancos (adaptación von Kries en XYZ) ---------- */

/* Devuelve una matriz de adaptación que lleva el blanco medido a D65.
   measured = {r,g,b} de una superficie que sabemos neutra. */
export function buildWhiteBalance(measured) {
  const { X, Y, Z } = rgbToXyz(measured.r, measured.g, measured.b);
  if (Y <= 0.0001) return null;
  // Normaliza a Y=100 para separar cromaticidad de exposición
  const s = 100 / Y;
  const src = { X: X * s, Y: 100, Z: Z * s };
  return {
    kx: D65.X / src.X,
    ky: D65.Y / src.Y,
    kz: D65.Z / src.Z,
    ref: { ...measured }
  };
}

export function applyWhiteBalance(rgb, wb) {
  if (!wb) return { ...rgb };
  const { X, Y, Z } = rgbToXyz(rgb.r, rgb.g, rgb.b);
  return xyzToRgb(X * wb.kx, Y * wb.ky, Z * wb.kz);
}

/* ---------- Muestreo robusto ---------- */

/* Toma un parche de píxeles, los pasa a Lab, descarta atípicos usando la
   desviación absoluta mediana (MAD) sobre ΔE respecto a la mediana, y
   promedia el resto en Lab. Esto elimina reflejos especulares, ruido del
   sensor y píxeles de borde que arruinan una media simple en RGB. */
export function sampleRegion(imageData, opts = {}) {
  const cutoff = opts.cutoff ?? 2.5; // en múltiplos de MAD
  const px = [];
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 250) continue;
    px.push({ r: d[i], g: d[i + 1], b: d[i + 2] });
  }
  if (!px.length) return null;

  let samples = px;
  if (opts.wb) samples = px.map(p => applyWhiteBalance(p, opts.wb));

  const labs = samples.map(p => rgbToLab(p.r, p.g, p.b));

  const med = k => {
    const v = labs.map(l => l[k]).sort((x, y) => x - y);
    const m = v.length >> 1;
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
  };
  const median = { L: med('L'), a: med('a'), b: med('b') };

  const dists = labs.map(l => deltaE2000(l, median)).sort((x, y) => x - y);
  const mid = dists.length >> 1;
  const mad = dists.length % 2 ? dists[mid] : (dists[mid - 1] + dists[mid]) / 2;
  const limit = Math.max(1.0, mad * cutoff);

  let kept = labs.filter(l => deltaE2000(l, median) <= limit);
  if (kept.length < Math.max(1, labs.length * 0.25)) kept = labs;

  const avg = kept.reduce(
    (acc, l) => ({ L: acc.L + l.L, a: acc.a + l.a, b: acc.b + l.b }),
    { L: 0, a: 0, b: 0 }
  );
  const lab = { L: avg.L / kept.length, a: avg.a / kept.length, b: avg.b / kept.length };
  const rgb = labToRgb(lab.L, lab.a, lab.b);

  // Dispersión: cuánto varía la zona muestreada. Alta = mal punto de medida.
  const spread = kept.reduce((s, l) => s + deltaE2000(l, lab), 0) / kept.length;

  return {
    lab,
    rgb,
    total: labs.length,
    used: kept.length,
    discarded: labs.length - kept.length,
    spread
  };
}

/* ---------- Interpretación del ΔE ---------- */

export function deltaEQuality(de) {
  if (de < 1.0) return { level: 'exacta', text: 'imperceptible a simple vista' };
  if (de < 2.0) return { level: 'muy-buena', text: 'solo perceptible por ojo entrenado' };
  if (de < 3.5) return { level: 'buena', text: 'diferencia leve, perceptible' };
  if (de < 5.0) return { level: 'aceptable', text: 'diferencia clara' };
  return { level: 'lejana', text: 'colores distintos' };
}

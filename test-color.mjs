import * as C from './js/color.js';
import { buildCatalogs, describeColor } from './js/catalogs.js';

let fails = 0;
const ok = (name, cond, extra='') => { console.log((cond?'  PASS':'  FALLA')+'  '+name+(extra?'  '+extra:'')); if(!cond) fails++; };

console.log('\n== Conversiones ==');
// Blanco D65 -> L*=100, a=b=0
const w = C.rgbToLab(255,255,255);
ok('Blanco = L100 a0 b0', Math.abs(w.L-100)<0.01 && Math.abs(w.a)<0.01 && Math.abs(w.b)<0.01, `L=${w.L.toFixed(3)}`);
const k = C.rgbToLab(0,0,0);
ok('Negro = L0', Math.abs(k.L)<0.01);
// Gris 50% sRGB -> L* ~ 53.39
const g = C.rgbToLab(128,128,128);
ok('Gris 128 -> L*≈53.6', Math.abs(g.L-53.585)<0.1, `L=${g.L.toFixed(3)}`);
// Rojo puro
const r = C.rgbToLab(255,0,0);
ok('Rojo puro L*≈53.24 a≈80.09 b≈67.20', Math.abs(r.L-53.24)<0.1 && Math.abs(r.a-80.09)<0.2 && Math.abs(r.b-67.20)<0.2, `L=${r.L.toFixed(2)} a=${r.a.toFixed(2)} b=${r.b.toFixed(2)}`);

console.log('\n== Ida y vuelta Lab -> RGB ==');
let maxErr = 0;
for (let i=0;i<3000;i++){
  const a=[0,0,0].map(()=>Math.floor(Math.random()*256));
  const lab=C.rgbToLab(...a); const back=C.labToRgb(lab.L,lab.a,lab.b);
  maxErr=Math.max(maxErr,Math.abs(back.r-a[0]),Math.abs(back.g-a[1]),Math.abs(back.b-a[2]));
}
ok('Error máximo <= 1 nivel en 3000 colores', maxErr<=1, `max=${maxErr}`);

console.log('\n== CIEDE2000 (casos de Sharma et al.) ==');
const cases = [
  [[50.0000,2.6772,-79.7751],[50.0000,0.0000,-82.7485],2.0425],
  [[50.0000,3.1571,-77.2803],[50.0000,0.0000,-82.7485],2.8615],
  [[50.0000,2.8361,-74.0200],[50.0000,0.0000,-82.7485],3.4412],
  [[50.0000,-1.3802,-84.2814],[50.0000,0.0000,-82.7485],1.0000],
  [[50.0000,2.4900,-0.0010],[50.0000,-2.4900,0.0009],7.1792],
  [[50.0000,-0.0010,2.4900],[50.0000,0.0009,-2.4900],4.8045],
  [[60.2574,-34.0099,36.2677],[60.4626,-34.1751,39.4387],1.2644],
  [[63.0109,-31.0961,-5.8663],[62.8187,-29.7946,-4.0864],1.2630],
  [[2.0776,0.0795,-1.1350],[0.9033,-0.0636,-0.5514],0.9082],
];
let worst=0;
cases.forEach(([a,b,exp],i)=>{
  const got = C.deltaE2000({L:a[0],a:a[1],b:a[2]},{L:b[0],a:b[1],b:b[2]});
  worst=Math.max(worst,Math.abs(got-exp));
});
ok('9 casos de referencia, error < 0.0001', worst<0.0001, `peor desvío=${worst.toExponential(2)}`);
ok('Simetría dE(A,B)=dE(B,A)', Math.abs(
  C.deltaE2000({L:50,a:2.5,b:0},{L:55,a:-3,b:8}) - C.deltaE2000({L:55,a:-3,b:8},{L:50,a:2.5,b:0})
)<1e-12);
ok('dE(A,A) = 0', C.deltaE2000({L:40,a:12,b:-30},{L:40,a:12,b:-30})<1e-12);

console.log('\n== Catálogos ==');
const cats = buildCatalogs({rgbToLab:C.rgbToLab,hexToRgb:C.hexToRgb,labToRgb:C.labToRgb,rgbToHex:C.rgbToHex});
ok('RAL Classic cargado', cats.ral.colors.length>200, `${cats.ral.colors.length} colores`);
ok('Colores web cargados', cats.css.colors.length>140, `${cats.css.colors.length} colores`);
ok('Grises neutros', cats.neutral.colors.length===21);
const badRal = cats.ral.colors.filter(c=>!/^#[0-9A-F]{6}$/i.test(c.hex)||!c.name||!/^RAL \d{4}$/.test(c.code));
ok('Todas las filas RAL bien formadas', badRal.length===0, badRal.length?JSON.stringify(badRal.slice(0,3)):'');
const dupes = cats.ral.colors.map(c=>c.code).filter((v,i,a)=>a.indexOf(v)!==i);
ok('Sin códigos RAL duplicados', dupes.length===0, dupes.join(','));

console.log('\n== Coincidencia sobre color conocido ==');
// Un RAL exacto debe salir el primero con dE 0
const target = cats.ral.colors.find(c=>c.code==='RAL 5015');
const scored = cats.ral.colors.map(c=>({c,de:C.deltaE2000(target.lab,c.lab)})).sort((a,b)=>a.de-b.de);
ok('RAL 5015 se identifica a sí mismo con dE=0', scored[0].c.code==='RAL 5015'&&scored[0].de<1e-9,
   `1º=${scored[0].c.code} dE=${scored[0].de.toFixed(4)} | 2º=${scored[1].c.code} dE=${scored[1].de.toFixed(2)}`);

console.log('\n== Balance de blancos ==');
// Simula una foto con dominante cálida: el blanco se leyó como 255,235,205
const wb = C.buildWhiteBalance({r:255,g:235,b:205});
const corrected = C.applyWhiteBalance({r:255,g:235,b:205}, wb);
ok('El blanco de referencia se corrige a neutro',
   Math.abs(corrected.r-corrected.g)<=2 && Math.abs(corrected.g-corrected.b)<=2,
   `-> ${corrected.r},${corrected.g},${corrected.b}`);
const labC = C.rgbToLab(corrected.r,corrected.g,corrected.b);
ok('Croma residual del blanco corregido < 1.5', Math.hypot(labC.a,labC.b)<1.5, `C=${Math.hypot(labC.a,labC.b).toFixed(2)}`);
ok('Sin referencia, el color no se toca', C.applyWhiteBalance({r:10,g:20,b:30},null).r===10);

console.log('\n== Muestreo robusto ==');
// Parche 9x9 de un gris uniforme con 5 píxeles de reflejo blanco
function patch(base, outliers){
  const n=9, d=new Uint8ClampedArray(n*n*4);
  for(let i=0;i<n*n;i++){ d[i*4]=base[0]; d[i*4+1]=base[1]; d[i*4+2]=base[2]; d[i*4+3]=255; }
  outliers.forEach(idx=>{ d[idx*4]=255; d[idx*4+1]=255; d[idx*4+2]=255; });
  return {data:d,width:n,height:n};
}
const clean = C.sampleRegion(patch([90,120,60],[]));
ok('Zona uniforme se mide exacta', clean.rgb.r===90&&clean.rgb.g===120&&clean.rgb.b===60, `${clean.rgb.r},${clean.rgb.g},${clean.rgb.b}`);
ok('Dispersión ~0 en zona uniforme', clean.spread<0.01);
const noisy = C.sampleRegion(patch([90,120,60],[0,5,12,40,77]));
ok('Descarta los reflejos', noisy.discarded===5, `descartados=${noisy.discarded}/${noisy.total}`);
ok('Resultado idéntico al color real pese al ruido', Math.abs(noisy.rgb.r-90)<=1&&Math.abs(noisy.rgb.g-120)<=1&&Math.abs(noisy.rgb.b-60)<=1, `${noisy.rgb.r},${noisy.rgb.g},${noisy.rgb.b}`);
// Comparación con media simple en RGB, para justificar el método
let sr=0,sg=0,sb=0; const p=patch([90,120,60],[0,5,12,40,77]);
for(let i=0;i<81;i++){sr+=p.data[i*4];sg+=p.data[i*4+1];sb+=p.data[i*4+2];}
console.log(`  (media simple RGB daría ${Math.round(sr/81)},${Math.round(sg/81)},${Math.round(sb/81)} — dE ${C.deltaE2000(C.rgbToLab(90,120,60),C.rgbToLab(sr/81,sg/81,sb/81)).toFixed(2)} de error)`);

console.log('\n== Nombres genéricos ==');
[[255,0,0],[128,128,128],[255,255,255],[10,10,12],[30,90,200],[240,220,120]].forEach(c=>{
  const l=C.rgbToLab(...c); console.log(`  ${C.rgbToHex(...c)} -> ${describeColor(C.labToLch(l.L,l.a,l.b))}`);
});

console.log(fails? `\n${fails} PRUEBAS FALLIDAS\n` : '\nTodas las pruebas pasan\n');
process.exit(fails?1:0);

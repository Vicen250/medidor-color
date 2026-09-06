/* =========================================================================
   catalogs.js — Escalas de referencia
   Formato compacto: "codigo hex nombre;codigo hex nombre;..."
   Los valores RGB de RAL son equivalencias aproximadas de dominio público:
   el estándar RAL se define sobre muestras físicas, no sobre valores digitales.
   ========================================================================= */

const RAL_CLASSIC =
'1000 CDBA88 Beige verdoso;1001 D0B084 Beige;1002 D2AA6D Amarillo arena;1003 F9A800 Amarillo señales;' +
'1004 E49E00 Amarillo oro;1005 CB8E00 Amarillo miel;1006 E29000 Amarillo maíz;1007 E88C00 Amarillo narciso;' +
'1011 AF804F Amarillo pardo;1012 DDAF27 Amarillo limón;1013 E3D9C6 Blanco perla;1014 DDC49A Marfil;' +
'1015 E6D2B5 Marfil claro;1016 F1DD38 Amarillo azufre;1017 F6A950 Amarillo azafrán;1018 FACA30 Amarillo zinc;' +
'1019 A48F7A Beige agrisado;1020 A08F65 Amarillo oliva;1021 F6B600 Amarillo colza;1023 F7B500 Amarillo tráfico;' +
'1024 BA8F4C Amarillo ocre;1026 FFFF00 Amarillo brillante;1027 A77F0E Amarillo curry;1028 FF9B00 Amarillo melón;' +
'1032 D6AE01 Amarillo retama;1033 F3A505 Amarillo dalia;1034 EFA94A Amarillo pastel;1035 6A5D4D Beige perlado;' +
'1036 705335 Oro perlado;1037 F4A900 Amarillo perlado;' +
'2000 ED760E Amarillo naranja;2001 C93C20 Rojo anaranjado;2002 CB2821 Naranja sangre;2003 FF7514 Naranja pastel;' +
'2004 F44611 Naranja puro;2005 FF2301 Naranja brillante;2007 FFA420 Naranja claro brillante;' +
'2008 F75E25 Naranja rojo claro;2009 F54021 Naranja tráfico;2010 D84B20 Naranja señales;2011 EC7C26 Naranja intenso;' +
'2012 E55137 Naranja salmón;2013 C35831 Naranja perlado;' +
'3000 AF2B1E Rojo vivo;3001 A52019 Rojo señales;3002 A2231D Rojo carmín;3003 9B111E Rojo rubí;' +
'3004 75151E Rojo púrpura;3005 5E2129 Rojo vino;3007 412227 Rojo negruzco;3009 642424 Rojo óxido;' +
'3011 781F19 Rojo pardo;3012 C1876B Rojo beige;3013 A12312 Rojo tomate;3014 D36E70 Rojo viejo;' +
'3015 EA899A Rojo claro;3016 B32821 Rojo coral;3017 E63244 Rosa;3018 D53032 Rojo fresa;' +
'3020 CC0605 Rojo tráfico;3022 D95030 Rojo salmón;3024 F80000 Rojo brillante;3026 FE0000 Rojo tráfico brillante;' +
'3027 C51D34 Rojo frambuesa;3028 CB3234 Rojo puro;3031 B32428 Rojo oriente;3032 721422 Rubí perlado;' +
'3033 B44C43 Rosa perlado;' +
'4001 6D3F5B Lila rojizo;4002 922B3E Rojo violeta;4003 DE4C8A Violeta érica;4004 641C34 Burdeos;' +
'4005 6C4675 Lila azulado;4006 A03472 Púrpura tráfico;4007 4A192C Violeta púrpura;4008 924E7D Violeta señales;' +
'4009 A18594 Violeta pastel;4010 CF3476 Magenta;4011 8673A1 Violeta perlado;4012 6C6874 Mora perlada;' +
'5000 354D73 Azul violeta;5001 1F3438 Azul verdoso;5002 20214F Azul ultramar;5003 1D1E33 Azul zafiro;' +
'5004 18171C Azul negruzco;5005 1E2460 Azul señales;5007 3E5F8A Azul brillante;5008 26252D Azul grisáceo;' +
'5009 025669 Azul azur;5010 0E294B Azul genciana;5011 231A24 Azul acero;5012 3B83BD Azul luminoso;' +
'5013 1E213D Azul cobalto;5014 606E8C Azul pichón;5015 2271B3 Azul celeste;5017 063971 Azul tráfico;' +
'5018 3F888F Azul turquesa;5019 1B5583 Azul capri;5020 1D334A Azul océano;5021 256D7B Azul agua;' +
'5022 252850 Azul noche;5023 49678D Azul distante;5024 5D9B9B Azul pastel;5025 2A6478 Genciana perlado;' +
'5026 102C54 Azul noche perlado;' +
'6000 316650 Verde patina;6001 287233 Verde esmeralda;6002 2D572C Verde hoja;6003 424632 Verde oliva;' +
'6004 1F3A3D Verde azulado;6005 2F4538 Verde musgo;6006 3E3B32 Verde oliva grisáceo;6007 343B29 Verde botella;' +
'6008 39352A Verde parduzco;6009 31372B Verde abeto;6010 35682D Verde hierba;6011 587246 Verde reseda;' +
'6012 343E40 Verde negruzco;6013 6C7156 Verde caña;6014 47402E Amarillo oliva;6015 3B3C36 Oliva negruzco;' +
'6016 1E5945 Verde turquesa;6017 4C9141 Verde mayo;6018 57A639 Verde amarillento;6019 BDECB6 Verde blanquecino;' +
'6020 2E3A23 Verde óxido de cromo;6021 89AC76 Verde pálido;6022 25221B Oliva parduzco;6024 308446 Verde tráfico;' +
'6025 3D642D Verde helecho;6026 015D52 Verde ópalo;6027 84C3BE Verde luminoso;6028 2C5545 Verde pino;' +
'6029 20603D Verde menta;6032 317F43 Verde señales;6033 497E76 Verde menta turquesa;6034 7FB5B5 Turquesa pastel;' +
'6035 1C542D Verde perlado;6036 193737 Verde ópalo perlado;6037 008F39 Verde puro;6038 00BB2D Verde brillante;' +
'7000 78858B Gris ardilla;7001 8A9597 Gris plata;7002 7E7B52 Gris oliva;7003 6C7059 Gris musgo;' +
'7004 969992 Gris señales;7005 646B63 Gris ratón;7006 6D6552 Gris beige;7008 6A5F31 Gris caqui;' +
'7009 4D5645 Gris verdoso;7010 4C514A Gris lona;7011 434B4D Gris hierro;7012 4E5754 Gris basalto;' +
'7013 464531 Gris parduzco;7015 434750 Gris pizarra;7016 293133 Gris antracita;7021 23282B Gris negruzco;' +
'7022 332F2C Gris sombra;7023 686C5E Gris hormigón;7024 474A51 Gris grafito;7026 2F353B Gris granito;' +
'7030 8B8C7A Gris piedra;7031 474B4E Gris azulado;7032 B8B799 Gris guijarro;7033 7D8471 Gris cemento;' +
'7034 8F8B66 Gris amarillento;7035 D7D7D7 Gris luminoso;7036 7F7679 Gris platino;7037 7D7F7D Gris polvo;' +
'7038 B5B8B1 Gris ágata;7039 6C6960 Gris cuarzo;7040 9DA1AA Gris ventana;7042 8D948D Gris tráfico A;' +
'7043 4E5452 Gris tráfico B;7044 CAC4B0 Gris seda;7045 909090 Telegris 1;7046 82898F Telegris 2;' +
'7047 D0D0D0 Telegris 4;7048 898176 Gris musgo perlado;' +
'8000 826C34 Marrón verdoso;8001 955F20 Marrón ocre;8002 6C3B2A Marrón señales;8003 734222 Marrón arcilla;' +
'8004 8E402A Marrón cobre;8007 59351F Marrón corzo;8008 6F4F28 Marrón oliva;8011 5B3A29 Marrón nuez;' +
'8012 592321 Marrón rojo;8014 382C1E Marrón sepia;8015 633A34 Marrón castaño;8016 4C2F27 Marrón caoba;' +
'8017 45322E Marrón chocolate;8019 403A3A Marrón grisáceo;8022 212121 Marrón negruzco;8023 A65E2E Marrón anaranjado;' +
'8024 79553D Marrón beige;8025 755C48 Marrón pálido;8028 4E3B31 Marrón tierra;8029 763C28 Cobre perlado;' +
'9001 FDF4E3 Blanco crema;9002 E7EBDA Blanco grisáceo;9003 F4F4F4 Blanco señales;9004 282828 Negro señales;' +
'9005 0A0A0A Negro intenso;9006 A5A5A5 Aluminio blanco;9007 8F8F8F Aluminio gris;9010 FFFFFF Blanco puro;' +
'9011 1C1C1C Negro grafito;9016 F6F6F6 Blanco tráfico;9017 1E1E1E Negro tráfico;9018 D7D7D7 Blanco papiro;' +
'9022 9C9C9C Gris claro perlado;9023 828282 Gris oscuro perlado';

const CSS_NAMED =
'aliceblue F0F8FF;antiquewhite FAEBD7;aqua 00FFFF;aquamarine 7FFFD4;azure F0FFFF;beige F5F5DC;bisque FFE4C4;' +
'black 000000;blanchedalmond FFEBCD;blue 0000FF;blueviolet 8A2BE2;brown A52A2A;burlywood DEB887;cadetblue 5F9EA0;' +
'chartreuse 7FFF00;chocolate D2691E;coral FF7F50;cornflowerblue 6495ED;cornsilk FFF8DC;crimson DC143C;cyan 00FFFF;' +
'darkblue 00008B;darkcyan 008B8B;darkgoldenrod B8860B;darkgray A9A9A9;darkgreen 006400;darkkhaki BDB76B;' +
'darkmagenta 8B008B;darkolivegreen 556B2F;darkorange FF8C00;darkorchid 9932CC;darkred 8B0000;darksalmon E9967A;' +
'darkseagreen 8FBC8F;darkslateblue 483D8B;darkslategray 2F4F4F;darkturquoise 00CED1;darkviolet 9400D3;' +
'deeppink FF1493;deepskyblue 00BFFF;dimgray 696969;dodgerblue 1E90FF;firebrick B22222;floralwhite FFFAF0;' +
'forestgreen 228B22;fuchsia FF00FF;gainsboro DCDCDC;ghostwhite F8F8FF;gold FFD700;goldenrod DAA520;gray 808080;' +
'green 008000;greenyellow ADFF2F;honeydew F0FFF0;hotpink FF69B4;indianred CD5C5C;indigo 4B0082;ivory FFFFF0;' +
'khaki F0E68C;lavender E6E6FA;lavenderblush FFF0F5;lawngreen 7CFC00;lemonchiffon FFFACD;lightblue ADD8E6;' +
'lightcoral F08080;lightcyan E0FFFF;lightgoldenrodyellow FAFAD2;lightgray D3D3D3;lightgreen 90EE90;lightpink FFB6C1;' +
'lightsalmon FFA07A;lightseagreen 20B2AA;lightskyblue 87CEFA;lightslategray 778899;lightsteelblue B0C4DE;' +
'lightyellow FFFFE0;lime 00FF00;limegreen 32CD32;linen FAF0E6;magenta FF00FF;maroon 800000;mediumaquamarine 66CDAA;' +
'mediumblue 0000CD;mediumorchid BA55D3;mediumpurple 9370DB;mediumseagreen 3CB371;mediumslateblue 7B68EE;' +
'mediumspringgreen 00FA9A;mediumturquoise 48D1CC;mediumvioletred C71585;midnightblue 191970;mintcream F5FFFA;' +
'mistyrose FFE4E1;moccasin FFE4B5;navajowhite FFDEAD;navy 000080;oldlace FDF5E6;olive 808000;olivedrab 6B8E23;' +
'orange FFA500;orangered FF4500;orchid DA70D6;palegoldenrod EEE8AA;palegreen 98FB98;paleturquoise AFEEEE;' +
'palevioletred DB7093;papayawhip FFEFD5;peachpuff FFDAB9;peru CD853F;pink FFC0CB;plum DDA0DD;powderblue B0E0E6;' +
'purple 800080;rebeccapurple 663399;red FF0000;rosybrown BC8F8F;royalblue 4169E1;saddlebrown 8B4513;salmon FA8072;' +
'sandybrown F4A460;seagreen 2E8B57;seashell FFF5EE;sienna A0522D;silver C0C0C0;skyblue 87CEEB;slateblue 6A5ACD;' +
'slategray 708090;snow FFFAFA;springgreen 00FF7F;steelblue 4682B4;tan D2B48C;teal 008080;thistle D8BFD8;' +
'tomato FF6347;turquoise 40E0D0;violet EE82EE;wheat F5DEB3;white FFFFFF;whitesmoke F5F5F5;yellow FFFF00;' +
'yellowgreen 9ACD32';

/* ---------- Parsers ---------- */

function parseRal(src) {
  return src.split(';').map(row => {
    const t = row.trim();
    const sp1 = t.indexOf(' ');
    const sp2 = t.indexOf(' ', sp1 + 1);
    return {
      code: 'RAL ' + t.slice(0, sp1),
      hex: '#' + t.slice(sp1 + 1, sp2),
      name: t.slice(sp2 + 1)
    };
  });
}

function parseCss(src) {
  return src.split(';').map(row => {
    const t = row.trim();
    const sp = t.indexOf(' ');
    const name = t.slice(0, sp);
    return { code: name, hex: '#' + t.slice(sp + 1), name };
  });
}

/* Escala de grises neutros por luminosidad L*, de N0 (negro) a N10 (blanco).
   Se genera en Lab para que los pasos sean perceptualmente uniformes. */
function buildNeutrals(labToRgb, rgbToHex) {
  const out = [];
  for (let i = 0; i <= 20; i++) {
    const L = (i / 20) * 100;
    const rgb = labToRgb(L, 0, 0);
    out.push({
      code: 'N' + (i / 2).toFixed(1),
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      name: `Neutro L*${L.toFixed(0)}`
    });
  }
  return out;
}

/* ---------- API ---------- */

export function buildCatalogs(helpers) {
  const { rgbToLab, hexToRgb, labToRgb, rgbToHex } = helpers;

  const withLab = list =>
    list.map(c => {
      const rgb = hexToRgb(c.hex);
      return { ...c, rgb, lab: rgbToLab(rgb.r, rgb.g, rgb.b) };
    });

  return {
    ral: { id: 'ral', label: 'RAL Classic', note: 'Equivalencias aproximadas', colors: withLab(parseRal(RAL_CLASSIC)) },
    css: { id: 'css', label: 'Colores web', note: 'Nombres CSS estándar', colors: withLab(parseCss(CSS_NAMED)) },
    neutral: { id: 'neutral', label: 'Grises neutros', note: 'Escala L* uniforme', colors: withLab(buildNeutrals(labToRgb, rgbToHex)) }
  };
}

/* Descripción del tono en lenguaje natural, derivada de LCh.
   No es un catálogo: es una etiqueta de apoyo. */
export function describeColor(lch) {
  const { L, C, h } = lch;
  if (C < 4) {
    if (L < 8) return 'negro';
    if (L < 25) return 'gris muy oscuro';
    if (L < 45) return 'gris oscuro';
    if (L < 62) return 'gris medio';
    if (L < 80) return 'gris claro';
    if (L < 95) return 'gris muy claro';
    return 'blanco';
  }
  /* Límites tomados del ángulo LCh real de colores de referencia:
     rojo 40°, naranja 60°, amarillo 103°, verde 136°, cian 196°,
     azul 306°, magenta 328°, rosa 3°. */
  const hues = [
    [12, 'rosa'], [50, 'rojo'], [70, 'naranja'], [90, 'naranja amarillento'],
    [112, 'amarillo'], [130, 'amarillo verdoso'], [158, 'verde'],
    [188, 'verde azulado'], [232, 'turquesa'], [298, 'azul'],
    [320, 'azul violáceo'], [348, 'magenta'], [360, 'rosa']
  ];
  let base = 'rosa';
  for (const [max, name] of hues) { if (h < max) { base = name; break; } }

  /* El marrón no tiene tono propio: es un naranja o rojo oscurecido y
     desaturado. Sin este caso, la madera se describiría como "naranja". */
  if (L < 58 && C < 62 && h >= 20 && h < 95) {
    const veryDark = L < 28;
    const reddish = h < 45;
    return (veryDark ? 'marrón muy oscuro' : reddish ? 'marrón rojizo' : 'marrón') +
           (C < 14 ? ' grisáceo' : '');
  }

  const light = L < 20 ? 'muy oscuro' : L < 40 ? 'oscuro' : L < 66 ? '' : L < 85 ? 'claro' : 'muy claro';
  const sat = C < 14 ? 'muy apagado' : C < 32 ? 'apagado' : C < 65 ? '' : C < 95 ? 'intenso' : 'muy saturado';

  return [base, light, sat].filter(Boolean).join(' ');
}

/* Carga un catálogo propio desde CSV: "codigo,nombre,hex" o "codigo,nombre,L,a,b" */
export function parseUserCatalog(text, helpers) {
  const { hexToRgb, rgbToLab, labToRgb, rgbToHex } = helpers;
  const colors = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || /^c[oó]digo/i.test(line)) continue;
    const p = line.split(/[,;\t]/).map(s => s.trim());
    if (p.length < 3) continue;
    try {
      if (p.length >= 5 && !/^#?[0-9a-f]{6}$/i.test(p[2])) {
        const lab = { L: parseFloat(p[2]), a: parseFloat(p[3]), b: parseFloat(p[4]) };
        if ([lab.L, lab.a, lab.b].some(Number.isNaN)) continue;
        const rgb = labToRgb(lab.L, lab.a, lab.b);
        colors.push({ code: p[0], name: p[1], hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb, lab });
      } else {
        const hex = p[2].startsWith('#') ? p[2] : '#' + p[2];
        if (!/^#[0-9a-f]{6}$/i.test(hex)) continue;
        const rgb = hexToRgb(hex);
        colors.push({ code: p[0], name: p[1], hex: hex.toUpperCase(), rgb, lab: rgbToLab(rgb.r, rgb.g, rgb.b) });
      }
    } catch { /* fila ignorada */ }
  }
  return colors;
}

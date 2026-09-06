# Medidor de color — de web a APK

App que mide el color de un punto concreto de una foto y devuelve su valor en
HEX, RGB, HSL, HSV, CMYK, L\*a\*b\* y LCh, junto con las referencias más
próximas en RAL Classic, colores web y una escala de grises neutros.

Funciona entera en el dispositivo. No sube ninguna imagen a ningún servidor.

---

## 1. Qué hace distinto a un cuentagotas normal

Un selector de color típico lee un píxel y lo compara en RGB. Eso falla por dos
motivos, y los dos están resueltos aquí.

**Promediar en RGB deforma el color.** El sRGB no es perceptualmente uniforme.
La app convierte cada píxel del parche a L\*a\*b\*, descarta los atípicos con la
desviación absoluta mediana (así se van los reflejos especulares y el ruido del
sensor) y promedia solo los que quedan. En la prueba incluida, un parche con
cinco píxeles de reflejo devuelve el color exacto del material, mientras que una
media simple en RGB se desvía ΔE 3.57 — una diferencia claramente visible.

**Comparar en RGB no equivale a comparar como ve el ojo.** El emparejamiento con
las cartas usa CIEDE2000, validado contra los nueve casos de referencia de
Sharma, Wu y Dalal con un error máximo de 4×10⁻⁵.

Además:

- **Balance de blancos.** Apunta a algo que sepas neutro (un folio, una pared
  blanca) y púlsalo como referencia: se aplica una adaptación cromática von
  Kries que anula la dominante de la luz. Es lo que más exactitud aporta.
- **Indicador de fiabilidad.** Si la zona bajo la mira es irregular, la app te
  lo dice en vez de darte un número con falsa confianza.
- **Mira fija en el centro.** La imagen se arrastra por debajo, así que el dedo
  nunca tapa el punto que estás midiendo. Las flechas del teclado mueven de
  píxel en píxel.

## 2. Probarla en el ordenador

Los módulos ES necesitan servirse por HTTP; abrir el `index.html` con doble clic
no funciona.

```bash
cd medidor-color
python -m http.server 8000
```

Y abre `http://localhost:8000`.

## 3. Probarla en el móvil antes de empaquetar

Súbela a cualquier hosting estático con HTTPS. Gratuitos y suficientes:

| Servicio | Cómo |
|---|---|
| **GitHub Pages** | Sube la carpeta a un repo, Settings → Pages → rama `main` |
| **Netlify Drop** | Arrastra la carpeta a `app.netlify.com/drop`, sin registro |
| **Cloudflare Pages** | Conecta el repo, sin configuración de build |
| **Vercel** | `vercel --prod` desde la carpeta |

Ábrela en Chrome Android: ya es instalable desde el menú (**Añadir a pantalla de
inicio**) y funciona sin conexión. Para muchos usos esto ya sustituye a la APK.

## 4. Generar la APK

### Opción A — PWABuilder (recomendada)

Gratuita, sin marcas de agua ni anuncios, y produce un proyecto Android real.

1. Entra en `pwabuilder.com` y pega la URL HTTPS de tu app.
2. **Package for stores → Android**.
3. Elige **Signing key: create new** (o usa tu keystore, que ya tienes de la app
   de Flutter) y guarda bien el `.keystore` y las contraseñas: sin ellos no
   podrás publicar actualizaciones.
4. Descargas un ZIP con la APK, el AAB y el archivo `assetlinks.json`.

**Paso que se salta mucha gente:** sube `assetlinks.json` a
`https://tu-dominio/.well-known/assetlinks.json`. Sin él, la app abre con la
barra de direcciones de Chrome visible en lugar de a pantalla completa.

### Opción B — Bubblewrap por línea de comandos

Es lo que PWABuilder usa por debajo. Como ya tienes Android Studio y el SDK
configurados, te da más control:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://tu-dominio/manifest.webmanifest
bubblewrap build
```

### Opción C — Capacitor, si quieres empaquetar sin servidor

Las opciones A y B crean una *Trusted Web Activity*: la APK carga tu web desde
internet (con caché offline). Si prefieres que los archivos vivan dentro de la
APK y no dependan de un dominio:

```bash
npm init -y
npm i @capacitor/core @capacitor/android
npx cap init "Medidor de color" com.tudominio.medidorcolor --web-dir=.
npx cap add android
npx cap open android
```

Y compilas desde Android Studio como hiciste con Descargador Social.

### Servicios que conviene evitar

AppsGeyser, WebIntoApp y similares insertan publicidad, piden permisos que la
app no necesita y en varios casos no permiten firmar con tu propia clave. Para
este caso no aportan nada frente a PWABuilder.

## 5. Sobre los permisos de cámara

La app usa `<input type="file" capture="environment">`, que abre la aplicación de
cámara del sistema en lugar de `getUserMedia`. Es deliberado:

- No hace falta declarar el permiso `CAMERA` en el manifiesto de Android.
- Funciona igual dentro de una TWA, de un WebView o de un navegador.
- Aprovechas el enfoque y la exposición de la cámara nativa, que son mejores
  que los de una vista previa por WebRTC.

## 6. Añadir tus propias cartas de color

RAL Classic va incluido con equivalencias RGB de dominio público. NCS y Pantone
no: sus valores son propiedad de sus titulares y hay que licenciarlos. Si
dispones de ellos, cárgalos desde la propia app en CSV:

```csv
codigo,nombre,hex
S 0500-N,Blanco,F3F3F3
S 1002-Y,Amarillo pálido,EDE8DC
```

O directamente en Lab, que es más exacto porque evita el viaje por sRGB:

```csv
codigo,nombre,L,a,b
S 0500-N,Blanco,95.2,0.1,0.4
```

Para editar los catálogos incluidos, están en `js/catalogs.js` como cadenas de
texto compactas al principio del archivo.

## 7. Hasta dónde llega la exactitud

Conviene tenerlo claro antes de usar esto para algo que importe:

- **La cámara de un móvil no es un colorímetro.** El ISP aplica saturación,
  mapeo de tonos y balance de blancos automático antes de que exista el JPEG.
  Ninguna corrección posterior deshace eso del todo.
- **La luz manda.** Bajo una bombilla cálida, un blanco se fotografía
  anaranjado. Por eso el balance de blancos con referencia es la función que más
  te va a acercar al color real.
- **RAL se define sobre muestras físicas**, no sobre valores digitales. Las
  equivalencias RGB que circulan varían según la fuente. Trátalas como una
  orientación para acotar la búsqueda en un abanico real.

Para acercarte todo lo posible: luz de día indirecta o difusa, sin reflejo ni
sombra propia sobre la zona a medir, un folio blanco en el mismo encuadre, el
objeto llenando el fotograma y el HDR desactivado.

Si en algún momento necesitas medidas trazables, un colorímetro de bolsillo
(Nix Mini, Datacolor ColorReader) mide con contacto y luz propia, que es otro
nivel de fiabilidad.

## 8. Estructura

```
index.html              interfaz
styles.css              estilos
js/color.js             conversiones, ΔE2000, muestreo, balance de blancos
js/catalogs.js          RAL Classic, colores web, grises, catálogos propios
js/app.js               interacción, medición, historial
sw.js                   funcionamiento sin conexión
manifest.webmanifest    metadatos de instalación
icons/                  iconos, incluidos los maskable de Android
```

La interfaz está construida en grises con R=G=B exactos a propósito: cualquier
tinte alrededor desplaza la percepción del color que estás midiendo.

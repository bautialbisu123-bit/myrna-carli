# Dra. Myrna a.n. Carli — página web

Página del consultorio odontológico de la Dra. Myrna a.n. Carli (Palermo, CABA). Tiene base crema, detalles en rosa y animaciones suaves.

## Archivos

- **`index.html`**: la página. Tiene portada, especialidades, la doctora, galería, turnos, estudios y experiencia, ubicación y cierre.
- **`assets/css/estilo.css`**: colores, letras y animaciones.
- **`assets/js/sitio.js`**: menú, animaciones de entrada, fotos de la portada, galería y foto ampliada.
- **`assets/js/fotos.js`**: **la lista de fotos**. Es lo único que hay que tocar para sumar fotos.
- **`assets/fotos/`**: carpeta donde van las fotos.

## Cómo sumar fotos

1. Copiá las fotos a `assets/fotos/`.
2. Anotalas en `assets/js/fotos.js`. El archivo trae un ejemplo.
   - **`hero`**: fotos que van cambiando en el arco de la portada. Las verticales quedan mejor.
   - **`doctora`**: retrato para la sección "La doctora".
   - **`galeria`**: trabajos y fotos del consultorio. Cada una lleva `src`, `alt` y, si querés, `tag` y `forma` (`grande`, `alta` o `ancha`).

Si una lista está vacía, la página muestra el dibujo del diente en su lugar y la galería no aparece.

Las fotos de pacientes, sobre todo de chicos, se publican solo con su permiso.

## Formularios

"Enviar estudios" y "Dejar mi experiencia" usan el sistema de Helsek que está en el servidor, en `https://lightpink-loris-112320.hostingersite.com/estudios` y `/experiencia`. Cuando el sitio tenga su dominio definitivo, hay que cambiar esa dirección en `index.html`.

## Datos

- **Dirección:** Coronel Díaz 2381, Piso 7, Depto B, CABA.
- **WhatsApp:** +54 9 11 6143-4141.
- **Instagram:** [@myrnacarli](https://www.instagram.com/myrnacarli/).

La página tiene `noindex` mientras es una versión de prueba. Para publicarla, hay que sacar esa línea del `<head>`.

/* Fotos de la página.
   1. Copiá las fotos a la carpeta assets/fotos/ (JPG, idealmente de 1200 a 1600 px del lado largo).
   2. Anotalas acá abajo. Si una lista queda vacía, la página muestra los dibujos en su lugar
      y la galería no aparece.

   hero:     fotos que van cambiando solas en el arco de la portada (verticales quedan mejor).
   doctora:  un retrato de la Dra. para la sección "La doctora".
   galeria:  trabajos y momentos del consultorio.
             src   = la foto
             alt   = qué se ve (para lectores de pantalla)
             tag   = etiqueta corta que aparece sobre la foto (opcional)
             forma = "grande", "alta" o "ancha" para que esa foto ocupe más lugar (opcional)

   Ejemplo:
   galeria: [
     { src: 'assets/fotos/consultorio-1.jpg', alt: 'Sala de atención del consultorio', tag: 'Consultorio', forma: 'grande' },
     { src: 'assets/fotos/ortodoncia-1.jpg', alt: 'Tratamiento de ortodoncia terminado', tag: 'Ortodoncia' }
   ]
*/
window.FOTOS = {
  hero: [],
  doctora: '',
  galeria: []
};

/* Modelo 2 · "Orgánico y suave" — comportamiento de la página (JS propio, sin librerías).
   - Manchas que cambian de forma despacio (SVG: puntos que se interpolan), pausadas fuera de pantalla.
   - Portada con capas en parallax suave (al bajar y, en compu, con el mouse).
   - Botones magnéticos (solo con mouse).
   - Especialidades en acordeón con altura animada (una abierta a la vez).
   - Comparador antes/después (mouse, toque y teclado).
   - Aparición con un leve rebote al entrar en pantalla.
   - Fotos: se leen de ../../assets/js/fotos.js; si no hay, quedan los marcos. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, W = window;
  var F = W.FOTOS || {};
  var reducido = W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conMouse = W.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hayIO = 'IntersectionObserver' in W;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function modulo(nombre, fn) {
    try { fn(); } catch (e) { html.classList.add('listo'); if (W.console) console.error('[modelo 2] ' + nombre, e); }
  }
  function ruta(p) { return /^(https?:)?\/\//.test(p) || p.charAt(0) === '/' || p.indexOf('data:') === 0 ? p : '../../' + p.replace(/^\.\//, ''); }

  /* ---------- menú del celular ---------- */
  modulo('menú', function () {
    var cab = $('#cab'), bt = $('.cab__menu'), nav = $('#menu');
    if (!cab || !bt || !nav) return;
    function poner(abrir) {
      cab.classList.toggle('abierto', abrir);
      bt.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      bt.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    }
    bt.addEventListener('click', function () { poner(!cab.classList.contains('abierto')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) poner(false); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cab.classList.contains('abierto')) { poner(false); bt.focus(); }
    });
    d.addEventListener('click', function (e) { if (cab.classList.contains('abierto') && !cab.contains(e.target)) poner(false); });
    var mq = matchMedia('(min-width: 1081px)');
    var alCambiar = function () { if (mq.matches) poner(false); };
    if (mq.addEventListener) mq.addEventListener('change', alCambiar); else if (mq.addListener) mq.addListener(alCambiar);
  });

  /* ---------- encabezado con sombra y WhatsApp flotante ---------- */
  modulo('encabezado', function () {
    var cab = $('#cab'), wa = $('.wa-flot'), cierre = $('.cierre'), pend = false;
    function revisar() {
      pend = false;
      var y = W.scrollY || W.pageYOffset;
      if (cab) cab.classList.toggle('con-sombra', y > 8);
      if (wa) {
        var cerca = cierre && cierre.getBoundingClientRect().top < innerHeight * .75;
        wa.classList.toggle('ve', y > innerHeight * .7 && !cerca);
      }
    }
    W.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(revisar); } }, { passive: true });
    revisar();
  });

  /* ---------- fotos (si hay) ---------- */
  modulo('fotos', function () {
    function ponerFoto(fig, src, alt, tag) {
      if (!fig || !src) return null;
      var im = new Image();
      im.decoding = 'async';
      im.alt = alt || '';
      im.onload = function () { im.classList.add('cargada'); fig.classList.add('con-foto'); };
      im.onerror = function () { im.remove(); };
      im.src = ruta(src);
      fig.appendChild(im);
      if (tag) {
        var t = d.createElement('figcaption'); t.className = 'foto__tag foto__cap'; t.textContent = tag; fig.appendChild(t);
      }
      return im;
    }
    var hero = (F.hero || []).filter(Boolean), gal = (F.galeria || []).filter(function (g) { return g && g.src; });

    // Portada: el arco principal va cambiando entre las fotos de "hero".
    var arco = $('#fotoHero'), pild = $('#fotoHero2');
    if (hero.length && arco) {
      var imgs = hero.map(function (src, i) {
        var im = ponerFoto(arco, src, i === 0 ? 'Consultorio de la Dra. Myrna a.n. Carli' : '');
        if (i > 0) im.classList.add('oculta');
        return im;
      });
      if (imgs.length > 1 && !reducido) {
        var k = 0, heroVisible = true;
        if (hayIO) new IntersectionObserver(function (es) { heroVisible = es[0].isIntersecting; }).observe(arco);
        setInterval(function () {
          if (!heroVisible || d.hidden) return;
          imgs[k].classList.add('oculta'); k = (k + 1) % imgs.length; imgs[k].classList.remove('oculta');
        }, 5200);
      }
    }
    // Píldora de la portada: la segunda foto de "hero" o la primera de la galería.
    var segunda = hero.length > 1 ? hero[1] : (gal[0] && gal[0].src);
    if (pild && segunda) ponerFoto(pild, segunda, hero.length > 1 ? '' : (gal[0].alt || ''));

    // Retrato de la doctora.
    if (F.doctora && $('#fotoDoctora')) ponerFoto($('#fotoDoctora'), F.doctora, 'Retrato de la Dra. Myrna a.n. Carli');

    // Acordeón: si una foto de la galería tiene una etiqueta que coincide, va en su marco.
    $$('.acc__foto[data-etiqueta]').forEach(function (fig) {
      var re = new RegExp(fig.getAttribute('data-etiqueta'), 'i');
      var g = gal.filter(function (x) { return re.test((x.tag || '') + ' ' + (x.alt || '')); })[0];
      if (g) ponerFoto(fig, g.src, g.alt);
    });

    // Galería: con fotos, se muestran solo las fotos (con las mismas formas); sin fotos, quedan los marcos.
    var caja = $('#galeria');
    if (caja && gal.length) {
      var formas = ['foto--arco', 'foto--circulo', 'foto--pildora', 'foto--gota', 'foto--arco'];
      caja.innerHTML = '';
      gal.forEach(function (g, i) {
        var fig = d.createElement('figure');
        fig.className = 'foto gal__i rv ' + formas[i % formas.length];
        ponerFoto(fig, g.src, g.alt, g.tag);
        caja.appendChild(fig);
      });
    }

    // Comparador (opcional): FOTOS.comparador = { antes: 'assets/fotos/a.jpg', despues: 'assets/fotos/b.jpg' }
    var c = F.comparador, comp = $('[data-comp]');
    if (c && c.antes && c.despues && comp) {
      [['.comp__antes', c.antes, 'Antes del tratamiento'], ['.comp__despues', c.despues, 'Después del tratamiento']].forEach(function (x) {
        var capa = $(x[0], comp), im = new Image();
        im.alt = x[2]; im.decoding = 'async'; im.src = ruta(x[1]); im.className = 'comp__img';
        im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1';
        capa.insertBefore(im, capa.firstChild.nextSibling);
      });
    }
  });

  /* ---------- aparición con rebote ---------- */
  modulo('aparición', function () {
    var els = $$('.rv');
    if (!hayIO || reducido) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        // En la galería del celular (que se desliza de costado) aparecen todas juntas.
        var grupo = e.target.classList.contains('gal__i') ? $$('.gal__i', e.target.parentNode) : [e.target];
        grupo.forEach(function (el, i) {
          if (el !== e.target && !el.classList.contains('in')) el.style.setProperty('--d', (i * .07).toFixed(2) + 's');
          el.classList.add('in'); io.unobserve(el);
        });
      });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
    // Si algo quedó arriba (por ejemplo, al entrar con un #ancla), se muestra igual.
    W.addEventListener('load', function () {
      setTimeout(function () {
        els.forEach(function (el) { if (!el.classList.contains('in') && el.getBoundingClientRect().bottom < 0) { el.classList.add('in'); io.unobserve(el); } });
      }, 400);
    });
  });

  /* ---------- manchas que cambian de forma ---------- */
  modulo('manchas', function () {
    var manchas = $$('[data-mancha]');
    if (!manchas.length) return;
    function azar(semilla) { // generador simple y repetible
      var s = semilla >>> 0;
      return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    function n1(x) { return Math.round(x * 10) / 10; }
    function curva(p) { // spline cerrada (Catmull-Rom) pasada a curvas Bézier
      var n = p.length, s = 'M' + n1(p[0][0]) + ',' + n1(p[0][1]);
      for (var i = 0; i < n; i++) {
        var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
        s += 'C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ',' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
          n1(p2[0] - (p3[0] - p1[0]) / 6) + ',' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n1(p2[0]) + ',' + n1(p2[1]);
      }
      return s + 'Z';
    }
    var lista = manchas.map(function (el) {
      var r = azar(parseInt(el.getAttribute('data-mancha'), 10) || 1);
      var amp = parseFloat(el.getAttribute('data-amp')) || .15, R = parseFloat(el.getAttribute('data-r')) || 72, n = 7, pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({
          a: i / n * Math.PI * 2 + (r() - .5) * .4,
          f1: .00026 + r() * .00022, f2: .00014 + r() * .00012,
          p1: r() * 6.283, p2: r() * 6.283, k: .75 + r() * .25
        });
      }
      var m = { el: el, path: $('path', el), pts: pts, amp: amp, t: r() * 40000 };
      m.forma = function () {
        var xy = [];
        for (var i = 0; i < n; i++) {
          var q = pts[i];
          var rr = R * (1 + amp * q.k * (Math.sin(m.t * q.f1 + q.p1) * .62 + Math.sin(m.t * q.f2 + q.p2) * .38));
          xy.push([100 + Math.cos(q.a) * rr, 100 + Math.sin(q.a) * rr]);
        }
        return curva(xy);
      };
      if (m.path) m.path.setAttribute('d', m.forma());
      return m;
    });
    if (reducido) return; // forma fija, sin movimiento

    var activas = [], corriendo = false, ultimo = 0;
    function cuadro(ahora) {
      if (!activas.length || d.hidden) { corriendo = false; return; }
      var dt = ahora - ultimo;
      if (dt >= 33) { // ~30 cuadros por segundo alcanzan: el cambio es muy lento
        ultimo = ahora; dt = Math.min(dt, 60);
        for (var i = 0; i < activas.length; i++) { var m = activas[i]; m.t += dt; if (m.path) m.path.setAttribute('d', m.forma()); }
      }
      requestAnimationFrame(cuadro);
    }
    function arrancar() { if (!corriendo && activas.length && !d.hidden) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(cuadro); } }
    if (!hayIO) { activas = lista.slice(); arrancar(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var m = lista.filter(function (x) { return x.el === e.target; })[0];
        if (!m) return;
        var i = activas.indexOf(m);
        if (e.isIntersecting) { if (i < 0) activas.push(m); m.el.classList.remove('pausa'); }
        else { if (i >= 0) activas.splice(i, 1); m.el.classList.add('pausa'); }
      });
      arrancar();
    }, { rootMargin: '60px 0px' });
    lista.forEach(function (m) { m.el.classList.add('pausa'); io.observe(m.el); });
    d.addEventListener('visibilitychange', arrancar);
  });

  /* ---------- parallax de la portada ---------- */
  modulo('parallax', function () {
    var hero = $('.portada');
    if (!hero || reducido) return;
    var capas = $$('[data-prof]', hero).map(function (el) { return { el: el, p: parseFloat(el.getAttribute('data-prof')) || 0 }; });
    var visible = true, pend = false, obj = { x: 0, y: 0 }, act = { x: 0, y: 0 };
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(cuadro); } }
    function cuadro() {
      pend = false;
      act.x += (obj.x - act.x) * .075; act.y += (obj.y - act.y) * .075;
      var chico = innerWidth < 760, y = Math.min(W.scrollY || 0, innerHeight * 1.3);
      var kS = chico ? .22 : .34, kX = chico ? 0 : 26, kY = chico ? 0 : 18;
      for (var i = 0; i < capas.length; i++) {
        var c = capas[i];
        c.el.style.transform = 'translate3d(' + (act.x * c.p * kX).toFixed(2) + 'px,' + (-y * c.p * kS + act.y * c.p * kY).toFixed(2) + 'px,0)';
      }
      if (Math.abs(obj.x - act.x) > .002 || Math.abs(obj.y - act.y) > .002) pedir();
    }
    if (hayIO) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) pedir(); }).observe(hero);
    W.addEventListener('scroll', function () { if (visible) pedir(); }, { passive: true });
    if (conMouse) {
      W.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !visible) return;
        obj.x = e.clientX / innerWidth * 2 - 1; obj.y = e.clientY / innerHeight * 2 - 1; pedir();
      }, { passive: true });
      d.addEventListener('mouseleave', function () { obj.x = 0; obj.y = 0; pedir(); });
    }
    pedir();
  });

  /* ---------- botones magnéticos ---------- */
  modulo('imán', function () {
    if (!conMouse || reducido) return;
    var imanes = $$('.magnet').map(function (b) { return { b: b, i: $('.bt__in', b), x: 0, y: 0, on: false }; });
    if (!imanes.length) return;
    var mx = -1e5, my = -1e5, pend = false;
    function poner(m, x, y) {
      m.x = x; m.y = y;
      m.b.style.setProperty('--mx', x.toFixed(2) + 'px'); m.b.style.setProperty('--my', y.toFixed(2) + 'px');
      if (m.i) { m.i.style.setProperty('--ix', (x * .35).toFixed(2) + 'px'); m.i.style.setProperty('--iy', (y * .35).toFixed(2) + 'px'); }
    }
    function cuadro() {
      pend = false;
      for (var k = 0; k < imanes.length; k++) {
        var m = imanes[k], r = m.b.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) { if (m.on) { m.on = false; m.b.classList.remove('atrae'); poner(m, 0, 0); } continue; }
        var cx = r.left + r.width / 2 - m.x, cy = r.top + r.height / 2 - m.y;
        var dx = mx - cx, dy = my - cy, zx = r.width / 2 + 70, zy = r.height / 2 + 60;
        if (Math.abs(dx) < zx && Math.abs(dy) < zy) {
          var f = 1 - Math.max(Math.abs(dx) / zx, Math.abs(dy) / zy) * .35;
          var tx = Math.max(-16, Math.min(16, dx * .3 * f)), ty = Math.max(-12, Math.min(12, dy * .4 * f));
          if (!m.on) { m.on = true; m.b.classList.add('atrae'); }
          poner(m, tx, ty);
        } else if (m.on) {
          m.on = false; m.b.classList.remove('atrae'); poner(m, 0, 0); // vuelve con un resorte (CSS)
        }
      }
    }
    function pedir() { if (!pend) { pend = true; requestAnimationFrame(cuadro); } }
    W.addEventListener('pointermove', function (e) { if (e.pointerType !== 'mouse') return; mx = e.clientX; my = e.clientY; pedir(); }, { passive: true });
    W.addEventListener('scroll', function () { if (imanes.some(function (m) { return m.on; })) pedir(); }, { passive: true });
    d.addEventListener('mouseleave', function () { mx = my = -1e5; pedir(); });
  });

  /* ---------- acordeón de especialidades ---------- */
  modulo('acordeón', function () {
    var items = $$('.acc__item');
    if (!items.length) return;
    var hastaHallar = 'onbeforematch' in d.body;
    var datos = items.map(function (it) { return { it: it, bt: $('.acc__bt', it), p: $('.acc__panel', it) }; });
    function ocultar(x) { if (hastaHallar) x.p.setAttribute('hidden', 'until-found'); else x.p.hidden = true; }
    function cancelar(x) { if (x.p.getAnimations) x.p.getAnimations().forEach(function (a) { a.cancel(); }); }
    function cerrar(x, animar) {
      if (!x.it.classList.contains('abierto') && x.p.hasAttribute('hidden')) return;
      var desde = x.p.offsetHeight;
      cancelar(x);
      x.it.classList.remove('abierto'); x.bt.setAttribute('aria-expanded', 'false');
      if (animar && !reducido && x.p.animate && desde > 0) {
        var a = x.p.animate([{ height: desde + 'px' }, { height: '0px' }], { duration: 440, easing: 'cubic-bezier(.5,0,.25,1)' });
        x.p.style.height = '0px';
        a.onfinish = function () { x.p.style.height = ''; ocultar(x); };
      } else { x.p.style.height = ''; ocultar(x); }
    }
    function abrir(x, animar) {
      var desde = x.p.hasAttribute('hidden') ? 0 : x.p.offsetHeight;
      cancelar(x);
      x.p.style.height = '';
      x.p.removeAttribute('hidden');
      x.it.classList.add('abierto'); x.bt.setAttribute('aria-expanded', 'true');
      if (animar && !reducido && x.p.animate) {
        var hasta = x.p.scrollHeight;
        x.p.animate([{ height: desde + 'px' }, { height: hasta + 'px' }], { duration: 620, easing: 'cubic-bezier(.2,.9,.25,1)' });
      }
    }
    datos.forEach(function (x, i) {
      if (i === 0) { x.it.classList.add('abierto'); x.bt.setAttribute('aria-expanded', 'true'); }
      else cerrar(x, false);
      x.bt.addEventListener('click', function () {
        if (x.it.classList.contains('abierto')) { cerrar(x, true); return; }
        datos.forEach(function (y) { if (y !== x) cerrar(y, true); });
        abrir(x, true);
      });
      x.p.addEventListener('beforematch', function () { // búsqueda con Ctrl+F dentro de un panel cerrado
        datos.forEach(function (y) { if (y !== x) cerrar(y, false); });
        abrir(x, false);
      });
    });
  });

  /* ---------- comparador antes / después ---------- */
  modulo('comparador', function () {
    $$('[data-comp]').forEach(function (comp) {
      var mango = $('.comp__mango', comp), pos = 50, abajo = false, movio = false, tocado = false, x0 = 0, id = null;
      if (!mango) return;
      function poner(v) {
        pos = Math.max(0, Math.min(100, v));
        comp.style.setProperty('--pos', pos.toFixed(2) + '%');
        var r = Math.round(pos);
        mango.setAttribute('aria-valuenow', r);
        mango.setAttribute('aria-valuetext', 'Antes ' + r + ' %, después ' + (100 - r) + ' %');
      }
      function desdeX(cx) { var r = comp.getBoundingClientRect(); return (cx - r.left) / r.width * 100; }
      comp.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        tocado = true; abajo = true; movio = false; x0 = e.clientX; id = e.pointerId;
        if (e.pointerType === 'mouse') e.preventDefault();
        if (e.target === mango || mango.contains(e.target)) mango.focus({ preventScroll: true });
      });
      comp.addEventListener('pointermove', function (e) {
        if (!abajo || e.pointerId !== id) return;
        if (!movio && Math.abs(e.clientX - x0) < 4) return;
        if (!movio) { movio = true; comp.classList.add('arrastra'); try { comp.setPointerCapture(id); } catch (er) {} }
        poner(desdeX(e.clientX));
      });
      function soltar(e) {
        if (!abajo || (e && e.pointerId !== id)) return;
        abajo = false;
        if (!movio && e && e.type === 'pointerup') poner(desdeX(e.clientX)); // un toque o clic lleva la barra ahí (con transición)
        comp.classList.remove('arrastra');
        try { comp.releasePointerCapture(id); } catch (er) {}
      }
      comp.addEventListener('pointerup', soltar);
      comp.addEventListener('pointercancel', function (e) { abajo = false; comp.classList.remove('arrastra'); });
      comp.addEventListener('lostpointercapture', function () { if (abajo && movio) { abajo = false; comp.classList.remove('arrastra'); } });
      mango.addEventListener('keydown', function (e) {
        var paso = e.shiftKey ? 10 : 5, v = null;
        switch (e.key) {
          case 'ArrowLeft': case 'ArrowDown': v = pos - paso; break;
          case 'ArrowRight': case 'ArrowUp': v = pos + paso; break;
          case 'PageDown': v = pos - 20; break;
          case 'PageUp': v = pos + 20; break;
          case 'Home': v = 0; break;
          case 'End': v = 100; break;
        }
        if (v !== null) { e.preventDefault(); tocado = true; poner(v); }
      });
      poner(50);

      // La primera vez que se ve, la barra se mueve sola un poquito para mostrar que se puede deslizar.
      if (reducido || !hayIO) return;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        setTimeout(function () {
          if (tocado) return;
          var t0 = performance.now(), dur = 2400;
          comp.classList.add('arrastra');
          (function paso(ahora) {
            if (tocado) { comp.classList.remove('arrastra'); return; }
            var t = Math.min(1, (ahora - t0) / dur);
            poner(50 + Math.sin(t * Math.PI * 2) * 18 * (1 - t * .25) * (t < 1 ? 1 : 0));
            if (t < 1) requestAnimationFrame(paso); else { poner(50); comp.classList.remove('arrastra'); }
          })(t0);
        }, 700);
      }, { threshold: .6 });
      io.observe(comp);
    });
  });

  /* ---------- sección activa en el menú ---------- */
  modulo('menú activo', function () {
    if (!hayIO) return;
    var links = $$('.cab__nav a[href^="#"]'), mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var a = mapa[e.target.id];
        links.forEach(function (l) { l.classList.remove('activo'); l.removeAttribute('aria-current'); });
        if (a) { a.classList.add('activo'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    // Se miran todas las secciones: en las que no están en el menú (portada, cierre...) no queda ninguna marcada.
    $$('main > section').forEach(function (s) { io.observe(s); });
  });

  W.M2_OK = true;
})();

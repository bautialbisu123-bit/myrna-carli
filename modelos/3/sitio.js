/* Modelo 3 · "Tarjetas que se apilan" — JS propio, sin librerías.
   Cada parte va aislada: si una falla, las demás siguen y el contenido queda a la vista. */
(function () {
  'use strict';
  var d = document, H = d.documentElement, F = window.FOTOS || {};
  var mm = window.matchMedia ? function (q) { return window.matchMedia(q).matches; } : function () { return false; };
  var RM = mm('(prefers-reduced-motion: reduce)');
  var MOUSE = mm('(hover: hover) and (pointer: fine)');
  window.__m3err = [];

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function lim(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ruta(src) { return /^([a-z]+:|\/\/|\/)/i.test(src) ? src : '../../' + String(src).replace(/^\.\//, ''); }
  function seguro(nombre, fn) {
    try { fn(); } catch (e) { window.__m3err.push(nombre + ': ' + (e && e.message)); if (window.console) console.warn('[modelo 3] ' + nombre, e); }
  }

  /* Un solo oyente de scroll / resize, repartido en el próximo cuadro */
  var alScroll = [], alMedir = [], pendS = false, pendR = false;
  function correrScroll() { pendS = false; for (var i = 0; i < alScroll.length; i++) alScroll[i](); }
  addEventListener('scroll', function () { if (!pendS) { pendS = true; requestAnimationFrame(correrScroll); } }, { passive: true });
  addEventListener('resize', function () {
    if (pendR) return; pendR = true;
    requestAnimationFrame(function () { pendR = false; for (var i = 0; i < alMedir.length; i++) alMedir[i](); correrScroll(); });
  });

  /* Transformaciones compuestas: escala de la pila + inclinación del mouse */
  function aplicar(el) {
    var s = el._esc == null ? 1 : el._esc, rx = el._rx || 0, ry = el._ry || 0, t = '';
    /* la escala se hace "desde arriba" (como un mazo): se corre el centro hacia arriba */
    if (s !== 1 && el._alto) t = 'translate3d(0,' + (-(1 - s) * el._alto / 2).toFixed(2) + 'px,0) ';
    if (Math.abs(rx) > .005 || Math.abs(ry) > .005) t += 'perspective(1100px) rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)';
    if (s !== 1) t += ' scale(' + s.toFixed(4) + ')';
    if (el._tr !== t) { el._tr = t; el.style.transform = t; }
  }

  /* ---------- 1. Fotos (si el cliente ya cargó alguna en fotos.js) ---------- */
  function poner(fig, src, alt, etiqueta, ansiosa) {
    var capa = $('.foto__capa', fig) || fig;
    var im = new Image(); im.decoding = 'async'; if (!ansiosa) im.loading = 'lazy';
    im.src = ruta(src); im.alt = alt || '';
    capa.appendChild(im); fig.classList.add('foto--con');
    var cap = $('.foto__marca', fig);
    if (cap) { if (etiqueta) cap.textContent = etiqueta; else cap.parentNode.removeChild(cap); }
    return im;
  }
  seguro('fotos', function () {
    var hero = (F.hero || []).filter(Boolean), fp = d.getElementById('fotoPortada');
    if (hero.length && fp) {
      var ims = hero.map(function (src, k) {
        var im = poner(fp, src, k ? '' : 'Consultorio de la Dra. Myrna a.n. Carli', '', !k);
        if (!k) im.className = 'on';
        return im;
      });
      if (ims.length > 1 && !RM) {
        var cur = 0, vis = true, io0;
        if ('IntersectionObserver' in window) { io0 = new IntersectionObserver(function (e) { vis = e[0].isIntersecting; }); io0.observe(fp); }
        setInterval(function () {
          if (!vis || d.hidden) return;
          ims[cur].className = ''; cur = (cur + 1) % ims.length; ims[cur].className = 'on';
        }, 5200);
      }
    }
    var fd = d.getElementById('fotoDoctora');
    if (F.doctora && fd) poner(fd, F.doctora, 'Retrato de la Dra. Myrna a.n. Carli', '');

    var G = (F.galeria || []).filter(function (g) { return g && g.src; });
    if (G.length) {
      var FORMAS = { grande: 'galeria__it--grande', alta: 'galeria__it--alta', ancha: 'galeria__it--ancha' };
      var conForma = G.some(function (g) { return g.forma; });
      $('#galeria').innerHTML = G.map(function (g, k) {
        var cl = g.forma ? (FORMAS[g.forma] || '') : (!conForma && k === 0 && G.length > 2 ? FORMAS.grande : '');
        return '<figure class="foto foto--con galeria__it rv ' + cl + '" style="--d:' + (k % 4 * 0.08).toFixed(2) + 's" data-tilt="5">' +
          '<div class="foto__capa"><img src="' + esc(ruta(g.src)) + '" alt="' + esc(g.alt || '') + '" loading="lazy" decoding="async"></div>' +
          (g.tag ? '<figcaption class="foto__marca">' + esc(g.tag) + '</figcaption>' : '') + '</figure>';
      }).join('');
      /* las tarjetas de especialidades usan una foto de la galería si la etiqueta coincide */
      $$('.tarjeta .foto[data-tag]').forEach(function (fig) {
        var re = new RegExp(fig.getAttribute('data-tag'), 'i');
        var g = G.filter(function (x) { return re.test((x.tag || '') + ' ' + (x.alt || '')); })[0];
        if (g) poner(fig, g.src, g.alt, g.tag);
      });
    }
  });

  /* ---------- 2. Portada: título palabra por palabra + marco que se despliega ---------- */
  seguro('portada', function () {
    var h = d.getElementById('titulo');
    if (!h) return;
    if (RM) { h.classList.add('partido'); H.classList.add('arranca'); return; }
    var n = 0;
    (function partir(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (c) {
        if (c.nodeType === 1) { partir(c); return; }
        if (c.nodeType !== 3) return;
        var frag = d.createDocumentFragment();
        c.nodeValue.split(/(\s+)/).forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
          var a = d.createElement('span'), b = d.createElement('span');
          a.className = 'pal'; b.className = 'pal__in'; b.style.setProperty('--n', n++); b.textContent = p;
          a.appendChild(b); frag.appendChild(a);
        });
        nodo.replaceChild(frag, c);
      });
    })(h);
    h.classList.add('partido');
    var hecho = false;
    function arrancar() { if (hecho) return; hecho = true; requestAnimationFrame(function () { requestAnimationFrame(function () { H.classList.add('arranca'); }); }); }
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(arrancar, arrancar);
    setTimeout(arrancar, 900);
  });

  /* ---------- 3. Aparición al entrar en pantalla ---------- */
  seguro('revelar', function () {
    var els = $$('.rv');
    if (RM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('visto'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.01 });
    els.forEach(function (e) { io.observe(e); });
  });

  /* ---------- 4. Encabezado: menú en celular, sombra y sección activa ---------- */
  seguro('cabecera', function () {
    var cab = d.getElementById('cab'), nav = d.getElementById('menu'), bt = $('.cab__menu');
    function abrir(si) {
      nav.classList.toggle('abierto', si);
      bt.setAttribute('aria-expanded', si ? 'true' : 'false');
      bt.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
    }
    bt.addEventListener('click', function () { abrir(!nav.classList.contains('abierto')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { abrir(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('abierto')) { abrir(false); bt.focus(); } });
    d.addEventListener('click', function (e) { if (nav.classList.contains('abierto') && !cab.contains(e.target)) abrir(false); });
    alScroll.push(function () { cab.classList.toggle('cab--sombra', scrollY > 8); });

    if ('IntersectionObserver' in window) {
      var links = $$('a[href^="#"]:not(.bt)', nav);
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.toggle('activo', a.getAttribute('href') === '#' + en.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (a) { var s = d.getElementById(a.getAttribute('href').slice(1)); if (s) io.observe(s); });
      var ini = d.getElementById('inicio');
      if (ini) {
        new IntersectionObserver(function (e) { if (e[0].isIntersecting) links.forEach(function (a) { a.classList.remove('activo'); }); }, { rootMargin: '-45% 0px -50% 0px' }).observe(ini);
      }
    }
  });

  /* ---------- 5. Especialidades: tarjetas que se apilan ---------- */
  seguro('pila', function () {
    var lista = d.getElementById('pila');
    if (!lista || RM) return;
    var items = $$('.pila__item', lista), cartas = items.map(function (i) { return $('.tarjeta', i); });
    var velos = cartas.map(function (c) { return $('.tarjeta__velo', c); }), ultV = [], tops = [], activo = true;
    function medir() {
      tops = items.map(function (i) { return parseFloat(getComputedStyle(i).top) || 0; });
      cartas.forEach(function (c) { c._alto = c.offsetHeight; });
    }
    function pintar() {
      if (!activo) return;
      var r = items.map(function (i) { return i.getBoundingClientRect(); }), lleg = [0];
      for (var k = 1; k < items.length; k++) {
        var abajo = r[k - 1].bottom, den = abajo - tops[k];
        lleg[k] = den > 1 ? lim((abajo - r[k].top) / den, 0, 1) : (r[k].top <= tops[k] + 1 ? 1 : 0);
      }
      for (var i = 0; i < items.length; i++) {
        var prof = 0;
        for (var j = i + 1; j < items.length; j++) prof += lleg[j];
        cartas[i]._esc = 1 - prof * 0.05;
        aplicar(cartas[i]);
        var v = Math.min(prof * 0.11, 0.28).toFixed(3);
        if (ultV[i] !== v) { ultV[i] = v; velos[i].style.opacity = v; }
      }
    }
    medir();
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { medir(); pintar(); });
    alMedir.push(medir);
    alScroll.push(pintar);
    if ('IntersectionObserver' in window) {
      activo = false;
      new IntersectionObserver(function (e) { activo = e[0].isIntersecting; if (activo) pintar(); }, { rootMargin: '150px 0px' }).observe(lista);
    }
    pintar();
  });

  /* ---------- 6. Inclinación 3D suave con brillo (solo con mouse) ---------- */
  seguro('inclinar', function () {
    if (RM || !MOUSE) return;
    var enMarcha = [], corriendo = false;
    function sumar(el) { if (enMarcha.indexOf(el) < 0) enMarcha.push(el); if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); } }
    function cuadro() {
      for (var i = enMarcha.length - 1; i >= 0; i--) {
        var el = enMarcha[i], t = el._t;
        el._rx = (el._rx || 0) + (t.ax - (el._rx || 0)) * 0.14;
        el._ry = (el._ry || 0) + (t.ay - (el._ry || 0)) * 0.14;
        t.cx += (t.bx - t.cx) * 0.22; t.cy += (t.by - t.cy) * 0.22;
        aplicar(el);
        t.b.style.transform = 'translate3d(' + (t.cx - t.tam / 2).toFixed(1) + 'px,' + (t.cy - t.tam / 2).toFixed(1) + 'px,0)';
        var quieto = Math.abs(t.ax - el._rx) < 0.01 && Math.abs(t.ay - el._ry) < 0.01 && Math.abs(t.bx - t.cx) < 0.5 && Math.abs(t.by - t.cy) < 0.5;
        if (quieto) {
          if (!t.on) { el._rx = el._ry = 0; aplicar(el); el.style.willChange = ''; }
          enMarcha.splice(i, 1);
        }
      }
      if (enMarcha.length) requestAnimationFrame(cuadro); else corriendo = false;
    }
    function preparar(el) {
      if (el._t) return;
      var b = d.createElement('span'); b.className = 'brillo'; b.setAttribute('aria-hidden', 'true'); el.appendChild(b);
      var t = el._t = { max: parseFloat(el.getAttribute('data-tilt')) || 4, ax: 0, ay: 0, bx: 0, by: 0, cx: 0, cy: 0, b: b, tam: 420, on: false };
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType !== 'mouse') return;
        var r = el.getBoundingClientRect(), s = el._esc || 1;
        t.tam = Math.round(lim(Math.max(r.width, r.height) * 0.8, 220, 640));
        b.style.width = b.style.height = t.tam + 'px';
        t.cx = t.bx = (e.clientX - r.left) / s; t.cy = t.by = (e.clientY - r.top) / s;
        t.on = true; el.classList.add('inclinada'); el.style.willChange = 'transform';
        b.style.opacity = '1';
      });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || !t.on) return;
        var r = el.getBoundingClientRect(), s = el._esc || 1;
        var px = lim((e.clientX - r.left) / r.width, 0, 1), py = lim((e.clientY - r.top) / r.height, 0, 1);
        t.ay = (px - 0.5) * 2 * t.max; t.ax = -(py - 0.5) * 2 * t.max;
        t.bx = (e.clientX - r.left) / s; t.by = (e.clientY - r.top) / s;
        sumar(el);
      });
      el.addEventListener('pointerleave', function () { t.on = false; t.ax = t.ay = 0; b.style.opacity = '0'; sumar(el); });
    }
    $$('[data-tilt]').forEach(preparar);
    /* la galería puede regenerarse con fotos reales: se preparan al pasar por primera vez */
    d.addEventListener('pointerover', function (e) {
      var el = e.target.closest && e.target.closest('[data-tilt]');
      if (el && !el._t) preparar(el);
    });
  });

  /* ---------- 7. Pestañas de "Cómo pedir tu turno" ---------- */
  seguro('pestanas', function () {
    var c = d.getElementById('pestanas');
    if (!c) return;
    var tabs = $$('[role="tab"]', c), paneles = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); }), ind = $('.pestanas__ind', c);
    var act = 0;
    c.classList.add('pestanas--ok');
    function moverIndicador() {
      var t = tabs[act];
      ind.style.width = t.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + t.offsetLeft + 'px)';
    }
    function ir(k, foco) {
      act = k;
      tabs.forEach(function (t, i) {
        var on = i === k;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        paneles[i].classList.toggle('activo', on);
      });
      moverIndicador();
      if (foco) tabs[k].focus();
    }
    alMedir.push(moverIndicador);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(moverIndicador);
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { ir(i); });
      t.addEventListener('keydown', function (e) {
        var n = null, L = tabs.length;
        if (e.key === 'ArrowRight') n = (i + 1) % L;
        else if (e.key === 'ArrowLeft') n = (i - 1 + L) % L;
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = L - 1;
        if (n !== null) { e.preventDefault(); ir(n, true); }
      });
    });
    ir(0);
  });

  /* ---------- 8. Contador de pasos con barra de progreso ---------- */
  seguro('pasos', function () {
    var c = d.getElementById('pasos');
    if (!c) return;
    var pasos = $$('.paso', c), N = pasos.length, act = -1;
    var barra = $('.pasos__barra', c), relleno = $('span', barra), num = $('.pasos__actual', c), lista = $('.pasos__lista', c);
    var bAnt = $('.pasos__bt[data-dir="-1"]', c), bSig = $('.pasos__bt[data-dir="1"]', c);
    var vivo = d.createElement('p'); vivo.className = 'sr'; vivo.setAttribute('aria-live', 'polite'); c.appendChild(vivo);
    c.classList.add('pasos--ok');
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    function ir(k, anunciar) {
      k = lim(k, 0, N - 1);
      if (k === act) return;
      act = k;
      pasos.forEach(function (p, i) {
        p.classList.toggle('activo', i === k); p.classList.toggle('antes', i < k); p.classList.toggle('despues', i > k);
      });
      relleno.style.transform = 'scaleX(' + ((k + 1) / N).toFixed(4) + ')';
      barra.setAttribute('aria-valuenow', k + 1);
      barra.setAttribute('aria-valuetext', 'Dato ' + (k + 1) + ' de ' + N);
      num.textContent = dos(k + 1);
      if (!RM) { num.classList.remove('salta'); void num.offsetWidth; num.classList.add('salta'); }
      bAnt.setAttribute('aria-disabled', k === 0 ? 'true' : 'false');
      bSig.setAttribute('aria-disabled', k === N - 1 ? 'true' : 'false');
      if (anunciar) vivo.textContent = 'Dato ' + (k + 1) + ' de ' + N + ': ' + $('h4', pasos[k]).textContent;
    }
    [bAnt, bSig].forEach(function (b) {
      b.addEventListener('click', function () { if (b.getAttribute('aria-disabled') !== 'true') ir(act + (+b.getAttribute('data-dir')), true); });
    });
    c.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = act + 1; else if (e.key === 'ArrowLeft') n = act - 1;
      else if (e.key === 'Home' && e.target === lista) n = 0; else if (e.key === 'End' && e.target === lista) n = N - 1;
      if (n !== null) { e.preventDefault(); ir(n, true); }
    });
    var x0 = null, y0 = 0;
    c.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; x0 = t.clientX; y0 = t.clientY; }, { passive: true });
    c.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var t = e.changedTouches[0], dx = t.clientX - x0, dy = t.clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) ir(act + (dx < 0 ? 1 : -1), true);
    }, { passive: true });
    window.__m3pasos = function (k) { ir(k, true); return act; };
    ir(0);
  });

  /* ---------- 9. Botón flotante de WhatsApp + globito (una sola vez) ---------- */
  seguro('flota', function () {
    var f = d.getElementById('flota'), g = d.getElementById('globo'), x = $('.globo__x', g), portada = d.getElementById('inicio');
    var limite = 400, yaVisto = false, tGlobo = 0, globoAbierto = false;
    try { yaVisto = sessionStorage.getItem('m3-globo') === '1'; } catch (e) { }
    function medir() { limite = portada ? portada.offsetTop + portada.offsetHeight * 0.6 : 400; }
    function cerrarGlobo() { clearTimeout(tGlobo); if (globoAbierto) { globoAbierto = false; g.classList.remove('ver'); } }
    function revisar() {
      var ver = scrollY > limite;
      if (ver === f.classList.contains('ver')) return;
      f.classList.toggle('ver', ver);
      if (!ver) { cerrarGlobo(); return; }
      if (!yaVisto) {
        yaVisto = true;
        try { sessionStorage.setItem('m3-globo', '1'); } catch (e) { }
        tGlobo = setTimeout(function () {
          globoAbierto = true; g.classList.add('ver');
          tGlobo = setTimeout(cerrarGlobo, 7000);
        }, 650);
      }
    }
    x.addEventListener('click', cerrarGlobo);
    medir(); alMedir.push(medir); alScroll.push(revisar); revisar();
  });

  window.SITIO_OK = true;
  correrScroll();
})();

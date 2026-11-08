/* Dra. Myrna a.n. Carli — Modelo 1 · "Editorial de revista"
   JS propio, sin librerías:
   1. Títulos que suben línea por línea detrás de una máscara.
   2. Especialidades: la sección queda fija y las páginas pasan de derecha a izquierda (carrusel en celular).
   3. Índice de tratamientos con un marco de foto que sigue al cursor (en celular se abre al tocar).
   4. Imagen fija que cambia según el capítulo que estás leyendo (La doctora / Turnos).
   5. Círculo que sigue al cursor y crece sobre enlaces y botones (solo mouse).
   6. Franja de tratamientos en movimiento que se acelera con la velocidad del scroll.
   Fotos: se leen de window.FOTOS (../../assets/js/fotos.js). Si no hay, quedan los marcos. */
(function () {
  'use strict';
  var d = document, W = window, html = d.documentElement;
  var RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MOUSE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var F = W.FOTOS || {};

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function lim(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  // Cada parte arranca por separado: si una falla, las demás siguen y el error queda a la vista.
  function seguro(fn) { try { fn(); } catch (e) { setTimeout(function () { throw e; }); } }

  /* ---------- un solo bucle para el scroll y otro para medir ---------- */
  var alScroll = [], alMedir = [], pend = false, sy = W.scrollY || 0, tMed = 0;
  function tick() { pend = false; sy = W.scrollY; for (var i = 0; i < alScroll.length; i++) alScroll[i](sy); }
  W.addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(tick); } }, { passive: true });
  function medirTodo() { for (var i = 0; i < alMedir.length; i++) alMedir[i](); tick(); }
  function pedirMedir() { cancelAnimationFrame(tMed); tMed = requestAnimationFrame(medirTodo); }
  W.addEventListener('resize', pedirMedir);
  W.addEventListener('load', pedirMedir);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(pedirMedir);

  /* ---------- fotos ---------- */
  function ruta(src) { return /^(https?:|\/|data:|blob:)/.test(src) ? src : '../../' + src; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var galeria = (F.galeria || []).filter(function (g) { return g && g.src; });
  function porTag(t) {
    t = norm(t);
    for (var i = 0; i < galeria.length; i++) {
      if (norm(galeria[i].tag).indexOf(t) >= 0 || norm(galeria[i].alt).indexOf(t) >= 0) return galeria[i];
    }
    return null;
  }
  function ponerFoto(fig, src, alt) {
    if (!fig || !src) return null;
    var im = new Image();
    im.className = 'foto__img'; im.alt = alt || ''; im.decoding = 'async'; im.loading = 'lazy'; im.src = ruta(src);
    var ph = fig.querySelector('.foto__ph');
    fig.insertBefore(im, ph ? ph.nextSibling : fig.firstChild);
    fig.classList.add('con-foto');
    return im;
  }
  seguro(function () {
    var hero = (F.hero || []).filter(Boolean);
    $$('[data-foto="hero"]').forEach(function (f) {
      var imgs = hero.map(function (src, k) {
        var im = ponerFoto(f, src, k ? '' : 'Consultorio de la Dra. Myrna a.n. Carli');
        if (k) im.classList.add('foto__img--extra');
        return im;
      });
      if (imgs.length > 1 && !RM) {
        var k = 0;
        imgs.forEach(function (im, j) { im.style.transition = 'opacity 1.4s'; im.style.opacity = j ? '0' : '1'; });
        setInterval(function () {
          if (sy > W.innerHeight || d.hidden) return;
          imgs[k].style.opacity = '0'; k = (k + 1) % imgs.length; imgs[k].style.opacity = '1';
        }, 5000);
      }
    });
    if (F.doctora) $$('[data-foto="doctora"]').forEach(function (f) { ponerFoto(f, F.doctora, 'Retrato de la Dra. Myrna a.n. Carli'); });
    $$('[data-foto-tag]').forEach(function (f) {
      var g = porTag(f.getAttribute('data-foto-tag'));
      if (g) ponerFoto(f, g.src, g.alt);
    });
    var grid = $('#galeria');
    if (grid && galeria.length) {
      grid.innerHTML = '';
      grid.classList.add('con-fotos');
      galeria.forEach(function (g) {
        var fig = d.createElement('figure');
        fig.className = 'foto revela' + (/^(grande|alta|ancha)$/.test(g.forma || '') ? ' ' + g.forma : '');
        ponerFoto(fig, g.src, g.alt);
        if (g.tag) { var t = d.createElement('span'); t.className = 'foto__tag'; t.textContent = g.tag; fig.appendChild(t); }
        grid.appendChild(fig);
      });
    }
  });

  /* ---------- 1. títulos con máscara, línea por línea ---------- */
  var mascaras = $$('.mascara');
  function partir(el) {
    var tw = d.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodos = [];
    while (tw.nextNode()) nodos.push(tw.currentNode);
    nodos.forEach(function (t) {
      var f = d.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { f.appendChild(d.createTextNode(p)); return; }
        var m = d.createElement('span'), i = d.createElement('span');
        m.className = 'm'; i.className = 'm__in'; i.textContent = p;
        m.appendChild(i); f.appendChild(m);
      });
      t.parentNode.replaceChild(f, t);
    });
  }
  // Las palabras de un mismo renglón comparten el número de línea: así sube cada renglón entero.
  function numerarLineas(el) {
    var ms = el.querySelectorAll('.m'), linea = -1, ult = -1e9;
    for (var k = 0; k < ms.length; k++) {
      var top = ms[k].offsetTop;
      if (top > ult + 6) { linea++; ult = top; }
      ms[k].firstChild.style.setProperty('--i', linea);
    }
  }
  if (!RM) seguro(function () {
    mascaras.forEach(partir);
    mascaras.forEach(numerarLineas);
    alMedir.push(function () { mascaras.forEach(numerarLineas); });
  });

  /* ---------- apariciones al entrar en pantalla ---------- */
  var io = ('IntersectionObserver' in W) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -9% 0px', threshold: 0 }) : null;
  $$('.rv, .mascara, .revela').forEach(function (el) { if (io && !RM) io.observe(el); else el.classList.add('visto'); });
  W.M1_OK = true;

  /* ---------- encabezado y menú ---------- */
  seguro(function () {
    var cab = $('#cab'), menu = $('#menu'), bt = $('.cab__menu'), ultY = sy, abierto = false;
    alScroll.push(function (y) {
      cab.classList.toggle('con-fondo', y > 20 || abierto);
      if (abierto) return;
      if (y <= 300) { cab.classList.remove('oculta'); ultY = y; return; }
      var dy = y - ultY;
      if (Math.abs(dy) < 12) return;
      cab.classList.toggle('oculta', dy > 0);
      ultY = y;
    });
    function poner(si) {
      abierto = si;
      menu.classList.toggle('abierto', si);
      html.classList.toggle('menu-abierto', si);
      bt.setAttribute('aria-expanded', si ? 'true' : 'false');
      bt.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
      cab.classList.remove('oculta');
      cab.classList.toggle('con-fondo', si || sy > 20);
      if (si) setTimeout(function () { var a = $('a', menu); if (a) a.focus({ preventScroll: true }); }, 80);
    }
    if (bt && menu) {
      bt.addEventListener('click', function () { poner(!abierto); });
      menu.addEventListener('click', function (e) { if (e.target.closest('a')) poner(false); });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && abierto) { poner(false); bt.focus(); } });
      var mqAncho = W.matchMedia('(min-width: 1301px)');
      var cerrar = function (m) { if (m.matches && abierto) poner(false); };
      if (mqAncho.addEventListener) mqAncho.addEventListener('change', cerrar); else if (mqAncho.addListener) mqAncho.addListener(cerrar);
    }
  });

  /* ---------- sello de la portada: gira con el scroll ---------- */
  if (!RM) seguro(function () {
    var s = $('.sello'); if (!s) return;
    alScroll.push(function (y) { if (y < W.innerHeight * 1.4) s.style.transform = 'rotate(' + (y * 0.12).toFixed(1) + 'deg)'; });
  });

  /* ---------- 6. franja en movimiento (se acelera con el scroll) ---------- */
  if (!RM) seguro(function () {
    var fr = $('.franja'), pista = $('.franja__pista'), grupo = $('.franja__grupo');
    if (!fr || !pista || !grupo || !pista.animate) return;
    var anim = null, anchoV = 0, vel = 1, meta = 1, corre = false, visible = true, ultY = sy;
    function armar() {
      if (anim && W.innerWidth === anchoV) return;
      anchoV = W.innerWidth;
      $$('.copia', pista).forEach(function (c) { pista.removeChild(c); });
      var ancho = grupo.getBoundingClientRect().width;
      if (!ancho) return;
      var n = Math.ceil(W.innerWidth / ancho) + 1;
      for (var i = 0; i < n; i++) { var c = grupo.cloneNode(true); c.classList.add('copia'); pista.appendChild(c); }
      if (anim) anim.cancel();
      anim = pista.animate(
        [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(' + (-ancho).toFixed(1) + 'px,0,0)' }],
        { duration: ancho / 62 * 1000, iterations: Infinity }
      );
      anim.playbackRate = vel;
      if (!visible) anim.pause();
    }
    alMedir.push(armar); armar();
    function paso() {
      meta += (1 - meta) * 0.05;
      vel += (meta - vel) * 0.16;
      if (anim) anim.playbackRate = vel;
      if (Math.abs(vel - 1) > 0.008 || Math.abs(meta - 1) > 0.008) requestAnimationFrame(paso);
      else { vel = meta = 1; if (anim) anim.playbackRate = 1; corre = false; }
    }
    alScroll.push(function (y) {
      var dy = Math.abs(y - ultY); ultY = y;
      if (!visible || !anim) return;
      meta = Math.max(meta, 1 + Math.min(dy / 12, 4));
      if (!corre) { corre = true; requestAnimationFrame(paso); }
    });
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (anim) { if (visible) anim.play(); else anim.pause(); }
    }).observe(fr);
  });

  /* ---------- 2. especialidades: sección fijada con páginas horizontales ---------- */
  seguro(function () {
    var esp = $('#especialidades'); if (!esp) return;
    var pista = $('.esp__pista', esp), ventana = $('.esp__ventana', esp), barra = $('.esp__barra i', esp), cont = $('.esp__cont b', esp);
    var pags = $$('.pag', esp);
    // paralaje: el marco va un poco más lento que la página, la foto (si hay) más lenta todavía y el número más rápido
    var marcos = pags.map(function (p) { return $('.pag__foto', p); });
    var capas = pags.map(function (p) { return $$('.pag__foto > .foto__img', p); });
    var nums = pags.map(function (p) { return $('.pag__num', p); });
    var mq = W.matchMedia('(min-width: 900px)');
    var pin = false, inicio = 0, dist = 0, vw = 0, centros = [], actual = -1, pAnt = -1;
    function marcar(i) { if (i !== actual) { actual = i; cont.textContent = dos(i + 1); } }
    function limpiar() {
      pista.style.transform = '';
      capas.forEach(function (l) { l.forEach(function (el) { el.style.transform = ''; }); });
      marcos.forEach(function (m) { if (m) m.style.transform = ''; });
      nums.forEach(function (n) { n.style.transform = ''; });
    }
    function carrusel() {
      var max = pista.scrollWidth - pista.clientWidth, n = pags.length;
      var p = max > 0 ? lim(pista.scrollLeft / max, 0, 1) : 0;
      barra.style.transform = 'scaleX(' + (1 / n + p * (1 - 1 / n)).toFixed(4) + ')';
      marcar(Math.round(p * (n - 1)));
    }
    function medir() {
      var quiere = mq.matches && !RM;
      if (quiere !== pin) {
        pin = quiere;
        esp.classList.toggle('esp--pin', pin);
        if (pin) pista.removeAttribute('tabindex'); else { pista.setAttribute('tabindex', '0'); esp.style.removeProperty('--alto'); limpiar(); }
      }
      if (!pin) { carrusel(); return; }
      vw = ventana.clientWidth;
      dist = Math.max(0, pista.scrollWidth - vw);
      esp.style.setProperty('--alto', Math.round(dist + W.innerHeight) + 'px');
      inicio = esp.getBoundingClientRect().top + W.scrollY;
      centros = pags.map(function (p) { return p.offsetLeft + p.offsetWidth / 2; });
      pAnt = -1;
      enScroll(W.scrollY);
    }
    function enScroll(y) {
      if (!pin) return;
      var p = dist ? lim((y - inicio) / dist, 0, 1) : 0;
      if (p === pAnt) return;
      pAnt = p;
      var x = p * dist;
      pista.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
      barra.style.transform = 'scaleX(' + (0.06 + p * 0.94).toFixed(4) + ')';
      var c = x + vw / 2, mejor = 0, md = 1e9;
      for (var i = 0; i < pags.length; i++) {
        var off = (centros[i] - c) / vw, ad = Math.abs(off);
        if (ad < md) { md = ad; mejor = i; }
        var o = lim(off, -1, 1);
        if (marcos[i]) marcos[i].style.transform = 'translate3d(' + (o * -22).toFixed(1) + 'px,0,0)';
        for (var k = 0; k < capas[i].length; k++) capas[i][k].style.transform = 'translate3d(' + (o * -36).toFixed(1) + 'px,0,0)';
        if (nums[i]) nums[i].style.transform = 'translate3d(' + (o * 90).toFixed(1) + 'px,0,0)';
      }
      marcar(mejor);
    }
    pista.addEventListener('scroll', function () { if (!pin) requestAnimationFrame(carrusel); }, { passive: true });
    alMedir.push(medir); alScroll.push(enScroll);
    medir();
  });

  /* ---------- 3. índice de tratamientos con vista previa ---------- */
  seguro(function () {
    var lista = $('#indice'); if (!lista) return;
    var items = $$('.indice__item', lista);
    function marco(it, i) {
      var f = d.createElement('figure');
      f.className = 'foto t' + ((i % 4) + 1);
      f.innerHTML = '<div class="foto__ph" aria-hidden="true"><svg class="ic foto__ic"><use href="#i-foto"/></svg><span class="foto__eti"></span></div>';
      $('.foto__eti', f).textContent = it.getAttribute('data-eti');
      var g = porTag(it.getAttribute('data-tag'));
      if (g) ponerFoto(f, g.src, g.alt);
      return f;
    }
    var modoMouse = MOUSE && !RM;
    if (modoMouse) {
      var vista = d.createElement('div'), mc = d.createElement('div'), tira = d.createElement('div');
      vista.className = 'vista'; vista.setAttribute('aria-hidden', 'true');
      mc.className = 'vista__marco'; tira.className = 'vista__tira';
      items.forEach(function (it, i) {
        var f = marco(it, i), n = d.createElement('span');
        n.className = 'foto__n'; n.textContent = dos(i + 1) + ' / ' + dos(items.length);
        f.appendChild(n); tira.appendChild(f);
      });
      mc.appendChild(tira); vista.appendChild(mc); d.body.appendChild(vista);
      var tx = 0, ty = 0, x = 0, y = 0, rot = 0, on = false, anda = false, idx = -1, w = 0, h = 0, salto = true;
      var medirV = function () { w = vista.offsetWidth; h = vista.offsetHeight; };
      medirV(); alMedir.push(medirV);
      var activar = function (i) { if (i < 0 || i === idx) return; idx = i; tira.style.transform = 'translate3d(0,' + (-i * 100) + '%,0)'; };
      var paso = function () {
        var ox = tx + 34, oy = ty - h * 0.55;
        if (ox + w > W.innerWidth - 16) ox = tx - w - 34;
        oy = lim(oy, 16, W.innerHeight - h - 16);
        if (salto) { x = ox; y = oy; salto = false; }
        var dx = ox - x, dy = oy - y;
        x += dx * 0.13; y += dy * 0.13;
        rot += (lim(dx * 0.025, -6, 6) - rot) * 0.14;
        vista.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) rotate(' + rot.toFixed(2) + 'deg)';
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3 || Math.abs(rot) > 0.03) requestAnimationFrame(paso); else anda = false;
      };
      var arrancar = function () { if (!anda) { anda = true; requestAnimationFrame(paso); } };
      var mostrar = function (si) { if (si === on) return; on = si; vista.classList.toggle('on', si); if (!si) salto = true; };
      lista.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        tx = e.clientX; ty = e.clientY;
        var it = e.target.closest && e.target.closest('.indice__item');
        if (it) { activar(items.indexOf(it)); mostrar(true); }
        arrancar();
      });
      lista.addEventListener('pointerover', function (e) {
        var it = e.target.closest && e.target.closest('.indice__item');
        if (it) activar(items.indexOf(it));
      });
      lista.addEventListener('pointerleave', function () { mostrar(false); });
      W.addEventListener('scroll', function () { if (on) { var r = lista.getBoundingClientRect(); if (ty < r.top || ty > r.bottom) mostrar(false); } }, { passive: true });
    } else {
      $$('.solo-mouse').forEach(function (e) { e.style.display = 'none'; });
      $$('.solo-tactil').forEach(function (e) { e.style.display = 'block'; });
      items.forEach(function (it, i) {
        var fila = $('.indice__fila', it), f = marco(it, i), mas = d.createElement('span');
        mas.className = 'indice__mas'; mas.setAttribute('aria-hidden', 'true'); fila.appendChild(mas);
        f.classList.add('indice__foto'); f.id = 'trat-foto-' + (i + 1); it.appendChild(f);
        fila.setAttribute('role', 'button'); fila.setAttribute('tabindex', '0');
        fila.setAttribute('aria-expanded', 'false'); fila.setAttribute('aria-controls', f.id);
        var alternar = function () {
          var abrir = !it.classList.contains('abierto'), antes = fila.getBoundingClientRect().top;
          items.forEach(function (o) { o.classList.remove('abierto'); $('.indice__fila', o).setAttribute('aria-expanded', 'false'); });
          if (abrir) { it.classList.add('abierto'); fila.setAttribute('aria-expanded', 'true'); }
          // que la fila tocada no salte de lugar si se cerró otra más arriba
          var dif = fila.getBoundingClientRect().top - antes;
          if (Math.abs(dif) > 1) W.scrollBy({ top: dif, left: 0, behavior: 'instant' });
        };
        fila.addEventListener('click', alternar);
        fila.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); } });
      });
    }
  });

  /* ---------- 4. capítulos con imagen fija que cambia ---------- */
  seguro(function () {
    var caps = $$('.cap'), escenas = $$('.escena'), nEl = $('.caps__n'), eEl = $('.caps__eti'), segs = $$('.caps__segs i');
    if (!caps.length || !('IntersectionObserver' in W)) return;
    var act = 0;
    function activar(i) {
      if (i === act) return;
      act = i;
      escenas.forEach(function (s) { s.classList.toggle('on', +s.getAttribute('data-cap') === i); });
      segs.forEach(function (s, k) { s.classList.toggle('on', k <= i); });
      var c = caps[i];
      if (nEl) nEl.textContent = c.getAttribute('data-n');
      if (eEl) eEl.textContent = c.getAttribute('data-eti');
    }
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) activar(+e.target.getAttribute('data-cap')); });
    }, { rootMargin: '-48% 0px -48% 0px', threshold: 0 });
    caps.forEach(function (c) { io2.observe(c); });
  });

  /* ---------- 5. círculo que sigue al cursor (solo compu con mouse) ---------- */
  if (MOUSE && !RM) seguro(function () {
    var c = d.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="cursor__p"></div>';
    d.body.appendChild(c);
    var tx = -50, ty = -50, x = -50, y = -50, anda = false, dentro = false;
    function paso() {
      x += (tx - x) * 0.24; y += (ty - y) * 0.24;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      if (Math.abs(tx - x) > 0.15 || Math.abs(ty - y) > 0.15) requestAnimationFrame(paso); else anda = false;
    }
    d.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      tx = e.clientX; ty = e.clientY;
      if (!dentro) { dentro = true; x = tx; y = ty; c.classList.add('on'); }
      if (!anda) { anda = true; requestAnimationFrame(paso); }
    }, { passive: true });
    d.addEventListener('pointerover', function (e) {
      var t = e.target; if (!t.closest) return;
      var lista = !!t.closest('.indice');
      c.classList.toggle('oculto', lista);
      c.classList.toggle('grande', !lista && !!t.closest('a, button, [role="button"], label, input, select, textarea'));
    });
    d.addEventListener('mouseout', function (e) { if (!e.relatedTarget) { dentro = false; c.classList.remove('on'); } });
  });

  medirTodo();
})();

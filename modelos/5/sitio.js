/* =========================================================
   Modelo 5 · "Cinemático" — JS propio, sin librerías.
   Telones entre secciones, pantallas divididas con texto fijo,
   navegación con puntos y teclado, marcadores, tipeo e imán.
   ========================================================= */
(function () {
  'use strict';

  var d = document, w = window, html = d.documentElement;
  var F = w.FOTOS || {};
  var RM = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var mqCompu = w.matchMedia('(min-width: 1024px) and (min-height: 560px)');
  var mqFino = w.matchMedia('(hover: hover) and (pointer: fine)');
  var hayIO = 'IntersectionObserver' in w;

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ruta(src) {
    if (!src) return '';
    src = String(src);
    if (/^(https?:)?\/\//i.test(src) || /^(data|blob):/i.test(src) || src.charAt(0) === '/') return src;
    return '../../' + src.replace(/^\.\//, '');
  }

  /* ---------- intro: se quita del DOM al terminar ---------- */
  var intro = $('.intro');
  if (intro) setTimeout(function () { intro.classList.add('fuera'); }, RM ? 0 : 1800);

  /* =========================================================
     Fotos (window.FOTOS): si hay, reemplazan a los marcos
     ========================================================= */
  var heroCaja = $('#heroFotos');
  var heroF = (F.hero || []).map(function (h) { return typeof h === 'string' ? { src: h } : h; }).filter(function (h) { return h && h.src; });
  if (heroF.length && heroCaja) {
    heroCaja.innerHTML = heroF.map(function (h, k) {
      return '<div class="hero__slide' + (k ? '' : ' activa') + '" data-tag=""><div class="hero__img hero__img--' + (k % 3 + 1) + '">' +
        '<img src="' + esc(ruta(h.src)) + '" alt="' + esc(h.alt || '') + '" decoding="async"' + (k ? ' loading="lazy"' : '') + '></div></div>';
    }).join('');
  }

  var G = (F.galeria || []).filter(function (g) { return g && g.src; });
  $$('.doc__capa').forEach(function (capa, k) {
    var src = '', alt = '';
    if (k === 0 && F.doctora) { src = F.doctora; alt = 'Retrato de la Dra. Myrna a.n. Carli'; }
    else if (k > 0 && G[k - 1]) { src = G[k - 1].src; alt = G[k - 1].alt || ''; }
    else if (F.doctora) { src = F.doctora; alt = ''; }
    if (!src) return;
    var im = new Image(); im.src = ruta(src); im.alt = alt; im.decoding = 'async'; im.loading = 'lazy';
    capa.appendChild(im); capa.classList.add('con-foto');
  });

  var gal = $('#galeria');
  if (G.length && gal) {
    var FORMAS = { grande: 'gal__it--g', alta: 'gal__it--al', ancha: 'gal__it--an' };
    gal.classList.add('con-fotos');
    gal.innerHTML = G.map(function (g, k) {
      return '<figure class="gal__it ' + (FORMAS[g.forma] || '') + ' rv rv--cortina" style="--d:' + ((k % 4) * 0.07).toFixed(2) + 's">' +
        '<div class="gal__foto marco con-foto"><img src="' + esc(ruta(g.src)) + '" alt="' + esc(g.alt || '') + '" loading="lazy" decoding="async"></div>' +
        (g.tag ? '<figcaption>' + esc(g.tag) + '</figcaption>' : '') + '</figure>';
    }).join('');
  }

  /* =========================================================
     Marcador: números que ruedan como un tablero
     ========================================================= */
  var TIRA = (function () { var s = ''; for (var r = 0; r < 2; r++) for (var i = 0; i < 10; i++) s += '<span>' + i + '</span>'; return s; })();
  function odoArmar(el) {
    if (el._odo) return el._odo;
    var txt = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    var sr = d.createElement('span'); sr.className = 'sr'; sr.textContent = txt;
    var vis = d.createElement('span'); vis.className = 'odo__vis'; vis.setAttribute('aria-hidden', 'true');
    var cols = [];
    for (var i = 0; i < txt.length; i++) {
      var ch = txt.charAt(i);
      if (/[0-9]/.test(ch)) {
        var col = d.createElement('span'); col.className = 'odo__col';
        var f = d.createElement('span'); f.className = 'odo__f'; f.textContent = ch;
        var tira = d.createElement('span'); tira.className = 'odo__tira'; tira.innerHTML = TIRA;
        col.appendChild(f); col.appendChild(tira); vis.appendChild(col);
        cols.push({ tira: tira, f: f, v: +ch });
      } else vis.appendChild(d.createTextNode(ch));
    }
    el.appendChild(sr); el.appendChild(vis);
    el._odo = { cols: cols, sr: sr };
    return el._odo;
  }
  function odoMover(c, k, dur) {
    if (dur != null) c.tira.style.transitionDuration = dur + 's';
    c.tira.style.transform = 'translateY(' + (-k * 5) + '%)';
  }
  /* rueda desde 0 hasta el valor final, más de una vuelta */
  function odoRodar(el) {
    var o = el._odo; if (!o) return;
    o.cols.forEach(function (c, i) { odoMover(c, 10 + c.v, 1.15 + i * 0.09); });
  }
  /* contador que cambia de valor (pasos, fotos, sección) */
  function odoPoner(el, valor) {
    var o = el._odo; if (!o) { el.textContent = valor; return; }
    valor = String(valor); o.sr.textContent = valor;
    o.cols.forEach(function (c, i) {
      var v = +valor.charAt(i) || 0; c.v = v; c.f.textContent = v;
      odoMover(c, 10 + v, RM ? 0 : 0.85);
    });
  }

  /* =========================================================
     Tipeo de palabras clave (una vez)
     ========================================================= */
  function tipeoArmar(el) {
    var txt = el.textContent;
    el.textContent = '';
    var sr = d.createElement('span'); sr.className = 'sr'; sr.textContent = txt;
    var vis = d.createElement('span'); vis.className = 'tipeo__vis'; vis.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < txt.length; i++) {
      var s = d.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = txt.charAt(i);
      vis.appendChild(s);
    }
    el.appendChild(sr); el.appendChild(vis);
    el.classList.add('tipeo--armado');
    el._n = txt.length;
  }
  function tipeoEscribir(el) { el.classList.add('escribe'); }

  /* =========================================================
     Secciones, telones y entradas
     ========================================================= */
  var secs = $$('main > section[id]');
  var pie = $('.pie');

  if (!RM) {
    $$('.odo').forEach(odoArmar);
    $$('.tipeo').forEach(tipeoArmar);
    // los contadores controlados arrancan en su valor sin rodar
    $$('.odo[data-odo="ctrl"]').forEach(function (el) { el._odo.cols.forEach(function (c) { odoMover(c, 10 + c.v, 0); }); });
  }

  function trasTelon(el, fn, demora) {
    var s = el.closest('.con-telon');
    if (!s || s.classList.contains('destapada')) { setTimeout(fn, demora || 0); return; }
    (s._cola || (s._cola = [])).push(fn);
  }

  function abrirTelon(s, sinAnim) {
    if (s.classList.contains('destapada')) return;
    var t = s._telon;
    s.classList.add('destapada');
    if (t) {
      if (sinAnim) { t.remove(); }
      else {
        s.classList.add('recien');
        t.classList.add('abierto');
        setTimeout(function () { if (t.parentNode) t.remove(); }, 1500);
        setTimeout(function () { s.classList.remove('recien'); }, 2000);
      }
    }
    var cola = s._cola || []; s._cola = [];
    cola.forEach(function (fn) { setTimeout(fn, sinAnim ? 0 : 520); });
  }

  if (!RM && hayIO) {
    secs.forEach(function (s, i) {
      if (!s.hasAttribute('data-telon')) return;
      var oscuro = s.getAttribute('data-tema') === 'oscuro';
      var t = d.createElement('div');
      t.className = 'telon telon--' + s.getAttribute('data-telon') + (oscuro ? ' telon--claro' : '');
      t.setAttribute('aria-hidden', 'true');
      t.innerHTML = '<div class="telon__capa telon__capa--b"><div class="telon__in"></div></div>' +
        '<div class="telon__capa telon__capa--a"><div class="telon__in"><p class="telon__lbl"><small>' + pad(i + 1) + ' / ' + pad(secs.length) + '</small>' + esc(s.getAttribute('data-nombre')) + '</p></div></div>';
      s.insertBefore(t, s.firstChild);
      s._telon = t;
      s.classList.add('con-telon');
    });
    // lo que ya está en pantalla (o arriba) al cargar se destapa sin animación
    var vh0 = innerHeight;
    secs.forEach(function (s) { if (s._telon && s.getBoundingClientRect().top < vh0 * 0.7) abrirTelon(s, true); });

    var ioTelon = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { ioTelon.unobserve(e.target); abrirTelon(e.target); } });
    }, { rootMargin: '0px 0px -42% 0px', threshold: 0 });
    secs.forEach(function (s) { if (s._telon && !s.classList.contains('destapada')) ioTelon.observe(s); });
  }

  function activar(el) {
    if (el.classList.contains('rv') || el.classList.contains('corte')) el.classList.add('visto');
    if (el.classList.contains('odo') && !el.hasAttribute('data-odo')) trasTelon(el, function () { odoRodar(el); }, 120);
    if (el.classList.contains('tipeo--armado')) trasTelon(el, function () { tipeoEscribir(el); }, 350);
  }
  var observables = $$('.rv, .corte, .odo:not([data-odo]), .tipeo--armado');
  if (hayIO && !RM) {
    var ioRv = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { ioRv.unobserve(e.target); activar(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    observables.forEach(function (el) { ioRv.observe(el); });
  } else {
    observables.forEach(function (el) { el.classList.add('visto'); });
    secs.forEach(function (s) { abrirTelon(s, true); });
  }

  /* =========================================================
     Encabezado y menú
     ========================================================= */
  var cab = $('#cab'), menu = $('#menu'), bMenu = $('.cab__menu');
  var menuAbierto = false, focoCab = false;
  function menuPoner(ab, devolverFoco) {
    menuAbierto = ab;
    menu.classList.toggle('abierto', ab);
    cab.classList.toggle('cab--menu', ab);
    html.classList.toggle('menu-abierto', ab);
    bMenu.setAttribute('aria-expanded', ab ? 'true' : 'false');
    bMenu.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú');
    [$('main'), pie, $('.puntos')].forEach(function (el) { if (el) el.inert = ab; });
    if (ab) { cab.classList.remove('oculta'); var a = $('a', menu); if (a) setTimeout(function () { a.focus({ preventScroll: true }); }, 80); }
    else if (devolverFoco) bMenu.focus({ preventScroll: true });
  }
  if (bMenu) bMenu.addEventListener('click', function () { menuPoner(!menuAbierto); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { if (menuAbierto) menuPoner(false); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuAbierto) menuPoner(false, true); });
  cab.addEventListener('focusin', function () { focoCab = true; cab.classList.remove('oculta'); });
  cab.addEventListener('focusout', function () { focoCab = false; });
  var mqMenu = w.matchMedia('(min-width: 1101px)');
  function alCambiarMenu() { if (mqMenu.matches && menuAbierto) menuPoner(false); }
  if (mqMenu.addEventListener) mqMenu.addEventListener('change', alCambiarMenu); else if (mqMenu.addListener) mqMenu.addListener(alCambiarMenu);

  var navLinks = $$('.cab__nav ul a');

  /* =========================================================
     Navegación con puntos (compu)
     ========================================================= */
  var puntos = d.createElement('nav');
  puntos.className = 'puntos';
  puntos.setAttribute('aria-label', 'Ir a una sección');
  puntos.innerHTML = '<p class="puntos__num" aria-hidden="true"><span class="odo" data-odo="ctrl" id="puntosNum">01</span><span>/ ' + pad(secs.length) + '</span></p><ol>' +
    secs.map(function (s, i) { return '<li><a href="#' + s.id + '" data-i="' + i + '"><span class="puntos__lbl">' + esc(s.getAttribute('data-nombre')) + '</span><i aria-hidden="true"></i></a></li>'; }).join('') +
    '</ol><p class="puntos__ayuda" aria-hidden="true" title="Usá las flechas o AvPág para pasar de sección"><kbd>↑</kbd><kbd>↓</kbd></p>';
  d.body.appendChild(puntos);
  var puntosA = $$('a', puntos), puntosNum = $('#puntosNum'), ayuda = $('.puntos__ayuda', puntos);
  if (!RM) odoArmar(puntosNum);
  if (puntosNum._odo) puntosNum._odo.cols.forEach(function (c) { odoMover(c, 10 + c.v, 0); });

  /* =========================================================
     Medidas (se cachean: el scroll no fuerza layout)
     ========================================================= */
  var vh = innerHeight, med = [], pieTop = 0, paradas = [];
  var splits = $$('.split').map(function (sp) {
    return { el: sp, tipo: sp.getAttribute('data-split'), pasos: $$('.paso', sp), cajas: [], act: -1 };
  });

  function medir() {
    vh = innerHeight;
    var y = w.pageYOffset;
    med = secs.map(function (s) { var r = s.getBoundingClientRect(); return { el: s, top: r.top + y, bottom: r.bottom + y, tema: s.getAttribute('data-tema') }; });
    pieTop = pie ? pie.getBoundingClientRect().top + y : 1e9;
    splits.forEach(function (sp) {
      sp.cajas = sp.pasos.map(function (p) { var r = p.getBoundingClientRect(); return { top: r.top + y, bottom: r.bottom + y }; });
      sp.el.classList.toggle('split--vivo', mqCompu.matches && !RM);
    });
    // paradas para el teclado: inicio de cada sección y cada párrafo de las pantallas divididas
    var p = [];
    med.forEach(function (m) {
      p.push(m.top);
      var alto = m.bottom - m.top;
      var sp = null;
      splits.forEach(function (s) { if (m.el.contains(s.el)) sp = s; });
      if (sp && mqCompu.matches) {
        sp.cajas.forEach(function (c) { p.push((c.top + c.bottom) / 2 - vh / 2); });
      } else if (alto > vh * 1.25) {
        for (var k = m.top + vh * 0.85; k < m.bottom - vh * 0.6; k += vh * 0.85) p.push(k);
      }
    });
    var max = d.documentElement.scrollHeight - vh;
    p.push(max);
    p = p.map(function (v) { return Math.max(0, Math.min(max, Math.round(v))); }).sort(function (a, b) { return a - b; });
    paradas = p.filter(function (v, i) { return i === 0 || v - p[i - 1] > 60; });
    pedir();
  }

  /* =========================================================
     Teclado: flechas y AvPág / RePág entre secciones
     ========================================================= */
  var destino = null, destinoT = 0;
  function irParada(dir) {
    var ahora = Date.now();
    var base = (destino !== null && ahora - destinoT < 800) ? destino : w.pageYOffset;
    var t = null, i;
    if (dir > 0) { for (i = 0; i < paradas.length; i++) if (paradas[i] > base + 8) { t = paradas[i]; break; } }
    else { for (i = paradas.length - 1; i >= 0; i--) if (paradas[i] < base - 8) { t = paradas[i]; break; } }
    if (t === null) t = dir > 0 ? paradas[paradas.length - 1] : 0;
    destino = t; destinoT = ahora;
    w.scrollTo({ top: t, behavior: RM ? 'auto' : 'smooth' });
    if (ayuda) ayuda.classList.add('usada');
  }
  d.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || menuAbierto) return;
    var k = e.key, dir = 0;
    if (k === 'ArrowDown' || k === 'PageDown') dir = 1;
    else if (k === 'ArrowUp' || k === 'PageUp') dir = -1;
    if (!dir) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|IFRAME)$/.test(t.tagName))) return;
    e.preventDefault();
    irParada(dir);
  });

  /* =========================================================
     Portada: fotos que se cruzan con zoom lento
     ========================================================= */
  var hero = $('#inicio'), heroIn = $('.hero__in'), slides = $$('.hero__slide');
  var heroNum = $('#heroNum'), heroTag = $('#heroTag'), heroBarra = $('.hero__barra i'), heroTot = $('.hero__tot');
  var sAct = 0, sTimer = null, heroVis = true, SLIDE_MS = 6500;
  if (heroTot) heroTot.textContent = '/ ' + pad(slides.length);
  if (heroF.length && heroTag) heroTag.style.display = 'none';
  function barraReinicia() {
    if (!heroBarra || RM) return;
    heroBarra.classList.add('reinicia'); void heroBarra.offsetWidth; heroBarra.classList.remove('reinicia');
  }
  function slideIr(k) {
    if (k === sAct || !slides[k]) return;
    var prev = slides[sAct];
    prev.classList.remove('activa'); prev.classList.add('sale');
    setTimeout(function () { prev.classList.remove('sale'); }, 1750);
    sAct = k; slides[k].classList.add('activa');
    if (heroNum) odoPoner(heroNum, pad(k + 1));
    if (heroTag && !heroF.length) {
      heroTag.classList.add('cambia');
      setTimeout(function () { heroTag.textContent = slides[k].getAttribute('data-tag') || ''; heroTag.classList.remove('cambia'); }, 450);
    }
    barraReinicia();
  }
  function slideProg() {
    clearTimeout(sTimer); sTimer = null;
    if (RM || !heroVis || d.hidden || slides.length < 2) return;
    sTimer = setTimeout(function () { slideIr((sAct + 1) % slides.length); slideProg(); }, SLIDE_MS);
  }
  if (slides.length < 2 && hero) hero.classList.add('pausa');
  if (hayIO && hero) {
    new IntersectionObserver(function (es) {
      var v = es[0].isIntersecting;
      if (v === heroVis) return;
      heroVis = v;
      hero.classList.toggle('pausa', !v);
      if (v) { barraReinicia(); slideProg(); } else { clearTimeout(sTimer); sTimer = null; }
    }, { threshold: 0.05 }).observe(hero);
  }
  d.addEventListener('visibilitychange', function () { if (!d.hidden) { barraReinicia(); slideProg(); } else { clearTimeout(sTimer); sTimer = null; } });
  setTimeout(slideProg, 400);

  /* =========================================================
     Cinta de tratamientos y tipeo cíclico: se pausan fuera de vista
     ========================================================= */
  var cinta = $('.cinta');
  var cicloEl = $('.ciclo__txt'), cicloP = cicloEl && cicloEl.closest('.ciclo');
  var ciclo = (function () {
    if (!cicloEl || RM) return null;
    var pal = cicloEl.getAttribute('data-ciclo').split('|'), i = 0, n = pal[0].length, borra = true, timer = null, on = false;
    function paso() {
      timer = null; if (!on) return;
      var p = pal[i];
      if (borra) {
        if (n > 0) { n--; cicloEl.textContent = p.slice(0, n); timer = setTimeout(paso, 34); }
        else { borra = false; i = (i + 1) % pal.length; timer = setTimeout(paso, 260); }
      } else {
        p = pal[i];
        if (n < p.length) { n++; cicloEl.textContent = p.slice(0, n); timer = setTimeout(paso, 72); }
        else { borra = true; timer = setTimeout(paso, 1900); }
      }
    }
    return {
      on: function () { if (on) return; on = true; if (!timer) timer = setTimeout(paso, 1500); },
      off: function () { on = false; clearTimeout(timer); timer = null; }
    };
  })();
  if (hayIO) {
    var ioPausa = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.isIntersecting;
        if (e.target === cinta) cinta.classList.toggle('pausa', !v);
        if (e.target === cicloP) { cicloP.classList.toggle('pausa', !v); if (ciclo) { if (v) ciclo.on(); else ciclo.off(); } }
      });
    }, { threshold: 0 });
    if (cinta) ioPausa.observe(cinta);
    if (cicloP) ioPausa.observe(cicloP);
  } else if (ciclo) ciclo.on();

  /* =========================================================
     Pantallas divididas: párrafo activo → foto y marcador
     ========================================================= */
  var docCapas = $$('.doc__capa'), docNum = $('#docNum');
  var turNum = $('#turNum'), turBarra = $('#turBarra');
  function splitActivo(sp, k) {
    if (k === sp.act) return;
    sp.act = k;
    sp.pasos.forEach(function (p, i) { p.classList.toggle('activo', i === k); });
    if (sp.tipo === 'doc') {
      var c = Math.max(0, Math.min(docCapas.length - 1, k));
      docCapas.forEach(function (el, i) { el.classList.toggle('activa', i === c); });
      if (docNum) odoPoner(docNum, pad(c + 1));
    } else if (sp.tipo === 'tur') {
      var n = Math.max(1, Math.min(4, k));
      if (turNum) odoPoner(turNum, pad(n));
      if (turBarra) turBarra.style.transform = 'scaleX(' + (k <= 0 ? 0.25 : Math.min(1, k / 4)) + ')';
    }
  }

  /* =========================================================
     Bucle de scroll (un solo rAF, sin lecturas de layout)
     ========================================================= */
  var ultY = w.pageYOffset, pend = false, secAct = -1, temaCab = '', etiquetaT = null;
  function pedir() { if (!pend) { pend = true; requestAnimationFrame(cuadro); } }
  function secEn(y) {
    for (var i = med.length - 1; i >= 0; i--) if (y >= med[i].top) return i;
    return 0;
  }
  function cuadro() {
    pend = false;
    var y = w.pageYOffset;

    // encabezado: se esconde al bajar, vuelve al subir; toma el color del bloque de abajo
    if (y > vh * 0.6 && y > ultY + 4 && !menuAbierto && !focoCab) cab.classList.add('oculta');
    else if (y < ultY - 4 || y < vh * 0.6) cab.classList.remove('oculta');
    ultY = y;
    var tema;
    if (y < 30) tema = 'transp';
    else if (y + 36 >= pieTop) tema = 'oscuro';
    else tema = med.length ? med[secEn(y + 36)].tema : 'claro';
    if (tema !== temaCab) {
      cab.classList.remove('cab--transp', 'cab--claro', 'cab--oscuro');
      cab.classList.add('cab--' + tema);
      temaCab = tema;
    }

    // sección actual (línea en el centro de la pantalla)
    if (med.length) {
      var i = secEn(y + vh * 0.5);
      if (i !== secAct) {
        if (secAct >= 0 && puntosA[secAct]) { puntosA[secAct].removeAttribute('aria-current'); puntosA[secAct].classList.remove('muestra'); }
        secAct = i;
        var a = puntosA[i];
        if (a) {
          a.setAttribute('aria-current', 'true');
          a.classList.add('muestra');
          clearTimeout(etiquetaT);
          etiquetaT = setTimeout(function () { a.classList.remove('muestra'); }, 1400);
        }
        odoPoner(puntosNum, pad(i + 1));
        var id = secs[i].id;
        navLinks.forEach(function (l) { if (l.getAttribute('href') === '#' + id) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current'); });
      }
      // color de los puntos según el bloque que tienen detrás
      var temaP = (y + vh * 0.5 >= pieTop) ? 'oscuro' : med[i].tema;
      puntos.classList.toggle('puntos--sobre-oscuro', temaP === 'oscuro');
    }

    // pantallas divididas
    var linea = y + vh * (mqCompu.matches ? 0.5 : 0.68);
    splits.forEach(function (sp) {
      var k = -1, j;
      for (j = 0; j < sp.cajas.length; j++) { if (linea >= sp.cajas[j].top) k = j; }
      if (k < 0) k = 0;
      splitActivo(sp, k);
    });

    // portada: el texto sube más lento y se apaga al salir
    if (heroIn && !RM) {
      if (y < vh * 1.1) {
        heroIn.style.transform = 'translate3d(0,' + (y * 0.22).toFixed(1) + 'px,0)';
        heroIn.style.opacity = Math.max(0, 1 - y / (vh * 0.85)).toFixed(3);
      }
    }

    // al llegar al final, que no quede ningún telón cerrado
    if (y + vh >= d.documentElement.scrollHeight - 4) secs.forEach(function (s) { if (s._telon) abrirTelon(s); });
  }
  w.addEventListener('scroll', pedir, { passive: true });

  var rT = null;
  function medirLuego() { clearTimeout(rT); rT = setTimeout(medir, 140); }
  w.addEventListener('resize', medirLuego);
  w.addEventListener('load', medir);
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(medir);
  if ('ResizeObserver' in w) new ResizeObserver(medirLuego).observe(d.body);
  if (mqCompu.addEventListener) mqCompu.addEventListener('change', medirLuego);
  medir();

  /* =========================================================
     Cierre: botón de WhatsApp que sigue al mouse (imán)
     ========================================================= */
  var iman = $('#iman'), cierre = $('#cierre');
  if (iman && cierre && !RM) {
    var luz = $('.iman__luz', iman), itxt = $('.iman__txt', iman), g1 = $('.cierre__g1', cierre), g2 = $('.cierre__g2', cierre);
    var px = 0, py = 0, cx = 0, cy = 0, pendI = false, dentro = false;
    function imanCuadro() {
      pendI = false;
      if (!dentro) return;
      var r = iman.getBoundingClientRect();
      var bx = r.left + r.width / 2 - cx, by = r.top + r.height / 2 - cy;   // centro sin el corrimiento actual
      var dx = px - bx, dy = py - by;
      var rad = Math.max(r.width, r.height) * 0.95;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < rad) {
        cx = dx * 0.32; cy = dy * 0.42;
        iman.classList.add('sigue');
        iman.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
        itxt.style.transform = 'translate3d(' + (dx * 0.1).toFixed(1) + 'px,' + (dy * 0.12).toFixed(1) + 'px,0)';
        luz.style.transform = 'translate3d(' + (px - (bx - r.width / 2) - cx).toFixed(1) + 'px,' + (py - (by - r.height / 2) - cy).toFixed(1) + 'px,0)';
      } else soltar();
      var nx = px / innerWidth - 0.5, ny = py / innerHeight - 0.5;
      if (g1) g1.style.transform = 'translate3d(' + (nx * -34).toFixed(1) + 'px,' + (ny * -22).toFixed(1) + 'px,0)';
      if (g2) g2.style.transform = 'translate3d(' + (nx * 22).toFixed(1) + 'px,' + (ny * 16).toFixed(1) + 'px,0)';
    }
    function soltar() {
      cx = 0; cy = 0;
      iman.classList.remove('sigue');
      iman.style.transform = ''; itxt.style.transform = '';
    }
    cierre.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !mqFino.matches) return;
      dentro = true; px = e.clientX; py = e.clientY;
      if (!pendI) { pendI = true; requestAnimationFrame(imanCuadro); }
    });
    cierre.addEventListener('pointerleave', function () { dentro = false; soltar(); });
  }

  w.M5_OK = true;
})();

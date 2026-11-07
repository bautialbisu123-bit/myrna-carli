/* Dra. Myrna a.n. Carli — comportamiento de la página.
   - Encabezado con línea al bajar; se esconde mientras bajás y vuelve al subir.
   - Menú del celular.
   - Títulos que suben palabra por palabra y dibujos que se trazan solos al aparecer.
   - Fotos: arco de la portada que va cambiando, retrato de la doctora y galería con foto ampliada.
   Las fotos se cargan desde assets/js/fotos.js. */
(function () {
  window.SITIO_OK = true;
  var d = document, F = window.FOTOS || {};
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- encabezado ---------- */
  var cab = d.getElementById('cab'), menu = d.getElementById('menu'), bMenu = d.querySelector('.cab__menu');
  var ultY = scrollY, pend = false;
  function alBajar() {
    pend = false;
    var y = scrollY, abierto = menu && menu.classList.contains('abierto');
    cab.classList.toggle('con-linea', y > 10);
    if (y > 420 && y > ultY + 6 && !abierto) cab.classList.add('oculta');
    else if (y < ultY - 6 || y < 420) cab.classList.remove('oculta');
    ultY = y;
  }
  addEventListener('scroll', function () { if (!pend) { pend = true; requestAnimationFrame(alBajar); } }, { passive: true });
  alBajar();
  function menuAbierto(si) { menu.classList.toggle('abierto', si); bMenu.setAttribute('aria-expanded', si ? 'true' : 'false'); bMenu.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú'); }
  if (bMenu) {
    bMenu.addEventListener('click', function () { menuAbierto(!menu.classList.contains('abierto')); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menuAbierto(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') menuAbierto(false); });
  }

  /* ---------- títulos palabra por palabra ---------- */
  [].forEach.call(d.querySelectorAll('.partir'), function (el) {
    var i = 0;
    (function recorrer(nodo) {
      [].slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var f = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(d.createTextNode(p)); return; }
            var w = d.createElement('span'), s = d.createElement('span');
            w.className = 'pal'; s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); f.appendChild(w);
          });
          n.parentNode.replaceChild(f, n);
        } else if (n.nodeType === 1) recorrer(n);
      });
    })(el);
  });

  /* ---------- largo de cada trazo para dibujarlo ---------- */
  [].forEach.call(d.querySelectorAll('.traza'), function (p) {
    try { p.style.setProperty('--largo', Math.ceil(p.getTotalLength()) + 1); } catch (e) {}
  });

  /* ---------- aparición al bajar ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
  function mirar(el) { if (io) io.observe(el); else el.classList.add('show'); }
  [].forEach.call(d.querySelectorAll('.rv, .partir, .hero__fondo'), mirar);

  /* ---------- el diente guiña cuando pasás por "Sacar turno" ---------- */
  var html = d.documentElement, tGuino = 0;
  [].forEach.call(d.querySelectorAll('.bt--rosa, .wa-flot'), function (b) {
    b.addEventListener('mouseenter', function () {
      html.classList.add('guino'); clearTimeout(tGuino);
      tGuino = setTimeout(function () { html.classList.remove('guino'); }, 1100);
    });
  });

  /* ---------- rincón para chicos: dos minutos de cepillado ---------- */
  var reloj = d.getElementById('reloj');
  if (reloj) {
    var TOT = 120, ZT = 30, ZN = ['Arriba, lado derecho', 'Arriba, lado izquierdo', 'Abajo, lado izquierdo', 'Abajo, lado derecho'];
    var aro = d.getElementById('aro'), tT = d.getElementById('relojT'), tZ = d.getElementById('relojZ');
    var bGo = d.getElementById('relojGo'), bRe = d.getElementById('relojReset'), aviso = d.getElementById('relojAviso');
    var zonas = [].slice.call(d.querySelectorAll('.zona')), C = 2 * Math.PI * 136;
    var hecho = 0, t0 = 0, corre = false, cuadroR = 0, zAnt = -1;
    aro.style.strokeDasharray = C.toFixed(1);
    function pintar() {
      var s = Math.min(TOT, hecho + (corre ? (performance.now() - t0) / 1000 : 0)), resto = Math.ceil(TOT - s);
      tT.textContent = Math.floor(resto / 60) + ':' + ('0' + resto % 60).slice(-2);
      aro.style.strokeDashoffset = (C * (1 - s / TOT)).toFixed(1);
      var z = Math.min(3, Math.floor(s / ZT)), empezo = s > 0;
      zonas.forEach(function (el) {
        var k = +el.getAttribute('data-z');
        el.classList.toggle('act', empezo && s < TOT && k === z);
        el.classList.toggle('ok', k < z || s >= TOT);
        el.style.setProperty('--p', (k < z || s >= TOT) ? 1 : (empezo && k === z ? ((s - z * ZT) / ZT).toFixed(3) : 0));
      });
      if (empezo && s < TOT) {
        tZ.textContent = ZN[z];
        if (z !== zAnt) {
          zAnt = z; aviso.textContent = 'Ahora: ' + ZN[z].toLowerCase();
          reloj.classList.remove('cambia'); void reloj.offsetWidth; reloj.classList.add('cambia');
        }
      }
      if (s >= TOT && corre) terminar();
    }
    function vuelta() { pintar(); if (corre) cuadroR = requestAnimationFrame(vuelta); }
    function empezar() {
      if (hecho >= TOT) reiniciar();
      corre = true; t0 = performance.now(); reloj.classList.add('corriendo'); reloj.classList.remove('fin');
      bGo.textContent = 'Pausa'; vuelta();
    }
    function pausar() {
      hecho += (performance.now() - t0) / 1000; corre = false; cancelAnimationFrame(cuadroR);
      reloj.classList.remove('corriendo'); bGo.textContent = 'Seguir'; pintar();
    }
    function terminar() {
      corre = false; hecho = TOT; cancelAnimationFrame(cuadroR);
      reloj.classList.remove('corriendo', 'cambia'); reloj.classList.add('fin');
      tZ.textContent = '¡Listo! Dientes limpios'; aviso.textContent = '¡Listo! Terminaron los dos minutos.'; bGo.textContent = 'Otra vez';
    }
    function reiniciar() {
      corre = false; cancelAnimationFrame(cuadroR); hecho = 0; zAnt = -1;
      reloj.classList.remove('corriendo', 'fin', 'cambia'); bGo.textContent = 'Empezar'; tZ.textContent = '¿Listos?'; pintar();
    }
    bGo.addEventListener('click', function () { if (corre) pausar(); else empezar(); });
    bRe.addEventListener('click', reiniciar);
    pintar();
  }

  /* ---------- fotos de la portada ---------- */
  var heroF = (F.hero || []).filter(Boolean), arco = d.getElementById('arcoHero'), caja = d.getElementById('heroFotos');
  if (heroF.length && arco && caja) {
    arco.classList.add('con-fotos');
    var imgs = heroF.map(function (src, k) {
      var im = new Image(); im.src = src; im.alt = ''; im.decoding = 'async'; if (k) im.loading = 'lazy';
      caja.appendChild(im); return im;
    });
    var act = 0; imgs[0].classList.add('on');
    if (imgs.length > 1 && !RM) setInterval(function () {
      if (d.hidden) return;
      imgs[act].classList.remove('on'); act = (act + 1) % imgs.length; imgs[act].classList.add('on');
    }, 5500);
  }

  /* ---------- retrato de la doctora ---------- */
  var marco = d.getElementById('marcoDoctora');
  if (F.doctora && marco) {
    var r = new Image(); r.src = F.doctora; r.alt = 'Dra. Myrna a.n. Carli'; r.loading = 'lazy';
    marco.appendChild(r); marco.classList.add('con-foto');
  }

  /* ---------- galería ---------- */
  var G = (F.galeria || []).filter(function (g) { return g && g.src; });
  var gal = d.getElementById('galeria'), secGal = d.getElementById('trabajo');
  var FORMAS = { grande: 'g-grande', alta: 'g-alta', ancha: 'g-ancha' }, PATRON = ['g-grande', '', '', 'g-alta', '', 'g-ancha', '', ''];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  if (G.length && gal && secGal) {
    secGal.hidden = false;
    gal.innerHTML = G.map(function (g, k) {
      var cl = g.forma ? (FORMAS[g.forma] || '') : (G.length >= 5 ? PATRON[k % PATRON.length] : '');
      return '<button type="button" class="gal__it ' + cl + '" data-k="' + k + '" aria-label="Ver foto: ' + esc(g.alt || g.tag || 'foto') + '">' +
        '<img src="' + esc(g.src) + '" alt="' + esc(g.alt || '') + '" loading="lazy" decoding="async">' +
        (g.tag ? '<figcaption>' + esc(g.tag) + '</figcaption>' : '') + '</button>';
    }).join('');
    [].forEach.call(gal.querySelectorAll('.gal__it'), function (it, k) { it.style.transitionDelay = (k % 4) * 0.08 + 's'; mirar(it); });
    [].forEach.call(secGal.querySelectorAll('.rv, .partir'), mirar);

    /* foto ampliada */
    var lb = d.getElementById('lb'), lbImg = d.getElementById('lbImg'), lbTxt = d.getElementById('lbTxt'), cur = 0, x0 = null, antes = null;
    function ver(k) { cur = (k + G.length) % G.length; lbImg.src = G[cur].src; lbImg.alt = G[cur].alt || ''; lbTxt.textContent = G[cur].tag || G[cur].alt || ''; }
    function abrir(k) { antes = d.activeElement; ver(k); lb.hidden = false; d.body.style.overflow = 'hidden'; lb.querySelector('.lb__x').focus(); }
    function cerrar() { lb.hidden = true; d.body.style.overflow = ''; if (antes) antes.focus(); }
    gal.addEventListener('click', function (e) { var b = e.target.closest('.gal__it'); if (b) abrir(+b.getAttribute('data-k')); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb || e.target.closest('.lb__x')) cerrar();
      else if (e.target.closest('.lb__prev')) ver(cur - 1);
      else if (e.target.closest('.lb__next')) ver(cur + 1);
    });
    addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') cerrar(); else if (e.key === 'ArrowLeft') ver(cur - 1); else if (e.key === 'ArrowRight') ver(cur + 1);
    });
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 45) ver(cur + (dx < 0 ? 1 : -1)); });
  }

  /* ---------- año del pie ---------- */
  var anio = d.getElementById('anio'); if (anio) anio.textContent = new Date().getFullYear();
})();

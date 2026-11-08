/* Modelo 4 · Bento interactivo — JS propio, sin librerías.
   Todo corre en el navegador: el armador de mensajes no guarda ni envía datos. */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var EASE = 'cubic-bezier(.22,.8,.2,1)';
  var WA = 'https://wa.me/5491161434141?text=';
  var hayIO = 'IntersectionObserver' in window;
  var hayWAAPI = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function seguro(nombre, fn) {
    try { fn(); } catch (e) { if (window.console) console.error('[modelo 4] ' + nombre, e); }
  }
  function animar(el, frames, opts) {
    if (!hayWAAPI || reduce || !el) return null;
    return el.animate(frames, opts);
  }

  /* ---------------------------------------------------------
     Fotos (window.FOTOS): si hay, reemplazan a los marcos
     --------------------------------------------------------- */
  var F = window.FOTOS || {};
  function ruta(s) { return /^(https?:)?\/\//.test(s) || s.charAt(0) === '/' ? s : '../../' + s; }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var CATS = [
    ['odontopediatr', 'chicos'], ['chic', 'chicos'], ['nin', 'chicos'],
    ['ortodon', 'ortodoncia'], ['bracket', 'ortodoncia'],
    ['protesis', 'protesis'], ['implant', 'protesis'],
    ['estetic', 'estetica'], ['blanque', 'estetica'], ['carilla', 'estetica'],
    ['consultorio', 'consultorio']
  ];
  function catDe(tag) {
    var t = norm(tag);
    for (var i = 0; i < CATS.length; i++) if (t.indexOf(CATS[i][0]) >= 0) return CATS[i][1];
    return 'otros';
  }
  function ponerFoto(marco, src, alt, eager) {
    var img = new Image();
    img.alt = alt || '';
    img.decoding = 'async';
    if (!eager) img.loading = 'lazy';
    img.onload = function () { img.classList.add('lista'); marco.classList.add('con-foto'); };
    img.onerror = function () { img.remove(); };
    img.src = ruta(src);
    marco.appendChild(img);
    return img;
  }
  function fotoDeCategoria(cat) {
    var g = F.galeria || [];
    for (var i = 0; i < g.length; i++) if (g[i] && g[i].src && catDe(g[i].tag) === cat) return g[i];
    return null;
  }

  seguro('fotos', function () {
    var mh = $('[data-foto="hero"]');
    var lista = (F.hero || []).filter(Boolean);
    if (mh && lista.length) {
      var imgs = lista.map(function (src, i) { return ponerFoto(mh, src, 'Consultorio de la Dra. Myrna a.n. Carli', i === 0); });
      if (imgs.length > 1) {
        var k = 0, visible = true;
        imgs.forEach(function (im, i) { if (i) im.style.opacity = '0'; });
        if (hayIO) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(mh);
        setInterval(function () {
          if (!visible || doc.hidden) return;
          imgs[k].style.opacity = '0';
          k = (k + 1) % imgs.length;
          imgs[k].style.opacity = '';
        }, 5200);
      }
    }
    var md = $('[data-foto="doctora"]');
    if (md && F.doctora) ponerFoto(md, F.doctora, 'Retrato de la Dra. Myrna a.n. Carli');
    $$('.esp__foto .marco[data-cat]').forEach(function (m) {
      var f = fotoDeCategoria(m.dataset.cat);
      if (f) ponerFoto(m, f.src, '');
    });

    var g = (F.galeria || []).filter(function (f) { return f && f.src; });
    var gal = $('#galeria');
    if (gal && g.length) {
      gal.innerHTML = '';
      g.forEach(function (f) {
        var li = doc.createElement('li');
        var forma = f.forma === 'grande' || f.forma === 'alta' || f.forma === 'ancha' ? ' gal__it--' + f.forma : '';
        li.className = 'gal__it rv' + forma;
        li.dataset.cat = catDe(f.tag);
        var m = doc.createElement('div');
        m.className = 'marco';
        li.appendChild(m);
        ponerFoto(m, f.src, f.alt || f.tag || 'Foto del consultorio');
        if (f.tag) {
          var t = doc.createElement('span');
          t.className = 'foto__tag';
          t.textContent = f.tag;
          m.appendChild(t);
        }
        gal.appendChild(li);
      });
    }
  });

  /* ---------------------------------------------------------
     Aparición al bajar (escalonada por tanda)
     --------------------------------------------------------- */
  seguro('aparicion', function () {
    var els = $$('.rv');
    if (reduce || !hayIO) { els.forEach(function (e) { e.classList.add('vis', 'fin'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var nuevos = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
      nuevos.sort(function (a, b) {
        var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
      });
      nuevos.forEach(function (el, i) {
        var d = Math.min(i * 75, 450);
        el.style.setProperty('--d', d + 'ms');
        el.classList.add('vis');
        io.unobserve(el);
        setTimeout(function () { el.classList.add('fin'); el.style.removeProperty('--d'); }, 1000 + d);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    els.forEach(function (e) { io.observe(e); });
    window.M4_revelarTodo = function () { els.forEach(function (e) { e.classList.add('vis', 'fin'); io.unobserve(e); }); };
  });

  window.M4_OK = true;

  /* ---------------------------------------------------------
     Encabezado: menú en celular + sección activa
     --------------------------------------------------------- */
  seguro('cabecera', function () {
    var cab = $('#cab'), bt = $('.cab__menu'), nav = $('#menu');
    if (!cab || !bt || !nav) return;
    function poner(ab) {
      cab.classList.toggle('abierto', ab);
      bt.setAttribute('aria-expanded', ab ? 'true' : 'false');
      bt.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú');
    }
    bt.addEventListener('click', function () { poner(!cab.classList.contains('abierto')); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { poner(false); }); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cab.classList.contains('abierto')) { poner(false); bt.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (cab.classList.contains('abierto') && !cab.contains(e.target)) poner(false);
    });

    if (!hayIO) return;
    var links = $$('.cab__nav > a[href^="#"]');
    var mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var secciones = ['inicio', 'especialidades', 'doctora', 'trabajo', 'turnos', 'pacientes', 'ubicacion'];
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('activo'); });
        var l = mapa[en.target.id];
        if (l) l.classList.add('activo');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secciones.forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
  });

  /* ---------------------------------------------------------
     Scroll: barra de progreso + línea de pasos que se dibuja
     --------------------------------------------------------- */
  var linea = { lista: false, medir: function () {}, dibujar: function () {} };

  seguro('linea', function () {
    var form = $('#armForm'), caja = $('.arm__linea'), relleno = $('#lineaPasos');
    var pasos = $$('.paso');
    if (!form || !caja || !relleno || !pasos.length) return;
    var circ = pasos.map(function (p) { return $('.paso__n', p); });
    var top0 = 0, alto = 1, centros = [], cerca = !hayIO;
    linea.medir = function () {
      var fr = form.getBoundingClientRect();
      centros = circ.map(function (c) { var r = c.getBoundingClientRect(); return r.top + r.height / 2 - fr.top; });
      var r0 = circ[0].getBoundingClientRect();
      top0 = centros[0];
      alto = Math.max(1, centros[centros.length - 1] - top0);
      caja.style.top = top0 + 'px';
      caja.style.height = alto + 'px';
      caja.style.left = (r0.left - fr.left + r0.width / 2 - 1) + 'px';
      caja.classList.add('lista');
      linea.lista = true;
      linea.dibujar(true);
    };
    linea.dibujar = function (forzar) {
      if (!linea.lista || (!cerca && !forzar)) return;
      var fr = form.getBoundingClientRect();
      var y = reduce ? 1e9 : innerHeight * 0.62 - (fr.top + top0);
      var p = Math.max(0, Math.min(1, y / alto));
      relleno.style.transform = 'scaleY(' + p.toFixed(4) + ')';
      pasos.forEach(function (el, i) { el.classList.toggle('on', y >= centros[i] - top0 - 2); });
    };
    if (hayIO) new IntersectionObserver(function (en) { cerca = en[0].isIntersecting; if (cerca) linea.dibujar(); }, { rootMargin: '200px 0px' }).observe(form);
    if ('ResizeObserver' in window) new ResizeObserver(function () { linea.medir(); }).observe(form);
    linea.medir();
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { linea.medir(); });
  });

  seguro('scroll', function () {
    var prog = $('#progreso');
    var pendiente = false;
    function cuadro() {
      pendiente = false;
      var max = html.scrollHeight - innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || html.scrollTop) / max)) : 0;
      if (prog) prog.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      linea.dibujar();
    }
    function pedir() { if (!pendiente) { pendiente = true; requestAnimationFrame(cuadro); } }
    addEventListener('scroll', pedir, { passive: true });
    addEventListener('resize', function () { linea.medir(); pedir(); });
    cuadro();
  });

  /* ---------------------------------------------------------
     Botón flotante de WhatsApp (aparece fuera de la portada)
     --------------------------------------------------------- */
  seguro('flotante', function () {
    var bt = $('#waFlot');
    if (!bt) return;
    if (!hayIO) { bt.classList.add('ver'); return; }
    var estado = { inicio: true, turnos: false, cierre: false, pie: false };
    function act() { bt.classList.toggle('ver', !estado.inicio && !estado.turnos && !estado.cierre && !estado.pie); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { estado[en.target.dataset.flot] = en.isIntersecting; });
      act();
    }, { rootMargin: '-10% 0px -10% 0px' });
    [['#inicio', 'inicio'], ['#turnos', 'turnos'], ['.sec--cierre', 'cierre'], ['.pie', 'pie']].forEach(function (p) {
      var el = $(p[0]);
      if (el) { el.dataset.flot = p[1]; io.observe(el); }
    });
  });

  /* ---------------------------------------------------------
     Cajas de especialidades que se expanden (FLIP)
     --------------------------------------------------------- */
  var panelApi = { cerrar: function (cb) { if (cb) cb(); } };

  seguro('expandir', function () {
    var exp = $('#exp'), panel = $('#expPanel'), fondo = $('#expFondo'), cont = $('#expCont'), barra = $('.exp__barra'), x = $('#expX');
    var cajas = $$('.esp');
    if (!exp || !panel || !cajas.length) return;
    var tinte = doc.createElement('div');
    tinte.className = 'exp__tinte';
    panel.insertBefore(tinte, panel.firstChild);
    var actual = null, animando = false, vivas = [];
    var CAT = { odontopediatria: 'chicos', ortodoncia: 'ortodoncia', protesis: 'protesis', general: 'estetica' };

    function llenar(box) {
      var det = $('.esp__detalle', box);
      $('#expN').textContent = $('.esp__n', box).textContent;
      $('#expDib').setAttribute('href', $('.esp__dib use', box).getAttribute('href'));
      $('#expTit').textContent = $('.esp__tit', box).textContent;
      $('#expTxt').textContent = $('.esp__txt', box).textContent;
      $('#expRot').textContent = $('.det__rot', det).textContent;
      $('#expChips').innerHTML = $('.det__chips', det).innerHTML;
      $('#expNota').innerHTML = $('.det__nota', det).innerHTML;
      $('#expTag').textContent = $('.det__foto', det).textContent;
      var marco = $('#expMarco');
      $$('img', marco).forEach(function (i) { i.remove(); });
      marco.classList.remove('con-foto');
      var f = fotoDeCategoria(CAT[box.dataset.esp]);
      if (f) ponerFoto(marco, f.src, f.alt || f.tag || '', true);
      panel.className = 'exp__panel caja' + (box.dataset.tono === 'rosa' ? ' tono-rosa' : '');
      tinte.style.background = getComputedStyle(box).backgroundColor;
      $('#expArmar').dataset.pre = box.dataset.esp;
    }
    function trans(a, b) {
      return 'translate(' + (a.left - b.left).toFixed(1) + 'px,' + (a.top - b.top).toFixed(1) + 'px) scale(' +
        (a.width / b.width).toFixed(4) + ',' + (a.height / b.height).toFixed(4) + ')';
    }
    function inertes(v) {
      ['#cab', '#contenido', '.pie', '#waFlot'].forEach(function (s) {
        var el = $(s);
        if (!el) return;
        if (v) el.setAttribute('inert', ''); else el.removeAttribute('inert');
      });
    }
    function limpiar() { vivas.forEach(function (a) { try { a.cancel(); } catch (e) {} }); vivas = []; }
    function anim(el, fr, op) { var a = animar(el, fr, op); if (a) vivas.push(a); return a; }

    function abrir(box) {
      if (actual || animando) return;
      actual = box;
      llenar(box);
      var a = box.getBoundingClientRect();
      exp.hidden = false;
      html.classList.add('bloqueo');
      inertes(true);
      panel.scrollTop = 0;
      box.classList.add('esp--fuera');
      if (reduce || !hayWAAPI) { x.focus(); return; }
      var b = panel.getBoundingClientRect();
      animando = true;
      var dur = 620;
      var t = anim(panel, [{ transform: trans(a, b) }, { transform: 'none' }], { duration: dur, easing: EASE });
      anim(tinte, [{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: dur, easing: 'ease-out' });
      anim(fondo, [{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
      anim(cont, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 440, delay: dur * 0.38, easing: EASE, fill: 'backwards' });
      anim(barra, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: dur * 0.55, fill: 'backwards' });
      // los chips del detalle entran en cascada
      $$('#expChips li').forEach(function (li, i) {
        anim(li, [{ opacity: 0, transform: 'translateY(8px) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: dur * 0.6 + i * 45, easing: EASE, fill: 'backwards' });
      });
      t.onfinish = function () { limpiar(); animando = false; x.focus({ preventScroll: true }); };
    }

    function cerrar(cb) {
      if (!actual) { if (cb) cb(); return; }
      if (animando) return;
      var box = actual;
      function fin() {
        limpiar();
        exp.hidden = true;
        html.classList.remove('bloqueo');
        inertes(false);
        box.classList.remove('esp--fuera');
        actual = null;
        animando = false;
        if (cb) cb(); else { var b = $('.esp__abrir', box); if (b) b.focus({ preventScroll: true }); }
      }
      if (reduce || !hayWAAPI) { fin(); return; }
      animando = true;
      var a = box.getBoundingClientRect(), b = panel.getBoundingClientRect();
      anim(cont, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
      anim(barra, [{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: 'forwards' });
      anim(tinte, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, delay: 140, easing: 'ease-in', fill: 'both' });
      anim(fondo, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 80, fill: 'forwards' });
      var t = anim(panel, [{ transform: 'none' }, { transform: trans(a, b) }], { duration: 480, delay: 90, easing: 'cubic-bezier(.55,0,.2,1)', fill: 'forwards' });
      t.onfinish = fin;
    }
    panelApi.cerrar = cerrar;

    cajas.forEach(function (box) {
      var bt = $('.esp__abrir', box);
      if (bt) bt.addEventListener('click', function () { abrir(box); });
    });
    x.addEventListener('click', function () { cerrar(); });
    exp.addEventListener('click', function (e) { if (e.target === exp || e.target === fondo) cerrar(); });
    doc.addEventListener('keydown', function (e) {
      if (!actual) return;
      if (e.key === 'Escape') { e.preventDefault(); cerrar(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('button, a[href], input, [tabindex]:not([tabindex="-1"])', panel).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var primero = f[0], ultimo = f[f.length - 1];
      if (!panel.contains(doc.activeElement)) { e.preventDefault(); primero.focus(); }
      else if (e.shiftKey && doc.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && doc.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    });
    $('#expArmar').addEventListener('click', function () {
      var clave = this.dataset.pre;
      cerrar(function () { if (window.M4_preseleccionar) window.M4_preseleccionar(clave); });
    });
  });

  /* ---------------------------------------------------------
     Galería filtrable con reacomodo FLIP
     --------------------------------------------------------- */
  seguro('galeria', function () {
    var gal = $('#galeria');
    var bts = $$('.filtro');
    if (!gal || !bts.length) return;
    var items = function () { return $$('.gal__it', gal); };
    function contar() {
      var todos = items();
      bts.forEach(function (b) {
        var f = b.dataset.f;
        var n = f === 'todos' ? todos.length : todos.filter(function (it) { return it.dataset.cat === f; }).length;
        $('.filtro__n', b).textContent = n;
        b.hidden = f !== 'todos' && n === 0;
      });
    }
    contar();
    var actual = 'todos', ocupado = false;

    function aplicar(f) {
      if (ocupado || f === actual) return;
      actual = f;
      bts.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f ? 'true' : 'false'); });
      var todos = items();
      todos.forEach(function (it) { it.classList.add('vis', 'fin'); });
      function va(it) { return f === 'todos' || it.dataset.cat === f; }
      if (reduce || !hayWAAPI) { todos.forEach(function (it) { it.hidden = !va(it); }); return; }
      ocupado = true;
      var antes = new Map();
      todos.forEach(function (it) { if (!it.hidden) antes.set(it, it.getBoundingClientRect()); });
      var salen = todos.filter(function (it) { return !it.hidden && !va(it); });
      var anims = salen.map(function (it) {
        return it.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.86)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
      });
      setTimeout(function () {
        salen.forEach(function (it) { it.hidden = true; });
        anims.forEach(function (a) { a.cancel(); });
        var entran = [];
        todos.forEach(function (it) { if (it.hidden && va(it)) { it.hidden = false; entran.push(it); } });
        var k = 0;
        todos.forEach(function (it) {
          if (it.hidden) return;
          var b = it.getBoundingClientRect();
          var a = antes.get(it);
          if (!a || entran.indexOf(it) >= 0) {
            it.animate([{ opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: 60 + k++ * 50, easing: EASE, fill: 'backwards' });
            return;
          }
          var dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width, sy = a.height / b.height;
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
          it.animate([
            { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
            { transformOrigin: '0 0', transform: 'none' }
          ], { duration: 560, easing: EASE });
        });
        setTimeout(function () { ocupado = false; }, 260);
      }, 230);
    }
    bts.forEach(function (b) { b.addEventListener('click', function () { aplicar(b.dataset.f); }); });
  });

  /* ---------------------------------------------------------
     Armador de mensaje de WhatsApp
     --------------------------------------------------------- */
  seguro('armador', function () {
    var form = $('#armForm');
    if (!form) return;
    var globo = $('#globo'), btWa = $('#btWa'), estado = $('#estadoArm'), urg = $('#urg');
    var cuentas = $$('.js-cuenta'), barraC = $('#cuentaBarra'), chat = $('#chat'), globoCaja = $('.globo');
    var pasos = {};
    $$('.paso').forEach(function (p) { pasos[p.dataset.paso] = p; });
    var texto = 'Hola, quiero pedir un turno.';
    var cuentaPrev = 0;

    var hora = $('#hora');
    if (hora) {
      var d = new Date();
      hora.textContent = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
    var primera = $('.ln', globo);
    if (primera) primera._t = primera.textContent;

    function marcados(n) { return $$('input[name="' + n + '"]:checked', form).map(function (i) { return i.value; }); }
    function conj(c, sig) {
      if (c === 'y' && /^h?i(?![aeiouáéíóú])/i.test(sig)) return 'e';
      if (c === 'o' && /^h?[oó]/i.test(sig)) return 'u';
      return c;
    }
    function lista(arr, c) {
      if (arr.length < 2) return arr.join('');
      var ult = arr[arr.length - 1];
      return arr.slice(0, -1).join(', ') + ' ' + conj(c, ult) + ' ' + ult;
    }
    function limpio(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

    function datos() {
      var r = form.querySelector('input[name="primera"]:checked');
      return {
        nombre: limpio(form.elements.nombre.value),
        chico: form.elements.chico.checked,
        que: marcados('que'),
        queTxt: limpio(form.elements.queTxt.value),
        primera: r ? r.value : '',
        franja: marcados('franja'),
        dias: marcados('dia'),
        urg: form.elements.urgencia.checked,
        motivos: marcados('motivo')
      };
    }

    function lineas(d) {
      var L = [];
      if (d.urg) L.push(['urg', 'Es una urgencia' + (d.motivos.length ? ': ' + lista(d.motivos, 'y') : '') + '.']);
      L.push(['hola', 'Hola, quiero pedir un turno.']);
      if (d.nombre) L.push(['nombre', 'Nombre y apellido: ' + d.nombre + (d.chico ? ' (el turno es para un chico o una chica)' : '')]);
      else if (d.chico) L.push(['nombre', 'El turno es para un chico o una chica.']);
      var q = [];
      if (d.que.length) q.push(lista(d.que, 'y'));
      if (d.queTxt) q.push(d.queTxt);
      if (q.length) L.push(['que', 'Qué necesito: ' + q.join('. ')]);
      if (d.primera) L.push(['primera', d.primera === 'si' ? 'Primera vez: sí, es mi primera consulta' : 'Primera vez: no, ya fui antes']);
      var m = [];
      if (d.franja.length) m.push(lista(d.franja, 'o'));
      if (d.dias.length) m.push('los ' + lista(d.dias, 'o'));
      if (m.length) L.push(['momentos', 'Momentos cómodos: ' + m.join(', ')]);
      return { L: L, ok: { nombre: d.nombre.length >= 2, que: q.length > 0, primera: !!d.primera, momentos: m.length > 0 } };
    }

    function pintar(s, k, t) {
      s.textContent = '';
      var i = t.indexOf(': ');
      if (k !== 'hola' && k !== 'urg' && i > 0) {
        var e = doc.createElement('span');
        e.className = 'ln__et';
        e.textContent = t.slice(0, i + 1);
        s.appendChild(e);
        s.appendChild(doc.createTextNode(t.slice(i + 1)));
      } else {
        s.textContent = t;
      }
      s._t = t;
    }

    function render(pulso) {
      var d = datos();
      var res = lineas(d);
      texto = res.L.map(function (l) { return l[1]; }).join('\n');
      btWa.href = WA + encodeURIComponent(texto);

      var previas = {};
      $$('.ln', globo).forEach(function (s) { previas[s.dataset.k] = s; });
      var orden = [];
      res.L.forEach(function (l) {
        var k = l[0], t = l[1];
        var s = previas[k];
        var nueva = !s;
        if (nueva) {
          s = doc.createElement('span');
          s.dataset.k = k;
          s.className = 'ln' + (k === 'urg' ? ' ln--urg' : '');
          if (!reduce) s.classList.add('ln--nueva');
        }
        if (s._t !== t) {
          pintar(s, k, t);
          if (pulso && !nueva && !reduce) { s.classList.remove('ln--pulso'); void s.offsetWidth; s.classList.add('ln--pulso'); }
        }
        delete previas[k];
        orden.push(s);
      });
      Object.keys(previas).forEach(function (k) { previas[k].remove(); });
      orden.forEach(function (s, i) { if (globo.children[i] !== s) globo.insertBefore(s, globo.children[i] || null); });

      var n = 0;
      Object.keys(res.ok).forEach(function (k) {
        if (res.ok[k]) n++;
        if (pasos[k]) pasos[k].classList.toggle('completo', res.ok[k]);
      });
      cuentas.forEach(function (c) { c.textContent = n; });
      if (barraC) barraC.style.transform = 'scaleX(' + (n / 4) + ')';
      if (n !== cuentaPrev && estado) estado.textContent = n === 4 ? 'Listo: el mensaje tiene los cuatro datos.' : n + ' de 4 datos completos.';
      if (n !== cuentaPrev && pulso && globoCaja && !reduce) { globoCaja.classList.remove('salta'); void globoCaja.offsetWidth; globoCaja.classList.add('salta'); }
      cuentaPrev = n;
      if (urg) urg.classList.toggle('on', d.urg);
      if (chat) chat.scrollTop = chat.scrollHeight;
    }

    form.addEventListener('input', function (e) { render(e.target.type === 'checkbox' || e.target.type === 'radio'); });
    form.addEventListener('change', function (e) { if (e.target.type !== 'checkbox' && e.target.type !== 'radio') render(true); });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type === 'text') e.preventDefault();
    });

    var btCopiar = $('#btCopiar');
    if (btCopiar) btCopiar.addEventListener('click', function () {
      var et = $('span', btCopiar);
      function hecho() { et.textContent = 'Copiado'; setTimeout(function () { et.textContent = 'Copiar texto'; }, 1800); }
      function viejo() {
        var ta = doc.createElement('textarea');
        ta.value = texto; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.top = '0';
        doc.body.appendChild(ta); ta.select();
        try { if (doc.execCommand('copy')) hecho(); } catch (err) {}
        ta.remove();
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(hecho, viejo);
      else viejo();
    });
    var btBorrar = $('#btBorrar');
    if (btBorrar) btBorrar.addEventListener('click', function () { form.reset(); render(true); });

    var PRE = {
      odontopediatria: { chico: true, que: ['un control'] },
      ortodoncia: { que: ['ortodoncia'] },
      protesis: { que: ['prótesis'] },
      general: { que: ['un control'] }
    };
    window.M4_preseleccionar = function (clave) {
      var p = PRE[clave] || {};
      if (p.chico) form.elements.chico.checked = true;
      (p.que || []).forEach(function (v) {
        var i = form.querySelector('input[name="que"][value="' + v + '"]');
        if (i) i.checked = true;
      });
      render(true);
      var dest = $('#armador');
      dest.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      if (window.matchMedia && matchMedia('(pointer: fine)').matches) {
        setTimeout(function () { form.elements.nombre.focus({ preventScroll: true }); }, reduce ? 0 : 700);
      }
    };

    // barra fija en celular: se esconde cuando la vista previa está a la vista
    var barra = $('#armBarra'), vista = $('#vista');
    if (barra && vista && hayIO) {
      new IntersectionObserver(function (en) { barra.classList.toggle('oculta', en[0].isIntersecting); }, { threshold: 0.25 }).observe(vista);
    }
    render(false);
  });

})();

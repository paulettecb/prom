(function () {
  'use strict';

  /* ── Personalización ──────────────────────────────────────────
     La página de cada egresado ya trae window.EGRESADO.
     En la página general también funciona ?de=sara. */
  var e = window.EGRESADO;
  if (!e) {
    var de = new URLSearchParams(location.search).get('de');
    if (de && window.EGRESADOS) {
      e = window.EGRESADOS.filter(function (x) { return x.slug === de.toLowerCase(); })[0] || null;
    }
    if (e) {
      document.getElementById('para').textContent = 'Invitados de ' + e.corto;
      document.getElementById('invitado-a').textContent = 'estás invitado a la graduación de';
      document.getElementById('nombre').textContent = e.completo;
      document.title = 'Invitados de ' + e.corto + ' · Graduación Psicología 2026';
    }
  }

  var $ = function (id) { return document.getElementById(id); };
  var apertura = $('apertura'), sobre = $('sobre'), tarjeta = $('tarjeta');
  var para = $('para'), pista = $('pista'), escEyebrow = $('escEyebrow'), flotan = $('flotan'), desliza = $('desliza');
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var L, abierto = false, vivo = false, p = 0, raf = null;

  /* ── Medidas: todo sale de una unidad "u" según la pantalla ── */
  function medir() {
    var W = window.innerWidth, H = window.innerHeight;
    var vertical = W / H < 1.25;
    var u = vertical ? Math.min(H / 118, W / 62) : Math.min(H / 100, W / 172);
    var m = { W: W, H: H, u: u, vertical: vertical };
    m.cardW = 40 * u; m.cardH = m.cardW * 1.4;
    m.envW = 52 * u; m.envH = m.envW / 1.518;
    if (vertical) { m.cardX = 6.5 * u; m.cardY = 15 * u; m.envX = -6 * u; m.envY = -19 * u; }
    else { m.cardX = 30 * u; m.cardY = 0; m.envX = -30 * u; m.envY = 0; }
    m.fsRest = m.cardW / 21;
    m.fsFull = Math.max(m.fsRest * 1.85, Math.min(W, H * 1.7) / 38);
    m.openH = H * 2.6;
    return m;
  }

  function aplicarEstatico() {
    sobre.style.width = L.envW + 'px';
    sobre.style.height = L.envH + 'px';
    tarjeta.style.width = L.cardW + 'px';
    tarjeta.style.height = L.cardH + 'px';
    tarjeta.style.fontSize = L.fsRest + 'px';
    var abajo = L.H / 2 + L.envH / 2;
    para.style.top = (abajo + Math.max(16, L.u * 3.5)) + 'px';
    pista.style.top = (abajo + Math.max(16, L.u * 3.5) + para.offsetHeight + 8) + 'px';
  }

  /* ── El scroll convierte la tarjeta en el hero ── */
  function colocar(q) {
    var k = q <= 0 ? 0 : q >= 1 ? 1 : q * q * (3 - 2 * q);
    var w = L.cardW + (L.W - L.cardW) * k, h = L.cardH + (L.H - L.cardH) * k;
    var cx = L.cardX * (1 - k), cy = L.cardY * (1 - k);
    if (k >= 0.999) {
      tarjeta.style.width = '100%'; tarjeta.style.height = '100%';
    } else {
      tarjeta.style.width = w + 'px'; tarjeta.style.height = h + 'px';
    }
    tarjeta.style.fontSize = (L.fsRest + (L.fsFull - L.fsRest) * k) + 'px';
    tarjeta.style.transform = 'translate(-50%,-50%) translate(' + cx + 'px,' + cy + 'px)';
    tarjeta.style.borderRadius = (4 * (1 - k)) + 'px';
    tarjeta.style.boxShadow = k > 0.985 ? 'none' : '0 ' + (34 * (1 - k)) + 'px ' + (72 * (1 - k)) + 'px rgba(0,0,0,' + (0.5 * (1 - k)) + ')';
    tarjeta.style.opacity = '1';
    var ep = Math.min(1, q / 0.42);
    sobre.style.transform = 'translate(-50%,-50%) translate(' + (L.envX - 46 * ep * L.u) + 'px,' + (L.envY + 14 * ep * L.u) + 'px) rotate(' + (-2 - 4 * ep) + 'deg) scale(' + (1 - 0.08 * ep) + ')';
    sobre.style.opacity = String(1 - ep);
    flotan.style.opacity = String(1 - Math.min(1, q / 0.55));
    desliza.style.opacity = String(Math.max(0, 1 - q / 0.14));
  }

  /* Itinerario: la línea avanza con el scroll */
  var linea = $('linea'), momentos = linea ? [].slice.call(linea.querySelectorAll('li')) : [];
  function avanzar() {
    if (!linea) return;
    var r = linea.getBoundingClientRect(), punto = window.innerHeight * 0.62;
    var a = Math.min(1, Math.max(0, (punto - r.top - 20) / Math.max(1, r.height - 40)));
    linea.style.setProperty('--avance', a.toFixed(4));
    momentos.forEach(function (li) {
      var ill = li.querySelector('.ill').getBoundingClientRect();
      if (ill.top + ill.height / 2 < punto) li.classList.add('tocado');
    });
  }

  function alScroll() {
    revisar();
    avanzar();
    if (!vivo) return;
    var recorrido = Math.max(1, (L.openH - L.H) * 0.72);
    var q = Math.min(1, Math.max(0, window.scrollY / recorrido));
    if (Math.abs(q - p) < 0.0008) return;
    p = q;
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; colocar(p); });
  }

  function alCambiarTamano() {
    var nuevo = medir();
    // En celular la barra del navegador cambia la altura al hacer scroll: eso no es un cambio real.
    if (abierto && L && nuevo.W === L.W && Math.abs(nuevo.H - L.H) < 160) return;
    L = nuevo;
    aplicarEstatico();
    if (vivo) { apertura.style.height = L.openH + 'px'; colocar(p); }
  }


  /* La tarjeta sale de la bolsa: lo que todavía está adentro no se ve. */
  function sacarTarjeta(dur) {
    var boca = -L.envH / 2 + 0.5 * L.envH;          // línea de la bolsa, relativa al centro
    var y0 = boca + L.cardH / 2 + 4, y1 = -0.72 * L.envH;
    var t0 = null;
    tarjeta.style.transition = 'none';
    tarjeta.style.transform = 'translate(-50%,-50%) translate(0px,' + y0 + 'px)';
    tarjeta.style.opacity = '1';
    tarjeta.style.zIndex = '20';
    function paso(ts) {
      if (t0 === null) t0 = ts;
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      var y = y0 + (y1 - y0) * e;
      var oculto = Math.max(0, (y + L.cardH / 2) - boca);
      tarjeta.style.transform = 'translate(-50%,-50%) translate(0px,' + y + 'px)';
      tarjeta.style.clipPath = oculto > 0 ? 'inset(0 0 ' + oculto + 'px 0)' : 'none';
      if (k < 1) requestAnimationFrame(paso);
      else { tarjeta.style.clipPath = 'none'; tarjeta.style.transition = 'transform 1s cubic-bezier(.22,1,.36,1)'; }
    }
    requestAnimationFrame(paso);
  }

  /* ── Abrir el sobre ── */
  function abrir() {
    if (abierto) return;
    abierto = true;
    window.scrollTo(0, 0);
    var t = quieto ? 0.15 : 1;
    sobre.classList.add('abierto');
    sobre.style.transition = 'transform 1s cubic-bezier(.22,1,.36,1), opacity .8s ease';
    pista.style.animation = 'none';
    $('escenario').scrollTop = 0;
    [para, pista, escEyebrow].forEach(function (el) { el.style.opacity = '0'; });
    setTimeout(function () { sobre.classList.add('atras'); }, 480 * t);
    setTimeout(function () { sacarTarjeta(quieto ? 1 : 700); }, 1450 * t);
    setTimeout(function () {
      tarjeta.style.transform = 'translate(-50%,-50%) translate(' + L.cardX + 'px,' + L.cardY + 'px)';
      sobre.style.transform = 'translate(-50%,-50%) translate(' + L.envX + 'px,' + L.envY + 'px) rotate(-2deg)';
    }, 2250 * t);
    setTimeout(function () {
      tarjeta.style.transition = 'none';
      sobre.style.transition = 'none';
      apertura.style.height = L.openH + 'px';
      document.body.classList.remove('cerrado');
      window.scrollTo(0, 0);
      vivo = true;
      colocar(0);
      desliza.style.opacity = '1';
      revisar();
    }, 3150 * t);
  }
  sobre.addEventListener('click', abrir);

  /* ── Aparecer al hacer scroll ── */
  var pendientes = [].slice.call(document.querySelectorAll('.aparece'));
  var ultimo = 0;
  function revisar() {
    if (!pendientes.length) return;
    var ahora = Date.now();
    if (ahora - ultimo < 120) return;
    ultimo = ahora;
    var H = window.innerHeight, quedan = [];
    pendientes.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < H * 0.9) {
        var hermanos = [].slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains('aparece'); });
        el.style.transitionDelay = Math.min(hermanos.indexOf(el) * 0.09, 0.45) + 's';
        el.classList.add('si');
      } else quedan.push(el);
    });
    pendientes = quedan;
  }

  /* ── Cuenta regresiva: viernes 27 de noviembre de 2026, 8:00 pm, Guadalajara ── */
  var meta = new Date('2026-11-27T20:00:00-06:00').getTime();
  var cuenta = $('cuenta'), reloj = null;
  function dos(n) { return (n < 10 ? '0' : '') + n; }
  function poner(u, v) {
    var el = cuenta.querySelector('[data-u="' + u + '"]');
    if (el.textContent === v) return;
    if (quieto || el.textContent === '00') { el.textContent = v; return; }
    el.classList.add('cambia');
    setTimeout(function () { el.textContent = v; el.classList.remove('cambia'); }, 220);
  }
  function tic() {
    var s = Math.floor((meta - Date.now()) / 1000);
    if (s <= 0) {
      $('faltanTxt').textContent = 'hoy es la noche';
      cuenta.style.display = 'none';
      document.querySelector('.cuenta-nota').textContent = 'las luces ya están prendidas';
      if (reloj) clearInterval(reloj);
      return;
    }
    poner('d', String(Math.floor(s / 86400)));
    poner('h', dos(Math.floor((s % 86400) / 3600)));
    poner('m', dos(Math.floor((s % 3600) / 60)));
    poner('s', dos(s % 60));
  }
  tic();
  reloj = setInterval(tic, 1000);

  /* ── Arranque ── */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  L = medir();
  aplicarEstatico();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(aplicarEstatico);
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', alCambiarTamano);
  setTimeout(revisar, 8000);
})();

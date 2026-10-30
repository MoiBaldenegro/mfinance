// Interacciones de la landing: tema, barra al hacer scroll, revelado,
// contadores de la maqueta y demo de estrategias de deuda.
(function () {
  'use strict';
  var raiz = document.documentElement;
  var sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
  raiz.classList.add('js');

  // Tema oscuro / claro
  var botonTema = document.querySelector('[data-tema]');
  function pintarBotonTema() {
    var claro = raiz.dataset.theme === 'claro';
    botonTema.setAttribute('aria-label', claro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  }
  botonTema.addEventListener('click', function () {
    raiz.dataset.theme = raiz.dataset.theme === 'claro' ? 'oscuro' : 'claro';
    localStorage.setItem('mf-tema', raiz.dataset.theme);
    pintarBotonTema();
  });
  pintarBotonTema();

  // Fondo de la barra de navegación al desplazarse
  var nav = document.querySelector('[data-nav]');
  function alDesplazar() { nav.classList.toggle('con-fondo', scrollY > 8); }
  addEventListener('scroll', alDesplazar, { passive: true });
  alDesplazar();

  // Contadores de los KPI de la maqueta
  var formato = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
  function contar(el) {
    var fin = Number(el.dataset.contar);
    if (sinMovimiento) return;
    var inicio = performance.now(), dur = 1400;
    (function paso(t) {
      var k = Math.min(1, (t - inicio) / dur);
      el.textContent = formato.format(fin * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(paso);
    })(inicio);
  }

  // Revelado al entrar en pantalla, escalonado por grupo
  var elementos = document.querySelectorAll('.revelar');
  if (!('IntersectionObserver' in window) || sinMovimiento) {
    elementos.forEach(function (el) { el.classList.add('visible'); });
  } else {
    elementos.forEach(function (el) {
      var hermanos = Array.prototype.filter.call(el.parentElement.children, function (h) { return h.classList.contains('revelar'); });
      el.style.setProperty('--retraso', Math.min(hermanos.indexOf(el), 6) * 0.07 + 's');
    });
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible');
        if (e.target.classList.contains('ventana')) e.target.querySelectorAll('[data-contar]').forEach(contar);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    elementos.forEach(function (el) { obs.observe(el); });
  }

  // Brillo que sigue al ratón en las tarjetas
  document.querySelectorAll('.tarjeta').forEach(function (t) {
    t.addEventListener('pointermove', function (e) {
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', e.clientX - r.left + 'px');
      t.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

  // Demo de estrategias de deuda (reordenado animado con FLIP)
  var ESTRATEGIAS = {
    avalancha: {
      orden: ['tarjeta', 'personal', 'coche'], meses: 23, intereses: '1.184 €',
      desc: 'Primero la deuda con el <strong>interés más alto</strong>. Es la que menos intereses te cuesta en total.'
    },
    bola: {
      orden: ['personal', 'tarjeta', 'coche'], meses: 24, intereses: '1.297 €',
      desc: 'Primero la deuda <strong>más pequeña</strong>. Liquidas una pronto y ganas impulso para seguir.'
    }
  };
  var lista = document.querySelector('[data-lista]');
  var pestanas = document.querySelectorAll('[data-estrategia]');
  function elegir(clave) {
    var e = ESTRATEGIAS[clave];
    pestanas.forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.estrategia === clave)); });
    document.querySelector('[data-desc]').innerHTML = e.desc;
    document.querySelector('[data-meses]').innerHTML = 'Libre de deudas en <b>' + e.meses + ' meses</b>';
    document.querySelector('[data-intereses]').textContent = e.intereses;
    var antes = new Map();
    lista.querySelectorAll('li').forEach(function (li) { antes.set(li, li.getBoundingClientRect().top); });
    e.orden.forEach(function (id) { lista.appendChild(lista.querySelector('[data-id="' + id + '"]')); });
    if (sinMovimiento) return;
    antes.forEach(function (top, li) {
      var dy = top - li.getBoundingClientRect().top;
      if (!dy) return;
      li.style.transition = 'none';
      li.style.transform = 'translateY(' + dy + 'px)';
      requestAnimationFrame(function () { requestAnimationFrame(function () { li.style.transition = ''; li.style.transform = ''; }); });
    });
  }
  pestanas.forEach(function (b, i) {
    b.addEventListener('click', function () { elegir(b.dataset.estrategia); });
    b.addEventListener('keydown', function (ev) {
      if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
      var otra = pestanas[(i + 1) % pestanas.length];
      otra.focus(); elegir(otra.dataset.estrategia);
    });
  });

  var anio = document.querySelector('[data-anio]');
  if (anio) anio.textContent = new Date().getFullYear();
})();

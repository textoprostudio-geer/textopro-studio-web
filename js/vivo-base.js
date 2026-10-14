// TextoPro Studio — vivo-base.js · utilidades compartidas de Tecnología Viva
// Movimiento reducido, visibilidad, creación de elementos y botón de pausa accesible.
// Sin dependencias ni llamadas externas. Se carga antes que vivo-inicio.js / vivo-digitalizacion.js.
(function () {
  'use strict';

  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  window.TPVivo = {
    // ¿La persona pidió reducir el movimiento?
    reduced: function () { return !!(mq && mq.matches); },

    // Avisa cuando cambia esa preferencia
    onReducedChange: function (fn) {
      if (!mq) return;
      if (mq.addEventListener) mq.addEventListener('change', fn);
      else if (mq.addListener) mq.addListener(fn);
    },

    // Avisa cuando el elemento entra o sale de la pantalla (sin soporte: se considera visible)
    whenVisible: function (el, fn) {
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) { fn(entries[0].isIntersecting); }).observe(el);
      }
    },

    // Crea un elemento con clase y texto
    el: function (tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    },

    // Botón de pausa: alterna aria-pressed y la etiqueta, y avisa con onChange(pausado).
    // Devuelve una función set(pausado) para cambiar el estado desde código.
    bindPause: function (btn, pauseLabel, playLabel, onChange) {
      var paused = false;
      function set(p) {
        paused = p;
        btn.setAttribute('aria-pressed', p ? 'true' : 'false');
        btn.setAttribute('aria-label', p ? playLabel : pauseLabel);
        onChange(p);
      }
      btn.addEventListener('click', function () { set(!paused); });
      return set;
    }
  };
})();

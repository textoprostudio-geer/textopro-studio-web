// TextoPro Studio — vivo-digitalizacion.js · demostración Antes/Después (solo digitalizacion.html)
// Requiere vivo-base.js. Sin dependencias ni llamadas externas.

// El HTML ya contiene el texto Antes/Después. Este bloque añade la escena que se transforma,
// un deslizador y dos botones. Sin avance automático; con movimiento reducido el cambio es inmediato.
(function () {
  'use strict';

  var root = document.getElementById('baDemo');
  if (!root) return;
  var stage = root.querySelector('.ba-stage');
  var range = root.querySelector('.ba-range');
  var controls = root.querySelector('.ba-controls');
  var status = root.querySelector('.ba-status');
  var buttons = [].slice.call(root.querySelectorAll('.ba-btn'));
  if (!stage || !range || !controls) return;

  var V = window.TPVivo;
  if (!V) return;
  var p = 0;
  var raf = 0;
  var TEXT = {
    before: 'Antes: operación dispersa',
    mid: 'En transición: ordenando la información',
    after: 'Después: proceso digital organizado'
  };

  function stateOf(v) { return v <= 0.001 ? 'before' : (v >= 0.999 ? 'after' : 'mid'); }

  function render(v, announce) {
    p = Math.max(0, Math.min(1, v));
    stage.style.setProperty('--p', p.toFixed(3));
    range.value = String(Math.round(p * 100));
    range.style.setProperty('--fill', (p * 100).toFixed(1) + '%');
    var s = stateOf(p);
    root.setAttribute('data-state', s === 'mid' ? (p < 0.5 ? 'before' : 'after') : s);
    range.setAttribute('aria-valuetext', TEXT[s]);
    buttons.forEach(function (b) {
      var to = parseInt(b.getAttribute('data-to'), 10) / 100;
      b.setAttribute('aria-pressed', Math.abs(p - to) < 0.001 ? 'true' : 'false');
    });
    if (announce && status) status.textContent = TEXT[s];
  }

  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function animateTo(target) {
    stop();
    if (V.reduced()) { render(target, true); return; }
    var from = p, t0 = null, dur = 900;
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function tick(now) {
      if (t0 === null) t0 = now;
      var k = Math.min(1, (now - t0) / dur);
      render(from + (target - from) * ease(k), false);
      if (k < 1) raf = requestAnimationFrame(tick);
      else { raf = 0; render(target, true); }
    }
    raf = requestAnimationFrame(tick);
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { animateTo(parseInt(b.getAttribute('data-to'), 10) / 100); });
  });

  var announceTimer = 0;
  range.addEventListener('input', function () {
    stop();
    render(parseInt(range.value, 10) / 100, false);
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () { if (status) status.textContent = TEXT[stateOf(p)]; }, 350);
  });

  controls.hidden = false;
  root.classList.add('is-live');
  render(0, false);
})();

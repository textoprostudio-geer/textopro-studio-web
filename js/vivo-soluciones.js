// TextoPro Studio — vivo-soluciones.js · esquemas conceptuales del carrusel de soluciones (Inicio)
// Comunicación, Digitalización e IA. Requiere vivo-base.js y vivo-inicio.js (que crea las pestañas del carrusel).
// El HTML ya contiene cada esquema completo y legible; este script solo añade interacción.
// Todo es conceptual: no hay datos, agentes ni integraciones reales. Sin dependencias ni llamadas externas.
(function () {
  'use strict';

  var V = window.TPVivo;
  var root = document.getElementById('solCarousel');
  if (!V || !root) return;
  var stages = [].slice.call(root.querySelectorAll('.sx'));
  if (!stages.length) return;

  // El HTML trae <span> (sin JS no hay nada que pulsar); aquí pasan a ser botones reales.
  function toButton(span) {
    var b = document.createElement('button');
    b.type = 'button';
    for (var i = 0; i < span.attributes.length; i++) b.setAttribute(span.attributes[i].name, span.attributes[i].value);
    b.innerHTML = span.innerHTML;
    span.parentNode.replaceChild(b, span);
    return b;
  }

  // Grupo de opciones (radiogroup) con tabindex dinámico: una sola parada de Tab; flechas, Inicio y Fin mueven y eligen.
  function roving(items, pick) {
    items.forEach(function (it, i) {
      it.addEventListener('click', function () { pick(i, false); });
      it.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % items.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + items.length - 1) % items.length;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = items.length - 1;
        else if (e.key === 'Escape' && pick.clear) { e.preventDefault(); pick.clear(); return; }
        if (to === null) return;
        e.preventDefault();
        pick(to, true);
      });
    });
  }

  function setup(sx) {
    var kind = sx.getAttribute('data-sx');
    var stage = sx.querySelector('.sx-stage');
    var list = sx.querySelector('.sx-nodes');
    var read = sx.querySelector('.sx-read-in');
    var panel = sx.closest('.sol-panel');
    if (!stage || !list || !read || !panel) return;

    var nodes = [].slice.call(list.querySelectorAll('.sx-node')).map(toButton);
    var edges = [].slice.call(sx.querySelectorAll('.sx-edge'));
    var flows = [].slice.call(sx.querySelectorAll('.sx-flow'));
    var mode = sx.getAttribute('data-hl') || 'route';
    var cur = -1;
    var defaults = { _: read.innerHTML };

    list.setAttribute('role', 'radiogroup');
    [].forEach.call(list.children, function (li) { li.setAttribute('role', 'presentation'); });
    nodes.forEach(function (n) { n.setAttribute('role', 'radio'); n.setAttribute('aria-checked', 'false'); n.tabIndex = -1; });
    nodes[0].tabIndex = 0;
    sx.classList.add('is-live');

    // ---- textos que dependen del estado (solo Digitalización) ----
    function scattered() { return sx.getAttribute('data-state') === 'scattered'; }
    function nameOf(n) { return (scattered() && n.getAttribute('data-name0')) || n.getAttribute('data-name'); }
    function descOf(n) { return (scattered() && n.getAttribute('data-desc0')) || n.getAttribute('data-desc'); }
    function defaultText() { return defaults[kind === 'dig' ? (scattered() ? 's' : 'c') : '_']; }

    function setRead(html, title, desc) {
      if (html !== null) { read.innerHTML = html; return; }
      read.innerHTML = '';
      var t = document.createElement('span'); t.className = 'sx-read-t'; t.textContent = title;
      var d = document.createElement('span'); d.className = 'sx-read-d'; d.textContent = desc;
      read.appendChild(t); read.appendChild(document.createTextNode(' ')); read.appendChild(d);
    }

    function paint() {
      var n = cur < 0 ? null : nodes[cur];
      var id = n ? n.getAttribute('data-node') : '';
      var path = n ? (n.getAttribute('data-path') || id).split(' ') : [];
      sx.setAttribute('data-sel', id);
      nodes.forEach(function (m, k) {
        var on = k === cur;
        var linked = !!n && !on && path.indexOf(m.getAttribute('data-node')) > -1;
        m.classList.toggle('is-linked', linked);
        m.classList.toggle('is-dim', !!n && !on && !linked);
        m.setAttribute('aria-checked', on ? 'true' : 'false');
        m.tabIndex = (n ? on : k === 0) ? 0 : -1;
        m.setAttribute('aria-label', nameOf(m));
      });
      edges.forEach(function (e) {
        var p = e.getAttribute('data-e').split(' ');
        var hot = !!n && (mode === 'incident' ? (p[0] === id || p[1] === id) : (path.indexOf(p[0]) > -1 && path.indexOf(p[1]) > -1));
        e.classList.toggle('is-hot', hot);
        e.classList.toggle('is-dim', !!n && !hot);
      });
      if (n) setRead(null, nameOf(n), descOf(n)); else setRead(defaultText());
    }

    function pick(i, focus) {
      cur = i;
      paint();
      if (kind === 'ia') fire(flows.filter(function (f) { var p = f.getAttribute('data-e').split(' '); return p[0] === nodes[i].getAttribute('data-node') || p[1] === nodes[i].getAttribute('data-node'); }), nodes[i].getAttribute('data-node'));
      if (focus) nodes[i].focus();
    }
    pick.clear = function () { cur = -1; paint(); };
    roving(nodes, pick);

    // ---- Digitalización: estados «Disperso» / «Conectado» (solo cambian con los controles de la persona) ----
    if (kind === 'dig') {
      defaults.s = 'De piezas sueltas a un sistema conectado. Elige una pieza para ver su papel.';
      defaults.c = 'Piezas conectadas: cada módulo se relaciona con los demás. Elige uno para ver su papel.';
      defaults.s = '<span class="sx-read-t">Esquema conceptual</span> <span class="sx-read-d">' + defaults.s + '</span>';
      defaults.c = '<span class="sx-read-t">Esquema conceptual</span> <span class="sx-read-d">' + defaults.c + '</span>';

      var tg = V.el('div', 'sx-toggle');
      tg.setAttribute('role', 'radiogroup');
      tg.setAttribute('aria-label', 'Estado del esquema');
      var opts = [['scattered', 'Disperso'], ['connected', 'Conectado']].map(function (o) {
        var b = V.el('button', '', o[1]);
        b.type = 'button';
        b.setAttribute('role', 'radio');
        b.setAttribute('data-state', o[0]);
        return b;
      });
      opts.forEach(function (b) { tg.appendChild(b); });
      stage.appendChild(tg);

      var setState = function (s, focus) {
        sx.setAttribute('data-state', s);
        opts.forEach(function (b) {
          var on = b.getAttribute('data-state') === s;
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.tabIndex = on ? 0 : -1;
        });
        [].forEach.call(sx.querySelectorAll('.sx-t0'), function (t) { t.setAttribute('aria-hidden', s === 'scattered' ? 'false' : 'true'); });
        [].forEach.call(sx.querySelectorAll('.sx-t1'), function (t) { t.setAttribute('aria-hidden', s === 'scattered' ? 'true' : 'false'); });
        paint();
        if (focus) opts[s === 'scattered' ? 0 : 1].focus();
      };
      roving(opts, function (i, focus) { setState(i === 0 ? 'scattered' : 'connected', focus); });
      // Estado inicial «Disperso» sin transición (el panel está oculto en este momento); el HTML sin JS muestra «Conectado».
      sx.classList.add('is-init');
      setState('scattered', false);
      setTimeout(function () { sx.classList.remove('is-init'); }, 60);
    } else {
      paint();
    }

    // ---- IA: pulsos finitos y profundidad sutil ----
    function fire(list, from) {
      if (V.reduced() || !list.length) return;
      list.forEach(function (f) { f.classList.remove('is-fly', 'is-rev'); });
      void stage.offsetWidth; // un único reflujo para reiniciar las animaciones
      list.forEach(function (f, i) {
        var p = f.getAttribute('data-e').split(' ');
        f.style.setProperty('--d', (i * 0.16).toFixed(2) + 's');
        if (from && p[1] === from) f.classList.add('is-rev');
        f.classList.add('is-fly');
      });
    }
    if (kind === 'ia') {
      flows.forEach(function (f) { f.addEventListener('animationend', function () { f.classList.remove('is-fly', 'is-rev'); }); });
      var shown = !panel.hidden, vis = true, pending = shown;
      var maybe = function () { if (pending && shown && vis && !V.reduced()) { pending = false; fire(flows, null); } };
      new MutationObserver(function () {
        var now = !panel.hidden;
        if (now && !shown) pending = true; // cada vez que se muestra el panel: una sola secuencia corta
        shown = now;
        maybe();
      }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      V.whenVisible(stage, function (v) { vis = v; maybe(); });
      maybe();

      var raf = 0, nx = 0, ny = 0;
      var apply = function () { raf = 0; stage.style.setProperty('--px', nx.toFixed(2)); stage.style.setProperty('--py', ny.toFixed(2)); };
      stage.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse' || V.reduced()) return;
        var r = stage.getBoundingClientRect();
        nx = (e.clientX - r.left) / r.width * 2 - 1; ny = (e.clientY - r.top) / r.height * 2 - 1;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      stage.addEventListener('pointerleave', function () { nx = 0; ny = 0; if (!raf) raf = requestAnimationFrame(apply); });
    }
  }

  stages.forEach(setup);
})();

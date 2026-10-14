// TextoPro Studio — vivo-ia.js · recorrido conceptual de IA (solo ia.html).
// El HTML ya contiene los 4 pasos; este script añade el riel interactivo, las flechas y la pausa.
(function () {
  'use strict';

  var root = document.getElementById('aiFlow');
  if (!root) return;
  var list = root.querySelector('.aiflow-steps');
  var steps = [].slice.call(root.querySelectorAll('.aiflow-step'));
  if (!list || steps.length < 2) return;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  var rail = el('div', 'aiflow-rail');
  rail.setAttribute('role', 'tablist');
  rail.setAttribute('aria-label', 'Pasos del recorrido conceptual');
  var pulse = el('span', 'aiflow-pulse');
  pulse.setAttribute('aria-hidden', 'true');
  rail.appendChild(pulse);

  var nodes = steps.map(function (s, i) {
    var b = el('button', 'aiflow-node');
    b.type = 'button';
    b.id = 'aiflow-tab-' + (i + 1);
    s.id = s.id || 'aiflow-step-' + (i + 1);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', s.id);
    b.setAttribute('aria-selected', 'false');
    b.tabIndex = -1;
    b.appendChild(el('span', 'aiflow-dot', String(i + 1)));
    b.appendChild(el('span', 'aiflow-label', s.getAttribute('data-title') || ('Paso ' + (i + 1))));
    s.setAttribute('role', 'tabpanel');
    s.setAttribute('aria-labelledby', b.id);
    rail.appendChild(b);
    return b;
  });

  var bar = el('div', 'aiflow-bar');
  var nav = el('div', 'aiflow-nav');
  var prev = el('button', 'aiflow-btn', '← Anterior');
  var next = el('button', 'aiflow-btn', 'Siguiente →');
  var pause = el('button', 'aiflow-pause');
  var status = el('span', 'sr-only');
  prev.type = next.type = pause.type = 'button';
  pause.setAttribute('aria-pressed', 'false');
  pause.setAttribute('aria-label', 'Pausar animación del recorrido');
  pause.appendChild(el('span', 'aiflow-pause-icon'));
  pause.firstChild.setAttribute('aria-hidden', 'true');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  nav.appendChild(prev); nav.appendChild(next);
  bar.appendChild(nav); bar.appendChild(pause); bar.appendChild(status);

  root.insertBefore(rail, list);
  root.appendChild(bar);
  // la nota "conceptual" va al final, debajo de los controles
  var note = root.querySelector('.aiflow-note');
  if (note) root.appendChild(note);
  root.classList.add('is-live');

  var current = -1;
  function select(i, announce) {
    i = (i + steps.length) % steps.length;
    if (i === current) return;
    current = i;
    steps.forEach(function (s, k) {
      s.classList.toggle('is-active', k === i);
      s.classList.toggle('is-entering', k === i);
      if (k === i) setTimeout(function () { s.classList.remove('is-entering'); }, 400);
    });
    nodes.forEach(function (n, k) {
      n.setAttribute('aria-selected', k === i ? 'true' : 'false');
      n.tabIndex = k === i ? 0 : -1;
    });
    if (announce) status.textContent = 'Paso ' + (i + 1) + ' de ' + steps.length + ': ' + nodes[i].lastChild.textContent;
  }

  nodes.forEach(function (n, i) {
    n.addEventListener('click', function () { select(i, true); });
    n.addEventListener('keydown', function (e) {
      var to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = i - 1;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = steps.length - 1;
      if (to === null) return;
      e.preventDefault();
      to = (to + steps.length) % steps.length;
      select(to, true);
      nodes[to].focus();
    });
  });
  prev.addEventListener('click', function () { select(current - 1, true); });
  next.addEventListener('click', function () { select(current + 1, true); });
  pause.addEventListener('click', function () {
    var p = !root.classList.contains('is-paused');
    root.classList.toggle('is-paused', p);
    pause.setAttribute('aria-pressed', p ? 'true' : 'false');
    pause.setAttribute('aria-label', p ? 'Reanudar animación del recorrido' : 'Pausar animación del recorrido');
  });

  // El pulso solo se anima mientras el recorrido está a la vista
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      root.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    }).observe(root);
  }

  // Los pasos del hero enlazan (ancla) con el recorrido; aquí además se elige el paso correspondiente
  [].forEach.call(document.querySelectorAll('[data-aiflow-step]'), function (a) {
    a.addEventListener('click', function () { select(parseInt(a.getAttribute('data-aiflow-step'), 10) - 1, true); });
  });

  select(0, false);
})();

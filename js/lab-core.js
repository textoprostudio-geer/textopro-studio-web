// TextoPro Lab — base compartida de las herramientas (lab-core.js)
// Solo contiene lo que usan al menos dos herramientas: pestañas del selector, copiado con aviso,
// errores de campo accesibles y avisos para lectores de pantalla. Sin red, sin dependencias.
// Requiere vivo-base.js (TPVivo.el y TPVivo.reduced).
(function () {
  'use strict';

  var V = window.TPVivo || {
    el: function (tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; },
    reduced: function () { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  };
  var TPLab = window.TPLab = window.TPLab || {};
  TPLab.el = V.el;
  TPLab.reduced = V.reduced;

  // ---- Aviso para lectores de pantalla (una sola región para todo Lab) ----
  var live = null;
  TPLab.announce = function (msg) {
    if (!live) {
      live = V.el('div', 'sr-only');
      live.setAttribute('role', 'status');
      live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
    }
    live.textContent = '';
    setTimeout(function () { live.textContent = msg; }, 30);
  };

  // ---- Copiar al portapapeles con aviso visible ----
  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) { return false; }
  }
  // Copia `text` y escribe el resultado en `statusEl` (un elemento con aria-live="polite").
  TPLab.copy = function (text, statusEl, okMsg, failMsg) {
    function done(ok) {
      if (!statusEl) return;
      statusEl.textContent = ok ? (okMsg || 'Copiado') : (failMsg || 'No se pudo copiar. Selecciona el texto y cópialo manualmente.');
      clearTimeout(statusEl._t);
      statusEl._t = setTimeout(function () { statusEl.textContent = ''; }, 2400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(fallbackCopy(text)); });
    } else {
      done(fallbackCopy(text));
    }
  };

  // ---- Errores de campo: aria-invalid + mensaje enlazado con aria-describedby ----
  TPLab.setError = function (input, msgEl, message) {
    msgEl.textContent = message;
    msgEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    var ids = (input.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (ids.indexOf(msgEl.id) < 0) { ids.push(msgEl.id); input.setAttribute('aria-describedby', ids.join(' ')); }
  };
  TPLab.clearError = function (input, msgEl) {
    msgEl.textContent = '';
    msgEl.hidden = true;
    input.setAttribute('aria-invalid', 'false');
  };

  // ---- Selector de herramientas: las tarjetas del índice pasan a ser pestañas ----
  // index: contenedor con enlaces <a data-tool="id"> hacia paneles con ese id.
  TPLab.initTabs = function (index) {
    var list = index && index.querySelector('ul');
    if (!list) return null;
    var links = [].slice.call(index.querySelectorAll('a[data-tool]'));
    var panels = links.map(function (a) { return document.getElementById(a.getAttribute('data-tool')); });
    if (links.length < 2 || panels.some(function (p) { return !p; })) return null;

    list.setAttribute('role', 'tablist');
    list.setAttribute('aria-label', 'Herramientas de TextoPro Lab');
    var tabs = links.map(function (a, i) {
      var b = V.el('button', a.className);
      b.type = 'button';
      b.innerHTML = a.innerHTML;
      b.id = 'lab-tab-' + a.getAttribute('data-tool');
      b.setAttribute('data-tool', a.getAttribute('data-tool'));
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', panels[i].id);
      b.setAttribute('aria-selected', 'false');
      b.tabIndex = -1;
      a.parentNode.setAttribute('role', 'presentation');
      a.parentNode.replaceChild(b, a);
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', b.id);
      return b;
    });

    var current = -1;
    function select(i, opts) {
      i = (i + tabs.length) % tabs.length;
      opts = opts || {};
      if (i !== current) {
        current = i;
        tabs.forEach(function (t, k) {
          t.setAttribute('aria-selected', k === i ? 'true' : 'false');
          t.tabIndex = k === i ? 0 : -1;
          panels[k].hidden = k !== i;
        });
        panels[i].dispatchEvent(new CustomEvent('tplab:show', { bubbles: true }));
      }
      if (opts.hash && window.history && history.replaceState) history.replaceState(null, '', '#' + panels[i].id);
      if (opts.scroll) panels[i].scrollIntoView({ behavior: V.reduced() ? 'auto' : 'smooth', block: 'start' });
      if (opts.focus) tabs[i].focus();
    }
    function fromHash() {
      var id = (location.hash || '').slice(1);
      for (var k = 0; k < panels.length; k++) if (panels[k].id === id) return k;
      return -1;
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, { hash: true }); });
      t.addEventListener('keydown', function (e) {
        var to = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = i + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = i - 1;
        else if (e.key === 'Home') to = 0;
        else if (e.key === 'End') to = tabs.length - 1;
        if (to === null) return;
        e.preventDefault();
        select(to, { hash: true, focus: true });
      });
    });
    window.addEventListener('hashchange', function () {
      var k = fromHash();
      if (k >= 0) select(k, { scroll: true });
    });

    var start = fromHash();
    select(start >= 0 ? start : 0, { scroll: start >= 0 });
    index.classList.add('is-live');
    return { select: select, tabs: tabs, panels: panels };
  };

  function boot() { var idx = document.getElementById('labIndex'); if (idx) TPLab.initTabs(idx); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

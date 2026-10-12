// TextoPro Studio — vivo-proyectos.js · esquema conceptual de APC Connect (solo proyectos.html)
// Requiere vivo-base.js. El HTML ya contiene la estructura completa como lista anidada; este script
// convierte cada elemento en un botón, resalta su ruta y muestra una descripción tomada del propio HTML.
// Sin animaciones continuas ni dependencias.
(function () {
  'use strict';

  var root = document.getElementById('apcSchema');
  var V = window.TPVivo;
  if (!root || !V) return;
  var spans = [].slice.call(root.querySelectorAll('.apc-node'));
  if (!spans.length) return;

  var HINT = 'Selecciona un elemento para ver su lugar en el esquema.';
  var detail = V.el('div', 'apc-detail');
  var title = V.el('p', 'apc-detail-title');
  var text = V.el('p', 'apc-detail-text', HINT);
  var rel = V.el('p', 'apc-detail-rel');
  detail.setAttribute('role', 'status');
  detail.setAttribute('aria-live', 'polite');
  detail.appendChild(title); detail.appendChild(text); detail.appendChild(rel);
  root.appendChild(detail);

  var buttons = spans.map(function (s) {
    var b = V.el('button', s.className, s.textContent);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('data-desc', s.getAttribute('data-desc') || '');
    s.parentNode.replaceChild(b, s);
    return b;
  });

  function itemOf(b) { return b.parentNode; }
  function nodeIn(li) { return li.querySelector(':scope > .apc-node'); }
  function parentItem(li) { var p = li.parentNode && li.parentNode.closest ? li.parentNode.closest('li.apc-item') : null; return p; }

  var current = null;
  function clear() {
    [].forEach.call(root.querySelectorAll('.is-path, .is-sub'), function (e) { e.classList.remove('is-path', 'is-sub'); });
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    root.classList.remove('has-sel');
  }

  function select(b) {
    clear();
    if (current === b) { current = null; title.textContent = ''; text.textContent = HINT; rel.textContent = ''; return; }
    current = b;
    var li = itemOf(b);
    b.setAttribute('aria-pressed', 'true');
    root.classList.add('has-sel');
    // ruta hasta la raíz
    for (var a = li; a; a = parentItem(a)) a.classList.add('is-path');
    // elementos que cuelgan de este
    [].forEach.call(li.querySelectorAll('li.apc-item'), function (d) { d.classList.add('is-sub'); });

    title.textContent = b.textContent;
    text.textContent = b.getAttribute('data-desc');
    var kids = [].slice.call(li.querySelectorAll(':scope > ul > li > .apc-node')).map(function (n) { return n.textContent; });
    var par = parentItem(li);
    if (kids.length) rel.textContent = 'Incluye: ' + kids.join(', ') + '.';
    else if (par) rel.textContent = 'Forma parte de: ' + nodeIn(par).textContent + '.';
    else rel.textContent = '';
  }

  buttons.forEach(function (b) { b.addEventListener('click', function () { select(b); }); });
  root.classList.add('is-live');
})();

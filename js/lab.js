// TextoPro Lab — Generador de anuncios (V1 · Motor de plantillas)
// 100% local: sin IA, sin API, sin backend. Todo el procesamiento ocurre en el navegador.

(function () {
  'use strict';

  // ===== Utilidades =====
  function cap(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ===== Plantillas =====
  // Cada plantilla es una función pura: (datos) => texto.
  // datos = { producto, publico, tono }
  var TEMPLATES = {
    profesional: [
      {
        headline: function (d) { return cap(d.producto) + ', pensado para ' + d.publico + '.'; },
        texto: function (d) { return 'Ofrecemos ' + d.producto + ' diseñado específicamente para ' + d.publico + '. Un enfoque claro, directo y adaptado a lo que tu negocio necesita.'; },
        cta: function () { return 'Solicita más información'; }
      },
      {
        headline: function (d) { return cap(d.producto) + ' para ' + d.publico + ' que buscan claridad.'; },
        texto: function (d) { return 'Trabajamos con ' + d.publico + ' que necesitan ' + d.producto + ' confiable y bien estructurado. Conversemos sobre tu caso particular.'; },
        cta: function () { return 'Agenda una conversación'; }
      },
      {
        headline: function (d) { return 'Una solución de ' + d.producto + ' hecha para ' + d.publico + '.'; },
        texto: function (d) { return 'Entendemos el contexto de ' + d.publico + ' y ofrecemos ' + d.producto + ' adaptado a esa realidad, sin complicaciones innecesarias.'; },
        cta: function () { return 'Conoce más detalles'; }
      },
      {
        headline: function (d) { return cap(d.producto) + ': claridad para ' + d.publico + '.'; },
        texto: function (d) { return 'Si formas parte de ' + d.publico + ', este servicio de ' + d.producto + ' está pensado para simplificar tu decisión con información clara.'; },
        cta: function () { return 'Habla con nosotros'; }
      }
    ],
    cercano: [
      {
        headline: function (d) { return '¿Buscas ' + d.producto + '? Hablemos.'; },
        texto: function (d) { return 'Sabemos que como parte de ' + d.publico + ', encontrar ' + d.producto + ' confiable no siempre es fácil. Por eso estamos aquí, para acompañarte en el proceso.'; },
        cta: function () { return 'Escríbenos'; }
      },
      {
        headline: function (d) { return cap(d.producto) + ', sin complicaciones.'; },
        texto: function (d) { return 'Si eres de ' + d.publico + ' y necesitas ' + d.producto + ', te entendemos. Hagamos que esto sea simple y cercano, como debería ser.'; },
        cta: function () { return 'Cuéntanos tu caso'; }
      },
      {
        headline: function (d) { return 'Para ' + d.publico + ' que quieren algo distinto.'; },
        texto: function (d) { return 'Nuestro ' + d.producto + ' está pensado para personas como tú. Sin tecnicismos, sin vueltas: solo lo que necesitas.'; },
        cta: function () { return 'Platiquemos'; }
      },
      {
        headline: function (d) { return cap(d.producto) + ' hecho pensando en ti.'; },
        texto: function (d) { return 'Trabajamos de la mano con ' + d.publico + ' para ofrecer ' + d.producto + ' que se sienta realmente hecho a la medida.'; },
        cta: function () { return 'Hablemos hoy'; }
      }
    ],
    directo: [
      {
        headline: function (d) { return cap(d.producto) + '. Para ' + d.publico + '.'; },
        texto: function (d) { return 'Sin rodeos. Ofrecemos ' + d.producto + ' pensado para ' + d.publico + '. Simple y directo.'; },
        cta: function () { return 'Pide información'; }
      },
      {
        headline: function (d) { return '¿Necesitas ' + d.producto + '? Aquí está.'; },
        texto: function (d) { return cap(d.publico) + ' confían en este servicio. Rápido de entender, fácil de contratar.'; },
        cta: function () { return 'Contáctanos ahora'; }
      },
      {
        headline: function (d) { return cap(d.producto) + ' sin vueltas.'; },
        texto: function (d) { return 'Hecho para ' + d.publico + '. Sin promesas vacías: solo lo que necesitas saber.'; },
        cta: function () { return 'Escríbenos ya'; }
      },
      {
        headline: function (d) { return 'Directo al punto: ' + d.producto + '.'; },
        texto: function (d) { return 'Para ' + d.publico + ' que no tienen tiempo que perder. Esto es lo que ofrecemos.'; },
        cta: function () { return 'Más información aquí'; }
      }
    ],
    inspirador: [
      {
        headline: function (d) { return 'Imagina lo que ' + d.producto + ' puede abrir para ti.'; },
        texto: function (d) { return 'Para ' + d.publico + ', este es un paso hacia algo distinto. ' + cap(d.producto) + ', pensado para acompañar ese cambio.'; },
        cta: function () { return 'Empieza a explorar'; }
      },
      {
        headline: function (d) { return 'Una nueva forma de pensar en ' + d.producto + '.'; },
        texto: function (d) { return 'Creemos que ' + d.publico + ' merece opciones que se sientan diferentes. Este es un punto de partida.'; },
        cta: function () { return 'Descubre más'; }
      },
      {
        headline: function (d) { return cap(d.producto) + ': el primer paso hacia algo mejor.'; },
        texto: function (d) { return 'Para ' + d.publico + ' que están listos para dar el siguiente paso, aquí hay una posibilidad que vale la pena explorar.'; },
        cta: function () { return 'Conoce la posibilidad'; }
      },
      {
        headline: function (d) { return '¿Y si ' + d.producto + ' fuera el comienzo de algo distinto?'; },
        texto: function (d) { return 'Pensado para ' + d.publico + ' que buscan más que lo de siempre. Una invitación a explorar otra manera de avanzar.'; },
        cta: function () { return 'Explora esta idea'; }
      }
    ]
  };

  var TONE_LABELS = {
    profesional: 'Profesional',
    cercano: 'Cercano',
    directo: 'Directo',
    inspirador: 'Inspirador'
  };

  var lastIndices = null;

  function pick3(tone) {
    var list = TEMPLATES[tone] || TEMPLATES.profesional;
    var indices = list.map(function (_, i) { return i; });
    var attempt = 0;
    var chosen;
    do {
      // Fisher-Yates shuffle
      for (var i = indices.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
      }
      chosen = indices.slice(0, 3);
      attempt++;
    } while (lastIndices && attempt < 6 && sameSet(chosen, lastIndices));
    lastIndices = chosen.slice();
    return chosen.map(function (i) { return list[i]; });
  }

  function sameSet(a, b) {
    var sa = a.slice().sort().join(',');
    var sb = b.slice().sort().join(',');
    return sa === sb;
  }

  // ===== Motor de generación =====
  function generateAds(data) {
    var chosen = pick3(data.tono);
    return chosen.map(function (t) {
      return {
        headline: t.headline(data),
        texto: t.texto(data),
        cta: t.cta(data),
        tono: data.tono
      };
    });
  }

  // ===== Render (sin innerHTML con datos del usuario) =====
  function renderResults(ads, container) {
    container.textContent = '';
    ads.forEach(function (ad, i) {
      var card = document.createElement('article');
      card.className = 'card lab-result';

      var meta = document.createElement('div');
      meta.className = 'lab-result-meta';

      var num = document.createElement('span');
      num.className = 'case-label';
      num.textContent = 'Propuesta ' + String(i + 1).padStart(2, '0');

      var toneTag = document.createElement('span');
      toneTag.className = 'case-label';
      toneTag.textContent = TONE_LABELS[ad.tono] || ad.tono;

      meta.appendChild(num);
      meta.appendChild(toneTag);

      var h = document.createElement('h3');
      h.textContent = ad.headline;

      var p = document.createElement('p');
      p.textContent = ad.texto;

      var ctaLabel = document.createElement('p');
      ctaLabel.className = 'case-label';
      ctaLabel.style.marginTop = '0.8rem';
      ctaLabel.textContent = 'CTA';

      var ctaValue = document.createElement('p');
      ctaValue.className = 'case-value';
      ctaValue.textContent = ad.cta;

      var actions = document.createElement('div');
      actions.className = 'lab-result-actions';

      var copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'btn-secondary btn-small';
      copyBtn.textContent = 'Copiar anuncio';

      var status = document.createElement('span');
      status.className = 'lab-copy-status';
      status.setAttribute('aria-live', 'polite');

      copyBtn.addEventListener('click', function () {
        copyAd(ad, status);
      });

      actions.appendChild(copyBtn);
      actions.appendChild(status);

      card.appendChild(meta);
      card.appendChild(h);
      card.appendChild(p);
      card.appendChild(ctaLabel);
      card.appendChild(ctaValue);
      card.appendChild(actions);

      container.appendChild(card);
    });
  }

  function copyAd(ad, statusEl) {
    var text = ad.headline + '\n\n' + ad.texto + '\n\nCTA: ' + ad.cta;

    function showCopied() {
      statusEl.textContent = 'Copiado';
      setTimeout(function () { statusEl.textContent = ''; }, 1800);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied, function () {
        fallbackCopy(text, showCopied);
      });
    } else {
      fallbackCopy(text, showCopied);
    }
  }

  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      done();
    } catch (e) {
      // Sin feedback si el copiado no es posible; no se envía nada a ningún servidor.
    }
  }

  // ===== Interfaz =====
  function initLab() {
    var form = document.getElementById('labForm');
    if (!form) return;

    var producto = document.getElementById('labProducto');
    var publico = document.getElementById('labPublico');
    var tono = document.getElementById('labTono');
    var message = document.getElementById('labFormMessage');
    var results = document.getElementById('labResults');
    var emptyState = document.getElementById('labResultsEmpty');
    var regenerateWrap = document.getElementById('labRegenerateWrap');
    var regenerateBtn = document.getElementById('labRegenerateBtn');
    var clearBtn = document.getElementById('labClearBtn');

    function currentData() {
      return {
        producto: producto.value.trim(),
        publico: publico.value.trim(),
        tono: tono.value
      };
    }

    function isValid(data) {
      return !!(data.producto && data.publico && data.tono);
    }

    function showResults(data) {
      var ads = generateAds(data);
      if (emptyState) emptyState.hidden = true;
      renderResults(ads, results);
      if (regenerateWrap) regenerateWrap.hidden = false;
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = currentData();
      if (!isValid(data)) {
        message.textContent = 'Completa los tres campos para generar tus propuestas.';
        return;
      }
      message.textContent = '';
      lastIndices = null; // primera generación: sin restricción de "no repetir"
      showResults(data);
    });

    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', function () {
        var data = currentData();
        if (!isValid(data)) return;
        showResults(data);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        form.reset();
        message.textContent = '';
        results.textContent = '';
        if (emptyState) {
          results.appendChild(emptyState);
          emptyState.hidden = false;
        }
        if (regenerateWrap) regenerateWrap.hidden = true;
        lastIndices = null;
        producto.focus();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initLab);
})();

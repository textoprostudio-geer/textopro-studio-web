// TextoPro Lab — Generador de anuncios V2 (js/lab.js)
// Motor de plantillas determinista, 100 % local: sin IA, sin red, sin almacenamiento.
// Combina estructuras de redacción predefinidas con lo que la persona escribe. No inventa descuentos,
// características, garantías ni datos: solo usa sus palabras (producto o servicio, público, beneficio,
// diferenciador y oferta) y frases neutras. El motor es independiente del DOM para poder probarse aparte.
(function () {
  'use strict';

  // ===================== Utilidades de texto =====================
  function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().replace(/[.!?¡¿,;:]+$/, '').trim(); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  // Minúscula inicial para usar la frase a mitad de oración, salvo siglas o nombres propios escritos por la persona.
  function low(s) {
    if (!s) return s;
    var first = s.split(' ')[0];
    if (first.length > 1 && first === first.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(first)) return s;
    if (/\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]/.test(s.slice(first.length))) return s;
    if (/[a-záéíóúñ][A-ZÁÉÍÓÚÑ]/.test(first)) return s; // iPhone, eBay…
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  function sentence(s) { s = clean(s); return s ? s + '.' : ''; }
  function fill(tpl, ctx) { return tpl.replace(/\{(p|P|pub)\}/g, function (_, k) { return ctx[k]; }); }
  function pick(rng, arr) { return arr[Math.floor(rng() * arr.length) % arr.length]; }

  // ===================== Validación y normalización =====================
  var LIMITS = { item: 100, publico: 100, extra: 120 };
  var CANALES = { whatsapp: 'Mensaje de WhatsApp', redes: 'Publicación en redes sociales', anuncio: 'Anuncio pagado corto', ficha: 'Descripción o ficha' };
  var OBJETIVOS = { vender: 'Vender o recibir pedidos', cotizar: 'Agendar o cotizar', contacto: 'Recibir mensajes', conocer: 'Dar a conocer' };
  var TONOS = { profesional: 'Profesional', cercano: 'Cercano', directo: 'Directo', inspirador: 'Inspirador' };
  // Longitud orientativa del texto principal por canal (no son límites oficiales de ninguna plataforma).
  var LONGITUD = { whatsapp: 300, redes: 500, anuncio: 150, ficha: 600 };

  function normalize(raw) {
    raw = raw || {};
    var errors = {};
    var tipo = raw.tipo === 'servicio' ? 'servicio' : 'producto';
    var item = clean(raw.item);
    var publico = clean(raw.publico).replace(/^(para|dirigido a|a)\s+/i, '');
    function opt(v, key) { var t = clean(v); if (t.length > LIMITS.extra) errors[key] = 'Máximo ' + LIMITS.extra + ' caracteres.'; return t; }
    var beneficio = opt(raw.beneficio, 'beneficio'), diferenciador = opt(raw.diferenciador, 'diferenciador'), oferta = opt(raw.oferta, 'oferta');
    if (!item) errors.item = tipo === 'servicio' ? 'Escribe qué servicio ofreces.' : 'Escribe qué producto vendes.';
    else if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(item)) errors.item = 'Usa al menos una palabra.';
    else if (item.length > LIMITS.item) errors.item = 'Máximo ' + LIMITS.item + ' caracteres.';
    if (!publico) errors.publico = 'Escribe a quién quieres llegar.';
    else if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(publico)) errors.publico = 'Usa al menos una palabra.';
    else if (publico.length > LIMITS.publico) errors.publico = 'Máximo ' + LIMITS.publico + ' caracteres.';
    var canal = CANALES[raw.canal] ? raw.canal : 'redes';
    var objetivo = OBJETIVOS[raw.objetivo] ? raw.objetivo : 'vender';
    var tono = TONOS[raw.tono] ? raw.tono : 'cercano';
    return { ok: Object.keys(errors).length === 0, errors: errors, data: { tipo: tipo, item: item, publico: publico, beneficio: beneficio, diferenciador: diferenciador, oferta: oferta, canal: canal, objetivo: objetivo, tono: tono } };
  }

  // ===================== Léxico por tono =====================
  // Todas las frases son seguras con cualquier sustantivo: no concuerdan en género ni número con lo que escribe la persona
  // (sin «este/esta», «nuestro», «lo/la», participios) y el público solo entra tras «para», «con», «a» o «en».
  var LEX = {
    profesional: {
      q: { producto: ['¿Necesitas {p}?', '¿Buscas {p}?'], servicio: ['¿Necesitas {p}?', '¿Buscas apoyo con {p}?'] },
      intro: { producto: ['Presentamos {p}.', 'Una opción en {p}.'], servicio: ['Ofrecemos {p}.', 'Contamos con {p}.'] },
      forPub: { producto: ['Ideal para {pub}.', 'Pensando en {pub}.'], servicio: ['Trabajamos con {pub}.', 'Atendemos a {pub}.'] },
      imp: { producto: ['Conoce {p}', 'Descubre {p}'], servicio: ['Conoce {p}', 'Descubre {p}'] },
      hook5: ['{P} para {pub}', '{P} pensando en {pub}'],
      hook6: ['Conversemos sobre {p}', 'Hablemos de {p}'],
      bridge: ['Conoce los detalles y resuelve tus dudas.', 'Pregunta lo que necesites saber.'],
      invite: { producto: ['Conoce los detalles.', 'Consulta la información disponible.'], servicio: ['Conversemos sobre tu caso.', 'Platiquemos sobre lo que necesitas.'] }
    },
    cercano: {
      q: { producto: ['¿Buscas {p}?', '¿Estás buscando {p}?'], servicio: ['¿Necesitas ayuda con {p}?', '¿Buscas apoyo con {p}?'] },
      intro: { producto: ['Te presentamos {p}.', 'Aquí encontrarás {p}.'], servicio: ['Te ayudamos con {p}.', 'Estamos aquí para ayudarte con {p}.'] },
      forPub: { producto: ['Ideal para {pub}.', 'Pensando en {pub}.'], servicio: ['Trabajamos con {pub}.', 'Acompañamos a {pub}.'] },
      imp: { producto: ['Conoce {p}', 'Descubre {p}'], servicio: ['Conoce {p}', 'Descubre {p}'] },
      hook5: ['{P}, pensando en ti', '{P} para {pub}'],
      hook6: ['Hablemos de {p}', 'Platiquemos sobre {p}'],
      bridge: ['Cuéntanos qué necesitas y lo vemos juntos.', 'Escríbenos si tienes dudas.'],
      invite: { producto: ['Escríbenos si tienes dudas.', 'Cuéntanos qué estás buscando.'], servicio: ['Cuéntanos qué necesitas.', 'Platiquemos sobre tu caso.'] }
    },
    directo: {
      q: { producto: ['¿Necesitas {p}?'], servicio: ['¿Necesitas {p}?'] },
      intro: { producto: ['Sin rodeos: {p}.', 'Esto es lo que ofrecemos: {p}.'], servicio: ['Sin rodeos: {p}.', 'Esto es lo que ofrecemos: {p}.'] },
      forPub: { producto: ['Para {pub}.', 'Dirigido a {pub}.'], servicio: ['Para {pub}.', 'Dirigido a {pub}.'] },
      imp: { producto: ['Directo al punto: {p}', 'Aquí está: {p}'], servicio: ['Directo al punto: {p}', 'Aquí está: {p}'] },
      hook5: ['{P}. Para {pub}', '{P}, directo'],
      hook6: ['Directo al punto: {p}', 'Esto es {p}'],
      bridge: ['Pregunta lo que necesites.', 'Escríbenos y lo aclaramos.'],
      invite: { producto: ['Pregunta lo que necesites.', 'Escríbenos.'], servicio: ['Escríbenos.', 'Cuéntanos tu caso.'] }
    },
    inspirador: {
      q: { producto: ['¿Listo para empezar con {p}?', '¿Y si hoy empiezas con {p}?'], servicio: ['¿Listo para dar el siguiente paso con {p}?', '¿Y si hoy empiezas con {p}?'] },
      intro: { producto: ['Con {p} empieza algo nuevo.', 'Hay otra forma de conocer {p}.'], servicio: ['Con {p} empieza algo nuevo.', 'Hay otra forma de conocer {p}.'] },
      forPub: { producto: ['Pensando en {pub}.', 'Una invitación para {pub}.'], servicio: ['Pensando en {pub}.', 'Una invitación para {pub}.'] },
      imp: { producto: ['Da el primer paso con {p}', 'Empieza con {p}'], servicio: ['Da el primer paso con {p}', 'Empieza con {p}'] },
      hook5: ['Empieza con {p}', 'Un nuevo comienzo con {p}'],
      hook6: ['Un nuevo comienzo con {p}', 'El siguiente paso: {p}'],
      bridge: ['Cada avance empieza con una decisión.', 'El primer paso puede ser un mensaje.'],
      invite: { producto: ['Empieza hoy.', 'El primer paso está a un mensaje de distancia.'], servicio: ['Empieza hoy.', 'El primer paso está a un mensaje de distancia.'] }
    }
  };

  // Llamado a la acción según tono, objetivo y tipo.
  var CTA = {
    vender: {
      producto: { profesional: ['Haz tu pedido', 'Solicita tu pedido'], cercano: ['Haz tu pedido cuando quieras', 'Escríbenos y haz tu pedido'], directo: ['Compra hoy', 'Haz tu pedido'], inspirador: ['Haz tu pedido y empieza hoy'] },
      servicio: { profesional: ['Solicita el servicio', 'Contrata hoy'], cercano: ['Contáctanos y empezamos', 'Escríbenos y lo organizamos'], directo: ['Contrata hoy', 'Solicita el servicio'], inspirador: ['Empieza hoy con nosotros'] }
    },
    cotizar: {
      producto: { profesional: ['Solicita tu cotización', 'Pide tu cotización'], cercano: ['Pide tu cotización', 'Cuéntanos qué necesitas y cotizamos'], directo: ['Cotiza hoy', 'Pide tu cotización'], inspirador: ['Da el primer paso: pide tu cotización'] },
      servicio: { profesional: ['Solicita tu cotización', 'Agenda una cita'], cercano: ['Agenda una cita', 'Pide tu cotización'], directo: ['Cotiza hoy', 'Agenda una cita'], inspirador: ['Da el primer paso: agenda una cita'] }
    },
    contacto: {
      producto: { profesional: ['Envíanos un mensaje', 'Escríbenos'], cercano: ['Escríbenos', 'Mándanos un mensaje'], directo: ['Escríbenos ahora', 'Escríbenos'], inspirador: ['Escríbenos y da el primer paso'] },
      servicio: { profesional: ['Envíanos un mensaje', 'Escríbenos'], cercano: ['Escríbenos', 'Mándanos un mensaje'], directo: ['Escríbenos ahora', 'Escríbenos'], inspirador: ['Escríbenos y da el primer paso'] }
    },
    conocer: {
      producto: { profesional: ['Conoce más', 'Consulta los detalles'], cercano: ['Conoce más', 'Descubre más'], directo: ['Conoce más', 'Ve los detalles'], inspirador: ['Descubre más', 'Conoce lo que sigue'] },
      servicio: { profesional: ['Conoce más', 'Consulta los detalles'], cercano: ['Conoce más', 'Descubre más'], directo: ['Conoce más', 'Ve los detalles'], inspirador: ['Descubre más', 'Conoce lo que sigue'] }
    }
  };
  function makeCta(ctx, rng) {
    var cta = pick(rng, CTA[ctx.objetivo][ctx.tipo][ctx.tono]);
    if (ctx.canal === 'whatsapp') {
      if (ctx.objetivo === 'contacto') cta = pick(rng, ['Escríbenos por WhatsApp', 'Mándanos un mensaje por WhatsApp']);
      else if (ctx.objetivo === 'vender' || ctx.objetivo === 'cotizar') cta += ' por WhatsApp';
    }
    return cta;
  }

  // ===================== Estructuras =====================
  var MAX_FRASES = { whatsapp: 3, redes: 4, anuncio: 2, ficha: 5 };
  var STRUCT_LABELS = ['Pregunta al público', 'Presentación', 'Invitación directa', 'Para quién es', 'Beneficio primero', 'Propuesta y oferta'];

  function buildCtx(d) {
    var item = d.item, pub = low(d.publico);
    var ctx = { tipo: d.tipo, tono: d.tono, canal: d.canal, objetivo: d.objetivo, p: low(item), P: cap(item), pub: pub,
      ben: d.beneficio, dif: d.diferenciador, ofe: d.oferta };
    ctx.benS = ctx.ben ? sentence(cap(ctx.ben)) : '';
    ctx.difS = ctx.dif ? sentence(cap(ctx.dif)) : '';
    ctx.benV = ctx.ben ? [ctx.benS] : [];
    ctx.difV = ctx.dif ? [ctx.difS, sentence('Lo que nos distingue: ' + low(ctx.dif)), sentence('Además: ' + low(ctx.dif))] : [];
    ctx.ofeS = ctx.ofe ? 'Oferta: ' + sentence(low(ctx.ofe)) : '';
    return ctx;
  }
  // Cada estructura devuelve { t: titular, parts: [{s, k}] , greet }; k = 'dato' (lo escribió la persona), 'relleno' o 'cierre'.
  function structure(i, ctx, rng) {
    var L = LEX[ctx.tono], T = ctx.tipo;
    function F(arr) { return fill(pick(rng, arr), ctx); }
    function part(s, k) { return s ? { s: s, k: k } : null; }
    var data = function (s) { return part(s, 'dato'); };
    function V3(arr, fallback) { return arr && arr.length ? pick(rng, arr) : fallback; }
    var benX = function () { return data(V3(ctx.benV, '')); }, difX = function () { return data(V3(ctx.difV, '')); };
    var rel = function (s) { return part(s, 'relleno'); };
    var cierre = function () { return part(F(L.invite[T]), 'cierre'); };
    var t, parts, greet = true;
    switch (i) {
      case 0: // pregunta al público
        t = F(L.q[T]);
        parts = [rel(F(L.intro[T])), rel(F(L.forPub[T])), benX(), difX(), data(ctx.ofeS), cierre()];
        break;
      case 1: // presentación
        greet = false;
        if (ctx.ben) { t = ctx.P + ': ' + ctx.ben; parts = [rel(F(L.forPub[T])), difX(), data(ctx.ofeS), cierre()]; }
        else if (ctx.dif) { t = ctx.P + ': ' + ctx.dif; parts = [rel(F(L.forPub[T])), data(ctx.ofeS), rel(pick(rng, L.bridge)), cierre()]; }
        else { t = ctx.P + ' para ' + ctx.pub; parts = [rel(F(L.intro[T])), data(ctx.ofeS), rel(pick(rng, L.bridge)), cierre()]; }
        break;
      case 2: // invitación directa
        t = F(L.imp[T]);
        parts = [rel(F(L.forPub[T])), benX(), difX(), data(ctx.ofeS), cierre()];
        break;
      case 3: // para quién es
        greet = false;
        t = 'Para ' + ctx.pub + ': ' + ctx.p;
        parts = [rel(F(L.intro[T])), benX(), difX(), data(ctx.ofeS), cierre()];
        break;
      case 4: // beneficio primero
        greet = false;
        if (ctx.ben) { t = cap(ctx.ben); parts = [rel(F(L.intro[T])), rel(F(L.forPub[T])), difX(), data(ctx.ofeS), cierre()]; }
        else if (ctx.dif) { t = cap(ctx.dif); parts = [rel(F(L.intro[T])), rel(F(L.forPub[T])), data(ctx.ofeS), cierre()]; }
        else { greet = true; t = F(L.hook5); parts = [rel(F(L.intro[T])), data(ctx.ofeS), rel(pick(rng, L.bridge)), cierre()]; }
        break;
      default: // propuesta y oferta
        greet = false;
        if (ctx.ofe) { t = ctx.P + ': ' + low(ctx.ofe); parts = [rel(F(L.forPub[T])), benX(), difX(), cierre()]; }
        else { greet = true; t = F(L.hook6); parts = [rel(F(L.intro[T])), rel(F(L.forPub[T])), benX(), difX(), cierre()]; }
    }
    return { t: t, parts: parts.filter(Boolean), greet: greet };
  }

  function compose(i, ctx, rng) {
    var st = structure(i, ctx, rng);
    var max = MAX_FRASES[ctx.canal];
    var parts = st.parts.slice();
    function drop(kind) { for (var k = parts.length - 1; k >= 0; k--) { if (parts[k].k === kind) { parts.splice(k, 1); return true; } } return false; }
    var cta = makeCta(ctx, rng), ctaKey = clean(cta).toLowerCase();
    parts = parts.filter(function (p) { return !(p.k === 'cierre' && (ctx.objetivo === 'contacto' || clean(p.s).toLowerCase() === ctaKey)); });
    while (parts.length > max) { if (!drop('relleno') && !drop('cierre')) break; }
    // sin frases repetidas
    var seen = {}; parts = parts.filter(function (p) { var key = p.s.toLowerCase(); if (seen[key]) return false; seen[key] = 1; return true; });
    var titular = st.t.replace(/[.,;:]+$/, '');
    if (ctx.canal === 'whatsapp' && st.greet && (ctx.tono === 'profesional' || ctx.tono === 'cercano')) titular = 'Hola, ' + (titular.charAt(0) === '¿' ? '¿' + low(titular.slice(1)) : low(titular));
    return { estructura: i, etiqueta: STRUCT_LABELS[i], titular: titular, texto: parts.map(function (p) { return p.s; }).join(' '), cta: cta };
  }

  // ===================== Selección de conjuntos =====================
  var N = STRUCT_LABELS.length;
  function allSets() { var out = []; for (var a = 0; a < N; a++) for (var b = a + 1; b < N; b++) for (var c = b + 1; c < N; c++) out.push([a, b, c]); return out; }
  // history: claves de los últimos conjuntos mostrados; se excluyen y se prefieren los que menos repiten estructuras.
  function chooseSet(history, rng) {
    var hist = (history || []).slice(-2), last = hist.length ? hist[hist.length - 1].split(',').map(Number) : [];
    var sets = allSets().filter(function (s) { return hist.indexOf(s.join(',')) < 0; });
    var best = -1, pool = [];
    sets.forEach(function (s) { var fresh = s.filter(function (x) { return last.indexOf(x) < 0; }).length; if (fresh > best) { best = fresh; pool = [s]; } else if (fresh === best) pool.push(s); });
    return pool[Math.floor(rng() * pool.length) % pool.length];
  }

  // generate(raw, { rng, history }) → { ok, errors, propuestas, clave }
  function generate(raw, opts) {
    opts = opts || {};
    var rng = opts.rng || Math.random;
    var n = normalize(raw);
    if (!n.ok) return { ok: false, errors: n.errors, propuestas: [], clave: '' };
    var ctx = buildCtx(n.data);
    var set = chooseSet(opts.history, rng);
    var props = set.map(function (i) { return compose(i, ctx, rng); });
    return { ok: true, errors: {}, propuestas: props, clave: set.join(','), canal: ctx.canal, longitud: LONGITUD[ctx.canal] };
  }

  var engine = { generate: generate, normalize: normalize, chooseSet: chooseSet, CANALES: CANALES, OBJETIVOS: OBJETIVOS, TONOS: TONOS, LONGITUD: LONGITUD, STRUCT_LABELS: STRUCT_LABELS, STRUCTURES_PER_TONE: N };

  if (typeof module === 'object' && module.exports) { module.exports = engine; return; }
  window.TPLab = window.TPLab || {};
  window.TPLab.generadorEngine = engine;

  // ===================== Interfaz =====================
  function init() {
    var form = document.getElementById('labForm');
    var Core = window.TPLab;
    if (!form || !Core || !Core.el) return;
    var el = Core.el;

    var tipoRadios = [].slice.call(form.querySelectorAll('input[name="tipo"]'));
    var f = {
      item: document.getElementById('labProducto'), publico: document.getElementById('labPublico'),
      beneficio: document.getElementById('labBeneficio'), diferenciador: document.getElementById('labDiferenciador'), oferta: document.getElementById('labOferta'),
      canal: document.getElementById('labCanal'), objetivo: document.getElementById('labObjetivo'), tono: document.getElementById('labTono')
    };
    var errEls = {};
    ['item', 'publico', 'beneficio', 'diferenciador', 'oferta'].forEach(function (k) { errEls[k] = document.getElementById('labErr-' + k); });
    var message = document.getElementById('labFormMessage');
    var results = document.getElementById('labResults');
    var emptyState = document.getElementById('labResultsEmpty');
    var actions = document.getElementById('labRegenerateWrap');
    var regenerateBtn = document.getElementById('labRegenerateBtn');
    var clearBtn = document.getElementById('labClearBtn');
    var itemLabel = document.getElementById('labItemLabel');
    var itemHint = document.getElementById('labItemHint');
    var history = [];

    var TEXTOS = {
      producto: { label: '¿Qué producto vendes?', ph: 'Ej. Audífonos inalámbricos con cancelación de ruido', hint: 'Escribe el nombre del producto, como lo diría un cliente.' },
      servicio: { label: '¿Qué servicio ofreces?', ph: 'Ej. Clases particulares de matemáticas', hint: 'Escribe el servicio, como lo diría un cliente.' }
    };
    function tipo() { var r = tipoRadios.filter(function (x) { return x.checked; })[0]; return r ? r.value : 'producto'; }
    function applyTipo() { var t = TEXTOS[tipo()]; itemLabel.textContent = t.label; f.item.placeholder = t.ph; itemHint.textContent = t.hint; }
    tipoRadios.forEach(function (r) { r.addEventListener('change', applyTipo); });
    applyTipo();

    function raw() {
      return { tipo: tipo(), item: f.item.value, publico: f.publico.value, beneficio: f.beneficio.value, diferenciador: f.diferenciador.value, oferta: f.oferta.value, canal: f.canal.value, objetivo: f.objetivo.value, tono: f.tono.value };
    }
    function showErrors(errors) {
      var first = null;
      ['item', 'publico', 'beneficio', 'diferenciador', 'oferta'].forEach(function (k) {
        if (errors[k]) { Core.setError(f[k], errEls[k], errors[k]); if (!first) first = f[k]; }
        else Core.clearError(f[k], errEls[k]);
      });
      return first;
    }
    ['item', 'publico', 'beneficio', 'diferenciador', 'oferta'].forEach(function (k) {
      f[k].addEventListener('input', function () { if (f[k].getAttribute('aria-invalid') === 'true') { var e = normalize(raw()).errors; if (!e[k]) Core.clearError(f[k], errEls[k]); } });
    });

    // ---- Tarjeta de resultado editable ----
    function renderCard(p, i, longitud) {
      var card = el('article', 'card lab-result');
      var head = el('div', 'lab-result-meta');
      head.appendChild(el('span', 'case-label', 'Propuesta ' + String(i + 1).padStart(2, '0')));
      head.appendChild(el('span', 'case-label', p.etiqueta));
      card.appendChild(head);
      var id = 'labR' + i;

      function field(kind, labelText, value, rows) {
        var wrap = el('div', 'lab-result-field');
        var lab = el('label', 'lab-result-label', labelText); lab.setAttribute('for', id + kind);
        var inp = rows ? el('textarea', 'lab-edit') : el('input', 'lab-edit');
        if (rows) inp.rows = rows; else inp.type = 'text';
        inp.id = id + kind; inp.value = value;
        wrap.appendChild(lab); wrap.appendChild(inp);
        return { wrap: wrap, input: inp };
      }
      var tit = field('T', 'Titular', p.titular);
      var txt = field('X', 'Texto principal', p.texto, 4);
      var cta = field('C', 'Llamado a la acción', p.cta);
      var counter = el('p', 'lab-counter'); counter.id = id + 'N';
      txt.input.setAttribute('aria-describedby', counter.id);
      function fit() { txt.input.style.height = 'auto'; txt.input.style.height = Math.min(txt.input.scrollHeight + 2, 320) + 'px'; }
      function count() {
        var n = txt.input.value.length;
        counter.textContent = n + ' caracteres · referencia para este canal: hasta ' + longitud + (n > longitud ? ' (te pasas por ' + (n - longitud) + ')' : '');
        counter.classList.toggle('is-over', n > longitud);
        fit();
      }
      txt.input.addEventListener('input', count);
      txt.wrap.appendChild(counter);
      card.appendChild(tit.wrap); card.appendChild(txt.wrap); card.appendChild(cta.wrap);

      var status = el('span', 'lab-copy-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      var bar = el('div', 'lab-result-actions');
      function btn(text, aria, getText, primary) {
        var b = el('button', (primary ? 'btn-primary' : 'btn-secondary') + ' btn-small', text); b.type = 'button';
        b.setAttribute('aria-label', aria + ' de la propuesta ' + String(i + 1).padStart(2, '0'));
        b.addEventListener('click', function () { Core.copy(getText(), status, 'Copiado: ' + aria.toLowerCase().replace('copiar ', '')); });
        return b;
      }
      bar.appendChild(btn('Copiar anuncio completo', 'Copiar anuncio completo', function () { return [tit.input.value, txt.input.value, cta.input.value].filter(function (x) { return x.trim(); }).join('\n\n'); }, true));
      bar.appendChild(btn('Titular', 'Copiar titular', function () { return tit.input.value; }));
      bar.appendChild(btn('Texto', 'Copiar texto principal', function () { return txt.input.value; }));
      bar.appendChild(btn('Llamado', 'Copiar llamado a la acción', function () { return cta.input.value; }));
      bar.appendChild(status);
      card.appendChild(bar);
      results.appendChild(card);
      count();
      return card;
    }

    function render(res) {
      results.textContent = '';
      res.propuestas.forEach(function (p, i) { renderCard(p, i, res.longitud); });
      var tip = el('p', 'lab-tip', 'Edita lo que necesites, agrega datos reales (precio, ubicación, condiciones) y revisa el texto antes de publicarlo. Son borradores, no resultados garantizados.');
      results.appendChild(tip);
      if (actions) actions.hidden = false;
      document.querySelectorAll('#labResults textarea.lab-edit').forEach(function (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 320) + 'px'; });
    }

    function run(isRegen) {
      var res = generate(raw(), { history: history });
      if (!res.ok) {
        var first = showErrors(res.errors);
        message.textContent = 'Revisa los campos marcados para generar tus propuestas.';
        if (first) first.focus();
        return;
      }
      showErrors({});
      message.textContent = '';
      history.push(res.clave); if (history.length > 6) history.shift();
      render(res);
      Core.announce(res.propuestas.length + ' propuestas ' + (isRegen ? 'nuevas ' : '') + 'generadas.');
      results.scrollIntoView({ behavior: Core.reduced() ? 'auto' : 'smooth', block: 'start' });
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); history = []; run(false); });
    if (regenerateBtn) regenerateBtn.addEventListener('click', function () { run(true); });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      form.reset(); applyTipo(); history = [];
      showErrors({}); message.textContent = '';
      results.textContent = '';
      if (emptyState) { results.appendChild(emptyState); emptyState.hidden = false; }
      if (actions) actions.hidden = true;
      f.item.focus();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

// TextoPro Lab — Generador de enlaces de WhatsApp (js/lab-whatsapp.js)
// Arma un enlace https://wa.me/<número>?text=<mensaje> en el navegador. No envía mensajes, no contacta a nadie
// y no guarda ni transmite lo que escribes: el enlace solo se abre si tú pulsas «Abrir enlace».
(function () {
  'use strict';

  var MIN_DIGITS = 8, MAX_DIGITS = 15;   // formato internacional E.164: hasta 15 dígitos con código de país
  var MAX_URL = 2000;                    // referencia prudente de longitud para enlaces compartidos

  // Quita solo separadores y símbolos de formato (espacios, guiones, puntos, paréntesis y un «+» inicial).
  // No agrega, quita ni cambia dígitos.
  function normalizePhone(raw) {
    var s = String(raw == null ? '' : raw).replace(/[  ]/g, ' ').trim();
    if (!s) return { ok: false, error: 'vacio', message: 'Escribe el número de teléfono con código de país.' };
    var hadPlus = s.charAt(0) === '+';
    var body = hadPlus ? s.slice(1) : s;
    if (/[^\d\s().\-]/.test(body)) return { ok: false, error: 'caracteres', message: 'El número solo puede tener dígitos, espacios, guiones, puntos o paréntesis (y un + al inicio).' };
    var digits = body.replace(/[\s().\-]/g, '');
    if (!digits) return { ok: false, error: 'vacio', message: 'Escribe el número de teléfono con código de país.' };
    if (digits.charAt(0) === '0') return { ok: false, error: 'cero', message: 'El número no debe empezar con 0: empieza con el código de país (por ejemplo 52 para México).' };
    if (digits.length < MIN_DIGITS) return { ok: false, error: 'corto', message: 'Faltan dígitos: incluye el código de país y el número completo (mínimo ' + MIN_DIGITS + ' dígitos).' };
    if (digits.length > MAX_DIGITS) return { ok: false, error: 'largo', message: 'Hay demasiados dígitos: el máximo es ' + MAX_DIGITS + ' contando el código de país.' };
    return { ok: true, digits: digits };
  }

  function encodeMessage(msg) {
    return encodeURIComponent(String(msg == null ? '' : msg).replace(/\r\n?/g, '\n').trim());
  }

  function buildLink(rawPhone, msg) {
    var p = normalizePhone(rawPhone);
    if (!p.ok) return { ok: false, error: p.error, message: p.message };
    var text = encodeMessage(msg);
    var url = 'https://wa.me/' + p.digits + (text ? '?text=' + text : '');
    return { ok: true, digits: p.digits, url: url, hasMessage: !!text, long: url.length > MAX_URL };
  }

  var api = { normalizePhone: normalizePhone, encodeMessage: encodeMessage, buildLink: buildLink, MIN_DIGITS: MIN_DIGITS, MAX_DIGITS: MAX_DIGITS };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  window.TPLab = window.TPLab || {};
  window.TPLab.whatsappEngine = api;

  // ===================== Interfaz =====================
  function init() {
    var Core = window.TPLab;
    var root = document.getElementById('whatsapp');
    if (!root || !Core || !Core.el) return;
    var $ = function (id) { return document.getElementById(id); };
    var phone = $('waTel'), msg = $('waMsg'), err = $('waErr-tel');
    var linkBox = $('waLink'), openBtn = $('waOpen'), copyBtn = $('waCopy'), status = $('waCopyStatus');
    var preview = $('waPreview'), previewWrap = $('waPreviewWrap'), empty = $('waEmpty'), out = $('waOut'), count = $('waCount'), warn = $('waWarn');
    var form = $('waForm'), clearBtn = $('waLimpiar'), exBtn = $('waEjemplo');
    var current = null;

    // level: 0 = mientras escribe, 1 = al salir del campo, 2 = al pulsar «Generar enlace» (lleva el foco al número si hay error).
    function render(level) {
      level = level || 0;
      var any = phone.value.trim() !== '' || msg.value.trim() !== '';
      count.textContent = msg.value.length + ' caracteres';
      if (!any && level < 2) { out.hidden = true; empty.hidden = false; Core.clearError(phone, err); current = null; return; }
      var r = buildLink(phone.value, msg.value);
      if (!r.ok) {
        // Mientras la persona aún escribe el número, no se marca error por «vacío» o «corto»; los errores claros sí.
        if (level >= 1 || r.error === 'caracteres' || r.error === 'cero' || r.error === 'largo') Core.setError(phone, err, r.message); else Core.clearError(phone, err);
        out.hidden = true; empty.hidden = false; current = null;
        openBtn.setAttribute('href', '#'); openBtn.setAttribute('aria-disabled', 'true');
        if (level >= 2) phone.focus();
        return;
      }
      Core.clearError(phone, err);
      current = r;
      empty.hidden = true; out.hidden = false;
      linkBox.value = r.url;
      openBtn.href = r.url; openBtn.removeAttribute('aria-disabled');
      previewWrap.hidden = !r.hasMessage;
      preview.textContent = decodeURIComponent(encodeMessage(msg.value));
      warn.hidden = !r.long;
      if (r.long) warn.textContent = 'El enlace es muy largo (' + r.url.length + ' caracteres). Acorta el mensaje: algunos sitios y apps recortan los enlaces extensos.';
    }
    phone.addEventListener('input', function () { render(0); });
    // Sin validación al salir del campo: un mensaje que aparece al hacer clic en «Generar enlace» movería el botón y se perdería el clic.
    msg.addEventListener('input', function () { render(0); });
    form.addEventListener('submit', function (e) { e.preventDefault(); render(2); if (current) Core.announce('Enlace generado.'); });
    copyBtn.addEventListener('click', function () { if (!current) { render(2); return; } Core.copy(current.url, status, 'Enlace copiado'); });
    clearBtn.addEventListener('click', function () { phone.value = ''; msg.value = ''; render(0); phone.focus(); });
    exBtn.addEventListener('click', function () { phone.value = '52 998 123 4567'; msg.value = 'Hola, quiero información sobre sus servicios.'; render(0); Core.announce('Ejemplo cargado. Cambia el número por el tuyo.'); });
    openBtn.addEventListener('click', function (e) { if (!current) e.preventDefault(); });
    render(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

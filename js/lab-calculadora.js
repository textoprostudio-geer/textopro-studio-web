// TextoPro Lab — Calculadora de precio y margen (js/lab-calculadora.js)
// Estimación con los datos que escribe la persona. No usa tarifas oficiales de ninguna plataforma, no consulta
// la red y no equivale a una utilidad contable o fiscal. El cálculo se hace en centavos enteros para que lo que
// se muestra siempre cuadre (la suma de las partes es exactamente el total).
(function () {
  'use strict';

  // ===================== Lectura de números =====================
  // Acepta «1234.50», «1,234.50», «1.234,50», «1234,50», «12,5», con espacios o símbolo de moneda.
  // Devuelve { ok, value } o { ok:false, error:'vacio'|'formato' }.
  function parseNumber(raw) {
    var s = String(raw == null ? '' : raw).replace(/[\s $€£%]/g, '').replace(/^(MXN|USD|EUR|COP|ARS|CLP|PEN|BRL)/i, '');
    if (!s) return { ok: false, error: 'vacio' };
    if (!/^[-+]?[\d.,]+$/.test(s)) return { ok: false, error: 'formato' };
    var sign = 1;
    if (s.charAt(0) === '-') { sign = -1; s = s.slice(1); } else if (s.charAt(0) === '+') s = s.slice(1);
    if (!s || !/\d/.test(s)) return { ok: false, error: 'formato' };
    var lastDot = s.lastIndexOf('.'), lastComma = s.lastIndexOf(',');
    var dec = '';
    if (lastDot >= 0 && lastComma >= 0) dec = lastDot > lastComma ? '.' : ',';
    else if (lastComma >= 0) dec = /^\d{1,3}(,\d{3})+$/.test(s) ? '' : ',';   // «1,234» = miles; «12,5» = decimal
    else if (lastDot >= 0) dec = /^\d{1,3}(\.\d{3})+$/.test(s) && (s.match(/\./g) || []).length > 1 ? '' : '.';
    var intPart = s, fracPart = '';
    if (dec) {
      var i = s.lastIndexOf(dec);
      intPart = s.slice(0, i); fracPart = s.slice(i + 1);
      if (/[.,]/.test(fracPart)) return { ok: false, error: 'formato' };
      // La parte entera solo puede traer el otro símbolo como separador de miles bien agrupado (1,234 o 1.234).
      if (/[.,]/.test(intPart) && !(dec === '.' ? /^\d{1,3}(,\d{3})+$/ : /^\d{1,3}(\.\d{3})+$/).test(intPart)) return { ok: false, error: 'formato' };
    }
    intPart = intPart.replace(/[.,]/g, '');
    if (!/^\d*$/.test(intPart) || !/^\d*$/.test(fracPart)) return { ok: false, error: 'formato' };
    var n = parseFloat((intPart || '0') + (fracPart ? '.' + fracPart : ''));
    return isFinite(n) ? { ok: true, value: sign * n } : { ok: false, error: 'formato' };
  }

  // ===================== Cálculo =====================
  function cents(x) { return Math.round(x * 100 + 1e-7); }                 // dinero → centavos enteros
  function pctOf(priceC, pct) { return Math.round(priceC * pct / 100 + 1e-7); } // centavos del porcentaje, redondeo al centavo
  function profitAt(priceC, k) { return priceC - k.fixedC - pctOf(priceC, k.com) - pctOf(priceC, k.pub) - pctOf(priceC, k.otr); }

  // Menor precio (en centavos) cuya ganancia es ≥ margen·precio, con el mismo redondeo que el resultado mostrado.
  function minPriceC(k, marginPct) {
    var s = (k.com + k.pub + k.otr + marginPct) / 100;
    if (s >= 1) return null;
    var c = Math.max(0, Math.ceil(k.fixedC / (1 - s) - 1e-7));
    function ok(p) { return p > 0 ? profitAt(p, k) * 100 >= marginPct * p - 1e-7 : k.fixedC === 0; }
    while (!ok(c)) c++;
    while (c > 0 && ok(c - 1)) c--;
    return c;
  }

  // Valida y calcula. in: { costo, envio, comision, publicidad, otros, precio, margenObjetivo } como texto o número.
  function calculate(input) {
    var errors = {}, v = {};
    var spec = {
      costo: { req: true, min: 0, label: 'El costo del producto' }, envio: { req: false, min: 0, label: 'El envío y otros costos' },
      comision: { req: false, pct: true, label: 'La comisión' }, publicidad: { req: false, pct: true, label: 'La publicidad' },
      otros: { req: false, pct: true, label: 'Otros gastos' }, precio: { req: true, gt0: true, label: 'El precio de venta' },
      margenObjetivo: { req: false, pct: true, label: 'El margen objetivo' }
    };
    Object.keys(spec).forEach(function (key) {
      var sp = spec[key], raw = input[key];
      var r = typeof raw === 'number' ? { ok: isFinite(raw), value: raw, error: 'formato' } : parseNumber(raw);
      if (!r.ok) {
        if (r.error === 'vacio') { if (sp.req) errors[key] = sp.label + ' es obligatorio.'; else v[key] = 0; }
        else errors[key] = sp.label + ' debe ser un número (por ejemplo 149.90).';
        return;
      }
      if (r.value < 0) { errors[key] = sp.label + ' no puede ser negativo.'; return; }
      if (sp.gt0 && !(r.value > 0)) { errors[key] = sp.label + ' debe ser mayor que 0.'; return; }
      if (sp.pct && r.value >= 100) { errors[key] = sp.label + ' debe ser menor que 100 %.'; return; }
      if (r.value > 1e9) { errors[key] = sp.label + ' es demasiado grande.'; return; }
      v[key] = r.value;
    });
    if (Object.keys(errors).length) return { ok: false, errors: errors };
    var sum = v.comision + v.publicidad + v.otros;
    if (sum >= 100) {
      errors.comision = 'Comisión, publicidad y otros gastos suman ' + (Math.round(sum * 100) / 100) + ' %: con 100 % o más ninguna venta deja ganancia. Revisa los porcentajes.';
      return { ok: false, errors: errors };
    }
    var k = { fixedC: cents(v.costo) + cents(v.envio), com: v.comision, pub: v.publicidad, otr: v.otros };
    var priceC = cents(v.precio);
    var comC = pctOf(priceC, k.com), pubC = pctOf(priceC, k.pub), otrC = pctOf(priceC, k.otr);
    var pctC = comC + pubC + otrC, totalC = k.fixedC + pctC, profitC = priceC - totalC;
    // Equilibrio: menor precio con ganancia ≥ 0.
    var be = Math.max(0, Math.ceil(k.fixedC / (1 - sum / 100) - 1e-7));
    while (profitAt(be, k) < 0) be++;
    while (be > 0 && profitAt(be - 1, k) >= 0) be--;
    var minC = minPriceC(k, v.margenObjetivo);
    return {
      ok: true, errors: {}, values: v,
      cents: { costo: cents(v.costo), envio: cents(v.envio), fixed: k.fixedC, comision: comC, publicidad: pubC, otros: otrC, pct: pctC, total: totalC, price: priceC, profit: profitC, equilibrio: be, minimo: minC },
      margen: profitC / priceC * 100,                       // sobre el precio de venta
      markup: totalC > 0 ? profitC / totalC * 100 : null,   // sobre el costo total por unidad
      margenObjetivo: v.margenObjetivo,
      minimoPosible: minC !== null
    };
  }

  var api = { parseNumber: parseNumber, calculate: calculate, minPriceC: minPriceC, cents: cents };
  if (typeof module === 'object' && module.exports) { module.exports = api; return; }
  window.TPLab = window.TPLab || {};
  window.TPLab.calculadoraEngine = api;

  // ===================== Interfaz =====================
  var EJEMPLO = { costo: '200', envio: '40', comision: '15', publicidad: '8', otros: '2', precio: '450', margenObjetivo: '25' };
  var KEYS = ['costo', 'envio', 'comision', 'publicidad', 'otros', 'precio', 'margenObjetivo'];

  function init() {
    var root = document.getElementById('calculadora');
    var Core = window.TPLab;
    if (!root || !Core || !Core.el) return;
    var $ = function (id) { return document.getElementById(id); };
    var f = {}, err = {};
    KEYS.forEach(function (k) { f[k] = $('calc-' + k); err[k] = $('calcErr-' + k); });
    var moneda = $('calc-moneda');
    var out = $('calcOut'), empty = $('calcEmpty'), summary = $('calcSummary'), live = $('calcLive');
    var btnEj = $('calcEjemplo'), btnLimpiar = $('calcLimpiar');

    function money(c) {
      try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda.value }).format(c / 100); }
      catch (e) { return (c / 100).toFixed(2) + ' ' + moneda.value; }
    }
    function pct(x) { return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(x) + ' %'; }
    function set(id, text) { var e = $(id); if (e) e.textContent = text; }

    function readAll() { var o = {}; KEYS.forEach(function (k) { o[k] = f[k].value; }); return o; }
    function anyFilled() { return KEYS.some(function (k) { return f[k].value.trim() !== ''; }); }

    function update(opts) {
      opts = opts || {};
      if (!anyFilled()) { out.hidden = true; empty.hidden = false; KEYS.forEach(function (k) { Core.clearError(f[k], err[k]); }); return null; }
      var r = calculate(readAll());
      KEYS.forEach(function (k) { if (r.errors && r.errors[k]) Core.setError(f[k], err[k], r.errors[k]); else Core.clearError(f[k], err[k]); });
      // Mientras se escribe, no se marca como error un campo obligatorio aún vacío (solo con «Calcular»).
      if (!r.ok) {
        if (!opts.strict) KEYS.forEach(function (k) { if (r.errors[k] && f[k].value.trim() === '') Core.clearError(f[k], err[k]); });
        out.hidden = true; empty.hidden = false;
        var first = KEYS.filter(function (k) { return r.errors[k]; })[0];
        if (opts.strict && first) f[first].focus();
        return r;
      }
      empty.hidden = true; out.hidden = false;
      var c = r.cents;
      set('calcFijos', money(c.fixed));
      set('calcFijosDetalle', 'Costo ' + money(c.costo) + ' + envío y otros ' + money(c.envio));
      set('calcCom', money(c.comision)); set('calcPub', money(c.publicidad)); set('calcOtros', money(c.otros));
      set('calcPctTotal', money(c.pct));
      set('calcGanancia', money(c.profit));
      $('calcGananciaLabel').textContent = c.profit < 0 ? 'Pérdida estimada por unidad' : 'Ganancia estimada por unidad';
      $('calcGananciaTile').classList.toggle('is-negative', c.profit < 0);
      set('calcMargen', pct(r.margen));
      set('calcMarkup', r.markup === null ? 'No aplica (costo total 0)' : pct(r.markup));
      set('calcEquilibrio', money(c.equilibrio));
      var objTxt = pct(r.margenObjetivo);
      set('calcObjLabel', 'Precio mínimo para ' + objTxt + ' de margen');
      if (r.minimoPosible) { set('calcMinimo', money(c.minimo)); set('calcMinimoNota', c.price >= c.minimo ? 'Tu precio actual (' + money(c.price) + ') lo alcanza.' : 'Tu precio actual (' + money(c.price) + ') queda ' + money(c.minimo - c.price) + ' por debajo.'); }
      else { set('calcMinimo', 'No existe'); set('calcMinimoNota', 'Con esos porcentajes y ese margen objetivo suman 100 % o más: ningún precio lo alcanza. Baja la comisión, la publicidad, otros gastos o el margen objetivo.'); }
      summary.textContent = (c.profit < 0 ? 'Con este precio pierdes ' + money(-c.profit) : 'Con este precio ganas ' + money(c.profit)) + ' por unidad, un margen de ' + pct(r.margen) + ' sobre el precio de venta.';
      if (opts.announce) Core.announce('Resultado actualizado. ' + summary.textContent);
      return r;
    }

    KEYS.forEach(function (k) { f[k].addEventListener('input', function () { update(); }); });
    moneda.addEventListener('change', function () { update(); });
    $('calcForm').addEventListener('submit', function (e) { e.preventDefault(); update({ strict: true, announce: true }); });
    btnEj.addEventListener('click', function () { KEYS.forEach(function (k) { f[k].value = EJEMPLO[k]; }); moneda.value = 'MXN'; update({ announce: true }); f.costo.focus(); });
    btnLimpiar.addEventListener('click', function () { KEYS.forEach(function (k) { f[k].value = ''; Core.clearError(f[k], err[k]); }); moneda.value = 'MXN'; update(); f.costo.focus(); });
    update();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

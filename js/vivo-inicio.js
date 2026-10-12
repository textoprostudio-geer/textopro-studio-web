// TextoPro Studio — vivo-inicio.js · Tecnología Viva en Inicio
// Hero (nodos + red animada), franja de capacidades y panel de soluciones.
// Requiere vivo-base.js. Sin dependencias ni llamadas externas: el HTML ya es completo
// y este script solo añade interacción.

(function () {
  'use strict';

  var scene = document.getElementById('heroScene');
  if (!scene) return;

  var stage = scene.querySelector('.hero-stage');
  var canvas = scene.querySelector('.hero-net');
  var photo = scene.querySelector('.hero-photo');
  var nodes = [].slice.call(scene.querySelectorAll('.hero-node'));
  var infos = [].slice.call(scene.querySelectorAll('.hero-info li'));
  var pauseBtn = scene.querySelector('.hero-pause');
  if (!stage || !nodes.length) return;

  var V = window.TPVivo;
  if (!V) return;
  var coarseMq = window.matchMedia ? window.matchMedia('(pointer: coarse)') : null;
  var reduce = V.reduced();
  var userPaused = false;
  var inView = true;
  var active = 0;
  var ripple = null; // onda que sale del nodo recién seleccionado

  var P = nodes.map(function (n) {
    return { x: parseFloat(n.getAttribute('data-x')) / 100, y: parseFloat(n.getAttribute('data-y')) / 100 };
  });

  // ===== Panel: nodo activo =====
  scene.classList.add('is-live');

  function setActive(i) {
    if (i !== active) ripple = { node: i, t: 0 };
    active = i;
    nodes.forEach(function (n, k) { n.classList.toggle('is-active', k === i); });
    var key = nodes[i].getAttribute('data-node');
    infos.forEach(function (li) { li.classList.toggle('is-active', li.getAttribute('data-for') === key); });
    scene.style.setProperty('--nx', (P[i].x * 100).toFixed(1) + '%');
    if (ctx && !running) draw(t);
  }

  nodes.forEach(function (n, i) {
    // Ratón: al pasar por encima. Teclado: al enfocar. Ambos solo muestran la explicación.
    n.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') setActive(i); });
    n.addEventListener('focus', function () { setActive(i); });
    // Táctil: el primer toque muestra la explicación; el segundo (o el enlace del panel) abre la página.
    n.addEventListener('pointerdown', function (e) { n._first = e.pointerType === 'touch' && i !== active; });
    n.addEventListener('click', function (e) {
      if (n._first) { e.preventDefault(); n._first = false; setActive(i); }
    });
  });

  // ===== Red animada (canvas) =====
  var ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) {
    setActive(0);
    if (pauseBtn) pauseBtn.hidden = true;
    return;
  }
  scene.classList.add('has-canvas');

  var EDGES = [[0, 1], [1, 3], [3, 2], [2, 0], [1, 2]];
  var RING = [0, 1, 3, 2];
  var phase = EDGES.map(function (_, k) { return [(k * 0.37) % 1, (k * 0.37 + 0.5) % 1]; });

  var W = 1, H = 1, dpr = 1, ambient = [], ambientCount = 0, mouse = null;
  var tx = 0, ty = 0, px = 0, py = 0; // paralaje de la foto (-1..1)
  var sig = { seg: 0, p: 0 };          // cometa de señal sobre el anillo

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildAmbient(count) {
    var r = rng(7);
    ambient = [];
    for (var i = 0; i < count; i++) {
      ambient.push({ x: r(), y: r(), vx: (r() - 0.5) * 0.012, vy: (r() - 0.5) * 0.012 });
    }
    ambientCount = count;
  }

  function resize() {
    var rect = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(rect.width));
    H = Math.max(1, Math.round(rect.height));
    var cap = coarseMq && coarseMq.matches ? 1.5 : 2;
    dpr = Math.min(window.devicePixelRatio || 1, cap);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var want = W < 480 ? 11 : 18;
    if (want !== ambientCount) buildAmbient(want);
    draw(t);
  }

  function step(dt) {
    var i, a;
    for (i = 0; i < ambient.length; i++) {
      a = ambient[i];
      a.x += a.vx * dt; a.y += a.vy * dt;
      if (a.x < 0 || a.x > 1) { a.vx = -a.vx; a.x = Math.min(1, Math.max(0, a.x)); }
      if (a.y < 0 || a.y > 1) { a.vy = -a.vy; a.y = Math.min(1, Math.max(0, a.y)); }
    }
    // Paralaje suave de la foto (solo ratón)
    var k = Math.min(1, dt * 4);
    px += (tx - px) * k; py += (ty - py) * k;
    if (photo && (Math.abs(tx - px) > 0.002 || Math.abs(ty - py) > 0.002)) {
      photo.style.transform = 'translate3d(' + (-px * 8).toFixed(2) + 'px,' + (-py * 6).toFixed(2) + 'px,0)';
    }
    // Cometa: recorre el anillo y activa el pulso del nodo al llegar
    sig.p += dt * 0.4;
    if (sig.p >= 1) {
      sig.p = 0;
      pulse(RING[(sig.seg + 1) % RING.length]);
      sig.seg = (sig.seg + 1) % RING.length;
    }
    if (ripple) { ripple.t += dt; if (ripple.t > 0.9) ripple = null; }
  }

  function pulse(idx) {
    var n = nodes[idx];
    n.classList.add('is-pulse');
    setTimeout(function () { n.classList.remove('is-pulse'); }, 1200);
  }

  function dot(x, y, r, alpha) {
    ctx.fillStyle = 'rgba(110,231,255,' + alpha + ')';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }

  function draw(time) {
    var i, j, k, a, b, dx, dy, d;
    ctx.clearRect(0, 0, W, H);

    // Luz de acento sobre el nodo activo (la escena se "ilumina" donde miras)
    var ax = P[active].x * W, ay = P[active].y * H;
    var lg = ctx.createRadialGradient(ax, ay, 0, ax, ay, Math.max(90, W * 0.28));
    lg.addColorStop(0, 'rgba(50,177,255,0.22)');
    lg.addColorStop(1, 'rgba(50,177,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);

    // Haz de luz del nodo activo hacia el panel de información
    var bg = ctx.createLinearGradient(0, ay, 0, H);
    bg.addColorStop(0, 'rgba(110,231,255,0.42)');
    bg.addColorStop(1, 'rgba(110,231,255,0)');
    ctx.strokeStyle = bg; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay + 22); ctx.lineTo(ax, H); ctx.stroke();

    // Halos suaves tras cada nodo
    for (i = 0; i < P.length; i++) {
      var on = i === active;
      dot(P[i].x * W, P[i].y * H, on ? 30 : 22, on ? 0.10 : 0.05);
      dot(P[i].x * W, P[i].y * H, on ? 16 : 11, on ? 0.12 : 0.06);
    }

    // Onda al seleccionar un nodo
    if (ripple) {
      var rp = ripple.t / 0.9;
      ctx.strokeStyle = 'rgba(110,231,255,' + ((1 - rp) * 0.55).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(P[ripple.node].x * W, P[ripple.node].y * H, 18 + rp * 46, 0, 6.2832); ctx.stroke();
    }

    // Constelación ambiental
    ctx.lineWidth = 1;
    var maxD = Math.max(60, W * 0.2);
    for (i = 0; i < ambient.length; i++) {
      a = ambient[i];
      for (j = i + 1; j < ambient.length; j++) {
        b = ambient[j];
        dx = (a.x - b.x) * W; dy = (a.y - b.y) * H; d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxD) {
          ctx.strokeStyle = 'rgba(110,231,255,' + ((1 - d / maxD) * 0.16).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H); ctx.stroke();
        }
      }
      dot(a.x * W, a.y * H, 1.5, 0.45);
    }

    // Líneas entre nodos y partículas de flujo
    var perEdge = W < 480 ? 1 : 2;
    for (k = 0; k < EDGES.length; k++) {
      a = P[EDGES[k][0]]; b = P[EDGES[k][1]];
      var hot = EDGES[k][0] === active || EDGES[k][1] === active;
      ctx.lineWidth = hot ? 1.7 : 1.1;
      ctx.strokeStyle = hot ? 'rgba(110,231,255,0.62)' : 'rgba(110,231,255,0.26)';
      ctx.beginPath(); ctx.moveTo(a.x * W, a.y * H); ctx.lineTo(b.x * W, b.y * H); ctx.stroke();
      for (j = 0; j < perEdge; j++) {
        var s = (phase[k][j] + time * (hot ? 0.17 : 0.09)) % 1;
        if (j % 2) s = 1 - s;
        for (var tr = 0; tr < 4; tr++) {
          var u = j % 2 ? Math.min(1, s + tr * 0.012) : Math.max(0, s - tr * 0.012);
          dot((a.x + (b.x - a.x) * u) * W, (a.y + (b.y - a.y) * u) * H, (hot ? 2.6 : 2.1) - tr * 0.35, (hot ? 0.95 : 0.7) - tr * 0.2);
        }
      }
    }

    // Cometa de señal sobre el anillo (solo en movimiento)
    if (running) {
      var ea = P[RING[sig.seg]], eb = P[RING[(sig.seg + 1) % RING.length]];
      for (var c = 0; c < 9; c++) {
        var uc = Math.max(0, sig.p - c * 0.022);
        dot((ea.x + (eb.x - ea.x) * uc) * W, (ea.y + (eb.y - ea.y) * uc) * H, 3.4 - c * 0.3, (0.95 - c * 0.1).toFixed(2));
      }
    }

    // Reacción al puntero (solo ratón)
    if (mouse) {
      for (i = 0; i < ambient.length; i++) {
        dx = ambient[i].x * W - mouse.x; dy = ambient[i].y * H - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          ctx.strokeStyle = 'rgba(110,231,255,' + ((1 - d / 130) * 0.4).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(mouse.x, mouse.y); ctx.lineTo(ambient[i].x * W, ambient[i].y * H); ctx.stroke();
        }
      }
      dot(mouse.x, mouse.y, 3, 0.5);
    }
  }

  // ===== Bucle (con todas las condiciones de pausa) =====
  var t = 0, last = 0, raf = 0, running = false;
  var minFrame = coarseMq && coarseMq.matches ? 33 : 16;

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (now - last < minFrame) return;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now; t += dt;
    step(dt); draw(t);
  }

  function sync() {
    var should = !reduce && !userPaused && inView && !document.hidden;
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); draw(t); }
    if (pauseBtn) pauseBtn.hidden = reduce;
  }

  if (pauseBtn) {
    V.bindPause(pauseBtn, 'Pausar animación', 'Reanudar animación', function (p) {
      userPaused = p;
      scene.classList.toggle('is-paused', p);
      sync();
    });
  }

  V.onReducedChange(function () {
    reduce = V.reduced();
    if (reduce && photo) photo.style.transform = '';
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  V.whenVisible(stage, function (v) { inView = v; sync(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = stage.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    tx = (mouse.x / r.width - 0.5) * 2; ty = (mouse.y / r.height - 0.5) * 2;
  });
  stage.addEventListener('pointerleave', function () { mouse = null; tx = 0; ty = 0; });

  setActive(0);
  resize();
  sync();
})();

// ===== Franja de capacidades =====
// Sin JS (o con movimiento reducido) las capacidades se ven como una lista estática.
// Con JS se convierten en una franja continua que se puede pausar.
(function () {
  'use strict';

  var strip = document.querySelector('.cap-strip');
  if (!strip) return;
  var track = strip.querySelector('.cap-track');
  var btn = strip.querySelector('.cap-pause');
  if (!track) return;

  var V = window.TPVivo;
  if (!V) return;
  var clones = [];

  function onPause(p) { strip.classList.toggle('is-paused', p); }
  var setPaused = btn ? V.bindPause(btn, 'Pausar franja de capacidades', 'Reanudar franja de capacidades', onPause) : onPause;

  function enable() {
    if (strip.classList.contains('is-marquee')) return;
    [].slice.call(track.children).forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
      clones.push(c);
    });
    strip.classList.add('is-marquee');
    if (btn) btn.hidden = false;
  }

  function disable() {
    clones.forEach(function (c) { if (c.parentNode) c.parentNode.removeChild(c); });
    clones = [];
    strip.classList.remove('is-marquee');
    setPaused(false);
    if (btn) btn.hidden = true;
  }

  function apply() { if (V.reduced()) disable(); else enable(); }

  V.onReducedChange(apply);
  V.whenVisible(strip, function (v) { strip.classList.toggle('is-offscreen', !v); });
  apply();
})();

// ===== Panel de soluciones: pestañas + flechas (sin avance automático) =====
(function () {
  'use strict';

  var root = document.getElementById('solCarousel');
  if (!root) return;
  var wrap = root.querySelector('.sol-panels');
  var panels = [].slice.call(root.querySelectorAll('.sol-panel'));
  if (!wrap || panels.length < 2) return;

  var V = window.TPVivo;
  if (!V) return;
  var el = V.el;

  var bar = el('div', 'sol-bar');
  var tablist = el('div', 'sol-tabs');
  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Soluciones de TextoPro Studio');
  var arrows = el('div', 'sol-arrows');
  var prev = el('button', 'sol-arrow', '←');
  var next = el('button', 'sol-arrow', '→');
  var count = el('span', 'sol-count');
  var status = el('span', 'sr-only');
  prev.type = 'button'; next.type = 'button';
  prev.setAttribute('aria-label', 'Solución anterior');
  next.setAttribute('aria-label', 'Solución siguiente');
  count.setAttribute('aria-hidden', 'true');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  var tabs = panels.map(function (p, i) {
    var t = el('button', 'sol-tab', p.getAttribute('data-title') || ('Solución ' + (i + 1)));
    t.type = 'button';
    t.id = 'sol-tab-' + (i + 1);
    p.id = p.id || 'sol-panel-' + (i + 1);
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', p.id);
    t.setAttribute('aria-selected', 'false');
    t.tabIndex = -1;
    p.setAttribute('role', 'tabpanel');
    p.setAttribute('aria-labelledby', t.id);
    tablist.appendChild(t);
    return t;
  });

  arrows.appendChild(prev); arrows.appendChild(count); arrows.appendChild(next);
  bar.appendChild(tablist); bar.appendChild(arrows); bar.appendChild(status);
  root.insertBefore(bar, wrap);
  root.classList.add('is-live');

  var current = -1;
  function select(i, announce) {
    i = (i + panels.length) % panels.length;
    if (i === current) return;
    current = i;
    panels.forEach(function (p, k) {
      var on = k === i;
      p.hidden = !on;
      p.classList.toggle('is-entering', on);
      if (on) setTimeout(function () { p.classList.remove('is-entering'); }, 450);
    });
    tabs.forEach(function (t, k) {
      t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      t.tabIndex = k === i ? 0 : -1;
    });
    count.textContent = (i + 1) + ' / ' + panels.length;
    if (announce) status.textContent = 'Solución ' + (i + 1) + ' de ' + panels.length + ': ' + tabs[i].textContent;
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i, true); });
    t.addEventListener('keydown', function (e) {
      var to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = i - 1;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = panels.length - 1;
      if (to === null) return;
      e.preventDefault();
      to = (to + panels.length) % panels.length;
      select(to, true);
      tabs[to].focus();
    });
  });
  prev.addEventListener('click', function () { select(current - 1, true); });
  next.addEventListener('click', function () { select(current + 1, true); });

  select(0, false);
})();

// TextoPro Studio — main.js

// Links de compra de guías (PayPal)
const GUIDE_PAY_LINKS = {
  amazon: "https://www.paypal.com/ncp/payment/CDRNK3KXF96DC",
  mercado: "https://www.paypal.com/ncp/payment/CWP8V3V2987QN",
  mundial: "https://www.paypal.com/ncp/payment/UQR6HXDVN8T2E"
};

function initGuidePayLinks() {
  document.querySelectorAll('[data-guide]').forEach((btn) => {
    const key = btn.getAttribute('data-guide');
    const url = GUIDE_PAY_LINKS[key];
    if (url && !url.startsWith("PEGA_AQUI")) {
      btn.setAttribute('href', url);
    } else {
      // Si no hay link, manda a contacto para cerrar por WhatsApp/correo
      btn.setAttribute('href', '#contacto');
      btn.removeAttribute('target');
      btn.removeAttribute('rel');
    }
  });
}

// Navegación móvil
function initMobileNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  const backdrop = document.getElementById('navBackdrop');
  if (!toggle || !nav) return;

  const closeNav = () => {
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menú');
    if (backdrop) backdrop.classList.remove('is-visible');
  };

  const openNav = () => {
    nav.classList.add('is-open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar menú');
    if (backdrop) backdrop.classList.add('is-visible');
  };

  toggle.addEventListener('click', () => {
    nav.classList.contains('is-open') ? closeNav() : openNav();
  });

  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeNav));
  if (backdrop) backdrop.addEventListener('click', closeNav);
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.classList.contains('is-open')) return;
    closeNav();
    toggle.focus();
  });
}

// FAB único: WhatsApp + TextoPro AI (V1: solo estructura, TextoPro AI aún no funcional)
function initFab() {
  const fabToggle = document.getElementById('fabToggle');
  const fabMenu = document.getElementById('fabMenu');
  if (!fabToggle || !fabMenu) return;

  const closeFab = () => {
    fabMenu.classList.remove('is-open');
    fabMenu.setAttribute('aria-hidden', 'true');
    fabToggle.setAttribute('aria-expanded', 'false');
    fabToggle.setAttribute('aria-label', 'Abrir opciones de contacto');
  };

  const openFab = () => {
    fabMenu.classList.add('is-open');
    fabMenu.setAttribute('aria-hidden', 'false');
    fabToggle.setAttribute('aria-expanded', 'true');
    fabToggle.setAttribute('aria-label', 'Cerrar opciones de contacto');
  };

  fabToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    fabMenu.classList.contains('is-open') ? closeFab() : openFab();
  });

  document.addEventListener('click', (e) => {
    if (!fabMenu.classList.contains('is-open')) return;
    if (!fabMenu.contains(e.target) && e.target !== fabToggle) closeFab();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !fabMenu.classList.contains('is-open')) return;
    closeFab();
    fabToggle.focus();
  });
}

// Reveal-on-scroll (Fase 1) — respeta prefers-reduced-motion
function initRevealOnScroll() {
  const items = document.querySelectorAll('[data-reveal]');
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach((el) => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
  initGuidePayLinks();
  initMobileNav();
  initFab();
  initRevealOnScroll();
});

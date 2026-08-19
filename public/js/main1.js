/**
 * MediCare Plus — Simple UI helpers only
 * (mobile menu, theme, sticky header, scroll-top, accordion, page loader)
 * No dynamic data rendering — pages are static HTML for backend integration.
 */
(function () {
  'use strict';

  const THEME_KEY = 'medicare_theme';

  function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    setTimeout(function () {
      loader.classList.add('hidden');
      setTimeout(function () {
        loader.remove();
      }, 400);
    }, 300);
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    document.querySelectorAll('.theme-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem(THEME_KEY, next);
        updateThemeIcon(next);
      });
    });
  }

  function updateThemeIcon(theme) {
    document.querySelectorAll('.theme-toggle i').forEach(function (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    });
  }

  function initStickyHeader() {
    const header = document.getElementById('main-header') || document.querySelector('.site-header');
    if (!header) return;
    window.addEventListener(
      'scroll',
      function () {
        header.classList.toggle('scrolled', window.scrollY > 20);
      },
      { passive: true }
    );
  }

  function initMobileNav() {
    const nav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-overlay');
    const openBtn = document.getElementById('mobile-nav-open');
    const closeBtn = document.getElementById('mobile-nav-close');
    if (!nav) return;

    function open() {
      nav.classList.add('open');
      if (overlay) overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      nav.classList.remove('open');
      if (overlay) overlay.classList.remove('show');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
  }

  function initScrollTop() {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;
    window.addEventListener(
      'scroll',
      function () {
        btn.classList.toggle('show', window.scrollY > 400);
      },
      { passive: true }
    );
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const item = btn.closest('.accordion-item');
        if (!item) return;
        const open = item.classList.contains('open');
        const root = item.parentElement;
        if (root) {
          root.querySelectorAll('.accordion-item.open').forEach(function (el) {
            el.classList.remove('open');
          });
        }
        if (!open) item.classList.add('open');
      });
    });
  }

  function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
      const buttons = wrap.querySelectorAll('[data-tab]');
      const panels = wrap.querySelectorAll('[data-tab-panel]');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const id = btn.getAttribute('data-tab');
          buttons.forEach(function (b) {
            b.classList.remove('active');
          });
          panels.forEach(function (p) {
            p.classList.remove('active');
            p.hidden = true;
          });
          btn.classList.add('active');
          const panel = wrap.querySelector('[data-tab-panel="' + id + '"]');
          if (panel) {
            panel.classList.add('active');
            panel.hidden = false;
          }
        });
      });
    });
  }

  function initPasswordToggle() {
    document.querySelectorAll('[data-toggle-password]').forEach(function (icon) {
      icon.addEventListener('click', function () {
        const id = icon.getAttribute('data-toggle-password');
        const input = document.getElementById(id);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        icon.classList.toggle('fa-eye', !show);
        icon.classList.toggle('fa-eye-slash', show);
      });
    });
  }

  function initSidebarToggle() {
    const layout = document.querySelector('.dashboard-layout');
    const toggle = document.querySelector('[data-sidebar-toggle], #sidebar-toggle');
    const overlay = document.querySelector('.sidebar-overlay');
    if (!layout || !toggle) return;

    toggle.addEventListener('click', function () {
      if (window.innerWidth <= 992) {
        layout.classList.toggle('sidebar-open');
        if (overlay) overlay.classList.toggle('show');
      } else {
        layout.classList.toggle('sidebar-collapsed');
      }
    });
    if (overlay) {
      overlay.addEventListener('click', function () {
        layout.classList.remove('sidebar-open');
        overlay.classList.remove('show');
      });
    }
  }

  function initDropdowns() {
    document.querySelectorAll('.dropdown').forEach(function (dd) {
      const trigger = dd.querySelector('[data-dropdown], .dropdown-toggle');
      if (!trigger) return;
      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        document.querySelectorAll('.dropdown.open').forEach(function (other) {
          if (other !== dd) other.classList.remove('open');
        });
        dd.classList.toggle('open');
      });
    });
    document.addEventListener('click', function () {
      document.querySelectorAll('.dropdown.open').forEach(function (dd) {
        dd.classList.remove('open');
      });
    });
  }

  function initSwipers() {
    if (typeof Swiper === 'undefined') return;

    if (document.querySelector('.hero-swiper')) {
      new Swiper('.hero-swiper', {
        loop: true,
        speed: 800,
        autoplay: { delay: 5000, disableOnInteraction: false },
        effect: 'fade',
        fadeEffect: { crossFade: true },
        pagination: { el: '.hero-swiper .swiper-pagination', clickable: true },
        navigation: {
          nextEl: '.hero-swiper .swiper-button-next',
          prevEl: '.hero-swiper .swiper-button-prev',
        },
      });
    }

    if (document.querySelector('.doctors-swiper')) {
      new Swiper('.doctors-swiper', {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        autoplay: { delay: 4500, disableOnInteraction: false },
        pagination: { el: '.doctors-swiper .swiper-pagination', clickable: true },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 3 },
          1200: { slidesPerView: 4 },
        },
      });
    }

    if (document.querySelector('.testimonials-swiper')) {
      new Swiper('.testimonials-swiper', {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        autoplay: { delay: 5500, disableOnInteraction: false },
        pagination: { el: '.testimonials-swiper .swiper-pagination', clickable: true },
        breakpoints: {
          768: { slidesPerView: 2 },
          1100: { slidesPerView: 3 },
        },
      });
    }
  }

  function initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 700, once: true, offset: 60 });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    hideLoader();
    initTheme();
    initStickyHeader();
    initMobileNav();
    initScrollTop();
    initAccordion();
    initTabs();
    initPasswordToggle();
    initSidebarToggle();
    initDropdowns();
    initSwipers();
    initAOS();
  });
})();

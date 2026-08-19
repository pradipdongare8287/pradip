/**
 * MediCare Plus — Reusable UI Components & Helpers
 * Sticky header/footer, toasts, modals, theme, AOS, Swiper, etc.
 *
 * Public pages:  basePath = '' or './'
 * Panel pages:   basePath = '../'
 */
(function (global) {
  'use strict';

  /* ================================================================== */
  /*  Base path detection                                               */
  /* ================================================================== */

  /**
   * Detect relative prefix for assets/links based on current URL path.
   * Nested panels (customer/doctor/admin) → '../'
   * Deeper nesting → '../../'
   * Root public pages → ''
   */
  function detectBasePath() {
    if (typeof window === 'undefined') return '';
    const path = window.location.pathname.replace(/\\/g, '/');

    // Match .../customer/... or .../doctor/... or .../admin/...
    const panelMatch = path.match(/\/(customer|doctor|admin)(\/|$)/i);
    if (panelMatch) {
      // Count segments after the panel folder
      const after = path.split(new RegExp(`/${panelMatch[1]}/`, 'i'))[1] || '';
      const depth = after.split('/').filter(Boolean).length;
      // One level under panel folder → ../ ; two levels → ../../
      if (depth <= 1) return '../';
      return '../'.repeat(depth);
    }

    // pages/ subfolder on public site
    if (/\/pages\//i.test(path)) return '../';

    return '';
  }

  function normalizeBase(basePath) {
    if (basePath == null || basePath === '') return '';
    if (basePath === './') return '';
    return basePath.endsWith('/') ? basePath : basePath + '/';
  }

  /* ================================================================== */
  /*  Formatters                                                        */
  /* ================================================================== */

  function formatDate(dateInput, options) {
    if (!dateInput) return '';
    const d =
      typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)
        ? new Date(dateInput + 'T12:00:00')
        : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return String(dateInput);

    const opts = options || {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return d.toLocaleDateString('en-US', opts);
  }

  function formatCurrency(amount, currency) {
    const n = Number(amount);
    if (Number.isNaN(n)) return String(amount);
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
        maximumFractionDigits: 0,
      }).format(n);
    } catch {
      return `$${n.toFixed(0)}`;
    }
  }

  function formatTime(time24) {
    if (!time24) return '';
    const [h, m] = String(time24).split(':').map(Number);
    if (Number.isNaN(h)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${period}`;
  }

  /**
   * Status → badge HTML matching components.css classes
   */
  function getStatusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    const map = {
      pending: 'badge-pending',
      approved: 'badge-approved',
      completed: 'badge-completed',
      cancelled: 'badge-cancelled',
      canceled: 'badge-cancelled',
      active: 'badge-success',
      inactive: 'badge-danger',
      success: 'badge-success',
      error: 'badge-danger',
      warning: 'badge-warning',
      info: 'badge-info',
    };
    const cls = map[s] || 'badge-primary';
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    return `<span class="badge ${cls}">${label}</span>`;
  }

  /* ================================================================== */
  /*  Toast                                                             */
  /* ================================================================== */

  function ensureToastContainer() {
    let el = document.querySelector('.toast-container');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast-container';
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * @param {string} message
   * @param {'success'|'error'|'warning'|'info'} type
   * @param {number} duration ms
   */
  function showToast(message, type, duration) {
    const container = ensureToastContainer();
    const t = type || 'info';
    const toast = document.createElement('div');
    toast.className = `toast ${t}`;
    toast.setAttribute('role', 'status');

    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info',
    };

    toast.innerHTML = `
      <i class="fa-solid ${icons[t] || icons.info}"></i>
      <span>${message}</span>
      <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
    `;

    container.appendChild(toast);

    const remove = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 280);
    };

    toast.querySelector('.toast-close')?.addEventListener('click', remove);
    setTimeout(remove, duration || 4000);
    return toast;
  }

  /* ================================================================== */
  /*  Modal                                                             */
  /* ================================================================== */

  function ensureModalBackdrop() {
    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';
      document.body.appendChild(backdrop);
      backdrop.addEventListener('click', () => closeModal());
    }
    return backdrop;
  }

  /**
   * Open a modal by id or element. Optionally set title/body.
   */
  function openModal(idOrEl, options) {
    const modal =
      typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
    if (!modal) return;

    const opts = options || {};
    if (opts.title) {
      const h = modal.querySelector('.modal-header h3, .modal-title');
      if (h) h.textContent = opts.title;
    }
    if (opts.body != null) {
      const body = modal.querySelector('.modal-body');
      if (body) {
        if (opts.html) body.innerHTML = opts.body;
        else body.textContent = opts.body;
      }
    }

    ensureModalBackdrop().classList.add('show');
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    modal.querySelectorAll('[data-modal-close]').forEach((btn) => {
      btn.onclick = () => closeModal(modal);
    });
  }

  function closeModal(idOrEl) {
    const modals = idOrEl
      ? [
          typeof idOrEl === 'string'
            ? document.getElementById(idOrEl)
            : idOrEl,
        ]
      : Array.from(document.querySelectorAll('.modal.show'));

    modals.forEach((modal) => {
      if (!modal) return;
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    });

    if (!document.querySelector('.modal.show')) {
      document.querySelector('.modal-backdrop')?.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  /* ================================================================== */
  /*  Accordion / Tabs / Counters                                       */
  /* ================================================================== */

  function initAccordion(root) {
    const scope = root || document;
    scope.querySelectorAll('.accordion').forEach((accordion) => {
      accordion.querySelectorAll('.accordion-header').forEach((header) => {
        header.addEventListener('click', () => {
          const item = header.closest('.accordion-item');
          if (!item) return;
          const allowMulti = accordion.hasAttribute('data-multi');
          if (!allowMulti) {
            accordion.querySelectorAll('.accordion-item.open').forEach((openItem) => {
              if (openItem !== item) openItem.classList.remove('open');
            });
          }
          item.classList.toggle('open');
        });
      });
    });
  }

  function initTabs(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-tabs]').forEach((tabsRoot) => {
      const triggers = tabsRoot.querySelectorAll('[data-tab]');
      const panels = tabsRoot.querySelectorAll('[data-tab-panel]');

      triggers.forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-tab');
          triggers.forEach((t) => t.classList.remove('active'));
          panels.forEach((p) => {
            const match = p.getAttribute('data-tab-panel') === id;
            p.classList.toggle('active', match);
            p.hidden = !match;
          });
          btn.classList.add('active');
        });
      });

      // Activate first if none active
      if (!tabsRoot.querySelector('[data-tab].active') && triggers[0]) {
        triggers[0].click();
      }
    });
  }

  function initCounters(root) {
    const scope = root || document;
    const counters = scope.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const animate = (el) => {
      if (el.dataset.counted === '1') return;
      el.dataset.counted = '1';
      const target = Number(el.getAttribute('data-counter')) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const prefix = el.getAttribute('data-prefix') || '';
      const duration = Number(el.getAttribute('data-duration')) || 1600;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * target);
        el.textContent = `${prefix}${value.toLocaleString()}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
      };
      requestAnimationFrame(tick);
    };

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animate(entry.target);
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => io.observe(el));
    } else {
      counters.forEach(animate);
    }
  }

  /* ================================================================== */
  /*  Theme toggle                                                      */
  /* ================================================================== */

  const THEME_KEY = 'medicare_theme';

  function applyTheme(theme) {
    const t = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const icon = btn.querySelector('i');
      if (icon) {
        icon.className =
          t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
      }
      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function initThemeToggle() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));

    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    });
  }

  /* ================================================================== */
  /*  Page loader / scroll top                                          */
  /* ================================================================== */

  function initPageLoader() {
    const loader = document.querySelector('.page-loader');
    if (!loader) return;

    const hide = () => loader.classList.add('hidden');
    if (document.readyState === 'complete') {
      setTimeout(hide, 300);
    } else {
      window.addEventListener('load', () => setTimeout(hide, 300));
    }
    // Failsafe
    setTimeout(hide, 4000);
  }

  function initScrollTop() {
    const btn = document.querySelector('.scroll-top, [data-scroll-top]');
    if (!btn) return;

    const onScroll = () => {
      if (window.scrollY > 400) btn.classList.add('show');
      else btn.classList.remove('show');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================================================================== */
  /*  AOS / Swiper                                                      */
  /* ================================================================== */

  function initAOS() {
    if (typeof AOS === 'undefined') return;
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 60,
      disable: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    });
  }

  function initHeroSwiper(selector) {
    if (typeof Swiper === 'undefined') return null;
    const el = document.querySelector(selector || '.hero-swiper');
    if (!el) return null;

    return new Swiper(el, {
      loop: true,
      speed: 800,
      autoplay: { delay: 5000, disableOnInteraction: false },
      effect: 'fade',
      fadeEffect: { crossFade: true },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        nextEl: el.querySelector('.swiper-button-next'),
        prevEl: el.querySelector('.swiper-button-prev'),
      },
    });
  }

  function initDoctorsSwiper(selector) {
    if (typeof Swiper === 'undefined') return null;
    const el = document.querySelector(selector || '.doctors-swiper');
    if (!el) return null;

    return new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 4500, disableOnInteraction: false },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
        clickable: true,
      },
      navigation: {
        nextEl: el.querySelector('.swiper-button-next'),
        prevEl: el.querySelector('.swiper-button-prev'),
      },
      breakpoints: {
        576: { slidesPerView: 2 },
        992: { slidesPerView: 3 },
        1200: { slidesPerView: 4 },
      },
    });
  }

  function initTestimonialsSwiper(selector) {
    if (typeof Swiper === 'undefined') return null;
    const el = document.querySelector(selector || '.testimonials-swiper');
    if (!el) return null;

    return new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      autoplay: { delay: 5500, disableOnInteraction: false },
      pagination: {
        el: el.querySelector('.swiper-pagination'),
        clickable: true,
      },
      breakpoints: {
        768: { slidesPerView: 2 },
        1100: { slidesPerView: 3 },
      },
    });
  }

  /* ================================================================== */
  /*  Header / Footer / Floating buttons                                */
  /* ================================================================== */

  function getHospital() {
    return (global.MediCareData && global.MediCareData.hospital) || {
      name: 'MediCare Plus',
      phone: '+1 (800) 555-0147',
      emergency: '108 / +1-800-911-HELP',
      email: 'info@medicareplus.com',
      address: '1250 Healing Way, Suite 100, Health City, HC 90210',
      hours: { display: 'Mon–Fri 8AM–8PM · Sat 9AM–5PM' },
    };
  }

  function getDepartments() {
    return (global.MediCareData && global.MediCareData.departments) || [];
  }

  function navActive(activePage, page) {
    return activePage === page ? ' active' : '';
  }

  /**
   * Inject sticky public header into #site-header
   * @param {string} activePage - home|about|departments|doctors|services|blog|contact|appointment|...
   * @param {string} basePath
   */
  function renderHeader(activePage, basePath) {
    const mount = document.getElementById('site-header');
    if (!mount) return;

    const base = normalizeBase(basePath != null ? basePath : detectBasePath());
    const h = getHospital();
    const depts = getDepartments().slice(0, 6);
    const user =
      global.MediCareAuth && typeof global.MediCareAuth.getCurrentUser === 'function'
        ? global.MediCareAuth.getCurrentUser()
        : null;

    const authLink = user
      ? `<a href="${base}${user.role === 'admin' ? 'admin' : user.role === 'doctor' ? 'doctor' : 'customer'}/dashboard.html" class="btn btn-primary btn-sm">
           <i class="fa-solid fa-gauge-high"></i> Dashboard
         </a>`
      : `<a href="${base}login.html" class="btn btn-outline btn-sm">Login</a>
         <a href="${base}appointment.html" class="btn btn-primary btn-sm">
           <i class="fa-solid fa-calendar-check"></i> Book
         </a>`;

    mount.innerHTML = `
      <header class="site-header" id="main-header">
        <div class="container header-inner">
          <a href="${base}index.html" class="logo" aria-label="${h.name} home">
            <span class="logo-icon"><i class="fa-solid fa-hospital"></i></span>
            <span>
              <span class="logo-text">Medi<span>Care</span> Plus</span>
              <span class="logo-tagline">${h.tagline || 'Compassion. Excellence. Care.'}</span>
            </span>
          </a>

          <nav class="nav-main" aria-label="Primary">
            <a class="nav-link${navActive(activePage, 'home')}" href="${base}index.html">Home</a>
            <a class="nav-link${navActive(activePage, 'about')}" href="${base}about.html">About</a>
            <div class="nav-item has-mega">
              <a class="nav-link${navActive(activePage, 'departments')}" href="${base}departments.html">
                Departments <i class="fa-solid fa-chevron-down" style="font-size:0.65rem"></i>
              </a>
              <div class="mega-menu">
                <div class="mega-col">
                  <h5>Specialties</h5>
                  ${depts
                    .slice(0, 3)
                    .map(
                      (d) => `
                    <a class="mega-link" href="${base}departments.html#${d.id}">
                      <i class="${d.icon}"></i><span>${d.name}</span>
                    </a>`
                    )
                    .join('')}
                </div>
                <div class="mega-col">
                  <h5>More Care</h5>
                  ${depts
                    .slice(3, 6)
                    .map(
                      (d) => `
                    <a class="mega-link" href="${base}departments.html#${d.id}">
                      <i class="${d.icon}"></i><span>${d.name}</span>
                    </a>`
                    )
                    .join('')}
                </div>
                <div class="mega-col">
                  <h5>Quick Links</h5>
                  <a class="mega-link" href="${base}doctors.html"><i class="fa-solid fa-user-doctor"></i><span>Find a Doctor</span></a>
                  <a class="mega-link" href="${base}services.html"><i class="fa-solid fa-stethoscope"></i><span>Treatments</span></a>
                  <a class="mega-link" href="${base}appointment.html"><i class="fa-solid fa-calendar-plus"></i><span>Book Visit</span></a>
                </div>
              </div>
            </div>
            <a class="nav-link${navActive(activePage, 'doctors')}" href="${base}doctors.html">Doctors</a>
            <a class="nav-link${navActive(activePage, 'services')}" href="${base}services.html">Services</a>
            <a class="nav-link${navActive(activePage, 'blog')}" href="${base}blog.html">Blog</a>
            <a class="nav-link${navActive(activePage, 'contact')}" href="${base}contact.html">Contact</a>
          </nav>

          <div class="header-actions">
            <button type="button" class="theme-toggle" aria-label="Toggle theme">
              <i class="fa-solid fa-moon"></i>
            </button>
            ${authLink}
            <button type="button" class="mobile-toggle" id="mobile-nav-open" aria-label="Open menu">
              <i class="fa-solid fa-bars"></i>
            </button>
          </div>
        </div>
      </header>

      <div class="mobile-overlay" id="mobile-overlay"></div>
      <aside class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
        <div class="mobile-nav-header">
          <span class="logo-text">Medi<span>Care</span> Plus</span>
          <button type="button" id="mobile-nav-close" aria-label="Close menu">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <a class="nav-link" href="${base}index.html">Home</a>
        <a class="nav-link" href="${base}about.html">About</a>
        <a class="nav-link" href="${base}departments.html">Departments</a>
        <a class="nav-link" href="${base}doctors.html">Doctors</a>
        <a class="nav-link" href="${base}services.html">Services</a>
        <a class="nav-link" href="${base}blog.html">Blog</a>
        <a class="nav-link" href="${base}gallery.html">Gallery</a>
        <a class="nav-link" href="${base}pricing.html">Pricing</a>
        <a class="nav-link" href="${base}faq.html">FAQ</a>
        <a class="nav-link" href="${base}contact.html">Contact</a>
        <a class="nav-link" href="${base}appointment.html">Book Appointment</a>
        <a class="nav-link" href="${base}login.html">Login / Register</a>
      </aside>
    `;

    // Sticky shadow on scroll
    const header = mount.querySelector('.site-header');
    const onScroll = () => {
      if (!header) return;
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    initMobileNav();
    // Re-bind theme on newly injected toggle
    const themeBtn = mount.querySelector('.theme-toggle');
    if (themeBtn) {
      const saved = localStorage.getItem(THEME_KEY) || 'light';
      applyTheme(saved);
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  function initMobileNav() {
    const nav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('mobile-overlay');
    const openBtn = document.getElementById('mobile-nav-open');
    const closeBtn = document.getElementById('mobile-nav-close');
    if (!nav) return;

    const open = () => {
      nav.classList.add('open');
      overlay?.classList.add('show');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      nav.classList.remove('open');
      overlay?.classList.remove('show');
      document.body.style.overflow = '';
    };

    openBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', close);
  }

  /**
   * Inject footer into #site-footer
   */
  function renderFooter(basePath) {
    const mount = document.getElementById('site-footer');
    if (!mount) return;

    const base = normalizeBase(basePath != null ? basePath : detectBasePath());
    const h = getHospital();
    const year = new Date().getFullYear();

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand footer-col">
              <a href="${base}index.html" class="logo">
                <span class="logo-icon"><i class="fa-solid fa-hospital"></i></span>
                <span class="logo-text">Medi<span>Care</span> Plus</span>
              </a>
              <p>Trusted multi-specialty hospital delivering compassionate care with modern technology — offline demo powered by localStorage.</p>
              <div class="footer-contact-item">
                <i class="fa-solid fa-phone"></i>
                <span>${h.phone}<br>Emergency: ${h.emergency}</span>
              </div>
            </div>

            <div class="footer-col">
              <h4>Quick Links</h4>
              <div class="footer-links">
                <a href="${base}about.html"><i class="fa-solid fa-chevron-right"></i> About Us</a>
                <a href="${base}departments.html"><i class="fa-solid fa-chevron-right"></i> Departments</a>
                <a href="${base}doctors.html"><i class="fa-solid fa-chevron-right"></i> Our Doctors</a>
                <a href="${base}services.html"><i class="fa-solid fa-chevron-right"></i> Treatments</a>
                <a href="${base}appointment.html"><i class="fa-solid fa-chevron-right"></i> Book Appointment</a>
              </div>
            </div>

            <div class="footer-col">
              <h4>Support</h4>
              <div class="footer-links">
                <a href="${base}faq.html"><i class="fa-solid fa-chevron-right"></i> FAQs</a>
                <a href="${base}pricing.html"><i class="fa-solid fa-chevron-right"></i> Pricing Plans</a>
                <a href="${base}gallery.html"><i class="fa-solid fa-chevron-right"></i> Gallery</a>
                <a href="${base}contact.html"><i class="fa-solid fa-chevron-right"></i> Contact</a>
                <a href="${base}login.html"><i class="fa-solid fa-chevron-right"></i> Patient Login</a>
              </div>
            </div>

            <div class="footer-col">
              <h4>Newsletter</h4>
              <p style="color:rgba(255,255,255,0.65);font-size:0.9rem;margin-bottom:0.5rem;">
                Health tips &amp; hospital updates — no spam.
              </p>
              <form class="newsletter-form" id="newsletter-form" novalidate>
                <input type="email" name="email" placeholder="Your email" required aria-label="Email for newsletter" />
                <button type="submit" class="btn btn-secondary btn-sm">Join</button>
              </form>
              <div class="footer-contact-item" style="margin-top:1.25rem">
                <i class="fa-solid fa-location-dot"></i>
                <span>${h.address}</span>
              </div>
            </div>
          </div>

          <div class="footer-bottom">
            <span>&copy; ${year} ${h.name}. All rights reserved.</span>
            <div class="footer-legal">
              <a href="${base}privacy.html">Privacy</a>
              <a href="${base}terms.html">Terms</a>
              <a href="tel:${String(h.emergency).split('/')[0].trim()}">Emergency ${h.emergency}</a>
            </div>
          </div>
        </div>
      </footer>
    `;

    initNewsletterForm();
  }

  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('input[name="email"]')?.value?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast('Please enter a valid email address.', 'warning');
        return;
      }
      const list = JSON.parse(localStorage.getItem('medicare_newsletter') || '[]');
      if (!list.includes(email)) {
        list.push(email);
        localStorage.setItem('medicare_newsletter', JSON.stringify(list));
      }
      form.reset();
      showToast('Thanks for subscribing!', 'success');
    });
  }

  /**
   * Floating WhatsApp, emergency, appointment, scroll-top buttons
   */
  function renderFloatingButtons(basePath) {
    if (document.querySelector('.float-btns')) return;

    const base = normalizeBase(basePath != null ? basePath : detectBasePath());
    const h = getHospital();
    const phoneDigits = String(h.phone || '').replace(/\D/g, '');

    const wrap = document.createElement('div');
    wrap.className = 'float-btns';
    wrap.innerHTML = `
      <a href="tel:${String(h.emergency).includes('108') ? '108' : phoneDigits}"
         class="float-btn emergency-float" title="Emergency" aria-label="Call emergency">
        <i class="fa-solid fa-truck-medical"></i>
      </a>
      <a href="https://wa.me/${phoneDigits || '18005550147'}" target="_blank" rel="noopener"
         class="float-btn whatsapp" title="WhatsApp" aria-label="Chat on WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
      <a href="${base}appointment.html" class="float-btn appointment" title="Book appointment">
        <i class="fa-solid fa-calendar-check"></i>
        <span>Book</span>
      </a>
      <button type="button" class="float-btn scroll-top" data-scroll-top aria-label="Back to top">
        <i class="fa-solid fa-arrow-up"></i>
      </button>
    `;
    document.body.appendChild(wrap);
    initScrollTop();
  }

  /* ================================================================== */
  /*  Star rating helper                                                */
  /* ================================================================== */

  function renderStars(rating) {
    const r = Number(rating) || 0;
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    let html = '';
    for (let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
    if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
    const empty = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < empty; i++) html += '<i class="fa-regular fa-star"></i>';
    return `<span class="stars" aria-label="${r} out of 5">${html}</span>`;
  }

  /* ================================================================== */
  /*  Escape HTML                                                       */
  /* ================================================================== */

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ================================================================== */
  /*  Public API                                                        */
  /* ================================================================== */

  const MediCareComponents = {
    detectBasePath,
    normalizeBase,
    formatDate,
    formatCurrency,
    formatTime,
    getStatusBadge,
    showToast,
    openModal,
    closeModal,
    initAccordion,
    initTabs,
    initCounters,
    initThemeToggle,
    initPageLoader,
    initScrollTop,
    initAOS,
    initHeroSwiper,
    initDoctorsSwiper,
    initTestimonialsSwiper,
    initMobileNav,
    initNewsletterForm,
    renderHeader,
    renderFooter,
    renderFloatingButtons,
    renderStars,
    escapeHtml,
    applyTheme,
  };

  global.MediCareComponents = MediCareComponents;

  // Convenience aliases on a shared MediCare namespace (main.js also extends this)
  global.MediCare = global.MediCare || {};
  Object.assign(global.MediCare, MediCareComponents);

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareComponents;
  }
})(typeof window !== 'undefined' ? window : globalThis);

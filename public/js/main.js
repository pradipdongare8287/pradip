/**
 * MediCare Plus — Main Bootstrap
 * DOMContentLoaded entry point. Wires shared UI, forms, and exposes
 * the global MediCare namespace.
 *
 * Suggested script order on public pages:
 *   data.js → auth.js → components.js → appointment.js → dashboard.js → main.js
 *
 * Optional: set data-page on <body> for active nav, e.g. data-page="home"
 * Optional: set data-base-path on <html> or <body> to override path detection
 */
(function (global) {
  'use strict';

  const C = () => global.MediCareComponents || {};
  const Auth = () => global.MediCareAuth || {};
  const Appt = () => global.MediCareAppointment || {};
  const Dash = () => global.MediCareDashboard || {};
  const Data = () => global.MediCareData || {};

  /* ------------------------------------------------------------------ */
  /*  Resolve base path for this page                                   */
  /* ------------------------------------------------------------------ */
  function resolveBasePath() {
    const override =
      document.body?.getAttribute('data-base-path') ||
      document.documentElement?.getAttribute('data-base-path');
    if (override != null && override !== '') {
      return C().normalizeBase ? C().normalizeBase(override) : override;
    }
    if (C().detectBasePath) return C().detectBasePath();
    return '';
  }

  /* ------------------------------------------------------------------ */
  /*  Common form wiring                                                */
  /* ------------------------------------------------------------------ */

  function wireLoginForm() {
    const form = document.querySelector('[data-login-form], #login-form');
    if (!form || !Auth().login) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]')?.value?.trim();
      const password = form.querySelector('[name="password"]')?.value;
      const result = Auth().login(email, password);

      if (!result.success) {
        C().showToast?.(result.message, 'error');
        return;
      }

      C().showToast?.(result.message, 'success');

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const base = resolveBasePath();

      setTimeout(() => {
        if (redirect) {
          window.location.href = decodeURIComponent(redirect);
        } else {
          window.location.href = Auth().getDashboardPath(result.user.role, base);
        }
      }, 600);
    });
  }

  function wireRegisterForm() {
    const form = document.querySelector('[data-register-form], #register-form');
    if (!form || !Auth().register) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());

      if (data.password !== data.confirmPassword && data.confirmPassword != null) {
        C().showToast?.('Passwords do not match.', 'warning');
        return;
      }

      const result = Auth().register(data);
      if (!result.success) {
        C().showToast?.(result.message, 'error');
        return;
      }

      C().showToast?.(result.message, 'success');
      const base = resolveBasePath();
      setTimeout(() => {
        window.location.href = Auth().getDashboardPath(result.user.role, base);
      }, 600);
    });
  }

  function wireForgotPasswordForm() {
    const form = document.querySelector('[data-forgot-form], #forgot-form');
    if (!form || !Auth().requestPasswordReset) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]')?.value?.trim();
      const result = Auth().requestPasswordReset(email);
      C().showToast?.(result.message, result.success ? 'success' : 'error');

      if (result.success && result.token) {
        const tokenField = form.querySelector('[name="token"], #reset-token-display');
        if (tokenField) {
          if (tokenField.tagName === 'INPUT') tokenField.value = result.token;
          else tokenField.textContent = result.token;
        }
      }
    });
  }

  function wireResetPasswordForm() {
    const form = document.querySelector('[data-reset-form], #reset-form');
    if (!form || !Auth().resetPassword) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]')?.value?.trim();
      const token = form.querySelector('[name="token"]')?.value?.trim();
      const password = form.querySelector('[name="password"]')?.value;
      const result = Auth().resetPassword(email, token, password);
      C().showToast?.(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        setTimeout(() => {
          window.location.href = `${resolveBasePath()}login.html`;
        }, 800);
      }
    });
  }

  function wireContactForm() {
    const form = document.querySelector('[data-contact-form], #contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const entry = {
        id: `msg-${Date.now()}`,
        name: fd.get('name'),
        email: fd.get('email'),
        phone: fd.get('phone') || '',
        subject: fd.get('subject') || '',
        message: fd.get('message'),
        createdAt: new Date().toISOString(),
      };

      if (!entry.name || !entry.email || !entry.message) {
        C().showToast?.('Please fill in name, email, and message.', 'warning');
        return;
      }

      const inbox = JSON.parse(localStorage.getItem('medicare_messages') || '[]');
      inbox.unshift(entry);
      localStorage.setItem('medicare_messages', JSON.stringify(inbox));
      form.reset();
      C().showToast?.('Message sent! We will get back to you soon.', 'success');
    });
  }

  function wireProfileForm() {
    const form = document.querySelector('[data-profile-form], #profile-form');
    if (!form || !Auth().updateProfile) return;

    const user = Auth().getCurrentUser?.();
    if (user) {
      Object.keys(user).forEach((key) => {
        const input = form.querySelector(`[name="${key}"]`);
        if (input && user[key] != null) input.value = user[key];
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const result = Auth().updateProfile(data);
      C().showToast?.(result.message, result.success ? 'success' : 'error');
    });
  }

  function wireChangePasswordForm() {
    const form = document.querySelector(
      '[data-password-form], #change-password-form'
    );
    if (!form || !Auth().changePassword) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const oldPass = form.querySelector('[name="oldPassword"], [name="currentPassword"]')?.value;
      const newPass = form.querySelector('[name="newPassword"]')?.value;
      const confirm = form.querySelector('[name="confirmPassword"]')?.value;

      if (confirm != null && newPass !== confirm) {
        C().showToast?.('New passwords do not match.', 'warning');
        return;
      }

      const result = Auth().changePassword(oldPass, newPass);
      C().showToast?.(result.message, result.success ? 'success' : 'error');
      if (result.success) form.reset();
    });
  }

  function wireLogoutButtons() {
    document.querySelectorAll('[data-logout], .logout-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const base = resolveBasePath();
        const redirect =
          btn.getAttribute('data-logout') ||
          btn.getAttribute('href') ||
          `${base}login.html`;
        Auth().logout?.(redirect.startsWith('#') ? `${base}index.html` : redirect);
      });
    });
  }

  function wireSearchForms() {
    document.querySelectorAll('[data-site-search]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = form.querySelector('input[name="q"], input[type="search"]')?.value?.trim();
        if (!q) return;
        const base = resolveBasePath();
        window.location.href = `${base}search.html?q=${encodeURIComponent(q)}`;
      });
    });
  }

  function wireCommonForms() {
    wireLoginForm();
    wireRegisterForm();
    wireForgotPasswordForm();
    wireResetPasswordForm();
    wireContactForm();
    wireProfileForm();
    wireChangePasswordForm();
    wireLogoutButtons();
    wireSearchForms();
  }

  /* ------------------------------------------------------------------ */
  /*  Page-specific light enhancements                                  */
  /* ------------------------------------------------------------------ */

  function fillDynamicLists() {
    const data = Data();
    if (!data.doctors) return;

    // Doctor cards grid
    const doctorsGrid = document.querySelector('[data-doctors-grid]');
    if (doctorsGrid && !doctorsGrid.children.length) {
      const limit = Number(doctorsGrid.getAttribute('data-limit')) || 8;
      const list = data.doctors.slice(0, limit);
      const base = resolveBasePath();
      const stars = C().renderStars || (() => '');
      const currency = C().formatCurrency || ((n) => `$${n}`);

      doctorsGrid.innerHTML = list
        .map((d) => {
          const dept = data.getDepartment?.(d.departmentId);
          return `
          <article class="doctor-card" data-aos="fade-up">
            <a href="${base}doctor-details.html?id=${d.id}" class="doctor-card-media">
              <img src="${d.image}" alt="${d.name}" loading="lazy" />
            </a>
            <div class="doctor-card-body">
              <h3><a href="${base}doctor-details.html?id=${d.id}">${d.name}</a></h3>
              <p class="text-primary">${d.specialty}</p>
              <p class="text-muted">${dept?.name || ''}</p>
              <div class="doctor-card-meta">
                ${stars(d.rating)}
                <span>${d.rating} (${d.reviews})</span>
              </div>
              <p class="doctor-fee">${currency(d.fees)} / visit</p>
              <a href="${base}appointment.html?doctor=${d.id}&dept=${d.departmentId}" class="btn btn-primary btn-sm">
                Book Appointment
              </a>
            </div>
          </article>`;
        })
        .join('');
    }

    // Department cards
    const deptGrid = document.querySelector('[data-departments-grid]');
    if (deptGrid && !deptGrid.children.length) {
      const base = resolveBasePath();
      deptGrid.innerHTML = (data.departments || [])
        .map(
          (d) => `
        <article class="dept-card" data-aos="fade-up" id="${d.id}">
          <div class="dept-card-icon"><i class="${d.icon}"></i></div>
          <h3>${d.name}</h3>
          <p>${d.description}</p>
          <a href="${base}doctors.html?dept=${d.id}" class="btn-link">View Doctors →</a>
        </article>`
        )
        .join('');
    }

    // FAQ accordion seed
    const faqRoot = document.querySelector('[data-faq-list]');
    if (faqRoot && !faqRoot.children.length && data.faqs) {
      faqRoot.classList.add('accordion');
      faqRoot.innerHTML = data.faqs
        .map(
          (f) => `
        <div class="accordion-item">
          <button type="button" class="accordion-header">
            ${f.question}
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="accordion-body">
            <div class="accordion-content"><p>${f.answer}</p></div>
          </div>
        </div>`
        )
        .join('');
    }

    // Testimonials swiper slides
    const testiWrap = document.querySelector(
      '.testimonials-swiper .swiper-wrapper'
    );
    if (testiWrap && !testiWrap.children.length && data.testimonials) {
      const stars = C().renderStars || (() => '');
      testiWrap.innerHTML = data.testimonials
        .map(
          (t) => `
        <div class="swiper-slide">
          <blockquote class="testimonial-card">
            ${stars(t.rating)}
            <p>“${t.text}”</p>
            <footer>
              <img src="${t.image}" alt="${t.name}" width="48" height="48" loading="lazy" />
              <div>
                <strong>${t.name}</strong>
                <span>${t.role}</span>
              </div>
            </footer>
          </blockquote>
        </div>`
        )
        .join('');
    }
  }

  function updateAuthUI() {
    const user = Auth().getCurrentUser?.();
    document.querySelectorAll('[data-auth-show]').forEach((el) => {
      const role = el.getAttribute('data-auth-show');
      const show = user && (!role || role === 'any' || role === user.role);
      el.hidden = !show;
    });
    document.querySelectorAll('[data-auth-hide]').forEach((el) => {
      el.hidden = !!user;
    });
    document.querySelectorAll('[data-user-name]').forEach((el) => {
      if (user) el.textContent = user.name;
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Bootstrap                                                         */
  /* ------------------------------------------------------------------ */

  function bootstrap() {
    const comps = C();
    const base = resolveBasePath();
    const page =
      document.body?.getAttribute('data-page') ||
      document.documentElement?.getAttribute('data-page') ||
      '';

    // 1. Loader & theme first (no FOUC for theme ideally set in <head>, still safe here)
    comps.initPageLoader?.();
    comps.initThemeToggle?.();

    // 2. Chrome
    if (document.getElementById('site-header')) {
      comps.renderHeader?.(page, base);
    }
    if (document.getElementById('site-footer')) {
      comps.renderFooter?.(base);
    }

    // Floating buttons on public pages only (skip dashboards)
    const isDashboard = document.body?.classList.contains('dashboard-body') ||
      document.body?.hasAttribute('data-dashboard');
    if (!isDashboard) {
      comps.renderFloatingButtons?.(base);
    }

    // 3. Motion & carousels
    comps.initAOS?.();
    comps.initHeroSwiper?.();
    comps.initDoctorsSwiper?.();
    comps.initTestimonialsSwiper?.();
    comps.initCounters?.();
    comps.initAccordion?.();
    comps.initTabs?.();
    comps.initScrollTop?.();

    // 4. Dynamic content fillers
    fillDynamicLists();
    // Re-init accordion if FAQs were injected
    comps.initAccordion?.();
    // Re-init testimonial swiper after slides injected
    if (document.querySelector('.testimonials-swiper .swiper-slide')) {
      comps.initTestimonialsSwiper?.();
    }

    // 5. Forms
    wireCommonForms();
    Appt().initAppointmentForm?.();

    // 6. Dashboard widgets (no-op on public pages without matching DOM)
    if (isDashboard || document.querySelector('.dashboard-sidebar')) {
      Dash().initDashboardPage?.();
    }

    // 7. Auth-aware UI
    updateAuthUI();

    // 8. Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') comps.closeModal?.();
    });

    // Dispatch ready event for page-specific scripts
    document.dispatchEvent(
      new CustomEvent('medicare:ready', {
        detail: { basePath: base, page, user: Auth().getCurrentUser?.() || null },
      })
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Global MediCare namespace                                          */
  /* ------------------------------------------------------------------ */

  const MediCare = Object.assign(global.MediCare || {}, {
    version: '1.0.0',
    init: bootstrap,
    getBasePath: resolveBasePath,
    ready(fn) {
      if (MediCare._booted) {
        fn({
          basePath: resolveBasePath(),
          page: document.body?.getAttribute('data-page') || '',
          user: Auth().getCurrentUser?.() || null,
        });
        return;
      }
      document.addEventListener('medicare:ready', (e) => fn(e.detail), { once: true });
    },
  });

  // Live getters so modules remain reachable regardless of script order
  Object.defineProperties(MediCare, {
    Data: { get: () => global.MediCareData, enumerable: true },
    Auth: { get: () => global.MediCareAuth, enumerable: true },
    Components: { get: () => global.MediCareComponents, enumerable: true },
    Appointment: { get: () => global.MediCareAppointment, enumerable: true },
    Dashboard: { get: () => global.MediCareDashboard, enumerable: true },
  });

  global.MediCare = MediCare;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bootstrap();
      MediCare._booted = true;
    });
  } else {
    bootstrap();
    MediCare._booted = true;
  }
})(typeof window !== 'undefined' ? window : globalThis);

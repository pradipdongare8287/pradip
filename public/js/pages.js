/**
 * MediCare Plus — Page-Specific Enhancements
 * Handles: departments grid, doctors filter, doctor-details, treatment
 * list/detail, gallery lightbox, blog list/detail, testimonials grid.
 *
 * Runs after `medicare:ready` (dispatched by js/main.js once header,
 * footer, and default dynamic lists are in place) and simply re-renders
 * the relevant containers using the fully-styled component classes.
 */
(function () {
  'use strict';

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }
  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }
  function Data() {
    return window.MediCareData;
  }
  function Comp() {
    return window.MediCareComponents || {};
  }
  function stars(r) {
    return Comp().renderStars ? Comp().renderStars(r) : '';
  }
  function money(n) {
    return Comp().formatCurrency ? Comp().formatCurrency(n) : `$${n}`;
  }
  function fmtDate(d) {
    return Comp().formatDate ? Comp().formatDate(d) : d;
  }
  function fmtTime(t) {
    return Comp().formatTime ? Comp().formatTime(t) : t;
  }
  function esc(s) {
    return Comp().escapeHtml ? Comp().escapeHtml(s) : String(s ?? '');
  }
  function setText(sel, text) {
    const el = qs(sel);
    if (el) el.textContent = text;
  }
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  function refreshAOS() {
    if (window.AOS && typeof window.AOS.refreshHard === 'function') {
      setTimeout(() => window.AOS.refreshHard(), 50);
    }
  }

  /* ================================================================== */
  /*  Departments page                                                  */
  /* ================================================================== */
  function initDepartmentsPage() {
    const grid = qs('[data-departments-grid]');
    const data = Data();
    if (!grid || !data) return;

    grid.innerHTML = data.departments
      .map(
        (d) => `
      <article class="dept-card card-interactive" data-aos="fade-up" id="${d.id}">
        <div class="dept-icon"><i class="${d.icon}"></i></div>
        <h4>${esc(d.name)}</h4>
        <p>${esc(d.description)}</p>
        <a href="doctors.html?dept=${d.id}" class="dept-link">View Doctors <i class="fa-solid fa-arrow-right"></i></a>
      </article>`
      )
      .join('');

    const detailRoot = qs('[data-departments-detail]');
    if (detailRoot) {
      detailRoot.innerHTML = data.departments
        .map(
          (d) => `
        <div class="service-list-item" id="detail-${d.id}" data-aos="fade-up">
          <img src="${d.image}" alt="${esc(d.name)}" loading="lazy" />
          <div>
            <h4><i class="${d.icon} text-primary"></i> ${esc(d.name)}</h4>
            <p>${esc(d.description)}</p>
            <span class="badge badge-primary"><i class="fa-solid fa-user-doctor"></i> ${d.doctors} Doctors</span>
            <span class="badge badge-secondary"><i class="fa-solid fa-bed"></i> ${d.beds} Beds</span>
          </div>
          <a href="doctors.html?dept=${d.id}" class="btn btn-outline btn-sm">View Doctors</a>
        </div>`
        )
        .join('');
    }
    refreshAOS();
  }

  /* ================================================================== */
  /*  Doctors listing + filters                                         */
  /* ================================================================== */
  function initDoctorsPage() {
    const grid = qs('[data-doctors-grid]');
    const data = Data();
    if (!grid || !data) return;

    const searchInput = qs('[data-doctor-search]');
    const deptSelect = qs('[data-doctor-dept-filter]');
    const resultsCount = qs('[data-results-count]');
    const resetBtn = qs('[data-filter-reset]');
    const limit = Number(grid.getAttribute('data-limit')) || 0;

    if (deptSelect && !deptSelect.dataset.filled) {
      deptSelect.innerHTML =
        '<option value="">All Departments</option>' +
        data.departments.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');
      deptSelect.dataset.filled = '1';
    }

    function syncUrl(dept, q) {
      const p = new URLSearchParams();
      if (dept) p.set('dept', dept);
      if (q) p.set('q', q);
      const qStr = p.toString();
      const url = `${window.location.pathname}${qStr ? '?' + qStr : ''}`;
      window.history.replaceState({}, '', url);
    }

    function render() {
      const dept = deptSelect?.value || '';
      const q = searchInput?.value?.trim() || '';
      syncUrl(dept, q);

      let list = data.filterDoctors({ dept, search: q });
      const total = list.length;
      if (limit) list = list.slice(0, limit);

      if (resultsCount) {
        resultsCount.innerHTML = total
          ? `Showing <strong>${list.length}</strong> of <strong>${total}</strong> doctor${total === 1 ? '' : 's'}`
          : 'No doctors match your search';
      }

      if (!list.length) {
        grid.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-user-doctor"></i>
            <h4>No doctors found</h4>
            <p class="text-muted">Try adjusting your search term or department filter.</p>
          </div>`;
        return;
      }

      grid.innerHTML = list
        .map((d) => {
          const dept = data.getDepartment(d.departmentId);
          return `
          <article class="doctor-card" data-aos="fade-up">
            <div class="doctor-img">
              <img src="${d.image}" alt="${esc(d.name)}" loading="lazy" />
              <span class="doctor-badge">${d.experience}+ Yrs Exp.</span>
              <div class="doctor-social">
                <a href="doctor-details.html?id=${d.id}" aria-label="View profile"><i class="fa-solid fa-eye"></i></a>
                <a href="appointment.html?doctor=${d.id}&dept=${d.departmentId}" aria-label="Book appointment"><i class="fa-solid fa-calendar-check"></i></a>
              </div>
            </div>
            <div class="doctor-body">
              <h4><a href="doctor-details.html?id=${d.id}">${esc(d.name)}</a></h4>
              <p class="specialty">${esc(d.specialty)}</p>
              <div class="doctor-meta">
                <span class="rating"><i class="fa-solid fa-star"></i> ${d.rating}<span> (${d.reviews})</span></span>
                <span class="text-muted">${dept?.name || ''}</span>
              </div>
              <a href="doctor-details.html?id=${d.id}" class="btn btn-primary">View Profile</a>
            </div>
          </article>`;
        })
        .join('');
      refreshAOS();
    }

    const initial = new URLSearchParams(window.location.search);
    if (searchInput) searchInput.value = initial.get('q') || '';
    if (deptSelect) deptSelect.value = initial.get('dept') || '';

    searchInput?.addEventListener('input', debounce(render, 300));
    deptSelect?.addEventListener('change', render);
    resetBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (deptSelect) deptSelect.value = '';
      render();
    });

    render();
  }

  /* ================================================================== */
  /*  Doctor details                                                    */
  /* ================================================================== */
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function initDoctorDetailsPage() {
    const root = qs('[data-doctor-profile]');
    const data = Data();
    if (!root || !data) return;

    const id = new URLSearchParams(window.location.search).get('id');
    const doctor = data.getDoctor(id) || data.doctors[0];

    if (!doctor) {
      root.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h4>Doctor not found</h4>
          <p class="text-muted">The doctor profile you are looking for does not exist.</p>
          <a href="doctors.html" class="btn btn-primary mt-3">Back to Doctors</a>
        </div>`;
      return;
    }

    const dept = data.getDepartment(doctor.departmentId);
    document.title = `${doctor.name} — MediCare Plus`;
    setText('[data-breadcrumb-current]', doctor.name);
    setText('[data-page-title]', doctor.name);

    const related = data
      .filterDoctors({ dept: doctor.departmentId })
      .filter((d) => d.id !== doctor.id)
      .slice(0, 3);

    root.innerHTML = `
      <div class="about-intro mb-5">
        <div class="about-image" data-aos="fade-right">
          <img src="${doctor.image}" alt="${esc(doctor.name)}" />
          <div class="experience-badge">
            <strong>${doctor.experience}+</strong>
            <span>Years Exp.</span>
          </div>
        </div>
        <div data-aos="fade-left">
          <span class="eyebrow">${dept?.name || ''}</span>
          <h1>${esc(doctor.name)}</h1>
          <p class="text-primary fw-600">${esc(doctor.specialty)}</p>
          <div class="doctor-meta mb-3">
            <span class="rating"><i class="fa-solid fa-star"></i> ${doctor.rating}<span> (${doctor.reviews} reviews)</span></span>
          </div>
          <p class="lead">${esc(doctor.bio)}</p>
          <ul class="treatment-meta-list mb-3">
            <li><span>Education</span><span>${esc(doctor.education)}</span></li>
            <li><span>Department</span><span>${dept?.name || ''}</span></li>
            <li><span>Languages</span><span>${(doctor.languages || []).join(', ')}</span></li>
            <li><span>Consultation Fee</span><span>${money(doctor.fees)}</span></li>
          </ul>
          <div class="btn-group">
            <a href="appointment.html?doctor=${doctor.id}&dept=${doctor.departmentId}" class="btn btn-primary btn-lg">
              <i class="fa-solid fa-calendar-check"></i> Book Appointment
            </a>
            <a href="tel:+18005550147" class="btn btn-outline btn-lg"><i class="fa-solid fa-phone"></i> Call Clinic</a>
          </div>
        </div>
      </div>

      <div class="treatment-detail">
        <div class="treatment-content">
          <h3>Weekly Availability</h3>
          <ul class="treatment-features">
            ${DAYS.map(
              (day) => `
              <li>
                <i class="fa-solid ${doctor.availability.days.includes(day) ? 'fa-circle-check' : 'fa-circle-minus'}"></i>
                ${day} ${doctor.availability.days.includes(day) ? '— Available' : '— Off Day'}
              </li>`
            ).join('')}
          </ul>

          <h3>Typical Time Slots</h3>
          <div class="d-flex flex-wrap gap-2">
            ${doctor.availability.times.map((t) => `<span class="badge badge-primary">${fmtTime(t)}</span>`).join('')}
          </div>
        </div>

        <aside class="treatment-sidebar">
          <div class="sidebar-card">
            <h4>Book This Doctor</h4>
            <p class="treatment-price-tag">${money(doctor.fees)} <small class="text-muted fw-400">/ visit</small></p>
            <a href="appointment.html?doctor=${doctor.id}&dept=${doctor.departmentId}" class="btn btn-primary btn-block mb-2">
              <i class="fa-solid fa-calendar-plus"></i> Book Appointment
            </a>
            <a href="doctors.html" class="btn btn-outline btn-block"><i class="fa-solid fa-arrow-left"></i> Back to Doctors</a>
          </div>
          ${
            related.length
              ? `
          <div class="sidebar-card">
            <h4>Related Doctors</h4>
            <div class="related-treatments">
              ${related
                .map(
                  (r) => `
                <a href="doctor-details.html?id=${r.id}">
                  <img src="${r.image}" alt="${esc(r.name)}" />
                  <span>${esc(r.name)}<br><small class="text-muted">${esc(r.specialty)}</small></span>
                </a>`
                )
                .join('')}
            </div>
          </div>`
              : ''
          }
        </aside>
      </div>
    `;
    refreshAOS();
  }

  /* ================================================================== */
  /*  Treatments list / detail                                          */
  /* ================================================================== */
  function initTreatmentPage() {
    const listRoot = qs('[data-treatment-list]');
    const detailRoot = qs('[data-treatment-detail]');
    const data = Data();
    if (!data || (!listRoot && !detailRoot)) return;

    const id = new URLSearchParams(window.location.search).get('id');
    const treatment = id ? data.getTreatment(id) : null;

    if (treatment) {
      if (listRoot) listRoot.hidden = true;
      if (detailRoot) {
        detailRoot.hidden = false;
        renderTreatmentDetail(treatment);
      }
    } else {
      if (detailRoot) detailRoot.hidden = true;
      if (listRoot) {
        listRoot.hidden = false;
        renderTreatmentList();
      }
    }
  }

  function renderTreatmentList() {
    const grid = qs('[data-treatment-grid]');
    const data = Data();
    grid.innerHTML = data.treatments
      .map((t) => {
        const dept = data.getDepartment(t.department);
        return `
        <div class="service-list-item" data-aos="fade-up">
          <img src="${t.image}" alt="${esc(t.name)}" loading="lazy" />
          <div>
            <h4>${esc(t.name)}</h4>
            <p>${esc(t.description)}</p>
            <span class="badge badge-primary">${dept?.name || ''}</span>
            <span class="text-muted"> <i class="fa-regular fa-clock"></i> ${t.duration}</span>
          </div>
          <div class="text-right">
            <p class="service-price">${money(t.price)}</p>
            <a href="treatment.html?id=${t.id}" class="btn btn-outline btn-sm">View Details</a>
          </div>
        </div>`;
      })
      .join('');
    refreshAOS();
  }

  function renderTreatmentDetail(t) {
    const root = qs('[data-treatment-detail]');
    const data = Data();
    const dept = data.getDepartment(t.department);

    document.title = `${t.name} — MediCare Plus`;
    setText('[data-breadcrumb-current]', t.name);
    setText('[data-page-title]', t.name);

    const related = data.treatments.filter((x) => x.id !== t.id && x.department === t.department).slice(0, 3);
    const relatedFinal = related.length ? related : data.treatments.filter((x) => x.id !== t.id).slice(0, 3);

    root.innerHTML = `
      <div class="treatment-detail">
        <div class="treatment-content">
          <span class="badge badge-primary mb-2">${dept?.name || ''}</span>
          <h2>${esc(t.name)}</h2>
          <img src="${t.image}" alt="${esc(t.name)}" class="treatment-hero" />
          <div class="treatment-body">
            <p>${esc(t.description)}</p>
            <h3>What to Expect</h3>
            <p>Our specialists in ${dept?.name || 'this department'} guide you through every step — from pre-procedure preparation to aftercare — ensuring comfort and clarity throughout your visit. Reports and follow-up recommendations are shared through your patient dashboard.</p>
          </div>
          <ul class="treatment-features">
            <li><i class="fa-solid fa-user-doctor"></i> Performed by board-certified specialists</li>
            <li><i class="fa-solid fa-shield-heart"></i> Advanced, fully-sanitized equipment &amp; facilities</li>
            <li><i class="fa-solid fa-file-medical"></i> Detailed report with consultation follow-up</li>
            <li><i class="fa-regular fa-clock"></i> Typical duration: ${t.duration}</li>
          </ul>
        </div>
        <aside class="treatment-sidebar">
          <div class="sidebar-card">
            <h4>Treatment Overview</h4>
            <ul class="treatment-meta-list">
              <li><span>Department</span><span>${dept?.name || ''}</span></li>
              <li><span>Duration</span><span>${t.duration}</span></li>
              <li><span>Price</span><span>${money(t.price)}</span></li>
            </ul>
            <p class="treatment-price-tag">${money(t.price)}</p>
            <a href="appointment.html?dept=${t.department}" class="btn btn-primary btn-block">
              <i class="fa-solid fa-calendar-check"></i> Book This Treatment
            </a>
          </div>
          <div class="sidebar-card">
            <h4>Related Treatments</h4>
            <div class="related-treatments">
              ${relatedFinal
                .map(
                  (r) => `
                <a href="treatment.html?id=${r.id}">
                  <img src="${r.image}" alt="${esc(r.name)}" />
                  <span>${esc(r.name)}</span>
                </a>`
                )
                .join('')}
            </div>
          </div>
        </aside>
      </div>
    `;
    refreshAOS();
  }

  /* ================================================================== */
  /*  Gallery + lightbox                                                */
  /* ================================================================== */
  function initGalleryPage() {
    const grid = qs('[data-gallery-grid]');
    const data = Data();
    if (!grid || !data) return;

    const filterBtns = qsa('[data-gallery-filter]');
    const lightbox = qs('#gallery-lightbox');
    const lightboxImg = qs('#gallery-lightbox-img');
    const lightboxCaption = qs('#gallery-lightbox-caption');

    function render(category) {
      const list = data.filterGallery(category);
      grid.innerHTML = list
        .map(
          (g) => `
        <div class="gallery-item" data-aos="zoom-in" data-img="${g.image}" data-title="${esc(g.title)}" role="button" tabindex="0">
          <img src="${g.image}" alt="${esc(g.title)}" loading="lazy" />
          <div class="gallery-overlay"><i class="fa-solid fa-expand"></i></div>
          <div class="gallery-caption">${esc(g.title)}</div>
        </div>`
        )
        .join('');

      qsa('.gallery-item', grid).forEach((item) => {
        const open = () => {
          if (lightboxImg) lightboxImg.src = item.getAttribute('data-img');
          if (lightboxCaption) lightboxCaption.textContent = item.getAttribute('data-title');
          lightbox?.classList.add('open');
        };
        item.addEventListener('click', open);
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
      });
      refreshAOS();
    }

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-outline');
        });
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-primary');
        render(btn.getAttribute('data-gallery-filter'));
      });
    });

    const closeLightbox = () => lightbox?.classList.remove('open');
    qs('.lightbox-close')?.addEventListener('click', closeLightbox);
    lightbox?.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    render('all');
  }

  /* ================================================================== */
  /*  Blog list / detail                                                */
  /* ================================================================== */
  function initBlogPage() {
    const listRoot = qs('[data-blog-list]');
    const detailRoot = qs('[data-blog-detail]');
    const data = Data();
    if (!data || (!listRoot && !detailRoot)) return;

    const id = new URLSearchParams(window.location.search).get('id');
    const post = id ? data.getBlog(id) : null;

    if (post) {
      if (listRoot) listRoot.hidden = true;
      if (detailRoot) {
        detailRoot.hidden = false;
        renderBlogDetail(post);
      }
    } else {
      if (detailRoot) detailRoot.hidden = true;
      if (listRoot) {
        listRoot.hidden = false;
        renderBlogList();
      }
    }
  }

  function blogCard(b) {
    return `
    <article class="blog-card card-interactive" data-aos="fade-up">
      <div class="blog-img">
        <img src="${b.image}" alt="${esc(b.title)}" loading="lazy" />
        <span class="blog-category">${esc(b.category)}</span>
      </div>
      <div class="blog-body">
        <div class="blog-meta">
          <span><i class="fa-regular fa-calendar"></i> ${fmtDate(b.date)}</span>
          <span><i class="fa-regular fa-user"></i> ${esc(b.author)}</span>
        </div>
        <h4><a href="blog.html?id=${b.id}">${esc(b.title)}</a></h4>
        <p>${esc(b.excerpt)}</p>
        <a href="blog.html?id=${b.id}" class="read-more">Read More <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </article>`;
  }

  function renderBlogList() {
    const grid = qs('[data-blog-grid]');
    const data = Data();
    grid.innerHTML = data.blogs.map(blogCard).join('');
    refreshAOS();
  }

  function renderBlogDetail(post) {
    const root = qs('[data-blog-detail]');
    const data = Data();

    document.title = `${post.title} — MediCare Plus`;
    setText('[data-breadcrumb-current]', post.title);
    setText('[data-page-title]', post.title);

    const others = data.blogs.filter((b) => b.id !== post.id).slice(0, 3);

    root.innerHTML = `
      <div class="blog-detail">
        <div class="blog-meta mb-3">
          <span class="badge badge-secondary">${esc(post.category)}</span>
          <span><i class="fa-regular fa-calendar"></i> ${fmtDate(post.date)}</span>
          <span><i class="fa-regular fa-user"></i> ${esc(post.author)}</span>
        </div>
        <h1>${esc(post.title)}</h1>
        <img src="${post.image}" alt="${esc(post.title)}" class="blog-hero-img" />
        <div class="blog-content">${post.content}</div>
        <div class="blog-tags">
          ${(post.tags || []).map((t) => `<a href="blog.html">#${esc(t)}</a>`).join('')}
        </div>
      </div>
      ${
        others.length
          ? `
      <div class="section-header mt-5">
        <span class="eyebrow">Keep Reading</span>
        <h2>More Health Insights</h2>
      </div>
      <div class="blog-grid">
        ${others.map(blogCard).join('')}
      </div>`
          : ''
      }
    `;
    refreshAOS();
  }

  /* ================================================================== */
  /*  Testimonials grid                                                 */
  /* ================================================================== */
  function initTestimonialsPage() {
    const grid = qs('[data-testimonials-grid]');
    const data = Data();
    if (!grid || !data) return;

    grid.innerHTML = data.testimonials
      .map(
        (t) => `
      <article class="testimonial-card" data-aos="fade-up">
        <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
        ${stars(t.rating)}
        <p class="testimonial-text">${esc(t.text)}</p>
        <div class="testimonial-author">
          <img src="${t.image}" alt="${esc(t.name)}" class="author-avatar" loading="lazy" />
          <div class="author-info">
            <h5>${esc(t.name)}</h5>
            <span>${esc(t.role)}</span>
          </div>
        </div>
      </article>`
      )
      .join('');
    refreshAOS();
  }

  /* ================================================================== */
  /*  Dispatch by data-page                                             */
  /* ================================================================== */
  function init() {
    const page = document.body.getAttribute('data-page') || '';
    switch (page) {
      case 'departments':
        initDepartmentsPage();
        break;
      case 'doctors':
        initDoctorsPage();
        break;
      case 'doctor-details':
        initDoctorDetailsPage();
        break;
      case 'treatment':
        initTreatmentPage();
        break;
      case 'gallery':
        initGalleryPage();
        break;
      case 'blog':
        initBlogPage();
        break;
      case 'testimonials':
        initTestimonialsPage();
        break;
      default:
        break;
    }
  }

  if (window.MediCare && typeof window.MediCare.ready === 'function') {
    window.MediCare.ready(init);
  } else {
    document.addEventListener('medicare:ready', init);
    if (document.readyState !== 'loading') setTimeout(init, 0);
  }
})();

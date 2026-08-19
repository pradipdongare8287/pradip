/**
 * MediCare Plus — Home page dynamic content
 * Runs after medicare:ready from main.js
 */
(function () {
  'use strict';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function renderHome() {
    const Data = window.MediCareData;
    const C = window.MediCareComponents;
    if (!Data) return;

    const stars = C?.renderStars || (() => '');
    const money = C?.formatCurrency || ((n) => `$${n}`);

    // Departments
    const deptEl = $('#home-departments');
    if (deptEl) {
      deptEl.innerHTML = (Data.departments || [])
        .map(
          (d) => `
        <article class="dept-card card-interactive" data-aos="fade-up" id="${d.id}">
          <div class="dept-card-icon"><i class="${d.icon}"></i></div>
          <h3>${d.name}</h3>
          <p>${d.description}</p>
          <div class="dept-card-meta">
            <span><i class="fa-solid fa-user-doctor"></i> ${d.doctors} Doctors</span>
            <span><i class="fa-solid fa-bed"></i> ${d.beds} Beds</span>
          </div>
          <a href="doctors.html?dept=${d.id}" class="btn btn-ghost btn-sm">View Doctors</a>
        </article>`
        )
        .join('');
    }

    // Treatments
    const treatEl = $('#home-treatments');
    if (treatEl && Data.treatments) {
      treatEl.innerHTML = Data.treatments
        .slice(0, 6)
        .map(
          (t) => `
        <article class="treatment-card card-interactive" data-aos="fade-up">
          <div class="treatment-card-media">
            <img src="${t.image}" alt="${t.name}" loading="lazy" />
          </div>
          <div class="treatment-card-body">
            <span class="badge badge-primary">${t.department || ''}</span>
            <h3>${t.name}</h3>
            <p>${t.description}</p>
            <div class="treatment-card-footer">
              <strong>${money(t.price)}</strong>
              <span class="text-muted"><i class="fa-regular fa-clock"></i> ${t.duration}</span>
            </div>
            <a href="treatment.html?id=${t.id}" class="btn btn-outline btn-sm">Learn More</a>
          </div>
        </article>`
        )
        .join('');
    }

    // Doctors slider
    const docWrap = $('#home-doctors');
    if (docWrap && Data.doctors) {
      docWrap.innerHTML = Data.doctors
        .slice(0, 8)
        .map((d) => {
          const dept = Data.getDepartment?.(d.departmentId);
          return `
          <div class="swiper-slide">
            <article class="doctor-card">
              <a href="doctor-details.html?id=${d.id}" class="doctor-card-media">
                <img src="${d.image}" alt="${d.name}" loading="lazy" />
                <span class="doctor-exp">${d.experience}+ Years</span>
              </a>
              <div class="doctor-card-body">
                <h3><a href="doctor-details.html?id=${d.id}">${d.name}</a></h3>
                <p class="text-primary">${d.specialty}</p>
                <p class="text-muted">${dept?.name || ''}</p>
                <div class="doctor-card-meta">
                  ${stars(d.rating)}
                  <span>${d.rating} (${d.reviews})</span>
                </div>
                <a href="appointment.html?doctor=${d.id}&dept=${d.departmentId}" class="btn btn-primary btn-sm btn-block">
                  Book Appointment
                </a>
              </div>
            </article>
          </div>`;
        })
        .join('');
      C?.initDoctorsSwiper?.();
    }

    // Testimonials — filled by main.js if empty; ensure id matches
    const testiWrap = $('#home-testimonials');
    if (testiWrap && !testiWrap.children.length && Data.testimonials) {
      testiWrap.innerHTML = Data.testimonials
        .map(
          (t) => `
        <div class="swiper-slide">
          <blockquote class="testimonial-card">
            <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
            ${stars(t.rating)}
            <p>“${t.text}”</p>
            <footer>
              <img src="${t.image}" alt="${t.name}" class="avatar" loading="lazy" />
              <div>
                <strong>${t.name}</strong>
                <span>${t.role}</span>
              </div>
            </footer>
          </blockquote>
        </div>`
        )
        .join('');
      C?.initTestimonialsSwiper?.();
    }

    // Pricing
    const priceEl = $('#home-pricing');
    if (priceEl && Data.pricing) {
      priceEl.innerHTML = Data.pricing
        .map(
          (p, i) => `
        <article class="pricing-card${p.popular || p.featured ? ' featured' : ''}" data-aos="fade-up" data-aos-delay="${i * 100}">
          ${p.popular || p.featured ? '<span class="pricing-badge">Most Popular</span>' : ''}
          <h3>${p.name}</h3>
          <div class="pricing-price">
            <span class="amount">${money(p.price)}</span>
            <span class="period">/${p.period || 'package'}</span>
          </div>
          <p class="pricing-desc">${p.description || ''}</p>
          <ul class="pricing-features">
            ${(p.features || []).map((f) => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
          </ul>
          <a href="appointment.html" class="btn ${p.popular || p.featured ? 'btn-primary' : 'btn-outline'} btn-block">Choose Plan</a>
        </article>`
        )
        .join('');
    }

    // Blogs
    const blogEl = $('#home-blogs');
    if (blogEl && Data.blogs) {
      blogEl.innerHTML = Data.blogs
        .slice(0, 3)
        .map(
          (b) => `
        <article class="blog-card card-interactive" data-aos="fade-up">
          <a href="blog.html?id=${b.id}" class="blog-card-media">
            <img src="${b.image}" alt="${b.title}" loading="lazy" />
            <span class="badge badge-secondary">${b.category}</span>
          </a>
          <div class="blog-card-body">
            <div class="blog-meta">
              <span><i class="fa-regular fa-calendar"></i> ${C?.formatDate?.(b.date) || b.date}</span>
              <span><i class="fa-regular fa-user"></i> ${b.author}</span>
            </div>
            <h3><a href="blog.html?id=${b.id}">${b.title}</a></h3>
            <p>${b.excerpt}</p>
            <a href="blog.html?id=${b.id}" class="btn-link">Read More <i class="fa-solid fa-arrow-right"></i></a>
          </div>
        </article>`
        )
        .join('');
    }

    // FAQ
    const faqEl = $('#home-faq');
    if (faqEl && Data.faqs) {
      faqEl.innerHTML = Data.faqs
        .slice(0, 6)
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
      C?.initAccordion?.();
    }

    // Gallery preview
    const galEl = $('#home-gallery');
    if (galEl && Data.gallery) {
      galEl.innerHTML = Data.gallery
        .slice(0, 8)
        .map(
          (g) => `
        <a href="gallery.html" class="gallery-item" data-aos="zoom-in">
          <img src="${g.image || g.url}" alt="${g.title}" loading="lazy" />
          <div class="gallery-overlay">
            <span>${g.title}</span>
            <i class="fa-solid fa-expand"></i>
          </div>
        </a>`
        )
        .join('');
    }

    // Home filters
    const deptFilter = $('#home-dept-filter');
    if (deptFilter && !deptFilter.options.length) {
      deptFilter.innerHTML =
        '<option value="">All Departments</option>' +
        (Data.departments || [])
          .map((d) => `<option value="${d.id}">${d.name}</option>`)
          .join('');
    }

    const searchBtn = document.querySelector('a[href="doctors.html"]');
    const searchInput = $('#home-doctor-search');
    if (searchInput) {
      const goSearch = () => {
        const q = searchInput.value.trim();
        const dept = deptFilter?.value || '';
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (dept) params.set('dept', dept);
        window.location.href = `doctors.html?${params.toString()}`;
      };
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          goSearch();
        }
      });
    }

    // Video modal
    const playBtn = $('#video-play-btn');
    const backdrop = $('#video-modal-backdrop');
    const modal = $('#video-modal');
    const iframe = $('#tour-iframe');
    const closeVideo = () => {
      backdrop?.classList.remove('show');
      modal?.classList.remove('show');
      if (iframe) iframe.src = '';
    };
    playBtn?.addEventListener('click', () => {
      if (iframe) iframe.src = 'https://www.youtube.com/embed/EngW7tLk6R8?autoplay=1';
      backdrop?.classList.add('show');
      modal?.classList.add('show');
    });
    backdrop?.addEventListener('click', closeVideo);
    modal?.querySelector('[data-close-modal]')?.addEventListener('click', closeVideo);
  }

  document.addEventListener('medicare:ready', renderHome);
  if (document.readyState !== 'loading' && window.MediCareData) {
    // Fallback if event already fired
    setTimeout(renderHome, 0);
  }
})();

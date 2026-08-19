/**
 * MediCare Plus — Customer (Patient) Panel Helpers
 * Shared across customer/*.html — topbar widgets, appointment loading/
 * rendering, and demo datasets for reports/prescriptions/payments.
 *
 * Include after: data.js, auth.js, components.js, appointment.js,
 * dashboard.js, main.js
 */
(function (global) {
  'use strict';

  const Auth = () => global.MediCareAuth || {};
  const Comp = () => global.MediCareComponents || {};
  const Appt = () => global.MediCareAppointment || {};
  const Dash = () => global.MediCareDashboard || {};

  /* ================================================================== */
  /*  Small utils                                                       */
  /* ================================================================== */

  function escapeHtml(str) {
    if (Comp().escapeHtml) return Comp().escapeHtml(str);
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtDate(d) {
    return Comp().formatDate ? Comp().formatDate(d) : d;
  }

  function fmtTime(t) {
    return Comp().formatTime ? Comp().formatTime(t) : t;
  }

  function fmtMoney(n) {
    return Comp().formatCurrency ? Comp().formatCurrency(n) : `$${n}`;
  }

  function toast(msg, type) {
    Comp().showToast?.(msg, type);
  }

  function firstName(user) {
    if (!user || !user.name) return 'there';
    return String(user.name).trim().split(/\s+/)[0];
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function memberSinceYear(user) {
    if (!user?.createdAt) return '—';
    const d = new Date(user.createdAt);
    return Number.isNaN(d.getTime()) ? '—' : String(d.getFullYear());
  }

  /* ================================================================== */
  /*  Appointments                                                      */
  /* ================================================================== */

  function loadAppointments() {
    const user = Auth().getCurrentUser?.();
    if (!user) return [];
    return Appt().getAppointments?.(user.id) || [];
  }

  function splitAppointments(list) {
    const today = Appt().todayISO ? Appt().todayISO() : new Date().toISOString().slice(0, 10);
    const upcoming = [];
    const past = [];
    (list || []).forEach((a) => {
      const isUpcoming =
        a.date >= today && a.status !== 'cancelled' && a.status !== 'completed';
      (isUpcoming ? upcoming : past).push(a);
    });
    upcoming.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    past.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
    return { upcoming, past };
  }

  function nextAppointment(list) {
    const { upcoming } = splitAppointments(list || loadAppointments());
    return upcoming[0] || null;
  }

  function statusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    return `<span class="status-badge ${s}">${label}</span>`;
  }

  const DOCTOR_AVATARS = {};
  function doctorAvatar(doctorId) {
    if (DOCTOR_AVATARS[doctorId]) return DOCTOR_AVATARS[doctorId];
    const doc = global.MediCareData?.getDoctor?.(doctorId);
    const url = doc?.image || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80';
    DOCTOR_AVATARS[doctorId] = url;
    return url;
  }

  /**
   * Render <tr> rows for an appointments table.
   * @param {Array} list
   * @param {{ showActions?: boolean, colspan?: number, emptyText?: string }} opts
   */
  function appointmentRows(list, opts) {
    const o = opts || {};
    const colspan = o.colspan || (o.showActions ? 6 : 5);

    if (!list || !list.length) {
      return `
        <tr class="no-hover">
          <td colspan="${colspan}">
            <div class="empty-state">
              <i class="fa-regular fa-calendar-xmark"></i>
              <h4>No appointments found</h4>
              <p class="text-muted">${escapeHtml(o.emptyText || 'You have no appointments in this view yet.')}</p>
            </div>
          </td>
        </tr>`;
    }

    return list
      .map((a) => {
        const canCancel =
          o.showActions && (a.status === 'pending' || a.status === 'approved');
        return `
        <tr data-id="${a.id}" data-status="${a.status}">
          <td>
            <div class="table-user">
              <img src="${doctorAvatar(a.doctorId)}" alt="${escapeHtml(a.doctorName)}" class="avatar avatar-sm" loading="lazy" />
              <div>
                <strong>${escapeHtml(a.doctorName)}</strong>
                <span>${escapeHtml(a.departmentName)}</span>
              </div>
            </div>
          </td>
          <td>${fmtDate(a.date)}</td>
          <td>${fmtTime(a.time)}</td>
          <td>${escapeHtml(a.reason || '—')}</td>
          <td>${statusBadge(a.status)}</td>
          ${
            o.showActions
              ? `<td class="table-actions">
                  ${
                    canCancel
                      ? `<button type="button" class="btn btn-sm btn-outline" data-cancel-appt="${a.id}">
                          <i class="fa-solid fa-xmark"></i> Cancel
                         </button>`
                      : '<span class="text-muted">—</span>'
                  }
                 </td>`
              : ''
          }
        </tr>`;
      })
      .join('');
  }

  /**
   * Render a full table (tbody target) and wire cancel buttons.
   * @param {string|HTMLElement} tbody
   * @param {Array} list
   * @param {object} opts
   * @param {Function} [onChange] called after a successful cancel
   */
  function renderAppointmentsTable(tbody, list, opts, onChange) {
    const el = typeof tbody === 'string' ? document.querySelector(tbody) : tbody;
    if (!el) return;
    el.innerHTML = appointmentRows(list, opts);
    wireCancelButtons(el, onChange);
  }

  function wireCancelButtons(container, onDone) {
    (container || document).querySelectorAll('[data-cancel-appt]').forEach((btn) => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cancel-appt');
        if (!window.confirm('Cancel this appointment? This cannot be undone.')) return;
        const res = Appt().cancelAppointment(id);
        toast(res.message, res.success ? 'success' : 'error');
        if (res.success && typeof onDone === 'function') onDone();
      });
    });
  }

  /* ================================================================== */
  /*  Demo datasets — Reports / Prescriptions / Payments / History      */
  /*  (static demo content, consistent across dashboard + list pages)  */
  /* ================================================================== */

  function getReports() {
    return [
      { id: 'rpt-1', name: 'Complete Blood Count (CBC)', type: 'Lab Test', doctor: 'Dr. Sarah Mitchell', department: 'Cardiology', date: '2026-07-15', size: '412 KB', status: 'Ready' },
      { id: 'rpt-2', name: 'Lipid Profile Panel', type: 'Lab Test', doctor: 'Dr. Sarah Mitchell', department: 'Cardiology', date: '2026-07-15', size: '288 KB', status: 'Ready' },
      { id: 'rpt-3', name: 'Chest X-Ray (PA View)', type: 'Radiology', doctor: 'Dr. James Chen', department: 'Cardiology', date: '2026-06-10', size: '3.1 MB', status: 'Ready' },
      { id: 'rpt-4', name: 'ECG / EKG Report', type: 'Cardiac Test', doctor: 'Dr. Sarah Mitchell', department: 'Cardiology', date: '2026-05-02', size: '196 KB', status: 'Ready' },
      { id: 'rpt-5', name: 'Brain MRI Scan', type: 'Radiology', doctor: 'Dr. Priya Sharma', department: 'Neurology', date: '2026-04-18', size: '8.4 MB', status: 'Ready' },
      { id: 'rpt-6', name: 'Dental X-Ray (Panoramic)', type: 'Radiology', doctor: 'Dr. Lisa Nguyen', department: 'Dental', date: '2026-06-10', size: '1.2 MB', status: 'Ready' },
      { id: 'rpt-7', name: 'Vitamin D & B12 Panel', type: 'Lab Test', doctor: 'Dr. Emily Watson', department: 'Orthopedics', date: '2026-07-02', size: '154 KB', status: 'Pending' },
    ];
  }

  function getPrescriptions() {
    return [
      {
        id: 'rx-2026-041',
        date: '2026-07-15',
        doctor: 'Dr. Sarah Mitchell',
        specialty: 'Interventional Cardiologist',
        department: 'Cardiology',
        diagnosis: 'Mild hypertension with elevated LDL cholesterol',
        notes: 'Take medicines after meals. Recheck lipid profile in 6 weeks. Reduce sodium intake and continue 30 min daily walking.',
        medicines: [
          { name: 'Atorvastatin 20mg', dosage: '1 tablet', frequency: 'Once daily, at night', duration: '30 days' },
          { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily, morning', duration: '30 days' },
          { name: 'Aspirin 75mg', dosage: '1 tablet', frequency: 'Once daily, after breakfast', duration: '30 days' },
        ],
      },
      {
        id: 'rx-2026-033',
        date: '2026-06-10',
        doctor: 'Dr. Lisa Nguyen',
        specialty: 'Cosmetic & Restorative Dentist',
        department: 'Dental',
        diagnosis: 'Mild gingivitis, early enamel erosion',
        notes: 'Use prescribed mouthwash twice daily for 2 weeks. Avoid extremely hot/cold foods for 3 days.',
        medicines: [
          { name: 'Chlorhexidine Mouthwash 0.2%', dosage: '10 ml rinse', frequency: 'Twice daily', duration: '14 days' },
          { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'As needed for pain (max 3/day)', duration: '5 days' },
        ],
      },
      {
        id: 'rx-2026-019',
        date: '2026-05-02',
        doctor: 'Dr. Sarah Mitchell',
        specialty: 'Interventional Cardiologist',
        department: 'Cardiology',
        diagnosis: 'Annual cardiac wellness checkup — normal sinus rhythm',
        notes: 'Continue current supplements. No new medication changes required. Follow up in 6 months.',
        medicines: [
          { name: 'Vitamin D3 60K', dosage: '1 capsule', frequency: 'Once weekly', duration: '8 weeks' },
          { name: 'Omega-3 Fish Oil 1000mg', dosage: '1 capsule', frequency: 'Once daily', duration: '60 days' },
        ],
      },
      {
        id: 'rx-2026-011',
        date: '2026-04-18',
        doctor: 'Dr. Priya Sharma',
        specialty: 'Neurologist',
        department: 'Neurology',
        diagnosis: 'Episodic migraine without aura',
        notes: 'Maintain a headache diary. Avoid known triggers (skipped meals, screen glare). Hydrate well.',
        medicines: [
          { name: 'Sumatriptan 50mg', dosage: '1 tablet', frequency: 'At onset of migraine (max 2/day)', duration: '30 days' },
          { name: 'Propranolol 20mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days' },
        ],
      },
    ];
  }

  function getPayments() {
    return [
      { id: 'INV-100241', date: '2026-07-15', description: 'Cardiology Consultation + Lipid Panel', doctor: 'Dr. Sarah Mitchell', department: 'Cardiology', amount: 245, method: 'Credit Card', status: 'paid' },
      { id: 'INV-100238', date: '2026-07-02', description: 'Vitamin Panel — Lab Test', doctor: 'Dr. Emily Watson', department: 'Orthopedics', amount: 60, method: 'UPI', status: 'pending' },
      { id: 'INV-100226', date: '2026-06-10', description: 'Dental Cleaning & Panoramic X-Ray', doctor: 'Dr. Lisa Nguyen', department: 'Dental', amount: 180, method: 'Debit Card', status: 'paid' },
      { id: 'INV-100209', date: '2026-05-02', description: 'Annual Cardiac Checkup + ECG', doctor: 'Dr. Sarah Mitchell', department: 'Cardiology', amount: 210, method: 'Credit Card', status: 'paid' },
      { id: 'INV-100194', date: '2026-04-18', description: 'Neurology Consultation — Migraine Eval', doctor: 'Dr. Priya Sharma', department: 'Neurology', amount: 170, method: 'Cash', status: 'paid' },
      { id: 'INV-100181', date: '2026-03-22', description: 'Brain MRI Scan', doctor: 'Dr. Priya Sharma', department: 'Neurology', amount: 620, method: 'Insurance', status: 'paid' },
    ];
  }

  function getTreatmentHistory() {
    return [
      { disease: 'Hypertension (Stage 1)', diagnosis: 'Elevated blood pressure with mild LDL elevation', treatment: 'Lifestyle modification + antihypertensive therapy', doctor: 'Dr. Sarah Mitchell', date: '2026-07-15', medicine: 'Amlodipine 5mg, Atorvastatin 20mg', nextVisit: '2026-08-26' },
      { disease: 'Gingivitis', diagnosis: 'Early gum inflammation, mild enamel erosion', treatment: 'Professional cleaning + prescribed mouthwash', doctor: 'Dr. Lisa Nguyen', date: '2026-06-10', medicine: 'Chlorhexidine Mouthwash 0.2%', nextVisit: '2026-12-10' },
      { disease: 'Routine Cardiac Screening', diagnosis: 'Normal sinus rhythm, no structural abnormality', treatment: 'Preventive supplementation + monitoring', doctor: 'Dr. Sarah Mitchell', date: '2026-05-02', medicine: 'Vitamin D3, Omega-3 Fish Oil', nextVisit: '2026-11-02' },
      { disease: 'Migraine (Episodic, No Aura)', diagnosis: 'Recurrent migraine triggered by stress and dehydration', treatment: 'Abortive + prophylactic medication, trigger avoidance', doctor: 'Dr. Priya Sharma', date: '2026-04-18', medicine: 'Sumatriptan 50mg, Propranolol 20mg', nextVisit: '2026-07-18' },
      { disease: 'Seasonal Allergic Rhinitis', diagnosis: 'Nasal congestion and sneezing due to pollen exposure', treatment: 'Antihistamine course + nasal spray', doctor: 'Dr. Helen Park', date: '2026-02-08', medicine: 'Cetirizine 10mg, Saline Nasal Spray', nextVisit: '2026-08-08' },
      { disease: 'Knee Strain (Left)', diagnosis: 'Grade 1 ligament strain from overexertion', treatment: 'Physiotherapy + anti-inflammatory medication', doctor: 'Dr. Emily Watson', date: '2026-01-20', medicine: 'Ibuprofen 400mg', nextVisit: '2026-08-02' },
    ];
  }

  /* ================================================================== */
  /*  Topbar widgets — profile dropdown + notification bell             */
  /* ================================================================== */

  function iconForType(type) {
    const map = {
      appointment: 'fa-calendar-check',
      lab: 'fa-flask',
      system: 'fa-gear',
      review: 'fa-star',
      prescription: 'fa-prescription',
      payment: 'fa-credit-card',
    };
    return map[type] || 'fa-bell';
  }

  function iconClassForType(type) {
    const map = {
      appointment: '',
      lab: 'success',
      system: '',
      review: 'warning',
      prescription: 'success',
      payment: 'warning',
    };
    return map[type] || '';
  }

  function populateUserChrome() {
    const user = Auth().getCurrentUser?.();
    const avatarUrl =
      user?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

    document.querySelectorAll('[data-user-avatar]').forEach((img) => {
      img.src = avatarUrl;
      img.alt = user?.name || 'Patient';
    });
    document.querySelectorAll('[data-user-email]').forEach((el) => {
      if (user) el.textContent = user.email;
    });
    document.querySelectorAll('[data-user-firstname]').forEach((el) => {
      el.textContent = firstName(user);
    });
    document.querySelectorAll('[data-greeting]').forEach((el) => {
      el.textContent = `${greeting()}, ${firstName(user)}`;
    });
  }

  function initProfileDropdown() {
    document.querySelectorAll('[data-profile-dropdown]').forEach((dd) => {
      const trigger = dd.querySelector('.profile-trigger');
      trigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.profile-dropdown.open').forEach((other) => {
          if (other !== dd) other.classList.remove('open');
        });
        dd.classList.toggle('open');
      });
    });
    document.addEventListener('click', (e) => {
      document.querySelectorAll('.profile-dropdown.open').forEach((dd) => {
        if (!dd.contains(e.target)) dd.classList.remove('open');
      });
    });
  }

  function initNotificationBell() {
    const wrap = document.querySelector('[data-notif-wrap]');
    if (!wrap) return;
    const btn = wrap.querySelector('.topbar-btn');
    const badge = btn?.querySelector('.badge-dot');
    const listEl = wrap.querySelector('.notification-list');

    function render() {
      const list = Dash().readNotifications ? Dash().readNotifications() : [];
      const unread = list.filter((n) => !n.read).length;
      if (badge) {
        badge.textContent = unread > 0 ? String(unread) : '';
      }
      if (!listEl) return;

      listEl.innerHTML = list.length
        ? list
            .slice(0, 6)
            .map(
              (n) => `
          <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
            <div class="notification-icon ${iconClassForType(n.type)}">
              <i class="fa-solid ${iconForType(n.type)}"></i>
            </div>
            <div class="notification-body">
              <h5>${escapeHtml(n.title)}</h5>
              <p>${escapeHtml(n.text)}</p>
              <span class="notif-time">${escapeHtml(n.time)}</span>
            </div>
            ${!n.read ? '<span class="unread-dot"></span>' : ''}
          </div>`
            )
            .join('')
        : '<div class="empty-state"><i class="fa-regular fa-bell-slash"></i><h4>You are all caught up</h4></div>';

      listEl.querySelectorAll('.notification-item').forEach((item) => {
        item.addEventListener('click', () => {
          Dash().markNotificationsRead?.(item.getAttribute('data-id'));
          render();
        });
      });
    }

    render();

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.topbar-btn-wrap.open').forEach((w) => {
        if (w !== wrap) w.classList.remove('open');
      });
      wrap.classList.toggle('open');
    });

    wrap.querySelector('[data-mark-all-read]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Dash().markNotificationsRead?.();
      render();
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });

    wrap._refresh = render;
  }

  function initSidebarNotifBadge() {
    const el = document.querySelector('[data-nav-badge="notifications"]');
    if (!el) return;
    const list = Dash().readNotifications ? Dash().readNotifications() : [];
    const unread = list.filter((n) => !n.read).length;
    if (unread > 0) {
      el.textContent = String(unread);
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  function initTopbarSearch() {
    document.querySelectorAll('[data-topbar-search]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = form.querySelector('input')?.value?.trim();
        if (q) toast(`Searching for "${q}"… (demo)`, 'info');
      });
    });
  }

  /**
   * Call once per page (after medicare:ready) to wire shared topbar/sidebar
   * chrome. Safe to call multiple times.
   */
  function initShell() {
    populateUserChrome();
    initProfileDropdown();
    initNotificationBell();
    initSidebarNotifBadge();
    initTopbarSearch();
  }

  /**
   * Refresh the topbar bell dropdown + sidebar unread badge. Call after
   * marking notifications read/unread from a page-specific script.
   */
  function refreshNotifUI() {
    const wrap = document.querySelector('[data-notif-wrap]');
    if (wrap && typeof wrap._refresh === 'function') wrap._refresh();
    initSidebarNotifBadge();
  }

  /* ================================================================== */
  /*  Public API                                                        */
  /* ================================================================== */

  const MediCareCustomer = {
    escapeHtml,
    fmtDate,
    fmtTime,
    fmtMoney,
    toast,
    firstName,
    greeting,
    memberSinceYear,
    loadAppointments,
    splitAppointments,
    nextAppointment,
    statusBadge,
    doctorAvatar,
    appointmentRows,
    renderAppointmentsTable,
    wireCancelButtons,
    getReports,
    getPrescriptions,
    getPayments,
    getTreatmentHistory,
    initShell,
    refreshNotifUI,
    iconForType,
    iconClassForType,
  };

  global.MediCareCustomer = MediCareCustomer;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareCustomer;
  }
})(typeof window !== 'undefined' ? window : globalThis);

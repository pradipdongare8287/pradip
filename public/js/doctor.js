/**
 * MediCare Plus — Doctor Panel Helpers
 * Powers doctor/*.html — dashboard stats, appointments, patients,
 * treatment notes, prescriptions, reports, and schedule.
 *
 * Depends on (must load first): data.js, auth.js, components.js,
 * appointment.js, dashboard.js, main.js
 *
 * Storage keys (localStorage):
 *   medicare_treatment_notes   — treatment note records
 *   medicare_prescriptions     — prescription records
 *   medicare_doctor_reports    — uploaded report metadata
 *   medicare_doctor_schedule   — weekly availability per doctor
 *   medicare_leave_requests    — leave requests per doctor
 */
(function (global) {
  'use strict';

  const Auth = () => global.MediCareAuth || {};
  const Data = () => global.MediCareData || {};
  const Appt = () => global.MediCareAppointment || {};
  const Comp = () => global.MediCareComponents || {};
  const Dash = () => global.MediCareDashboard || {};

  const LS = {
    treatments: 'medicare_treatment_notes',
    prescriptions: 'medicare_prescriptions',
    reports: 'medicare_doctor_reports',
    schedule: 'medicare_doctor_schedule',
    leaves: 'medicare_leave_requests',
    seedFlag: 'medicare_doctor_seed_v2',
  };

  const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  /* ================================================================== */
  /*  Generic storage helpers                                          */
  /* ================================================================== */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function esc(str) {
    return Comp().escapeHtml ? Comp().escapeHtml(str) : String(str ?? '');
  }

  function fmtDate(d) {
    return Comp().formatDate ? Comp().formatDate(d) : d;
  }

  function fmtTime(t) {
    return Comp().formatTime ? Comp().formatTime(t) : t;
  }

  function fmtCurrency(n) {
    return Comp().formatCurrency ? Comp().formatCurrency(n) : `$${n}`;
  }

  function toast(msg, type) {
    if (Comp().showToast) Comp().showToast(msg, type);
  }

  function addDays(baseISO, delta) {
    const d = new Date(`${baseISO}T12:00:00`);
    d.setDate(d.getDate() + delta);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /* ================================================================== */
  /*  Doctor identity                                                   */
  /* ================================================================== */

  function getDoctorUser() {
    return Auth().getCurrentUser?.() || null;
  }

  function getDoctorId() {
    const user = getDoctorUser();
    return (user && user.doctorId) || 'd1';
  }

  function getDoctorRecord() {
    const rec = Data().getDoctor?.(getDoctorId());
    return (
      rec || {
        id: getDoctorId(),
        name: getDoctorUser()?.name || 'Doctor',
        specialty: getDoctorUser()?.specialty || 'General Physician',
        departmentId: getDoctorUser()?.departmentId || '',
        fees: 150,
        experience: 10,
        rating: 4.8,
        image: getDoctorUser()?.avatar || '',
      }
    );
  }

  /* ================================================================== */
  /*  Demo data seeding (idempotent)                                    */
  /* ================================================================== */

  function seedDemoData() {
    if (localStorage.getItem(LS.seedFlag) === '1') return;
    const A = Appt();
    if (!A.readAppointments) return;

    const doctorId = getDoctorId();
    const doctorRec = getDoctorRecord();
    const dept = Data().getDepartment?.(doctorRec.departmentId);
    const patients = Data().samplePatients || [];
    const today = A.todayISO ? A.todayISO() : new Date().toISOString().slice(0, 10);
    const fees = doctorRec.fees || 150;

    const p = (i) => patients[i % patients.length] || { id: `guest-${i}`, name: `Guest Patient ${i}` };

    const seeds = [
      { date: today, time: '09:00', patient: p(0), reason: 'Follow-up: chest discomfort', status: 'approved' },
      { date: today, time: '11:30', patient: p(2), reason: 'Post-operative review', status: 'pending' },
      { date: today, time: '15:00', patient: p(4), reason: 'Routine wellness check-up', status: 'pending' },
      { date: addDays(today, 1), time: '10:00', patient: p(1), reason: 'Lab result discussion', status: 'approved' },
      { date: addDays(today, 2), time: '09:30', patient: p(3), reason: 'New patient consultation', status: 'pending' },
      { date: addDays(today, 3), time: '14:00', patient: p(0), reason: 'Medication review', status: 'approved' },
      { date: addDays(today, -1), time: '10:30', patient: p(3), reason: 'General check-up', status: 'cancelled' },
      { date: addDays(today, -2), time: '09:00', patient: p(0), reason: 'Annual physical exam', status: 'completed' },
      { date: addDays(today, -5), time: '11:00', patient: p(1), reason: 'Blood pressure monitoring', status: 'completed' },
      { date: addDays(today, -8), time: '14:30', patient: p(2), reason: 'Knee pain assessment', status: 'completed' },
      { date: addDays(today, -12), time: '10:00', patient: p(4), reason: 'Diabetes management', status: 'completed' },
      { date: addDays(today, -15), time: '09:30', patient: p(1), reason: 'Routine follow-up', status: 'completed' },
    ];

    const list = A.readAppointments();
    seeds.forEach((s, idx) => {
      list.push({
        id: `dseed-${idx}-${doctorId}`,
        patientId: s.patient.id,
        patientName: s.patient.name,
        patientEmail: s.patient.email || '',
        patientPhone: s.patient.phone || '',
        doctorId,
        doctorName: doctorRec.name,
        departmentId: doctorRec.departmentId || '',
        departmentName: dept?.name || '',
        date: s.date,
        time: s.time,
        reason: s.reason,
        status: s.status,
        fees,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    writeJSON(A.STORAGE_KEY || 'medicare_appointments', list);
    localStorage.setItem(LS.seedFlag, '1');
  }

  /* ================================================================== */
  /*  Sidebar collapse fix-up (dashboard.css keys off .dashboard-layout,
      dashboard.js toggles body — inject matching rules once)          */
  /* ================================================================== */

  function injectSidebarFix() {
    if (document.getElementById('doctor-sidebar-fix')) return;
    const style = document.createElement('style');
    style.id = 'doctor-sidebar-fix';
    style.textContent = `
      body.sidebar-collapsed .sidebar { width: var(--sidebar-collapsed); }
      body.sidebar-collapsed .sidebar .nav-label,
      body.sidebar-collapsed .sidebar .sidebar-brand-text,
      body.sidebar-collapsed .sidebar .nav-badge,
      body.sidebar-collapsed .sidebar .sidebar-user-info { display: none; }
      body.sidebar-collapsed .sidebar .nav-item { justify-content: center; padding: 0.85rem; }
      body.sidebar-collapsed .sidebar .sidebar-brand { justify-content: center; padding: 1.25rem 0.75rem; }
      body.sidebar-collapsed .dashboard-main { margin-left: var(--sidebar-collapsed); }
      @media (max-width: 992px) {
        body.sidebar-collapsed .dashboard-main { margin-left: 0; }
        body.sidebar-collapsed .sidebar { width: var(--sidebar-width); }
        body.sidebar-collapsed .sidebar .nav-label,
        body.sidebar-collapsed .sidebar .sidebar-brand-text,
        body.sidebar-collapsed .sidebar .nav-badge,
        body.sidebar-collapsed .sidebar .sidebar-user-info { display: block; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ================================================================== */
  /*  Sidebar user / topbar profile                                    */
  /* ================================================================== */

  function initSidebarUser() {
    const user = getDoctorUser();
    const rec = getDoctorRecord();
    document.querySelectorAll('[data-doctor-avatar]').forEach((el) => {
      el.src = user?.avatar || rec.image || '';
      el.alt = user?.name || rec.name || 'Doctor';
    });
    document.querySelectorAll('[data-doctor-name]').forEach((el) => {
      el.textContent = user?.name || rec.name || 'Doctor';
    });
    document.querySelectorAll('[data-doctor-specialty]').forEach((el) => {
      el.textContent = rec.specialty || user?.specialty || 'General Physician';
    });
  }

  function initProfileDropdown() {
    const dropdown = document.querySelector('.profile-dropdown');
    if (!dropdown) return;
    const trigger = dropdown.querySelector('.profile-trigger');
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.topbar-btn-wrap.open').forEach((w) => w.classList.remove('open'));
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });
  }

  /* ================================================================== */
  /*  Notification dropdown (topbar bell)                              */
  /* ================================================================== */

  function notifIcon(type) {
    const map = {
      appointment: 'fa-calendar-check',
      lab: 'fa-flask-vial',
      system: 'fa-gear',
      review: 'fa-star',
    };
    return map[type] || 'fa-bell';
  }

  function renderNotifDropdown() {
    const wrap = document.querySelector('[data-notif-wrap]');
    const panel = document.querySelector('[data-notif-panel]');
    const badge = document.querySelector('[data-notif-count]');
    if (!wrap || !panel) return;

    const list = Dash().readNotifications ? Dash().readNotifications() : [];
    const unread = list.filter((n) => !n.read).length;

    if (badge) {
      badge.textContent = unread > 0 ? String(unread) : '';
      badge.style.display = unread > 0 ? '' : 'none';
    }

    panel.innerHTML = `
      <div class="notif-dropdown-header">
        <h4>Notifications</h4>
        <a href="#" data-mark-all-read>Mark all read</a>
      </div>
      <ul class="notification-list">
        ${
          list.length
            ? list
                .slice(0, 8)
                .map(
                  (n) => `
          <li class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
            <div class="notification-icon"><i class="fa-solid ${notifIcon(n.type)}"></i></div>
            <div class="notification-body">
              <h5>${esc(n.title)}</h5>
              <p>${esc(n.text)}</p>
              <span class="notif-time">${esc(n.time)}</span>
            </div>
            ${!n.read ? '<span class="unread-dot"></span>' : ''}
          </li>`
                )
                .join('')
            : '<li class="notification-item"><div class="notification-body"><p>No notifications yet.</p></div></li>'
        }
      </ul>
      <div class="notif-dropdown-footer">
        <a href="dashboard.html#notifications">View all notifications</a>
      </div>
    `;

    panel.querySelector('[data-mark-all-read]')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      Dash().markNotificationsRead?.();
      renderNotifDropdown();
      renderNotificationsSection();
    });

    panel.querySelectorAll('.notification-item[data-id]').forEach((item) => {
      item.addEventListener('click', () => {
        Dash().markNotificationsRead?.(item.getAttribute('data-id'));
        renderNotifDropdown();
        renderNotificationsSection();
      });
    });
  }

  function initNotifDropdown() {
    const wrap = document.querySelector('[data-notif-wrap]');
    if (!wrap) return;
    const trigger = wrap.querySelector('[data-notif-toggle]');
    renderNotifDropdown();
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelector('.profile-dropdown')?.classList.remove('open');
      wrap.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) wrap.classList.remove('open');
    });
  }

  /**
   * Full notifications list section (Dashboard page, id="notifications")
   */
  function renderNotificationsSection() {
    const el = document.querySelector('[data-notifications-full]');
    if (!el) return;
    const list = Dash().readNotifications ? Dash().readNotifications() : [];

    el.innerHTML = list.length
      ? list
          .map(
            (n) => `
      <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}" style="cursor:pointer;">
        <div class="notification-icon"><i class="fa-solid ${notifIcon(n.type)}"></i></div>
        <div class="notification-body">
          <h5>${esc(n.title)}</h5>
          <p>${esc(n.text)}</p>
          <span class="notif-time">${esc(n.time)}</span>
        </div>
        ${!n.read ? '<span class="unread-dot"></span>' : ''}
      </div>`
          )
          .join('')
      : '<div class="dashboard-empty"><i class="fa-regular fa-bell-slash"></i><h4>No notifications</h4><p>You are all caught up.</p></div>';

    el.querySelectorAll('.notification-item[data-id]').forEach((item) => {
      item.addEventListener('click', () => {
        Dash().markNotificationsRead?.(item.getAttribute('data-id'));
        renderNotificationsSection();
        renderNotifDropdown();
      });
    });
  }

  /* ================================================================== */
  /*  Sidebar badges (pending appointments count)                      */
  /* ================================================================== */

  function initSidebarBadges() {
    const stats = computeStats();
    document.querySelectorAll('[data-badge="pending-count"]').forEach((el) => {
      if (stats.pendingCount > 0) {
        el.textContent = String(stats.pendingCount);
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  /* ================================================================== */
  /*  Stats                                                             */
  /* ================================================================== */

  function computeStats() {
    const A = Appt();
    const doctorId = getDoctorId();
    const list = A.getAppointmentsByDoctor ? A.getAppointmentsByDoctor(doctorId) : [];
    const today = A.todayISO ? A.todayISO() : new Date().toISOString().slice(0, 10);

    const todays = list.filter((a) => a.date === today && a.status !== 'cancelled');
    const pending = list.filter((a) => a.status === 'pending');
    const completed = list.filter((a) => a.status === 'completed');
    const patientsSeen = new Set(completed.map((a) => a.patientId)).size;
    const earnings = completed.reduce((sum, a) => sum + (Number(a.fees) || 0), 0);

    return {
      list,
      today,
      todayCount: todays.length,
      todayList: todays,
      pendingCount: pending.length,
      patientsSeen,
      earnings,
      completedCount: completed.length,
    };
  }

  /* ================================================================== */
  /*  Patients list (derived from appointments + sample records)       */
  /* ================================================================== */

  function getMyPatients() {
    const stats = computeStats();
    const samples = Data().samplePatients || [];
    const byId = new Map();

    stats.list.forEach((a) => {
      if (!a.patientId) return;
      const sample = samples.find((p) => p.id === a.patientId);
      const existing = byId.get(a.patientId) || {
        id: a.patientId,
        name: a.patientName,
        email: sample?.email || a.patientEmail || '',
        phone: sample?.phone || a.patientPhone || '',
        age: sample?.age ?? null,
        gender: sample?.gender || '',
        bloodGroup: sample?.bloodGroup || '',
        address: sample?.address || '',
        status: sample?.status || 'active',
        visits: 0,
        lastVisit: null,
        appointments: [],
      };
      existing.visits += 1;
      existing.appointments.push(a);
      if (!existing.lastVisit || a.date > existing.lastVisit) existing.lastVisit = a.date;
      byId.set(a.patientId, existing);
    });

    return Array.from(byId.values()).sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''));
  }

  function statusColor(status) {
    const map = {
      pending: 'var(--warning)',
      approved: 'var(--primary)',
      completed: 'var(--secondary)',
      cancelled: 'var(--danger)',
    };
    return map[status] || 'var(--primary)';
  }

  function getPatientAvatar(gender) {
    if (gender === 'male') return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
    if (gender === 'female') return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80';
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';
  }

  /* ================================================================== */
  /*  DASHBOARD PAGE                                                    */
  /* ================================================================== */

  function initDashboardPage() {
    const stats = computeStats();
    const rec = getDoctorRecord();
    const user = getDoctorUser();

    setText('[data-welcome-name]', (user?.name || rec.name || 'Doctor').split(' ').slice(-1)[0] || 'Doctor');
    setText('[data-stat-today]', String(stats.todayCount));
    setText('[data-stat-patients]', String(stats.patientsSeen));
    setText('[data-stat-pending]', String(stats.pendingCount));
    setText('[data-stat-earnings]', fmtCurrency(stats.earnings));

    renderTodayList(stats);
    renderQuickChart(stats);
    renderNotificationsSection();
  }

  function setText(sel, text) {
    document.querySelectorAll(sel).forEach((el) => (el.textContent = text));
  }

  function renderTodayList(stats) {
    const el = document.querySelector('[data-today-list]');
    if (!el) return;

    if (!stats.todayList.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-regular fa-calendar"></i>
          <h4>No appointments today</h4>
          <p>Enjoy the quiet moment — new bookings will show up here.</p>
        </div>`;
      return;
    }

    el.innerHTML = stats.todayList
      .sort((a, b) => a.time.localeCompare(b.time))
      .map(
        (a) => `
      <div class="schedule-item">
        <div class="schedule-time">
          <strong>${fmtTime(a.time)}</strong>
          <span>Today</span>
        </div>
        <div class="schedule-divider" style="background:${statusColor(a.status)};"></div>
        <div class="schedule-info">
          <h5>${esc(a.patientName)}</h5>
          <p>${esc(a.reason || 'General consultation')}</p>
        </div>
        ${Comp().getStatusBadge ? Comp().getStatusBadge(a.status) : ''}
      </div>`
      )
      .join('');
  }

  function renderQuickChart(stats) {
    const canvas = document.getElementById('chart-patient-activity');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = [];
    const counts = [];
    const completedCounts = [];
    for (let i = 6; i >= 0; i--) {
      const dateStr = addDays(stats.today, -i);
      const dayName = Data().getDayName ? Data().getDayName(dateStr).slice(0, 3) : dateStr.slice(5);
      labels.push(dayName);
      counts.push(stats.list.filter((a) => a.date === dateStr && a.status !== 'cancelled').length);
      completedCounts.push(stats.list.filter((a) => a.date === dateStr && a.status === 'completed').length);
    }

    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#4A6072';

    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Visits',
            data: counts,
            borderColor: '#1FA97A',
            backgroundColor: 'rgba(31, 169, 122, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#1FA97A',
          },
          {
            label: 'Completed',
            data: completedCounts,
            borderColor: '#0B6E99',
            backgroundColor: 'rgba(11, 110, 153, 0.08)',
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointBackgroundColor: '#0B6E99',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, padding: 16 } } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(214,228,236,0.6)' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  /* ================================================================== */
  /*  APPOINTMENTS PAGE                                                 */
  /* ================================================================== */

  function initAppointmentsPage() {
    renderAppointmentTabs();
  }

  function renderAppointmentTabs() {
    const stats = computeStats();
    const groups = {
      today: stats.list.filter((a) => a.date === stats.today),
      upcoming: stats.list.filter((a) => a.date > stats.today && a.status !== 'cancelled' && a.status !== 'completed'),
      completed: stats.list.filter((a) => a.status === 'completed'),
      cancelled: stats.list.filter((a) => a.status === 'cancelled'),
    };

    Object.keys(groups).forEach((key) => {
      const el = document.querySelector(`[data-appt-panel="${key}"]`);
      if (!el) return;
      renderApptTable(el, groups[key], key);
    });

    setText('[data-count="today"]', String(groups.today.length));
    setText('[data-count="upcoming"]', String(groups.upcoming.length));
    setText('[data-count="completed"]', String(groups.completed.length));
    setText('[data-count="cancelled"]', String(groups.cancelled.length));
  }

  function renderApptTable(el, list, key) {
    if (!list.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-regular fa-calendar-xmark"></i>
          <h4>No ${key} appointments</h4>
          <p>Appointments matching this tab will appear here.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list
              .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`))
              .map(
                (a) => `
            <tr data-id="${a.id}">
              <td>
                <div class="user-meta">
                  <img src="${getPatientAvatar('')}" class="avatar avatar-sm" alt="" />
                  <div>
                    <div class="name">${esc(a.patientName)}</div>
                    <div class="sub">${esc(a.patientPhone || a.patientEmail || '—')}</div>
                  </div>
                </div>
              </td>
              <td>${fmtDate(a.date)}</td>
              <td>${fmtTime(a.time)}</td>
              <td>${esc(a.reason || '—')}</td>
              <td>${Comp().getStatusBadge ? Comp().getStatusBadge(a.status) : a.status}</td>
              <td class="table-actions">${apptActionButtons(a)}</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    el.querySelectorAll('[data-appt-action]').forEach((btn) => {
      btn.addEventListener('click', () => handleApptAction(btn));
    });
  }

  function apptActionButtons(a) {
    if (a.status === 'pending') {
      return `
        <button type="button" class="btn btn-sm btn-primary" data-appt-action="approved" data-id="${a.id}"><i class="fa-solid fa-check"></i> Approve</button>
        <button type="button" class="btn btn-sm btn-outline" data-appt-action="cancelled" data-id="${a.id}"><i class="fa-solid fa-xmark"></i> Cancel</button>`;
    }
    if (a.status === 'approved') {
      return `
        <button type="button" class="btn btn-sm btn-secondary" data-appt-action="completed" data-id="${a.id}"><i class="fa-solid fa-clipboard-check"></i> Complete</button>
        <button type="button" class="btn btn-sm btn-outline" data-appt-action="cancelled" data-id="${a.id}"><i class="fa-solid fa-xmark"></i> Cancel</button>`;
    }
    return '<span class="text-muted">—</span>';
  }

  function handleApptAction(btn) {
    const id = btn.getAttribute('data-id');
    const status = btn.getAttribute('data-appt-action');
    const result = Appt().updateAppointmentStatus?.(id, status);
    if (!result) return;
    toast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
      renderAppointmentTabs();
      initSidebarBadges();
    }
  }

  /* ================================================================== */
  /*  PATIENTS PAGE                                                     */
  /* ================================================================== */

  function initPatientsPage() {
    renderPatientsTable(getMyPatients());
    const search = document.querySelector('[data-patient-search]');
    search?.addEventListener('input', () => {
      const q = search.value.trim().toLowerCase();
      const all = getMyPatients();
      const filtered = !q
        ? all
        : all.filter((p) => [p.name, p.email, p.phone, p.bloodGroup].join(' ').toLowerCase().includes(q));
      renderPatientsTable(filtered);
    });
  }

  function renderPatientsTable(patients) {
    const el = document.querySelector('[data-patients-table]');
    if (!el) return;

    if (!patients.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-solid fa-hospital-user"></i>
          <h4>No patients found</h4>
          <p>Try a different search term.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="table" data-table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Contact</th>
              <th>Blood Group</th>
              <th>Visits</th>
              <th>Last Visit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${patients
              .map(
                (p) => `
            <tr data-id="${p.id}">
              <td>
                <div class="user-meta">
                  <img src="${getPatientAvatar(p.gender)}" class="avatar avatar-sm" alt="" />
                  <div class="name">${esc(p.name)}</div>
                </div>
              </td>
              <td>${p.age ? `${p.age} yrs` : '—'} ${p.gender ? `· ${esc(p.gender)}` : ''}</td>
              <td>${esc(p.phone || p.email || '—')}</td>
              <td><span class="badge badge-primary">${esc(p.bloodGroup || '—')}</span></td>
              <td>${p.visits}</td>
              <td>${p.lastVisit ? fmtDate(p.lastVisit) : '—'}</td>
              <td>${Comp().getStatusBadge ? Comp().getStatusBadge(p.status) : p.status}</td>
              <td class="table-actions">
                <button type="button" class="btn btn-sm btn-ghost" data-view-patient="${p.id}"><i class="fa-solid fa-eye"></i> View</button>
              </td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    el.querySelectorAll('[data-view-patient]').forEach((btn) => {
      btn.addEventListener('click', () => openPatientModal(btn.getAttribute('data-view-patient')));
    });
  }

  function openPatientModal(patientId) {
    const patients = getMyPatients();
    const p = patients.find((x) => x.id === patientId);
    if (!p) return;

    const modal = document.getElementById('patient-modal');
    if (!modal) return;

    modal.querySelector('[data-modal-patient-avatar]')?.setAttribute('src', getPatientAvatar(p.gender));
    setModalText(modal, '[data-modal-patient-name]', p.name);
    setModalText(modal, '[data-modal-patient-meta]', `${p.age ? p.age + ' yrs' : ''} ${p.gender ? '· ' + p.gender : ''} · ${p.bloodGroup || '—'}`);
    setModalText(modal, '[data-modal-patient-phone]', p.phone || '—');
    setModalText(modal, '[data-modal-patient-email]', p.email || '—');
    setModalText(modal, '[data-modal-patient-address]', p.address || '—');

    const history = modal.querySelector('[data-modal-patient-history]');
    if (history) {
      history.innerHTML = p.appointments
        .sort((a, b) => `${b.date}`.localeCompare(`${a.date}`))
        .map(
          (a) => `
        <div class="activity-item">
          <div class="activity-dot"><i class="fa-solid fa-calendar-day"></i></div>
          <div class="activity-content">
            <p><strong>${esc(a.reason || 'Consultation')}</strong> — ${fmtDate(a.date)} at ${fmtTime(a.time)}</p>
            <span class="activity-time">${Comp().getStatusBadge ? Comp().getStatusBadge(a.status) : a.status}</span>
          </div>
        </div>`
        )
        .join('');
    }

    const treatBtn = modal.querySelector('[data-modal-new-treatment]');
    if (treatBtn) treatBtn.href = `treatment.html?patient=${encodeURIComponent(p.id)}`;
    const rxBtn = modal.querySelector('[data-modal-new-rx]');
    if (rxBtn) rxBtn.href = `prescription.html?patient=${encodeURIComponent(p.id)}`;

    Comp().openModal?.(modal);
  }

  function setModalText(modal, sel, text) {
    const el = modal.querySelector(sel);
    if (el) el.textContent = text;
  }

  /* ================================================================== */
  /*  TREATMENT NOTES PAGE                                              */
  /* ================================================================== */

  function initTreatmentPage() {
    const patientSelect = document.querySelector('[data-treatment-patient]');
    if (patientSelect) {
      const patients = getMyPatients();
      patientSelect.innerHTML =
        '<option value="">Select Patient</option>' +
        patients.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

      const params = new URLSearchParams(window.location.search);
      const pre = params.get('patient');
      if (pre && patients.some((p) => p.id === pre)) patientSelect.value = pre;
    }

    const form = document.querySelector('[data-treatment-form]');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTreatmentNote(form, patientSelect);
    });

    renderTreatmentNotes();
  }

  function saveTreatmentNote(form, patientSelect) {
    const patientId = patientSelect?.value;
    const patients = getMyPatients();
    const patient = patients.find((p) => p.id === patientId);

    if (!patientId) {
      toast('Please select a patient.', 'warning');
      return;
    }

    const disease = form.querySelector('[name="disease"]')?.value.trim();
    const diagnosis = form.querySelector('[name="diagnosis"]')?.value.trim();
    const notes = form.querySelector('[name="notes"]')?.value.trim();
    const medicines = form.querySelector('[name="medicines"]')?.value.trim();
    const nextVisit = form.querySelector('[name="nextVisit"]')?.value;

    if (!disease || !diagnosis) {
      toast('Please fill in the disease/condition and diagnosis fields.', 'warning');
      return;
    }

    const record = {
      id: uid('tn'),
      doctorId: getDoctorId(),
      patientId,
      patientName: patient?.name || 'Patient',
      disease,
      diagnosis,
      notes,
      medicines,
      nextVisit: nextVisit || '',
      createdAt: new Date().toISOString(),
    };

    const list = readJSON(LS.treatments, []);
    list.unshift(record);
    writeJSON(LS.treatments, list);

    toast('Treatment note saved successfully.', 'success');
    form.reset();
    renderTreatmentNotes();
  }

  function renderTreatmentNotes() {
    const el = document.querySelector('[data-treatment-list]');
    if (!el) return;
    const list = readJSON(LS.treatments, []).filter((t) => t.doctorId === getDoctorId());

    if (!list.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-solid fa-notes-medical"></i>
          <h4>No treatment notes yet</h4>
          <p>Notes you save will appear here for quick reference.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr><th>Patient</th><th>Disease</th><th>Diagnosis</th><th>Next Visit</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            ${list
              .map(
                (t) => `
            <tr data-id="${t.id}">
              <td>${esc(t.patientName)}</td>
              <td>${esc(t.disease)}</td>
              <td>${esc((t.diagnosis || '').slice(0, 60))}${(t.diagnosis || '').length > 60 ? '…' : ''}</td>
              <td>${t.nextVisit ? fmtDate(t.nextVisit) : '—'}</td>
              <td>${fmtDate(t.createdAt)}</td>
              <td class="table-actions">
                <button type="button" class="btn btn-icon btn-sm btn-outline" data-delete-note="${t.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    el.querySelectorAll('[data-delete-note]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-note');
        const next = readJSON(LS.treatments, []).filter((t) => t.id !== id);
        writeJSON(LS.treatments, next);
        toast('Treatment note removed.', 'success');
        renderTreatmentNotes();
      });
    });
  }

  /* ================================================================== */
  /*  PRESCRIPTION PAGE                                                 */
  /* ================================================================== */

  function initPrescriptionPage() {
    const patientSelect = document.querySelector('[data-rx-patient]');
    if (patientSelect) {
      const patients = getMyPatients();
      patientSelect.innerHTML =
        '<option value="">Select Patient</option>' +
        patients.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');

      const params = new URLSearchParams(window.location.search);
      const pre = params.get('patient');
      if (pre && patients.some((p) => p.id === pre)) patientSelect.value = pre;
    }

    const dateInput = document.querySelector('[data-rx-date]');
    if (dateInput && !dateInput.value) {
      dateInput.value = Appt().todayISO ? Appt().todayISO() : new Date().toISOString().slice(0, 10);
    }

    const rowsBody = document.querySelector('[data-rx-rows]');
    document.querySelector('[data-rx-add-row]')?.addEventListener('click', () => addRxRow(rowsBody));
    if (rowsBody && !rowsBody.children.length) addRxRow(rowsBody);

    document.querySelector('[data-rx-preview-btn]')?.addEventListener('click', () => {
      if (renderPrescriptionPreview()) {
        document.querySelector('[data-rx-preview-wrap]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    document.querySelector('[data-rx-save-btn]')?.addEventListener('click', savePrescription);
    document.querySelector('[data-rx-print-btn]')?.addEventListener('click', () => window.print());
    document.querySelector('[data-rx-reset-btn]')?.addEventListener('click', () => {
      document.querySelector('[data-rx-form]')?.reset();
      if (rowsBody) {
        rowsBody.innerHTML = '';
        addRxRow(rowsBody);
      }
      const wrap = document.querySelector('[data-rx-preview-wrap]');
      if (wrap) wrap.style.display = 'none';
    });

    renderPrescriptionHistory();
  }

  function addRxRow(tbody) {
    if (!tbody) return;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="form-control" data-rx-field="name" placeholder="e.g. Amoxicillin 500mg" required /></td>
      <td><input type="text" class="form-control" data-rx-field="dosage" placeholder="1 tablet" /></td>
      <td><input type="text" class="form-control" data-rx-field="frequency" placeholder="3x daily" /></td>
      <td><input type="text" class="form-control" data-rx-field="duration" placeholder="5 days" /></td>
      <td><button type="button" class="btn btn-icon btn-sm btn-outline" data-rx-remove-row title="Remove"><i class="fa-solid fa-xmark"></i></button></td>
    `;
    row.querySelector('[data-rx-remove-row]')?.addEventListener('click', () => {
      if (tbody.children.length > 1) row.remove();
      else toast('At least one medicine row is required.', 'warning');
    });
    tbody.appendChild(row);
  }

  function collectRxRows() {
    const rows = document.querySelectorAll('[data-rx-rows] tr');
    const meds = [];
    rows.forEach((row) => {
      const name = row.querySelector('[data-rx-field="name"]')?.value.trim();
      if (!name) return;
      meds.push({
        name,
        dosage: row.querySelector('[data-rx-field="dosage"]')?.value.trim() || '—',
        frequency: row.querySelector('[data-rx-field="frequency"]')?.value.trim() || '—',
        duration: row.querySelector('[data-rx-field="duration"]')?.value.trim() || '—',
      });
    });
    return meds;
  }

  function renderPrescriptionPreview() {
    const patientSelect = document.querySelector('[data-rx-patient]');
    const patientId = patientSelect?.value;
    const patients = getMyPatients();
    const patient = patients.find((p) => p.id === patientId);

    if (!patientId) {
      toast('Please select a patient first.', 'warning');
      return false;
    }

    const meds = collectRxRows();
    if (!meds.length) {
      toast('Add at least one medicine.', 'warning');
      return false;
    }

    const rec = getDoctorRecord();
    const user = getDoctorUser();
    const date = document.querySelector('[data-rx-date]')?.value || (Appt().todayISO ? Appt().todayISO() : '');
    const advice = document.querySelector('[data-rx-advice]')?.value.trim() || 'Take medicines as prescribed. Stay hydrated and rest well.';
    const diagnosis = document.querySelector('[data-rx-diagnosis]')?.value.trim();

    const rxNo = `RX-${Date.now().toString(36).toUpperCase()}`;

    document.querySelectorAll('[data-preview-rx-no]').forEach((el) => (el.textContent = rxNo));
    document.querySelectorAll('[data-preview-date]').forEach((el) => (el.textContent = fmtDate(date)));
    document.querySelectorAll('[data-preview-patient-name]').forEach((el) => (el.textContent = patient?.name || '—'));
    document.querySelectorAll('[data-preview-patient-age]').forEach(
      (el) => (el.textContent = patient?.age ? `${patient.age} yrs / ${patient.gender || '—'}` : '—')
    );
    document.querySelectorAll('[data-preview-patient-id]').forEach((el) => (el.textContent = patient?.id || '—'));
    document.querySelectorAll('[data-preview-doctor-name]').forEach((el) => (el.textContent = user?.name || rec.name));
    document.querySelectorAll('[data-preview-doctor-specialty]').forEach((el) => (el.textContent = rec.specialty || ''));
    document.querySelectorAll('[data-preview-advice]').forEach((el) => (el.textContent = advice));
    document.querySelectorAll('[data-preview-diagnosis-wrap]').forEach((el) => {
      el.style.display = diagnosis ? '' : 'none';
      const span = el.querySelector('[data-preview-diagnosis]');
      if (span) span.textContent = diagnosis;
    });

    const medsBody = document.querySelector('[data-preview-meds]');
    if (medsBody) {
      medsBody.innerHTML = meds
        .map(
          (m, i) => `
        <tr>
          <td>${i + 1}. ${esc(m.name)}</td>
          <td>${esc(m.dosage)}</td>
          <td>${esc(m.frequency)}</td>
          <td>${esc(m.duration)}</td>
        </tr>`
        )
        .join('');
    }

    const wrap = document.querySelector('[data-rx-preview-wrap]');
    if (wrap) wrap.style.display = '';
    return { patient, meds, date, advice, diagnosis, rxNo };
  }

  function savePrescription() {
    const preview = renderPrescriptionPreview();
    if (!preview) return;

    const rec = getDoctorRecord();
    const record = {
      id: uid('rx'),
      rxNo: preview.rxNo,
      doctorId: getDoctorId(),
      doctorName: getDoctorUser()?.name || rec.name,
      patientId: preview.patient?.id,
      patientName: preview.patient?.name || 'Patient',
      date: preview.date,
      diagnosis: preview.diagnosis || '',
      medicines: preview.meds,
      advice: preview.advice,
      createdAt: new Date().toISOString(),
    };

    const list = readJSON(LS.prescriptions, []);
    list.unshift(record);
    writeJSON(LS.prescriptions, list);

    toast('Prescription saved successfully.', 'success');
    renderPrescriptionHistory();
  }

  function renderPrescriptionHistory() {
    const el = document.querySelector('[data-rx-history]');
    if (!el) return;
    const list = readJSON(LS.prescriptions, []).filter((r) => r.doctorId === getDoctorId());

    if (!list.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-solid fa-file-prescription"></i>
          <h4>No prescriptions saved yet</h4>
          <p>Generated prescriptions will be listed here.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr><th>Rx No.</th><th>Patient</th><th>Medicines</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            ${list
              .map(
                (r) => `
            <tr>
              <td><code>${esc(r.rxNo)}</code></td>
              <td>${esc(r.patientName)}</td>
              <td>${r.medicines.length} item${r.medicines.length > 1 ? 's' : ''}</td>
              <td>${fmtDate(r.date)}</td>
              <td class="table-actions">
                <button type="button" class="btn btn-icon btn-sm btn-outline" data-delete-rx="${r.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    el.querySelectorAll('[data-delete-rx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-rx');
        writeJSON(LS.prescriptions, readJSON(LS.prescriptions, []).filter((r) => r.id !== id));
        toast('Prescription removed.', 'success');
        renderPrescriptionHistory();
      });
    });
  }

  /* ================================================================== */
  /*  REPORTS PAGE                                                      */
  /* ================================================================== */

  function initReportsPage() {
    const patientSelect = document.querySelector('[data-report-patient]');
    if (patientSelect) {
      const patients = getMyPatients();
      patientSelect.innerHTML =
        '<option value="">Select Patient</option>' +
        patients.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
    }

    const fileInput = document.querySelector('[data-report-file]');
    const fileLabel = document.querySelector('[data-report-file-label]');
    fileInput?.addEventListener('change', () => {
      if (fileLabel) {
        fileLabel.textContent = fileInput.files?.length
          ? Array.from(fileInput.files).map((f) => f.name).join(', ')
          : 'Drag & drop files here, or click to browse';
      }
    });

    document.querySelector('[data-report-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      uploadReport(patientSelect, fileInput);
    });

    const search = document.querySelector('[data-report-search]');
    search?.addEventListener('input', () => renderReportsList(search.value));

    renderReportsList();
  }

  function uploadReport(patientSelect, fileInput) {
    const patientId = patientSelect?.value;
    const patients = getMyPatients();
    const patient = patients.find((p) => p.id === patientId);
    const typeSelect = document.querySelector('[data-report-type]');
    const titleInput = document.querySelector('[data-report-title]');

    if (!patientId) {
      toast('Please select a patient.', 'warning');
      return;
    }
    if (!fileInput?.files?.length) {
      toast('Please choose at least one file to upload.', 'warning');
      return;
    }

    const list = readJSON(LS.reports, []);
    Array.from(fileInput.files).forEach((file) => {
      list.unshift({
        id: uid('rep'),
        doctorId: getDoctorId(),
        patientId,
        patientName: patient?.name || 'Patient',
        title: titleInput?.value.trim() || file.name,
        type: typeSelect?.value || 'General',
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        uploadedAt: new Date().toISOString(),
      });
    });
    writeJSON(LS.reports, list);

    toast('Report uploaded successfully (demo — stored locally).', 'success');
    document.querySelector('[data-report-form]')?.reset();
    const fileLabel = document.querySelector('[data-report-file-label]');
    if (fileLabel) fileLabel.textContent = 'Drag & drop files here, or click to browse';
    renderReportsList();
  }

  function renderReportsList(query) {
    const el = document.querySelector('[data-reports-list]');
    if (!el) return;
    let list = readJSON(LS.reports, []).filter((r) => r.doctorId === getDoctorId());

    const q = (query || '').trim().toLowerCase();
    if (q) list = list.filter((r) => [r.patientName, r.title, r.type].join(' ').toLowerCase().includes(q));

    if (!list.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-solid fa-file-medical"></i>
          <h4>No reports uploaded</h4>
          <p>Upload lab results, scans, or documents to keep patient records complete.</p>
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="table">
          <thead>
            <tr><th>Patient</th><th>Report</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${list
              .map(
                (r) => `
            <tr>
              <td>${esc(r.patientName)}</td>
              <td><i class="fa-solid fa-file-lines text-primary"></i> ${esc(r.title)}</td>
              <td><span class="badge badge-primary">${esc(r.type)}</span></td>
              <td>${esc(r.fileSize)}</td>
              <td>${fmtDate(r.uploadedAt)}</td>
              <td class="table-actions">
                <button type="button" class="btn btn-icon btn-sm btn-ghost" data-view-report title="Preview"><i class="fa-solid fa-eye"></i></button>
                <button type="button" class="btn btn-icon btn-sm btn-outline" data-delete-report="${r.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;

    el.querySelectorAll('[data-view-report]').forEach((btn) => {
      btn.addEventListener('click', () => toast('Preview is not available in this offline demo.', 'info'));
    });
    el.querySelectorAll('[data-delete-report]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-report');
        writeJSON(LS.reports, readJSON(LS.reports, []).filter((r) => r.id !== id));
        toast('Report removed.', 'success');
        renderReportsList(document.querySelector('[data-report-search]')?.value);
      });
    });
  }

  /* ================================================================== */
  /*  SCHEDULE PAGE                                                     */
  /* ================================================================== */

  function defaultSchedule() {
    const rec = getDoctorRecord();
    const availableDays = rec.availability?.days || [];
    const sched = {};
    WEEK_DAYS.forEach((day) => {
      sched[day] = {
        available: availableDays.includes(day),
        start: '09:00',
        end: '17:00',
      };
    });
    return sched;
  }

  function initSchedulePage() {
    renderWorkingHoursSummary();
    renderScheduleGrid();
    document.querySelector('[data-schedule-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSchedule();
    });

    document.querySelector('[data-leave-form]')?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitLeaveRequest(e.target);
    });

    renderLeaveRequests();
  }

  function renderWorkingHoursSummary() {
    const rec = getDoctorRecord();
    const el = document.querySelector('[data-working-hours]');
    if (!el) return;
    const days = (rec.availability?.days || []).join(', ') || 'Not set';
    const times = (rec.availability?.times || []).map(fmtTime).join(', ') || 'Not set';
    el.innerHTML = `
      <div class="schedule-item">
        <div class="schedule-time"><strong><i class="fa-solid fa-calendar-check"></i></strong><span>Days</span></div>
        <div class="schedule-divider" style="background:var(--primary);"></div>
        <div class="schedule-info"><h5>Working Days</h5><p>${esc(days)}</p></div>
      </div>
      <div class="schedule-item">
        <div class="schedule-time"><strong><i class="fa-solid fa-clock"></i></strong><span>Slots</span></div>
        <div class="schedule-divider" style="background:var(--secondary);"></div>
        <div class="schedule-info"><h5>Available Time Slots</h5><p>${esc(times)}</p></div>
      </div>
      <div class="schedule-item">
        <div class="schedule-time"><strong>${fmtCurrency(rec.fees || 0)}</strong><span>Fee</span></div>
        <div class="schedule-divider" style="background:var(--warning);"></div>
        <div class="schedule-info"><h5>Consultation Fee</h5><p>Per visit, standard consultation</p></div>
      </div>
    `;
  }

  function renderScheduleGrid() {
    const el = document.querySelector('[data-schedule-grid]');
    if (!el) return;
    const doctorId = getDoctorId();
    const all = readJSON(LS.schedule, {});
    const sched = all[doctorId] || defaultSchedule();

    el.innerHTML = WEEK_DAYS.map(
      (day) => `
      <div class="schedule-item" data-day="${day}">
        <label class="form-check" style="min-width:150px;">
          <input type="checkbox" data-day-toggle ${sched[day]?.available ? 'checked' : ''} />
          <span>${day}</span>
        </label>
        <div class="form-row" style="flex:1;margin:0;gap:0.75rem;">
          <input type="time" class="form-control" data-day-start value="${sched[day]?.start || '09:00'}" ${sched[day]?.available ? '' : 'disabled'} />
          <input type="time" class="form-control" data-day-end value="${sched[day]?.end || '17:00'}" ${sched[day]?.available ? '' : 'disabled'} />
        </div>
      </div>`
    ).join('');

    el.querySelectorAll('[data-day-toggle]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const item = cb.closest('.schedule-item');
        item.querySelectorAll('[data-day-start],[data-day-end]').forEach((input) => {
          input.disabled = !cb.checked;
        });
      });
    });
  }

  function saveSchedule() {
    const doctorId = getDoctorId();
    const all = readJSON(LS.schedule, {});
    const sched = {};

    document.querySelectorAll('[data-schedule-grid] [data-day]').forEach((item) => {
      const day = item.getAttribute('data-day');
      sched[day] = {
        available: item.querySelector('[data-day-toggle]')?.checked || false,
        start: item.querySelector('[data-day-start]')?.value || '09:00',
        end: item.querySelector('[data-day-end]')?.value || '17:00',
      };
    });

    all[doctorId] = sched;
    writeJSON(LS.schedule, all);
    toast('Weekly availability updated successfully.', 'success');
  }

  function submitLeaveRequest(form) {
    const from = form.querySelector('[name="fromDate"]')?.value;
    const to = form.querySelector('[name="toDate"]')?.value;
    const reason = form.querySelector('[name="reason"]')?.value.trim();

    if (!from || !to) {
      toast('Please select both start and end dates.', 'warning');
      return;
    }
    if (to < from) {
      toast('End date cannot be before the start date.', 'warning');
      return;
    }
    if (!reason) {
      toast('Please provide a reason for your leave request.', 'warning');
      return;
    }

    const list = readJSON(LS.leaves, []);
    list.unshift({
      id: uid('lv'),
      doctorId: getDoctorId(),
      fromDate: from,
      toDate: to,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    writeJSON(LS.leaves, list);

    toast('Leave request submitted for admin approval.', 'success');
    form.reset();
    renderLeaveRequests();
  }

  function renderLeaveRequests() {
    const el = document.querySelector('[data-leave-list]');
    if (!el) return;
    const list = readJSON(LS.leaves, []).filter((l) => l.doctorId === getDoctorId());

    if (!list.length) {
      el.innerHTML = `
        <div class="dashboard-empty">
          <i class="fa-solid fa-plane-departure"></i>
          <h4>No leave requests</h4>
          <p>Submitted leave requests will appear here with their approval status.</p>
        </div>`;
      return;
    }

    el.innerHTML = list
      .map(
        (l) => `
      <div class="schedule-item" data-id="${l.id}">
        <div class="schedule-time">
          <strong>${fmtDate(l.fromDate)}</strong>
          <span>to ${fmtDate(l.toDate)}</span>
        </div>
        <div class="schedule-divider" style="background:${l.status === 'approved' ? 'var(--secondary)' : l.status === 'cancelled' ? 'var(--danger)' : 'var(--warning)'};"></div>
        <div class="schedule-info">
          <h5>${esc(l.reason)}</h5>
          <p>Requested ${fmtDate(l.createdAt)}</p>
        </div>
        ${Comp().getStatusBadge ? Comp().getStatusBadge(l.status) : l.status}
        ${
          l.status === 'pending'
            ? `<div class="schedule-actions"><button type="button" class="btn btn-icon btn-sm btn-outline" data-cancel-leave="${l.id}" title="Cancel request"><i class="fa-solid fa-xmark"></i></button></div>`
            : ''
        }
      </div>`
      )
      .join('');

    el.querySelectorAll('[data-cancel-leave]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-cancel-leave');
        const next = readJSON(LS.leaves, []).map((l) => (l.id === id ? { ...l, status: 'cancelled' } : l));
        writeJSON(LS.leaves, next);
        toast('Leave request cancelled.', 'success');
        renderLeaveRequests();
      });
    });
  }

  /* ================================================================== */
  /*  PROFILE PAGE                                                      */
  /* ================================================================== */

  function initProfilePage() {
    const user = getDoctorUser();
    const rec = getDoctorRecord();
    const stats = computeStats();

    setText('[data-profile-avatar-name]', user?.name || rec.name || '');
    setText('[data-profile-specialty-tag]', rec.specialty || '');
    setText('[data-profile-stat-experience]', `${rec.experience ?? '—'}`);
    setText('[data-profile-stat-patients]', String(stats.patientsSeen));

    const deptSelect = document.querySelector('[name="departmentId"]');
    if (deptSelect) {
      const depts = Data().departments || [];
      deptSelect.innerHTML = depts.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
      deptSelect.value = user?.departmentId || rec.departmentId || '';
    }
  }

  /* ================================================================== */
  /*  Boot                                                              */
  /* ================================================================== */

  const PAGE_INIT = {
    dashboard: initDashboardPage,
    profile: initProfilePage,
    appointments: initAppointmentsPage,
    patients: initPatientsPage,
    treatment: initTreatmentPage,
    prescription: initPrescriptionPage,
    reports: initReportsPage,
    schedule: initSchedulePage,
  };

  function boot() {
    const user = Auth().requireAuth ? Auth().requireAuth('doctor', '../login.html') : Auth().getCurrentUser?.();
    if (!user) return;

    injectSidebarFix();
    seedDemoData();
    initSidebarUser();
    initProfileDropdown();
    initNotifDropdown();
    initSidebarBadges();

    const page = document.body.getAttribute('data-page') || '';
    PAGE_INIT[page]?.();
  }

  if (global.MediCare && typeof global.MediCare.ready === 'function') {
    global.MediCare.ready(boot);
  } else {
    document.addEventListener('medicare:ready', boot, { once: true });
  }

  global.MediCareDoctor = {
    getDoctorUser,
    getDoctorRecord,
    getDoctorId,
    computeStats,
    getMyPatients,
    renderAppointmentTabs,
    renderNotifDropdown,
    renderNotificationsSection,
  };
})(typeof window !== 'undefined' ? window : globalThis);

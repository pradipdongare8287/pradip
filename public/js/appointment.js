/**
 * MediCare Plus — Appointment Booking (localStorage)
 * Storage key: medicare_appointments
 * Statuses: pending | approved | completed | cancelled
 *
 * Expects form fields (ids or name attrs):
 *   #appt-department, #appt-doctor, #appt-date, #appt-time,
 *   #appt-name, #appt-email, #appt-phone, #appt-reason
 * Or a form with [data-appointment-form]
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'medicare_appointments';
  const STATUSES = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  });

  /* ------------------------------------------------------------------ */
  /*  Storage                                                           */
  /* ------------------------------------------------------------------ */

  function readAppointments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seedIfEmpty();
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : seedIfEmpty();
    } catch {
      return seedIfEmpty();
    }
  }

  function writeAppointments(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function seedIfEmpty() {
    const samples =
      (global.MediCareData && global.MediCareData.sampleAppointments) || [];
    const copy = samples.map((a) => ({ ...a }));
    writeAppointments(copy);
    return copy;
  }

  function uid() {
    return `apt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function toast(msg, type) {
    if (global.MediCareComponents?.showToast) {
      global.MediCareComponents.showToast(msg, type);
    } else if (global.MediCare?.showToast) {
      global.MediCare.showToast(msg, type);
    } else {
      console.log(`[${type || 'info'}]`, msg);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  CRUD                                                              */
  /* ------------------------------------------------------------------ */

  function getAppointments(userId) {
    const all = readAppointments();
    if (!userId) return all.slice().sort(sortByDateDesc);
    return all
      .filter(
        (a) =>
          a.patientId === userId ||
          a.doctorId === userId ||
          a.userId === userId
      )
      .sort(sortByDateDesc);
  }

  function getAppointmentById(id) {
    return readAppointments().find((a) => a.id === id) || null;
  }

  function getAppointmentsByDoctor(doctorId) {
    return readAppointments()
      .filter((a) => a.doctorId === doctorId)
      .sort(sortByDateDesc);
  }

  function getAppointmentsByStatus(status) {
    return readAppointments()
      .filter((a) => a.status === status)
      .sort(sortByDateDesc);
  }

  function sortByDateDesc(a, b) {
    const da = `${a.date}T${a.time || '00:00'}`;
    const db = `${b.date}T${b.time || '00:00'}`;
    return db.localeCompare(da);
  }

  /**
   * @param {object} data
   * @returns {{ success: boolean, appointment?: object, message: string }}
   */
  function saveAppointment(data) {
    const validation = validateAppointment(data);
    if (!validation.valid) {
      return { success: false, message: validation.message };
    }

    const Data = global.MediCareData;
    const dept = Data?.getDepartment?.(data.departmentId);
    const doctor = Data?.getDoctor?.(data.doctorId);

    const user =
      global.MediCareAuth?.getCurrentUser?.() || null;

    const appointment = {
      id: uid(),
      patientId: user?.id || data.patientId || 'guest',
      patientName: data.patientName || user?.name || 'Guest',
      patientEmail: data.patientEmail || user?.email || '',
      patientPhone: data.patientPhone || user?.phone || '',
      doctorId: data.doctorId,
      doctorName: doctor?.name || data.doctorName || '',
      departmentId: data.departmentId,
      departmentName: dept?.name || data.departmentName || '',
      date: data.date,
      time: data.time,
      reason: data.reason || '',
      status: STATUSES.PENDING,
      fees: doctor?.fees || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Prevent double-booking same doctor/date/time (unless cancelled)
    const existing = readAppointments();
    const clash = existing.some(
      (a) =>
        a.doctorId === appointment.doctorId &&
        a.date === appointment.date &&
        a.time === appointment.time &&
        a.status !== STATUSES.CANCELLED
    );
    if (clash) {
      return {
        success: false,
        message: 'That time slot is already booked. Please choose another.',
      };
    }

    existing.push(appointment);
    writeAppointments(existing);

    return {
      success: true,
      appointment,
      message: 'Appointment booked successfully! Status: Pending approval.',
    };
  }

  function updateAppointmentStatus(id, status) {
    const allowed = Object.values(STATUSES);
    if (!allowed.includes(status)) {
      return { success: false, message: 'Invalid status.' };
    }

    const list = readAppointments();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) {
      return { success: false, message: 'Appointment not found.' };
    }

    list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();
    writeAppointments(list);

    return {
      success: true,
      appointment: list[idx],
      message: `Appointment marked as ${status}.`,
    };
  }

  function cancelAppointment(id) {
    return updateAppointmentStatus(id, STATUSES.CANCELLED);
  }

  function deleteAppointment(id) {
    const list = readAppointments().filter((a) => a.id !== id);
    writeAppointments(list);
    return { success: true, message: 'Appointment removed.' };
  }

  /* ------------------------------------------------------------------ */
  /*  Validation                                                        */
  /* ------------------------------------------------------------------ */

  function validateAppointment(data) {
    if (!data) return { valid: false, message: 'Missing appointment data.' };
    if (!data.departmentId) return { valid: false, message: 'Please select a department.' };
    if (!data.doctorId) return { valid: false, message: 'Please select a doctor.' };
    if (!data.date) return { valid: false, message: 'Please choose a date.' };
    if (!data.time) return { valid: false, message: 'Please choose a time slot.' };

    const today = todayISO();
    if (data.date < today) {
      return { valid: false, message: 'Appointment date cannot be in the past.' };
    }

    const name = data.patientName || '';
    const email = data.patientEmail || '';
    if (!name.trim()) return { valid: false, message: 'Please enter your full name.' };
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, message: 'Please enter a valid email.' };
    }

    // Doctor availability day check
    const Data = global.MediCareData;
    if (Data?.getAvailableSlots) {
      const slots = Data.getAvailableSlots(data.doctorId, data.date);
      if (!slots.length) {
        return {
          valid: false,
          message: 'Doctor is not available on the selected day.',
        };
      }
      if (!slots.includes(data.time)) {
        return {
          valid: false,
          message: 'Selected time is not available for this doctor.',
        };
      }
    }

    return { valid: true, message: 'OK' };
  }

  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /* ------------------------------------------------------------------ */
  /*  Form UI helpers                                                   */
  /* ------------------------------------------------------------------ */

  /**
   * Populate department <select>, wire doctor filtering, date min, time slots.
   * @param {HTMLFormElement|string} formOrSelector
   */
  function initAppointmentForm(formOrSelector) {
    const form =
      typeof formOrSelector === 'string'
        ? document.querySelector(formOrSelector)
        : formOrSelector || document.querySelector('[data-appointment-form], #appointment-form');

    if (!form) return null;

    const deptSelect =
      form.querySelector('#appt-department, [name="departmentId"], [name="department"]');
    const doctorSelect =
      form.querySelector('#appt-doctor, [name="doctorId"], [name="doctor"]');
    const dateInput = form.querySelector('#appt-date, [name="date"]');
    const timeSelect = form.querySelector('#appt-time, [name="time"]');
    const nameInput = form.querySelector('#appt-name, [name="patientName"], [name="name"]');
    const emailInput = form.querySelector('#appt-email, [name="patientEmail"], [name="email"]');
    const phoneInput = form.querySelector('#appt-phone, [name="patientPhone"], [name="phone"]');
    const reasonInput = form.querySelector('#appt-reason, [name="reason"]');

    const Data = global.MediCareData;
    if (!Data) {
      console.warn('MediCareData is required for appointment form.');
      return null;
    }

    // Prefill from logged-in user
    const user = global.MediCareAuth?.getCurrentUser?.();
    if (user) {
      if (nameInput && !nameInput.value) nameInput.value = user.name || '';
      if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = user.phone || '';
    }

    // Departments
    if (deptSelect) {
      const current = deptSelect.value;
      deptSelect.innerHTML =
        '<option value="">Select Department</option>' +
        Data.departments
          .map((d) => `<option value="${d.id}">${d.name}</option>`)
          .join('');
      if (current) deptSelect.value = current;

      // URL ?dept= or hash
      const params = new URLSearchParams(window.location.search);
      const preDept = params.get('dept') || params.get('department') || window.location.hash.replace('#', '');
      if (preDept && Data.getDepartment(preDept)) {
        deptSelect.value = preDept;
      }
    }

    // Date: min = today
    if (dateInput) {
      dateInput.setAttribute('min', todayISO());
      dateInput.setAttribute('type', 'date');
    }

    function refreshDoctors() {
      if (!doctorSelect) return;
      const deptId = deptSelect?.value || '';
      const doctors = deptId
        ? Data.filterDoctors({ dept: deptId })
        : Data.doctors.slice();

      const prev = doctorSelect.value;
      doctorSelect.innerHTML =
        '<option value="">Select Doctor</option>' +
        doctors
          .map(
            (d) =>
              `<option value="${d.id}" data-fees="${d.fees}">${d.name} — ${d.specialty}</option>`
          )
          .join('');

      // URL ?doctor=
      const params = new URLSearchParams(window.location.search);
      const preDoc = params.get('doctor') || params.get('doctorId');
      if (preDoc && doctors.some((d) => d.id === preDoc)) {
        doctorSelect.value = preDoc;
      } else if (prev && doctors.some((d) => d.id === prev)) {
        doctorSelect.value = prev;
      }

      refreshTimeSlots();
      updateFeesDisplay();
    }

    function refreshTimeSlots() {
      if (!timeSelect) return;
      const doctorId = doctorSelect?.value;
      const date = dateInput?.value;
      const prev = timeSelect.value;

      if (!doctorId || !date) {
        timeSelect.innerHTML = '<option value="">Select date &amp; doctor first</option>';
        return;
      }

      let slots = Data.getAvailableSlots
        ? Data.getAvailableSlots(doctorId, date)
        : Data.timeSlots || [];

      // Remove already booked slots
      const booked = readAppointments()
        .filter(
          (a) =>
            a.doctorId === doctorId &&
            a.date === date &&
            a.status !== STATUSES.CANCELLED
        )
        .map((a) => a.time);

      slots = slots.filter((s) => !booked.includes(s));

      if (!slots.length) {
        timeSelect.innerHTML =
          '<option value="">No slots available this day</option>';
        return;
      }

      const formatTime =
        global.MediCareComponents?.formatTime ||
        ((t) => t);

      timeSelect.innerHTML =
        '<option value="">Select Time</option>' +
        slots
          .map((s) => `<option value="${s}">${formatTime(s)}</option>`)
          .join('');

      if (prev && slots.includes(prev)) timeSelect.value = prev;
    }

    function updateFeesDisplay() {
      const feesEl = form.querySelector('[data-appt-fees], #appt-fees');
      if (!feesEl || !doctorSelect) return;
      const opt = doctorSelect.selectedOptions[0];
      const fees = opt?.getAttribute('data-fees');
      if (fees) {
        const fmt =
          global.MediCareComponents?.formatCurrency ||
          ((n) => `$${n}`);
        feesEl.textContent = fmt(fees);
      } else {
        feesEl.textContent = '—';
      }
    }

    deptSelect?.addEventListener('change', refreshDoctors);
    doctorSelect?.addEventListener('change', () => {
      refreshTimeSlots();
      updateFeesDisplay();
    });
    dateInput?.addEventListener('change', refreshTimeSlots);

    refreshDoctors();

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const payload = {
        departmentId: deptSelect?.value || '',
        doctorId: doctorSelect?.value || '',
        date: dateInput?.value || '',
        time: timeSelect?.value || '',
        patientName: nameInput?.value?.trim() || '',
        patientEmail: emailInput?.value?.trim() || '',
        patientPhone: phoneInput?.value?.trim() || '',
        reason: reasonInput?.value?.trim() || '',
      };

      const result = saveAppointment(payload);
      if (!result.success) {
        toast(result.message, 'error');
        return;
      }

      toast(result.message, 'success');
      form.reset();
      if (dateInput) dateInput.setAttribute('min', todayISO());
      refreshDoctors();

      form.dispatchEvent(
        new CustomEvent('appointment:booked', { detail: result.appointment })
      );

      // Optional redirect for logged-in patients
      const redirect = form.getAttribute('data-success-redirect');
      if (redirect) {
        setTimeout(() => {
          window.location.href = redirect;
        }, 1200);
      }
    });

    return {
      refreshDoctors,
      refreshTimeSlots,
      form,
    };
  }

  /**
   * Render a simple appointments table into a container.
   */
  function renderAppointmentsTable(container, appointments, options) {
    const el =
      typeof container === 'string'
        ? document.querySelector(container)
        : container;
    if (!el) return;

    const opts = options || {};
    const list = appointments || getAppointments(opts.userId);
    const badge =
      global.MediCareComponents?.getStatusBadge ||
      ((s) => s);
    const fmtDate =
      global.MediCareComponents?.formatDate || ((d) => d);
    const fmtTime =
      global.MediCareComponents?.formatTime || ((t) => t);

    if (!list.length) {
      el.innerHTML =
        '<p class="empty-state">No appointments found.</p>';
      return;
    }

    el.innerHTML = `
      <div class="table-responsive">
        <table class="data-table" data-table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              ${opts.actions !== false ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${list
              .map(
                (a) => `
              <tr data-id="${a.id}">
                <td><code>${a.id}</code></td>
                <td>${escape(a.patientName)}</td>
                <td>${escape(a.doctorName)}</td>
                <td>${escape(a.departmentName)}</td>
                <td>${fmtDate(a.date)}</td>
                <td>${fmtTime(a.time)}</td>
                <td>${badge(a.status)}</td>
                ${
                  opts.actions !== false
                    ? `<td class="table-actions">
                        ${actionButtons(a, opts)}
                      </td>`
                    : ''
                }
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;

    el.querySelectorAll('[data-appt-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-appt-action');
        const map = {
          approve: STATUSES.APPROVED,
          complete: STATUSES.COMPLETED,
          cancel: STATUSES.CANCELLED,
          pending: STATUSES.PENDING,
        };
        if (map[action]) {
          const res = updateAppointmentStatus(id, map[action]);
          toast(res.message, res.success ? 'success' : 'error');
          if (res.success && typeof opts.onUpdate === 'function') {
            opts.onUpdate(res.appointment);
          } else if (res.success) {
            renderAppointmentsTable(el, getAppointments(opts.userId), opts);
          }
        }
      });
    });
  }

  function actionButtons(a, opts) {
    const role = opts.role || global.MediCareAuth?.getCurrentUser?.()?.role;
    if (role === 'patient') {
      if (a.status === STATUSES.PENDING || a.status === STATUSES.APPROVED) {
        return `<button type="button" class="btn btn-sm btn-outline" data-appt-action="cancel" data-id="${a.id}">Cancel</button>`;
      }
      return '—';
    }
    // doctor / admin
    let html = '';
    if (a.status === STATUSES.PENDING) {
      html += `<button type="button" class="btn btn-sm btn-primary" data-appt-action="approve" data-id="${a.id}">Approve</button> `;
      html += `<button type="button" class="btn btn-sm btn-outline" data-appt-action="cancel" data-id="${a.id}">Cancel</button>`;
    } else if (a.status === STATUSES.APPROVED) {
      html += `<button type="button" class="btn btn-sm btn-secondary" data-appt-action="complete" data-id="${a.id}">Complete</button> `;
      html += `<button type="button" class="btn btn-sm btn-outline" data-appt-action="cancel" data-id="${a.id}">Cancel</button>`;
    } else {
      html = '—';
    }
    return html;
  }

  function escape(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ------------------------------------------------------------------ */
  /*  Stats helpers for dashboards                                      */
  /* ------------------------------------------------------------------ */

  function getAppointmentStats() {
    const all = readAppointments();
    return {
      total: all.length,
      pending: all.filter((a) => a.status === STATUSES.PENDING).length,
      approved: all.filter((a) => a.status === STATUSES.APPROVED).length,
      completed: all.filter((a) => a.status === STATUSES.COMPLETED).length,
      cancelled: all.filter((a) => a.status === STATUSES.CANCELLED).length,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                        */
  /* ------------------------------------------------------------------ */

  const MediCareAppointment = {
    STORAGE_KEY,
    STATUSES,
    getAppointments,
    getAppointmentById,
    getAppointmentsByDoctor,
    getAppointmentsByStatus,
    saveAppointment,
    updateAppointmentStatus,
    cancelAppointment,
    deleteAppointment,
    validateAppointment,
    initAppointmentForm,
    renderAppointmentsTable,
    getAppointmentStats,
    todayISO,
    readAppointments,
  };

  global.MediCareAppointment = MediCareAppointment;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareAppointment;
  }
})(typeof window !== 'undefined' ? window : globalThis);

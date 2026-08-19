/**
 * MediCare Plus — Admin Panel Helpers
 * CRUD layers (localStorage-backed, seeded from MediCareData), analytics,
 * table controllers (search + filter + pagination), and page bootstraps
 * for admin/*.html.
 *
 * Load order: data.js → auth.js → components.js → appointment.js →
 *             dashboard.js → admin.js → main.js
 */
(function (global) {
  'use strict';

  const STORAGE = {
    doctors: 'medicare_admin_doctors',
    departments: 'medicare_admin_departments',
    treatments: 'medicare_admin_treatments',
    medicines: 'medicare_admin_medicines',
    patientsExtra: 'medicare_admin_patients_extra',
    patientOverrides: 'medicare_admin_patient_overrides',
    patientDeleted: 'medicare_admin_patient_deleted',
    settings: 'medicare_hospital_settings',
  };

  const C = () => global.MediCareComponents || {};
  const Auth = () => global.MediCareAuth || {};
  const Data = () => global.MediCareData || {};
  const Appt = () => global.MediCareAppointment || {};

  /* ================================================================== */
  /*  Low-level storage helpers                                         */
  /* ================================================================== */

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
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

  function slugifyName(name) {
    return (
      String(name || 'doctor')
        .toLowerCase()
        .replace(/^dr\.?\s*/, '')
        .trim()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.|\.$/g, '') || 'doctor'
    );
  }

  /* ================================================================== */
  /*  Formatting / UI helpers                                           */
  /* ================================================================== */

  function esc(str) {
    return C().escapeHtml ? C().escapeHtml(str) : String(str ?? '');
  }
  function fmtDate(d) {
    return d ? (C().formatDate ? C().formatDate(d) : d) : '—';
  }
  function fmtTime(t) {
    return t ? (C().formatTime ? C().formatTime(t) : t) : '—';
  }
  function fmtCurrency(n) {
    return C().formatCurrency ? C().formatCurrency(n) : `$${Number(n || 0).toFixed(0)}`;
  }
  function toast(msg, type) {
    C().showToast?.(msg, type);
  }
  function confirmDelete(message) {
    return window.confirm(
      message || 'Are you sure you want to delete this record? This action cannot be undone.'
    );
  }

  const STATUS_LABELS = {
    pending: 'Pending',
    approved: 'Approved',
    completed: 'Completed',
    cancelled: 'Cancelled',
    active: 'Active',
    inactive: 'Inactive',
    confirmed: 'Confirmed',
    scheduled: 'Scheduled',
  };

  function statusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    const label = STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1);
    return `<span class="status-badge ${s}">${label}</span>`;
  }

  function stockBadge(stock) {
    const n = Number(stock) || 0;
    if (n < 100) return '<span class="status-badge cancelled">Low Stock</span>';
    if (n < 250) return '<span class="status-badge pending">Medium Stock</span>';
    return '<span class="status-badge approved">In Stock</span>';
  }

  function fillSelect(selectEl, items, opts) {
    if (!selectEl) return;
    const o = opts || {};
    const valueKey = o.valueKey || 'id';
    const labelKey = o.labelKey || 'name';
    const optionsHtml = items
      .map((it) => `<option value="${esc(it[valueKey])}">${esc(it[labelKey])}</option>`)
      .join('');
    selectEl.innerHTML = (o.placeholder != null ? `<option value="">${esc(o.placeholder)}</option>` : '') + optionsHtml;
  }

  function fillSelectFromValues(selectEl, values, placeholder) {
    if (!selectEl) return;
    selectEl.innerHTML =
      `<option value="all">${esc(placeholder || 'All')}</option>` +
      values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  }

  function fillForm(form, data) {
    if (!form) return;
    form.reset();
    Object.keys(data || {}).forEach((key) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === 'checkbox') field.checked = !!data[key];
      else field.value = data[key] ?? '';
    });
  }

  function formData(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function uniqueValues(list, key) {
    return Array.from(new Set(list.map((item) => item[key]).filter(Boolean)));
  }

  /* ================================================================== */
  /*  Generic searchable / filterable / paginated table controller      */
  /* ================================================================== */

  function createListController(opts) {
    const {
      tbody,
      getRows,
      renderRow,
      searchFields,
      filterAttr,
      pageSize = 8,
      emptyMessage = 'No records found.',
      colSpan = 6,
      paginationEl,
      onCount,
    } = opts;

    const tbodyEl = typeof tbody === 'string' ? document.getElementById(tbody) : tbody;
    const pagEl =
      paginationEl && typeof paginationEl === 'string' ? document.getElementById(paginationEl) : paginationEl;

    const state = { search: '', filter: 'all', page: 1 };

    function matchesSearch(record) {
      if (!state.search) return true;
      const q = state.search.toLowerCase();
      if (typeof searchFields === 'function') return searchFields(record, q);
      return (searchFields || []).some((f) => String(record[f] ?? '').toLowerCase().includes(q));
    }

    function matchesFilter(record) {
      if (!state.filter || state.filter === 'all') return true;
      return String(record[filterAttr || 'status'] ?? '').toLowerCase() === state.filter.toLowerCase();
    }

    function render() {
      if (!tbodyEl) return;
      const all = getRows() || [];
      const filtered = all.filter((r) => matchesSearch(r) && matchesFilter(r));
      const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * pageSize;
      const pageItems = filtered.slice(start, start + pageSize);

      tbodyEl.innerHTML = pageItems.length
        ? pageItems.map(renderRow).join('')
        : `<tr><td colspan="${colSpan}"><div class="dashboard-empty"><i class="fa-solid fa-inbox"></i><h4>Nothing here yet</h4><p>${esc(
            emptyMessage
          )}</p></div></td></tr>`;

      if (pagEl) {
        pagEl.innerHTML = `
          <button type="button" class="btn btn-sm btn-outline" data-pg="prev" ${state.page <= 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span class="pagination-info">Page ${state.page} of ${totalPages} · ${filtered.length} total</span>
          <button type="button" class="btn btn-sm btn-outline" data-pg="next" ${
            state.page >= totalPages ? 'disabled' : ''
          }>
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        `;
        pagEl.querySelector('[data-pg="prev"]')?.addEventListener('click', () => {
          state.page -= 1;
          render();
        });
        pagEl.querySelector('[data-pg="next"]')?.addEventListener('click', () => {
          state.page += 1;
          render();
        });
      }

      if (typeof onCount === 'function') onCount(filtered.length, all.length);
    }

    return {
      render,
      refresh: render,
      setSearch(v) {
        state.search = v || '';
        state.page = 1;
        render();
      },
      setFilter(v) {
        state.filter = v || 'all';
        state.page = 1;
        render();
      },
    };
  }

  /* ================================================================== */
  /*  Doctors                                                            */
  /* ================================================================== */

  function seedDoctors() {
    const list = (Data().doctors || []).map((d, i) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      departmentId: d.departmentId,
      experience: d.experience,
      rating: d.rating,
      reviews: d.reviews,
      image: d.image,
      fees: d.fees,
      gender: d.gender || '',
      email: `${slugifyName(d.name)}@medicareplus.com`,
      phone: `+1 555-06${String(10 + i).padStart(2, '0')}`,
      status: 'active',
      joinedAt: '2024-02-01',
    }));
    writeJSON(STORAGE.doctors, list);
    return list;
  }

  function getDoctors() {
    const list = readJSON(STORAGE.doctors, null);
    return Array.isArray(list) && list.length ? list : seedDoctors();
  }

  function getDoctorById(id) {
    return getDoctors().find((d) => d.id === id) || null;
  }

  function addDoctor(data) {
    const name = String(data.name || '').trim();
    const specialty = String(data.specialty || '').trim();
    const departmentId = String(data.departmentId || '').trim();
    const fees = Number(data.fees);
    if (!name || !specialty || !departmentId) {
      return { success: false, message: 'Name, specialty, and department are required.' };
    }
    if (!Number.isFinite(fees) || fees < 0) {
      return { success: false, message: 'Please enter a valid consultation fee.' };
    }

    const list = getDoctors();
    const doctor = {
      id: uid('doc'),
      name,
      specialty,
      departmentId,
      experience: Number(data.experience) || 0,
      fees,
      rating: data.rating ? Number(data.rating) : 4.5,
      reviews: 0,
      gender: data.gender || '',
      email: data.email || `${slugifyName(name)}@medicareplus.com`,
      phone: data.phone || '',
      image:
        data.image ||
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
      status: 'active',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    list.push(doctor);
    writeJSON(STORAGE.doctors, list);
    return { success: true, doctor, message: 'Doctor added successfully.' };
  }

  function updateDoctor(id, data) {
    const list = getDoctors();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return { success: false, message: 'Doctor not found.' };
    const fees = data.fees !== undefined ? Number(data.fees) : list[idx].fees;
    if (!Number.isFinite(fees) || fees < 0) {
      return { success: false, message: 'Please enter a valid consultation fee.' };
    }
    list[idx] = {
      ...list[idx],
      ...data,
      experience: data.experience !== undefined ? Number(data.experience) : list[idx].experience,
      fees,
      rating: data.rating !== undefined && data.rating !== '' ? Number(data.rating) : list[idx].rating,
    };
    writeJSON(STORAGE.doctors, list);
    return { success: true, doctor: list[idx], message: 'Doctor updated successfully.' };
  }

  function deleteDoctor(id) {
    writeJSON(STORAGE.doctors, getDoctors().filter((d) => d.id !== id));
    return { success: true, message: 'Doctor removed.' };
  }

  function toggleDoctorStatus(id) {
    const list = getDoctors();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return { success: false, message: 'Doctor not found.' };
    list[idx].status = list[idx].status === 'active' ? 'inactive' : 'active';
    writeJSON(STORAGE.doctors, list);
    return { success: true, doctor: list[idx], message: `Doctor marked as ${list[idx].status}.` };
  }

  /* ================================================================== */
  /*  Departments                                                        */
  /* ================================================================== */

  function seedDepartments() {
    const list = (Data().departments || []).map((d) => ({
      id: d.id,
      name: d.name,
      icon: d.icon,
      description: d.description,
      image: d.image,
      beds: d.beds,
    }));
    writeJSON(STORAGE.departments, list);
    return list;
  }

  function getDepartments() {
    const list = readJSON(STORAGE.departments, null);
    return Array.isArray(list) && list.length ? list : seedDepartments();
  }

  function getDepartmentById(id) {
    return getDepartments().find((d) => d.id === id) || null;
  }

  function addDepartment(data) {
    const name = String(data.name || '').trim();
    if (!name) return { success: false, message: 'Department name is required.' };
    const list = getDepartments();
    let id = slugifyName(name);
    if (list.some((d) => d.id === id)) id = uid('dept');
    const dept = {
      id,
      name,
      icon: data.icon || 'fa-solid fa-house-medical',
      description: data.description || '',
      image:
        data.image ||
        'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      beds: Number(data.beds) || 10,
    };
    list.push(dept);
    writeJSON(STORAGE.departments, list);
    return { success: true, department: dept, message: 'Department added successfully.' };
  }

  function updateDepartment(id, data) {
    const list = getDepartments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) return { success: false, message: 'Department not found.' };
    list[idx] = { ...list[idx], ...data, beds: data.beds !== undefined ? Number(data.beds) : list[idx].beds };
    writeJSON(STORAGE.departments, list);
    return { success: true, department: list[idx], message: 'Department updated successfully.' };
  }

  function deleteDepartment(id) {
    if (getDoctors().some((d) => d.departmentId === id)) {
      return { success: false, message: 'Cannot delete — doctors are still assigned to this department.' };
    }
    writeJSON(STORAGE.departments, getDepartments().filter((d) => d.id !== id));
    return { success: true, message: 'Department removed.' };
  }

  /* ================================================================== */
  /*  Treatments                                                         */
  /* ================================================================== */

  function seedTreatments() {
    const list = (Data().treatments || []).map((t) => ({
      id: t.id,
      name: t.name,
      department: t.department,
      description: t.description,
      price: t.price,
      duration: t.duration,
      image: t.image,
      status: 'active',
    }));
    writeJSON(STORAGE.treatments, list);
    return list;
  }

  function getTreatments() {
    const list = readJSON(STORAGE.treatments, null);
    return Array.isArray(list) && list.length ? list : seedTreatments();
  }

  function getTreatmentById(id) {
    return getTreatments().find((t) => t.id === id) || null;
  }

  function addTreatment(data) {
    const name = String(data.name || '').trim();
    const price = Number(data.price);
    if (!name || !data.department) {
      return { success: false, message: 'Treatment name and department are required.' };
    }
    if (!Number.isFinite(price) || price < 0) {
      return { success: false, message: 'Please enter a valid price.' };
    }
    const list = getTreatments();
    const t = {
      id: uid('trt'),
      name,
      department: data.department,
      description: data.description || '',
      price,
      duration: data.duration || '30 min',
      image:
        data.image ||
        'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
      status: 'active',
    };
    list.push(t);
    writeJSON(STORAGE.treatments, list);
    return { success: true, treatment: t, message: 'Treatment added successfully.' };
  }

  function updateTreatment(id, data) {
    const list = getTreatments();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, message: 'Treatment not found.' };
    const price = data.price !== undefined ? Number(data.price) : list[idx].price;
    if (!Number.isFinite(price) || price < 0) {
      return { success: false, message: 'Please enter a valid price.' };
    }
    list[idx] = { ...list[idx], ...data, price };
    writeJSON(STORAGE.treatments, list);
    return { success: true, treatment: list[idx], message: 'Treatment updated successfully.' };
  }

  function deleteTreatment(id) {
    writeJSON(STORAGE.treatments, getTreatments().filter((t) => t.id !== id));
    return { success: true, message: 'Treatment removed.' };
  }

  function toggleTreatmentStatus(id) {
    const list = getTreatments();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return { success: false, message: 'Treatment not found.' };
    list[idx].status = list[idx].status === 'active' ? 'inactive' : 'active';
    writeJSON(STORAGE.treatments, list);
    return { success: true, treatment: list[idx], message: `Treatment marked as ${list[idx].status}.` };
  }

  /* ================================================================== */
  /*  Medicines                                                          */
  /* ================================================================== */

  function seedMedicines() {
    const list = (Data().medicines || []).map((m) => ({ ...m }));
    writeJSON(STORAGE.medicines, list);
    return list;
  }

  function getMedicines() {
    const list = readJSON(STORAGE.medicines, null);
    return Array.isArray(list) && list.length ? list : seedMedicines();
  }

  function getMedicineById(id) {
    return getMedicines().find((m) => m.id === id) || null;
  }

  function addMedicine(data) {
    const name = String(data.name || '').trim();
    const stock = Number(data.stock);
    const price = Number(data.price);
    if (!name) return { success: false, message: 'Medicine name is required.' };
    if (!Number.isFinite(stock) || stock < 0) {
      return { success: false, message: 'Please enter a valid stock quantity.' };
    }
    if (!Number.isFinite(price) || price < 0) {
      return { success: false, message: 'Please enter a valid price.' };
    }
    const list = getMedicines();
    const m = {
      id: uid('med'),
      name,
      category: data.category || 'General',
      stock,
      price,
      unit: data.unit || 'strip',
      manufacturer: data.manufacturer || '—',
      description: data.description || '',
    };
    list.push(m);
    writeJSON(STORAGE.medicines, list);
    return { success: true, medicine: m, message: 'Medicine added to inventory.' };
  }

  function updateMedicine(id, data) {
    const list = getMedicines();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return { success: false, message: 'Medicine not found.' };
    const stock = data.stock !== undefined ? Number(data.stock) : list[idx].stock;
    const price = data.price !== undefined ? Number(data.price) : list[idx].price;
    if (!Number.isFinite(stock) || stock < 0) {
      return { success: false, message: 'Please enter a valid stock quantity.' };
    }
    if (!Number.isFinite(price) || price < 0) {
      return { success: false, message: 'Please enter a valid price.' };
    }
    list[idx] = { ...list[idx], ...data, stock, price };
    writeJSON(STORAGE.medicines, list);
    return { success: true, medicine: list[idx], message: 'Medicine updated successfully.' };
  }

  function deleteMedicine(id) {
    writeJSON(STORAGE.medicines, getMedicines().filter((m) => m.id !== id));
    return { success: true, message: 'Medicine removed from inventory.' };
  }

  function adjustStock(id, delta) {
    const list = getMedicines();
    const idx = list.findIndex((m) => m.id === id);
    if (idx === -1) return { success: false, message: 'Medicine not found.' };
    list[idx].stock = Math.max(0, Number(list[idx].stock || 0) + delta);
    writeJSON(STORAGE.medicines, list);
    return { success: true, medicine: list[idx], message: `Stock updated to ${list[idx].stock}.` };
  }

  /* ================================================================== */
  /*  Patients                                                           */
  /* ================================================================== */

  function normalizeFromAuth(u) {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      age: u.age ?? null,
      gender: u.gender || '',
      bloodGroup: u.bloodGroup || '',
      address: u.address || '',
      lastVisit: u.lastVisit || '',
      status: u.status || 'active',
    };
  }

  function getPatients() {
    const authList = (Auth().getAllUsers?.() || []).filter((u) => u.role === 'patient').map(normalizeFromAuth);
    const sampleList = (Data().samplePatients || []).map((p) => ({ ...p }));
    const extra = readJSON(STORAGE.patientsExtra, []);

    const byId = new Map();
    [...sampleList, ...authList, ...extra].forEach((p) => {
      byId.set(p.id, { ...(byId.get(p.id) || {}), ...p });
    });

    const overrides = readJSON(STORAGE.patientOverrides, {});
    const deleted = new Set(readJSON(STORAGE.patientDeleted, []));

    return Array.from(byId.values())
      .filter((p) => !deleted.has(p.id))
      .map((p) => (overrides[p.id] ? { ...p, ...overrides[p.id] } : p))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }

  function getPatientById(id) {
    return getPatients().find((p) => p.id === id) || null;
  }

  function addPatient(data) {
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    if (!name || !email) return { success: false, message: 'Name and email are required.' };
    if (getPatients().some((p) => String(p.email).toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'A patient with this email already exists.' };
    }
    const extra = readJSON(STORAGE.patientsExtra, []);
    const patient = {
      id: uid('pat'),
      name,
      email,
      phone: data.phone || '',
      age: data.age ? Number(data.age) : null,
      gender: data.gender || '',
      bloodGroup: data.bloodGroup || '',
      address: data.address || '',
      lastVisit: data.lastVisit || '',
      status: data.status === 'inactive' ? 'inactive' : 'active',
    };
    extra.push(patient);
    writeJSON(STORAGE.patientsExtra, extra);
    return { success: true, patient, message: 'Patient added successfully.' };
  }

  function updatePatient(id, data) {
    const extra = readJSON(STORAGE.patientsExtra, []);
    const idx = extra.findIndex((p) => p.id === id);
    const payload = {
      ...data,
      age: data.age !== undefined && data.age !== '' ? Number(data.age) : data.age === '' ? null : undefined,
    };
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    if (idx > -1) {
      extra[idx] = { ...extra[idx], ...payload };
      writeJSON(STORAGE.patientsExtra, extra);
    } else {
      const overrides = readJSON(STORAGE.patientOverrides, {});
      overrides[id] = { ...(overrides[id] || {}), ...payload };
      writeJSON(STORAGE.patientOverrides, overrides);
    }
    return { success: true, message: 'Patient updated successfully.' };
  }

  function deletePatient(id) {
    let extra = readJSON(STORAGE.patientsExtra, []);
    if (extra.some((p) => p.id === id)) {
      extra = extra.filter((p) => p.id !== id);
      writeJSON(STORAGE.patientsExtra, extra);
    } else {
      const deleted = readJSON(STORAGE.patientDeleted, []);
      if (!deleted.includes(id)) deleted.push(id);
      writeJSON(STORAGE.patientDeleted, deleted);
    }
    return { success: true, message: 'Patient removed.' };
  }

  /* ================================================================== */
  /*  Appointments (admin-side helpers on top of MediCareAppointment)    */
  /* ================================================================== */

  function addAppointmentAdmin(data) {
    const name = String(data.patientName || '').trim();
    if (!name) return { success: false, message: 'Patient name is required.' };
    if (!data.doctorId) return { success: false, message: 'Please select a doctor.' };
    if (!data.date || !data.time) return { success: false, message: 'Please choose a date and time.' };

    const doctor = getDoctorById(data.doctorId);
    const dept = getDepartmentById(data.departmentId) || (doctor ? getDepartmentById(doctor.departmentId) : null);
    const list = Appt().readAppointments ? Appt().readAppointments() : [];

    const clash = list.some(
      (a) => a.doctorId === data.doctorId && a.date === data.date && a.time === data.time && a.status !== 'cancelled'
    );
    if (clash) return { success: false, message: 'That time slot is already booked for this doctor.' };

    const appt = {
      id: uid('apt'),
      patientId: data.patientId || `walkin-${Date.now().toString(36)}`,
      patientName: name,
      patientEmail: data.patientEmail || '',
      patientPhone: data.patientPhone || '',
      doctorId: data.doctorId,
      doctorName: doctor?.name || '',
      departmentId: doctor?.departmentId || data.departmentId || '',
      departmentName: dept?.name || '',
      date: data.date,
      time: data.time,
      reason: data.reason || '',
      status: 'pending',
      fees: doctor?.fees || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(appt);
    localStorage.setItem(Appt().STORAGE_KEY || 'medicare_appointments', JSON.stringify(list));
    return { success: true, appointment: appt, message: 'Appointment created successfully.' };
  }

  /* ================================================================== */
  /*  Hospital settings                                                  */
  /* ================================================================== */

  function seedSettings() {
    const h = Data().hospital || {};
    const settings = {
      name: h.name || 'MediCare Plus',
      phone: h.phone || '',
      emergency: h.emergency || '',
      email: h.email || '',
      supportEmail: h.supportEmail || '',
      address: h.address || '',
      hoursWeekdays: h.hours?.weekdays || '',
      hoursSaturday: h.hours?.saturday || '',
      hoursSunday: h.hours?.sunday || '',
      maintenanceMode: false,
      cms: { gallery: true, booking: true, testimonials: true, blogs: true, newsletter: true },
      updatedAt: new Date().toISOString(),
    };
    writeJSON(STORAGE.settings, settings);
    return settings;
  }

  function getSettings() {
    const s = readJSON(STORAGE.settings, null);
    return s && typeof s === 'object' ? { cms: {}, ...s } : seedSettings();
  }

  function saveSettings(data) {
    const current = getSettings();
    const merged = {
      ...current,
      ...data,
      cms: { ...current.cms, ...(data.cms || {}) },
      updatedAt: new Date().toISOString(),
    };
    writeJSON(STORAGE.settings, merged);
    return { success: true, settings: merged, message: 'Settings saved successfully.' };
  }

  /* ================================================================== */
  /*  Analytics / stats                                                  */
  /* ================================================================== */

  function getOverviewStats() {
    const doctors = getDoctors();
    const patients = getPatients();
    const appts = Appt().readAppointments ? Appt().readAppointments() : [];
    const today = Appt().todayISO ? Appt().todayISO() : new Date().toISOString().slice(0, 10);
    const completed = appts.filter((a) => a.status === 'completed');
    const revenue = completed.reduce((sum, a) => sum + (Number(a.fees) || 0), 0);
    const medicines = getMedicines();

    return {
      totalDoctors: doctors.length,
      activeDoctors: doctors.filter((d) => d.status === 'active').length,
      totalPatients: patients.length,
      todayAppointments: appts.filter((a) => a.date === today).length,
      totalAppointments: appts.length,
      pendingAppointments: appts.filter((a) => a.status === 'pending').length,
      approvedAppointments: appts.filter((a) => a.status === 'approved').length,
      completedAppointments: completed.length,
      cancelledAppointments: appts.filter((a) => a.status === 'cancelled').length,
      revenue,
      departments: getDepartments().length,
      treatments: getTreatments().length,
      totalMedicines: medicines.length,
      lowStockMedicines: medicines.filter((m) => Number(m.stock) < 100).length,
    };
  }

  function getMonthlyTrend(months) {
    const n = months || 6;
    const appts = Appt().readAppointments ? Appt().readAppointments() : [];
    const now = new Date();
    const labels = [];
    const counts = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const real = appts.filter((a) => String(a.date || '').startsWith(key)).length;
      const trendBase = 46 + (n - 1 - i) * 7;
      labels.push(label);
      counts.push(trendBase + real * 4);
    }
    return { labels, counts };
  }

  function getDepartmentDistribution() {
    const depts = getDepartments();
    const doctors = getDoctors();
    return {
      labels: depts.map((d) => d.name),
      counts: depts.map((d) => doctors.filter((doc) => doc.departmentId === d.id).length),
    };
  }

  function getRecentAppointments(limit) {
    const appts = Appt().getAppointments ? Appt().getAppointments() : [];
    return appts.slice(0, limit || 6);
  }

  /* ================================================================== */
  /*  Shell — sidebar user, profile dropdown                             */
  /* ================================================================== */

  function renderUserInfo() {
    const user = Auth().getCurrentUser?.();
    if (!user) return;
    document.querySelectorAll('[data-current-user-name]').forEach((el) => (el.textContent = user.name));
    document.querySelectorAll('[data-current-user-email]').forEach((el) => (el.textContent = user.email));
    document.querySelectorAll('[data-current-user-role]').forEach(
      (el) => (el.textContent = (user.role || 'admin').toUpperCase())
    );
    document.querySelectorAll('[data-current-user-avatar]').forEach((el) => {
      if (user.avatar) el.src = user.avatar;
    });
  }

  function initProfileDropdown() {
    const dropdown = document.querySelector('.profile-dropdown');
    if (!dropdown || dropdown.dataset.bound === '1') return;
    dropdown.dataset.bound = '1';
    const trigger = dropdown.querySelector('.profile-trigger');
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });
  }

  function initShell() {
    renderUserInfo();
    initProfileDropdown();
    document.querySelectorAll('[data-current-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
  }

  /* ================================================================== */
  /*  Page: Dashboard                                                    */
  /* ================================================================== */

  function renderDashboardStats() {
    const s = getOverviewStats();
    const map = {
      'stat-total-patients': s.totalPatients,
      'stat-total-doctors': s.totalDoctors,
      'stat-today-appointments': s.todayAppointments,
      'stat-revenue': fmtCurrency(s.revenue),
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
    const pendingNote = document.getElementById('stat-pending-note');
    if (pendingNote) pendingNote.textContent = `${s.pendingAppointments} pending approval`;
    const lowStockNote = document.getElementById('stat-lowstock-note');
    if (lowStockNote) lowStockNote.textContent = `${s.lowStockMedicines} medicines low on stock`;
    const docNote = document.getElementById('stat-doctors-note');
    if (docNote) docNote.textContent = `${s.activeDoctors} currently active`;
  }

  function renderChart(canvasId, config) {
    if (typeof Chart === 'undefined') return null;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    return new Chart(canvas, config);
  }

  function renderDashboardCharts() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#4A6072';

    const trend = getMonthlyTrend(7);
    renderChart('admin-chart-trend', {
      type: 'line',
      data: {
        labels: trend.labels,
        datasets: [
          {
            label: 'Appointments',
            data: trend.counts,
            borderColor: '#0B6E99',
            backgroundColor: 'rgba(11, 110, 153, 0.12)',
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
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(214,228,236,0.6)' } },
          x: { grid: { display: false } },
        },
      },
    });

    const apptStats = Appt().getAppointmentStats
      ? Appt().getAppointmentStats()
      : { pending: 0, approved: 0, completed: 0, cancelled: 0 };
    renderChart('admin-chart-status', {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Completed', 'Cancelled'],
        datasets: [
          {
            data: [apptStats.pending, apptStats.approved, apptStats.completed, apptStats.cancelled],
            backgroundColor: ['#E6A817', '#1FA97A', '#0B6E99', '#E04B4B'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } },
      },
    });

    const deptDist = getDepartmentDistribution();
    renderChart('admin-chart-departments', {
      type: 'bar',
      data: {
        labels: deptDist.labels,
        datasets: [
          {
            label: 'Doctors',
            data: deptDist.counts,
            backgroundColor: '#1FA97A',
            borderRadius: 8,
            maxBarThickness: 36,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(214,228,236,0.6)' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  function renderRecentAppointmentsWidget() {
    const el = document.getElementById('recent-appointments-body');
    if (!el) return;
    const list = getRecentAppointments(6);
    el.innerHTML = list.length
      ? list
          .map(
            (a) => `
      <tr>
        <td>
          <div class="table-user">
            <div><strong>${esc(a.patientName)}</strong><span>${esc(a.departmentName)}</span></div>
          </div>
        </td>
        <td>${esc(a.doctorName)}</td>
        <td>${fmtDate(a.date)} · ${fmtTime(a.time)}</td>
        <td>${statusBadge(a.status)}</td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="4"><div class="dashboard-empty"><i class="fa-solid fa-calendar-xmark"></i><h4>No appointments yet</h4><p>New bookings will appear here.</p></div></td></tr>`;
  }

  function initDashboardPage() {
    renderDashboardStats();
    renderDashboardCharts();
    renderRecentAppointmentsWidget();
  }

  /* ================================================================== */
  /*  Page: Doctors                                                      */
  /* ================================================================== */

  function doctorRowHtml(d) {
    const dept = getDepartmentById(d.departmentId);
    return `
    <tr>
      <td>
        <div class="table-user">
          <img src="${d.image}" alt="${esc(d.name)}" onerror="this.src='https://ui-avatars.com/api/?background=0B6E99&color=fff&name=${encodeURIComponent(
      d.name
    )}'" />
          <div><strong>${esc(d.name)}</strong><span>${esc(d.email)}</span></div>
        </div>
      </td>
      <td>${esc(d.specialty)}</td>
      <td>${esc(dept ? dept.name : '—')}</td>
      <td>${d.experience} yrs</td>
      <td>${fmtCurrency(d.fees)}</td>
      <td><i class="fa-solid fa-star" style="color:#F5B800"></i> ${d.rating}</td>
      <td>${statusBadge(d.status)}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="edit" data-id="${d.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-outline" data-action="toggle" data-id="${d.id}" title="Toggle status"><i class="fa-solid fa-power-off"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${d.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function initDoctorsPage() {
    const tbody = document.getElementById('doctors-tbody');
    if (!tbody) return;

    const form = document.getElementById('doctor-form');
    const deptSelect = form?.elements['departmentId'];

    const controller = createListController({
      tbody,
      getRows: getDoctors,
      renderRow: doctorRowHtml,
      searchFields: ['name', 'specialty', 'email', 'phone'],
      filterAttr: 'status',
      pageSize: 8,
      colSpan: 8,
      emptyMessage: 'Add your first doctor to get started.',
      paginationEl: document.getElementById('doctors-pagination'),
      onCount: (n, total) => {
        const el = document.getElementById('doctors-count');
        if (el) el.textContent = `${n} of ${total}`;
      },
    });
    controller.render();

    document.getElementById('doctors-search')?.addEventListener('input', (e) => controller.setSearch(e.target.value));
    document
      .getElementById('doctors-status-filter')
      ?.addEventListener('change', (e) => controller.setFilter(e.target.value));

    function openDoctorModal(doctor) {
      fillSelect(deptSelect, getDepartments(), { placeholder: 'Select Department' });
      if (doctor) {
        fillForm(form, doctor);
        C().openModal?.('doctor-modal', { title: 'Edit Doctor' });
      } else {
        form.reset();
        if (form.elements['id']) form.elements['id'].value = '';
        C().openModal?.('doctor-modal', { title: 'Add New Doctor' });
      }
    }

    document.getElementById('add-doctor-btn')?.addEventListener('click', () => openDoctorModal(null));

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openDoctorModal(getDoctorById(id));
      if (action === 'toggle') {
        const res = toggleDoctorStatus(id);
        toast(res.message, res.success ? 'success' : 'error');
        controller.refresh();
      }
      if (action === 'delete') {
        if (confirmDelete('Delete this doctor record? This cannot be undone.')) {
          const res = deleteDoctor(id);
          toast(res.message, 'success');
          controller.refresh();
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      const res = id ? updateDoctor(id, data) : addDoctor(data);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        C().closeModal?.('doctor-modal');
        controller.refresh();
      }
    });
  }

  /* ================================================================== */
  /*  Page: Patients                                                     */
  /* ================================================================== */

  function patientRowHtml(p) {
    return `
    <tr>
      <td>
        <div class="table-user">
          <img src="https://ui-avatars.com/api/?background=1FA97A&color=fff&name=${encodeURIComponent(
            p.name
          )}" alt="${esc(p.name)}" />
          <div><strong>${esc(p.name)}</strong><span>${esc(p.email)}</span></div>
        </div>
      </td>
      <td>${esc(p.phone || '—')}</td>
      <td>${p.age ?? '—'} / ${esc(p.gender || '—')}</td>
      <td>${esc(p.bloodGroup || '—')}</td>
      <td>${p.lastVisit ? fmtDate(p.lastVisit) : '—'}</td>
      <td>${statusBadge(p.status || 'active')}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="view" data-id="${p.id}" title="View"><i class="fa-solid fa-eye"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="edit" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${p.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function openPatientView(p) {
    if (!p) return;
    const body = document.getElementById('patient-view-body');
    if (!body) return;
    const history = (Appt().getAppointments ? Appt().getAppointments() : []).filter((a) => a.patientId === p.id);
    body.innerHTML = `
      <div class="form-row">
        <div><strong>Full Name</strong><p>${esc(p.name)}</p></div>
        <div><strong>Email</strong><p>${esc(p.email)}</p></div>
      </div>
      <div class="form-row">
        <div><strong>Phone</strong><p>${esc(p.phone || '—')}</p></div>
        <div><strong>Age / Gender</strong><p>${p.age ?? '—'} / ${esc(p.gender || '—')}</p></div>
      </div>
      <div class="form-row">
        <div><strong>Blood Group</strong><p>${esc(p.bloodGroup || '—')}</p></div>
        <div><strong>Status</strong><p>${statusBadge(p.status || 'active')}</p></div>
      </div>
      <div style="margin-bottom:1rem;"><strong>Address</strong><p>${esc(p.address || '—')}</p></div>
      <hr style="border-color:var(--border-light);margin:1rem 0;" />
      <strong>Appointment History (${history.length})</strong>
      ${
        history.length
          ? `<div class="table-wrapper" style="margin-top:0.75rem;"><table class="table"><thead><tr><th>Date</th><th>Doctor</th><th>Status</th></tr></thead><tbody>${history
              .map((a) => `<tr><td>${fmtDate(a.date)}</td><td>${esc(a.doctorName)}</td><td>${statusBadge(a.status)}</td></tr>`)
              .join('')}</tbody></table></div>`
          : '<p style="color:var(--text-muted);font-size:0.85rem;margin-top:0.5rem;">No appointment history yet.</p>'
      }
    `;
    C().openModal?.('patient-view-modal', { title: `Patient — ${p.name}` });
  }

  function initPatientsPage() {
    const tbody = document.getElementById('patients-tbody');
    if (!tbody) return;

    const form = document.getElementById('patient-form');

    const controller = createListController({
      tbody,
      getRows: getPatients,
      renderRow: patientRowHtml,
      searchFields: ['name', 'email', 'phone'],
      filterAttr: 'status',
      pageSize: 8,
      colSpan: 7,
      emptyMessage: 'Add a patient record to get started.',
      paginationEl: document.getElementById('patients-pagination'),
      onCount: (n, total) => {
        const el = document.getElementById('patients-count');
        if (el) el.textContent = `${n} of ${total}`;
      },
    });
    controller.render();

    document
      .getElementById('patients-search')
      ?.addEventListener('input', (e) => controller.setSearch(e.target.value));
    document
      .getElementById('patients-status-filter')
      ?.addEventListener('change', (e) => controller.setFilter(e.target.value));

    function openPatientModal(patient) {
      if (patient) {
        fillForm(form, patient);
        C().openModal?.('patient-modal', { title: 'Edit Patient' });
      } else {
        form.reset();
        if (form.elements['id']) form.elements['id'].value = '';
        C().openModal?.('patient-modal', { title: 'Add New Patient' });
      }
    }

    document.getElementById('add-patient-btn')?.addEventListener('click', () => openPatientModal(null));

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'view') openPatientView(getPatientById(id));
      if (action === 'edit') openPatientModal(getPatientById(id));
      if (action === 'delete') {
        if (confirmDelete('Delete this patient record? This cannot be undone.')) {
          const res = deletePatient(id);
          toast(res.message, 'success');
          controller.refresh();
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      const res = id ? updatePatient(id, data) : addPatient(data);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        C().closeModal?.('patient-modal');
        controller.refresh();
      }
    });
  }

  /* ================================================================== */
  /*  Page: Appointments                                                 */
  /* ================================================================== */

  function apptActionButtons(a) {
    let html = '';
    if (a.status === 'pending') {
      html += `<button type="button" class="btn btn-icon btn-sm btn-outline" data-action="approve" data-id="${a.id}" title="Approve"><i class="fa-solid fa-check"></i></button>`;
    }
    if (a.status === 'approved') {
      html += `<button type="button" class="btn btn-icon btn-sm btn-outline" data-action="complete" data-id="${a.id}" title="Mark completed"><i class="fa-solid fa-flag-checkered"></i></button>`;
    }
    if (a.status !== 'cancelled' && a.status !== 'completed') {
      html += `<button type="button" class="btn btn-icon btn-sm btn-outline" data-action="cancel" data-id="${a.id}" title="Cancel"><i class="fa-solid fa-ban"></i></button>`;
    }
    return html;
  }

  function appointmentRowHtml(a) {
    return `
    <tr>
      <td><code>${esc(a.id)}</code></td>
      <td>
        <div class="table-user">
          <div><strong>${esc(a.patientName)}</strong><span>${esc(a.patientPhone || a.patientEmail || '')}</span></div>
        </div>
      </td>
      <td>${esc(a.doctorName)}</td>
      <td>${esc(a.departmentName)}</td>
      <td>${fmtDate(a.date)}<br><small class="text-muted">${fmtTime(a.time)}</small></td>
      <td>${statusBadge(a.status)}</td>
      <td class="table-actions">
        ${apptActionButtons(a)}
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="view" data-id="${a.id}" title="View"><i class="fa-solid fa-eye"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${a.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function openAppointmentView(a) {
    if (!a) return;
    const body = document.getElementById('appointment-view-body');
    if (!body) return;
    body.innerHTML = `
      <div class="prescription-patient" style="margin-bottom:1.25rem;">
        <div class="rx-field"><label>Patient</label><span>${esc(a.patientName)}</span></div>
        <div class="rx-field"><label>Doctor</label><span>${esc(a.doctorName)}</span></div>
        <div class="rx-field"><label>Department</label><span>${esc(a.departmentName)}</span></div>
      </div>
      <div class="form-row">
        <div><strong>Date &amp; Time</strong><p>${fmtDate(a.date)} · ${fmtTime(a.time)}</p></div>
        <div><strong>Status</strong><p>${statusBadge(a.status)}</p></div>
      </div>
      <div style="margin-top:1rem;"><strong>Reason for visit</strong><p>${esc(a.reason || '—')}</p></div>
      <div style="margin-top:1rem;"><strong>Consultation fee</strong><p>${fmtCurrency(a.fees || 0)}</p></div>
      <div style="margin-top:1rem;"><strong>Contact</strong><p>${esc(a.patientEmail || '—')} · ${esc(
      a.patientPhone || '—'
    )}</p></div>
    `;
    C().openModal?.('appointment-view-modal', { title: `Appointment ${a.id}` });
  }

  function wireAppointmentModal(controller) {
    const form = document.getElementById('appointment-form');
    if (!form) return;
    const deptSelect = form.elements['departmentId'];
    const doctorSelect = form.elements['doctorId'];
    const timeSelect = form.elements['time'];
    const patientSelect = form.elements['patientId'];
    const nameInput = form.elements['patientName'];
    const emailInput = form.elements['patientEmail'];
    const phoneInput = form.elements['patientPhone'];
    const dateInput = form.elements['date'];

    fillSelect(deptSelect, getDepartments(), { placeholder: 'Select Department' });
    if (patientSelect) {
      patientSelect.innerHTML =
        '<option value="">Walk-in / New Patient</option>' +
        getPatients()
          .map((p) => `<option value="${p.id}">${esc(p.name)} — ${esc(p.email || p.phone || '')}</option>`)
          .join('');
    }
    if (timeSelect) {
      timeSelect.innerHTML =
        '<option value="">Select Time</option>' +
        (Data().timeSlots || []).map((t) => `<option value="${t}">${fmtTime(t)}</option>`).join('');
    }
    if (dateInput) dateInput.min = Appt().todayISO ? Appt().todayISO() : '';

    function refreshDoctors() {
      const deptId = deptSelect.value;
      const source = getDoctors().filter((d) => d.status === 'active' && (!deptId || d.departmentId === deptId));
      fillSelect(
        doctorSelect,
        source.map((d) => ({ id: d.id, name: `${d.name} — ${d.specialty}` })),
        { placeholder: 'Select Doctor' }
      );
    }
    deptSelect?.addEventListener('change', refreshDoctors);
    refreshDoctors();

    patientSelect?.addEventListener('change', () => {
      const p = getPatientById(patientSelect.value);
      if (p) {
        nameInput.value = p.name || '';
        emailInput.value = p.email || '';
        phoneInput.value = p.phone || '';
      }
    });

    document.getElementById('add-appointment-btn')?.addEventListener('click', () => {
      form.reset();
      refreshDoctors();
      C().openModal?.('appointment-modal', { title: 'Add New Appointment' });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(form);
      const res = addAppointmentAdmin(data);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        C().closeModal?.('appointment-modal');
        controller.refresh();
        renderAppointmentStats();
      }
    });
  }

  function renderAppointmentStats() {
    const s = getOverviewStats();
    const map = {
      'appt-stat-total': s.totalAppointments,
      'appt-stat-pending': s.pendingAppointments,
      'appt-stat-approved': s.approvedAppointments,
      'appt-stat-completed': s.completedAppointments,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  function initAppointmentsPage() {
    const tbody = document.getElementById('appointments-tbody');
    if (!tbody) return;

    renderAppointmentStats();
    const dateFilterEl = document.getElementById('appointments-date-filter');

    const controller = createListController({
      tbody,
      getRows: () => {
        const all = Appt().getAppointments ? Appt().getAppointments() : [];
        const day = dateFilterEl?.value;
        return day ? all.filter((a) => a.date === day) : all;
      },
      renderRow: appointmentRowHtml,
      searchFields: ['patientName', 'doctorName', 'departmentName', 'id', 'patientPhone', 'patientEmail'],
      filterAttr: 'status',
      pageSize: 8,
      colSpan: 7,
      emptyMessage: 'No appointments match your filters.',
      paginationEl: document.getElementById('appointments-pagination'),
      onCount: (n, total) => {
        const el = document.getElementById('appointments-count');
        if (el) el.textContent = `${n} of ${total}`;
      },
    });
    controller.render();

    document
      .getElementById('appointments-search')
      ?.addEventListener('input', (e) => controller.setSearch(e.target.value));
    document
      .getElementById('appointments-status-filter')
      ?.addEventListener('change', (e) => controller.setFilter(e.target.value));
    dateFilterEl?.addEventListener('change', () => controller.refresh());

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      const statusMap = { approve: 'approved', complete: 'completed', cancel: 'cancelled' };
      if (statusMap[action]) {
        const res = Appt().updateAppointmentStatus(id, statusMap[action]);
        toast(res.message, res.success ? 'success' : 'error');
        controller.refresh();
        renderAppointmentStats();
      } else if (action === 'view') {
        openAppointmentView(Appt().getAppointmentById(id));
      } else if (action === 'delete') {
        if (confirmDelete('Delete this appointment record?')) {
          Appt().deleteAppointment(id);
          toast('Appointment removed.', 'success');
          controller.refresh();
          renderAppointmentStats();
        }
      }
    });

    wireAppointmentModal(controller);
  }

  /* ================================================================== */
  /*  Page: Departments                                                  */
  /* ================================================================== */

  function departmentRowHtml(d) {
    const docCount = getDoctors().filter((doc) => doc.departmentId === d.id).length;
    const shortDesc = (d.description || '').slice(0, 70) + ((d.description || '').length > 70 ? '…' : '');
    return `
    <tr>
      <td>
        <div class="table-user">
          <div class="stat-card-icon blue" style="width:42px;height:42px;font-size:1rem;border-radius:10px;"><i class="${esc(
            d.icon
          )}"></i></div>
          <div><strong>${esc(d.name)}</strong><span>${esc(shortDesc)}</span></div>
        </div>
      </td>
      <td>${docCount}</td>
      <td>${d.beds}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="edit" data-id="${d.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${d.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function renderDepartmentKPIs() {
    const depts = getDepartments();
    const totalBeds = depts.reduce((s, d) => s + (Number(d.beds) || 0), 0);
    const doctors = getDoctors();
    const unstaffed = depts.filter((d) => !doctors.some((doc) => doc.departmentId === d.id)).length;
    const map = {
      'dept-kpi-total': depts.length,
      'dept-kpi-beds': totalBeds,
      'dept-kpi-doctors': doctors.length,
      'dept-kpi-unstaffed': unstaffed,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  function renderDepartmentCards() {
    const el = document.getElementById('departments-cards');
    if (!el) return;
    const doctors = getDoctors();
    const depts = getDepartments();
    el.innerHTML = depts
      .map((d) => {
        const docCount = doctors.filter((doc) => doc.departmentId === d.id).length;
        return `
        <div class="col-3">
          <div class="dashboard-panel" style="height:100%;">
            <div class="dashboard-panel-body" style="text-align:center;">
              <div class="stat-card-icon blue" style="margin:0 auto 0.85rem;"><i class="${esc(d.icon)}"></i></div>
              <h4 style="margin-bottom:0.35rem;">${esc(d.name)}</h4>
              <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.65rem;">${docCount} doctor${
          docCount === 1 ? '' : 's'
        } · ${d.beds} beds</p>
              <button type="button" class="btn btn-sm btn-outline" data-action="edit-card" data-id="${d.id}">
                <i class="fa-solid fa-pen"></i> Edit
              </button>
            </div>
          </div>
        </div>`;
      })
      .join('');

    el.querySelectorAll('[data-action="edit-card"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dept = getDepartmentById(btn.getAttribute('data-id'));
        const form = document.getElementById('department-form');
        if (dept && form) {
          fillForm(form, dept);
          C().openModal?.('department-modal', { title: 'Edit Department' });
        }
      });
    });
  }

  function initDepartmentsPage() {
    const tbody = document.getElementById('departments-tbody');
    if (!tbody) return;

    renderDepartmentKPIs();
    renderDepartmentCards();

    const form = document.getElementById('department-form');
    const controller = createListController({
      tbody,
      getRows: getDepartments,
      renderRow: departmentRowHtml,
      searchFields: ['name', 'description'],
      pageSize: 8,
      colSpan: 4,
      emptyMessage: 'Add your first department to get started.',
      paginationEl: document.getElementById('departments-pagination'),
      onCount: (n, total) => {
        const el = document.getElementById('departments-count');
        if (el) el.textContent = `${n} of ${total}`;
      },
    });
    controller.render();

    document
      .getElementById('departments-search')
      ?.addEventListener('input', (e) => controller.setSearch(e.target.value));

    function openDepartmentModal(dept) {
      if (dept) {
        fillForm(form, dept);
        C().openModal?.('department-modal', { title: 'Edit Department' });
      } else {
        form.reset();
        if (form.elements['id']) form.elements['id'].value = '';
        C().openModal?.('department-modal', { title: 'Add New Department' });
      }
    }

    document.getElementById('add-department-btn')?.addEventListener('click', () => openDepartmentModal(null));

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openDepartmentModal(getDepartmentById(id));
      if (action === 'delete') {
        if (confirmDelete('Delete this department? Doctors must be reassigned first.')) {
          const res = deleteDepartment(id);
          toast(res.message, res.success ? 'success' : 'error');
          if (res.success) {
            controller.refresh();
            renderDepartmentKPIs();
            renderDepartmentCards();
          }
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      const res = id ? updateDepartment(id, data) : addDepartment(data);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        C().closeModal?.('department-modal');
        controller.refresh();
        renderDepartmentKPIs();
        renderDepartmentCards();
      }
    });
  }

  /* ================================================================== */
  /*  Page: Treatments                                                   */
  /* ================================================================== */

  function treatmentRowHtml(t) {
    const dept = getDepartmentById(t.department);
    return `
    <tr>
      <td><strong>${esc(t.name)}</strong></td>
      <td>${esc(dept ? dept.name : '—')}</td>
      <td>${esc(t.duration)}</td>
      <td>${fmtCurrency(t.price)}</td>
      <td>${statusBadge(t.status || 'active')}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="edit" data-id="${t.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-outline" data-action="toggle" data-id="${t.id}" title="Toggle status"><i class="fa-solid fa-power-off"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${t.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function initTreatmentsPage() {
    const tbody = document.getElementById('treatments-tbody');
    if (!tbody) return;

    const form = document.getElementById('treatment-form');
    const deptSelect = form?.elements['department'];
    const deptFilter = document.getElementById('treatments-dept-filter');
    if (deptFilter) {
      deptFilter.innerHTML =
        '<option value="all">All Departments</option>' +
        getDepartments().map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    }

    const controller = createListController({
      tbody,
      getRows: getTreatments,
      renderRow: treatmentRowHtml,
      searchFields: ['name', 'description'],
      filterAttr: 'department',
      pageSize: 8,
      colSpan: 6,
      emptyMessage: 'Add your first treatment to get started.',
      paginationEl: document.getElementById('treatments-pagination'),
      onCount: (n, total) => {
        const el = document.getElementById('treatments-count');
        if (el) el.textContent = `${n} of ${total}`;
      },
    });
    controller.render();

    document
      .getElementById('treatments-search')
      ?.addEventListener('input', (e) => controller.setSearch(e.target.value));
    deptFilter?.addEventListener('change', (e) => controller.setFilter(e.target.value));

    function openTreatmentModal(t) {
      fillSelect(deptSelect, getDepartments(), { placeholder: 'Select Department' });
      if (t) {
        fillForm(form, t);
        C().openModal?.('treatment-modal', { title: 'Edit Treatment' });
      } else {
        form.reset();
        if (form.elements['id']) form.elements['id'].value = '';
        C().openModal?.('treatment-modal', { title: 'Add New Treatment' });
      }
    }

    document.getElementById('add-treatment-btn')?.addEventListener('click', () => openTreatmentModal(null));

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openTreatmentModal(getTreatmentById(id));
      if (action === 'toggle') {
        const res = toggleTreatmentStatus(id);
        toast(res.message, res.success ? 'success' : 'error');
        controller.refresh();
      }
      if (action === 'delete') {
        if (confirmDelete('Delete this treatment? This cannot be undone.')) {
          const res = deleteTreatment(id);
          toast(res.message, 'success');
          controller.refresh();
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      const res = id ? updateTreatment(id, data) : addTreatment(data);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        C().closeModal?.('treatment-modal');
        controller.refresh();
      }
    });
  }

  /* ================================================================== */
  /*  Page: Medicines                                                    */
  /* ================================================================== */

  function medicineRowHtml(m) {
    return `
    <tr>
      <td><strong>${esc(m.name)}</strong><br><small class="text-muted">${esc(m.manufacturer)}</small></td>
      <td>${esc(m.category)}</td>
      <td>${m.stock} ${esc(m.unit)}(s)</td>
      <td>${fmtCurrency(m.price)}</td>
      <td>${stockBadge(m.stock)}</td>
      <td class="table-actions">
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="restock" data-id="${m.id}" title="Restock +50"><i class="fa-solid fa-plus"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-ghost" data-action="edit" data-id="${m.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
        <button type="button" class="btn btn-icon btn-sm btn-danger" data-action="delete" data-id="${m.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
  }

  function stockStatusOf(stock) {
    const n = Number(stock) || 0;
    if (n <= 0) return 'out-of-stock';
    if (n < 100) return 'low-stock';
    return 'in-stock';
  }

  function renderMedicineStats() {
    const list = getMedicines();
    const map = {
      'med-stat-total': list.length,
      'med-stat-instock': list.filter((m) => stockStatusOf(m.stock) === 'in-stock').length,
      'med-stat-lowstock': list.filter((m) => stockStatusOf(m.stock) === 'low-stock').length,
      'med-stat-outstock': list.filter((m) => stockStatusOf(m.stock) === 'out-of-stock').length,
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  function initMedicinesPage() {
    const tbody = document.getElementById('medicines-tbody');
    if (!tbody) return;

    const form = document.getElementById('medicine-form');
    const stockFilter = document.getElementById('medicines-stock-filter');
    renderMedicineStats();

    const controller = createListController({
      tbody,
      getRows: () => getMedicines().map((m) => ({ ...m, stockStatus: stockStatusOf(m.stock) })),
      renderRow: medicineRowHtml,
      searchFields: ['name', 'category', 'manufacturer'],
      filterAttr: 'stockStatus',
      pageSize: 8,
      colSpan: 6,
      emptyMessage: 'Add a medicine to the inventory to get started.',
      paginationEl: document.getElementById('medicines-pagination'),
      onCount: (n, total) => {
        const el = document.getElementById('medicines-count');
        if (el) el.textContent = `${n} of ${total}`;
      },
    });
    controller.render();

    document
      .getElementById('medicines-search')
      ?.addEventListener('input', (e) => controller.setSearch(e.target.value));
    stockFilter?.addEventListener('change', (e) => controller.setFilter(e.target.value));

    function openMedicineModal(m) {
      if (m) {
        fillForm(form, m);
        C().openModal?.('medicine-modal', { title: 'Edit Medicine' });
      } else {
        form.reset();
        if (form.elements['id']) form.elements['id'].value = '';
        C().openModal?.('medicine-modal', { title: 'Add New Medicine' });
      }
    }

    document.getElementById('add-medicine-btn')?.addEventListener('click', () => openMedicineModal(null));

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if (action === 'edit') openMedicineModal(getMedicineById(id));
      if (action === 'restock') {
        const res = adjustStock(id, 50);
        toast(res.message, res.success ? 'success' : 'error');
        controller.refresh();
        renderMedicineStats();
      }
      if (action === 'delete') {
        if (confirmDelete('Remove this medicine from inventory?')) {
          const res = deleteMedicine(id);
          toast(res.message, 'success');
          controller.refresh();
          renderMedicineStats();
        }
      }
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = formData(form);
      const id = data.id;
      delete data.id;
      const res = id ? updateMedicine(id, data) : addMedicine(data);
      toast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        C().closeModal?.('medicine-modal');
        controller.refresh();
        renderMedicineStats();
      }
    });
  }

  /* ================================================================== */
  /*  Page: Reports                                                      */
  /* ================================================================== */

  function getReportFilters() {
    return {
      from: document.getElementById('report-date-from')?.value || '',
      to: document.getElementById('report-date-to')?.value || '',
      departmentId: document.getElementById('report-department-filter')?.value || 'all',
    };
  }

  function getFilteredAppointmentsForReport() {
    const { from, to, departmentId } = getReportFilters();
    const all = Appt().readAppointments ? Appt().readAppointments() : [];
    return all.filter(
      (a) =>
        (!from || a.date >= from) &&
        (!to || a.date <= to) &&
        (departmentId === 'all' || a.departmentId === departmentId)
    );
  }

  function renderReportKPIs() {
    const filtered = getFilteredAppointmentsForReport();
    const completed = filtered.filter((a) => a.status === 'completed');
    const revenue = completed.reduce((sum, a) => sum + (Number(a.fees) || 0), 0);
    const patientsSeen = new Set(filtered.map((a) => a.patientId)).size;
    const doctors = getDoctors();
    const avgRating = doctors.length
      ? doctors.reduce((sum, d) => sum + (Number(d.rating) || 0), 0) / doctors.length
      : 0;

    const map = {
      'report-stat-appointments': filtered.length,
      'report-stat-revenue': fmtCurrency(revenue),
      'report-stat-newpatients': patientsSeen,
      'report-stat-rating': avgRating.toFixed(1),
    };
    Object.entries(map).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  const reportChartInstances = {};
  function renderReportChart(canvasId, config) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    reportChartInstances[canvasId]?.destroy();
    reportChartInstances[canvasId] = new Chart(canvas, config);
  }

  function renderReportCharts() {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#4A6072';

    const filtered = getFilteredAppointmentsForReport();

    // Revenue & appointment trend — last 9 months, using real data.
    const months = 9;
    const now = new Date();
    const labels = [];
    const apptCounts = [];
    const revenueCounts = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthAppts = filtered.filter((a) => String(a.date || '').startsWith(key));
      labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      apptCounts.push(monthAppts.length);
      revenueCounts.push(
        monthAppts.filter((a) => a.status === 'completed').reduce((sum, a) => sum + (Number(a.fees) || 0), 0)
      );
    }
    renderReportChart('report-chart-revenue', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Revenue ($)',
            data: revenueCounts,
            borderColor: '#1FA97A',
            backgroundColor: 'rgba(31, 169, 122, 0.12)',
            fill: true,
            tension: 0.35,
            yAxisID: 'y1',
            pointRadius: 3,
          },
          {
            label: 'Appointments',
            data: apptCounts,
            backgroundColor: '#0B6E99',
            borderRadius: 6,
            maxBarThickness: 28,
            yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } },
        scales: {
          y: { beginAtZero: true, position: 'left', grid: { color: 'rgba(214,228,236,0.6)' }, title: { display: true, text: 'Appointments' } },
          y1: { beginAtZero: true, position: 'right', grid: { display: false }, title: { display: true, text: 'Revenue ($)' } },
          x: { grid: { display: false } },
        },
      },
    });

    // Appointments by department (filtered)
    const depts = getDepartments();
    const deptCounts = depts.map((d) => filtered.filter((a) => a.departmentId === d.id).length);
    renderReportChart('report-chart-department', {
      type: 'doughnut',
      data: {
        labels: depts.map((d) => d.name),
        datasets: [
          {
            data: deptCounts,
            backgroundColor: ['#0B6E99', '#1FA97A', '#E6A817', '#E04B4B', '#7A5AF8', '#00B4D8', '#F5738A', '#4A6072'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
      },
    });

    // Status breakdown (filtered)
    const statusCounts = {
      pending: filtered.filter((a) => a.status === 'pending').length,
      approved: filtered.filter((a) => a.status === 'approved').length,
      completed: filtered.filter((a) => a.status === 'completed').length,
      cancelled: filtered.filter((a) => a.status === 'cancelled').length,
    };
    renderReportChart('report-chart-status', {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Completed', 'Cancelled'],
        datasets: [
          {
            data: [statusCounts.pending, statusCounts.approved, statusCounts.completed, statusCounts.cancelled],
            backgroundColor: ['#E6A817', '#1FA97A', '#0B6E99', '#E04B4B'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14 } } },
      },
    });

    // Top performing doctors by completed appointments (filtered)
    const doctors = getDoctors();
    const topDoctors = doctors
      .map((d) => ({
        name: d.name,
        count: filtered.filter((a) => a.doctorId === d.id && a.status === 'completed').length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    renderReportChart('report-chart-doctors', {
      type: 'bar',
      data: {
        labels: topDoctors.map((d) => d.name),
        datasets: [{ label: 'Completed Visits', data: topDoctors.map((d) => d.count), backgroundColor: '#7A5AF8', borderRadius: 6, maxBarThickness: 28 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(214,228,236,0.6)' } },
          y: { grid: { display: false } },
        },
      },
    });
  }

  function renderReportLog() {
    const tbody = document.getElementById('report-log-tbody');
    if (!tbody) return;
    const filtered = getFilteredAppointmentsForReport()
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    tbody.innerHTML = filtered.length
      ? filtered
          .map(
            (a) => `
      <tr>
        <td>${fmtDate(a.date)}</td>
        <td>${esc(a.patientName)}</td>
        <td>${esc(a.doctorName)}</td>
        <td>${esc(a.departmentName)}</td>
        <td>${statusBadge(a.status)}</td>
        <td>${fmtCurrency(a.fees || 0)}</td>
      </tr>`
          )
          .join('')
      : `<tr><td colspan="6"><div class="dashboard-empty"><i class="fa-solid fa-chart-simple"></i><h4>No data in this range</h4><p>Try widening your date range or clearing filters.</p></div></td></tr>`;
  }

  function refreshReports() {
    renderReportKPIs();
    renderReportCharts();
    renderReportLog();
  }

  function initReportsPage() {
    const deptFilter = document.getElementById('report-department-filter');
    if (deptFilter) {
      deptFilter.innerHTML =
        '<option value="all">All Departments</option>' +
        getDepartments().map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('');
    }

    refreshReports();

    document.getElementById('report-apply-btn')?.addEventListener('click', refreshReports);
    document.getElementById('report-export-btn')?.addEventListener('click', () => {
      global.MediCareDashboard?.exportTableCSV?.('#report-log-table', 'hospital-report.csv');
    });
  }

  /* ================================================================== */
  /*  Page: Settings                                                     */
  /* ================================================================== */

  function initSettingsPage() {
    const settings = getSettings();
    const form = document.getElementById('settings-form');
    if (form) {
      fillForm(form, {
        name: settings.name,
        phone: settings.phone,
        emergency: settings.emergency,
        email: settings.email,
        supportEmail: settings.supportEmail,
        address: settings.address,
        hoursWeekdays: settings.hoursWeekdays,
        hoursSaturday: settings.hoursSaturday,
        hoursSunday: settings.hoursSunday,
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const res = saveSettings(formData(form));
        toast(res.message, 'success');
      });
    }

    const maintenanceToggle = document.getElementById('toggle-maintenance');
    if (maintenanceToggle) {
      maintenanceToggle.checked = !!settings.maintenanceMode;
      maintenanceToggle.addEventListener('change', () => {
        saveSettings({ maintenanceMode: maintenanceToggle.checked });
        toast(
          maintenanceToggle.checked
            ? 'Maintenance mode enabled — public site will show a notice banner.'
            : 'Maintenance mode disabled.',
          'success'
        );
      });
    }

    ['gallery', 'booking', 'testimonials', 'blogs', 'newsletter'].forEach((key) => {
      const el = document.getElementById(`toggle-${key}`);
      if (!el) return;
      el.checked = settings.cms ? settings.cms[key] !== false : true;
      el.addEventListener('change', () => {
        const res = saveSettings({ cms: { [key]: el.checked } });
        toast(res.message, 'success');
      });
    });

    const profileForm = document.getElementById('admin-profile-form');
    const user = Auth().getCurrentUser?.();
    if (profileForm && user) {
      fillForm(profileForm, { name: user.name, email: user.email, phone: user.phone || '' });
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = formData(profileForm);
        delete data.email;
        const res = Auth().updateProfile?.(data);
        toast(res?.message || 'Profile updated.', res?.success ? 'success' : 'error');
        if (res?.success) renderUserInfo();
      });
    }

    document.getElementById('export-all-data-btn')?.addEventListener('click', () => {
      const backup = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('medicare')) backup[key] = localStorage.getItem(key);
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medicare-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Full backup downloaded.', 'success');
    });

    document.getElementById('reset-data-btn')?.addEventListener('click', () => {
      if (
        !confirmDelete(
          'Reset all hospital data to the original demo dataset? This will clear all doctors, patients, appointments, and settings you have added or edited.'
        )
      )
        return;
      Object.values(STORAGE).forEach((key) => localStorage.removeItem(key));
      localStorage.removeItem('medicare_appointments');
      toast('Demo data has been reset. Reloading…', 'success');
      setTimeout(() => window.location.reload(), 900);
    });
  }

  /* ================================================================== */
  /*  Public API                                                         */
  /* ================================================================== */

  const MediCareAdmin = {
    STORAGE,
    // Doctors
    getDoctors,
    getDoctorById,
    addDoctor,
    updateDoctor,
    deleteDoctor,
    toggleDoctorStatus,
    // Departments
    getDepartments,
    getDepartmentById,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    // Treatments
    getTreatments,
    getTreatmentById,
    addTreatment,
    updateTreatment,
    deleteTreatment,
    toggleTreatmentStatus,
    // Medicines
    getMedicines,
    getMedicineById,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    adjustStock,
    // Patients
    getPatients,
    getPatientById,
    addPatient,
    updatePatient,
    deletePatient,
    // Appointments
    addAppointmentAdmin,
    // Settings
    getSettings,
    saveSettings,
    // Analytics
    getOverviewStats,
    getMonthlyTrend,
    getDepartmentDistribution,
    getRecentAppointments,
    // UI helpers
    statusBadge,
    stockBadge,
    createListController,
    confirmDelete,
    fillForm,
    fillSelect,
    formData,
    // Shell
    initShell,
    // Page bootstraps
    initDashboardPage,
    initDoctorsPage,
    initPatientsPage,
    initAppointmentsPage,
    initDepartmentsPage,
    initTreatmentsPage,
    initMedicinesPage,
    initReportsPage,
    initSettingsPage,
  };

  global.MediCareAdmin = MediCareAdmin;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareAdmin;
  }
})(typeof window !== 'undefined' ? window : globalThis);

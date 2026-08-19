/**
 * MediCare Plus — Dashboard Utilities
 * Sidebar, Chart.js samples, table search/filter, pagination,
 * notifications, CSV export stub.
 *
 * Works offline; notifications stored in localStorage.
 */
(function (global) {
  'use strict';

  const NOTIF_KEY = 'medicare_notifications';
  const SIDEBAR_KEY = 'medicare_sidebar_collapsed';

  /* ================================================================== */
  /*  Sidebar                                                           */
  /* ================================================================== */

  /**
   * Toggle / collapse / mobile sidebar for panel layouts.
   * Expects: .dashboard-sidebar, .sidebar-toggle, .sidebar-overlay, .dashboard-main
   */
  function initSidebar(options) {
    const opts = options || {};
    const sidebar =
      document.querySelector(opts.sidebar || '.dashboard-sidebar, #sidebar');
    if (!sidebar) return;

    const toggleBtns = document.querySelectorAll(
      opts.toggle || '.sidebar-toggle, [data-sidebar-toggle]'
    );
    const collapseBtns = document.querySelectorAll(
      opts.collapse || '[data-sidebar-collapse]'
    );
    let overlay = document.querySelector('.sidebar-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
    }

    // Restore collapsed state (desktop)
    if (localStorage.getItem(SIDEBAR_KEY) === '1') {
      document.body.classList.add('sidebar-collapsed');
      sidebar.classList.add('collapsed');
    }

    const openMobile = () => {
      sidebar.classList.add('open');
      overlay.classList.add('show');
      document.body.classList.add('sidebar-open');
    };

    const closeMobile = () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
      document.body.classList.remove('sidebar-open');
    };

    const toggleMobile = () => {
      if (sidebar.classList.contains('open')) closeMobile();
      else openMobile();
    };

    const toggleCollapse = () => {
      const collapsed = document.body.classList.toggle('sidebar-collapsed');
      sidebar.classList.toggle('collapsed', collapsed);
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0');
    };

    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        // On small screens → mobile drawer; otherwise collapse
        if (window.matchMedia('(max-width: 991px)').matches) {
          toggleMobile();
        } else {
          toggleCollapse();
        }
      });
    });

    collapseBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleCollapse();
      });
    });

    overlay.addEventListener('click', closeMobile);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 991px)').matches) closeMobile();
      });
    });

    // Highlight active link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    sidebar.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href.endsWith(path) || (path === '' && href.includes('index'))) {
        a.classList.add('active');
      }
    });

    return { openMobile, closeMobile, toggleCollapse };
  }

  /* ================================================================== */
  /*  Charts (Chart.js CDN)                                             */
  /* ================================================================== */

  /**
   * Initialize sample dashboard charts if Chart.js is present.
   * Looks for canvases:
   *   #chart-appointments (line)
   *   #chart-departments (bar)
   *   #chart-status (doughnut)
   */
  function initDashboardCharts(custom) {
    if (typeof Chart === 'undefined') {
      console.info('Chart.js not loaded — skipping dashboard charts.');
      return {};
    }

    const charts = {};
    const brand = {
      primary: '#0B6E99',
      secondary: '#1FA97A',
      warning: '#E6A817',
      danger: '#E04B4B',
      muted: '#7A8FA0',
    };

    Chart.defaults.font.family = "'DM Sans', sans-serif";
    Chart.defaults.color = '#4A6072';

    const lineCanvas = document.getElementById('chart-appointments');
    if (lineCanvas) {
      charts.appointments = new Chart(lineCanvas, {
        type: 'line',
        data: {
          labels: custom?.lineLabels || [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
          ],
          datasets: [
            {
              label: 'Appointments',
              data: custom?.lineData || [42, 55, 48, 70, 65, 80, 74],
              borderColor: brand.primary,
              backgroundColor: 'rgba(11, 110, 153, 0.12)',
              fill: true,
              tension: 0.35,
              pointRadius: 4,
              pointBackgroundColor: brand.primary,
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
    }

    const barCanvas = document.getElementById('chart-departments');
    if (barCanvas) {
      const depts =
        custom?.barLabels ||
        (global.MediCareData?.departments || [])
          .slice(0, 6)
          .map((d) => d.name) ||
        ['Cardio', 'Neuro', 'Ortho', 'Peds', 'Dental', 'Eye'];

      charts.departments = new Chart(barCanvas, {
        type: 'bar',
        data: {
          labels: depts,
          datasets: [
            {
              label: 'Visits',
              data: custom?.barData || [120, 90, 105, 80, 60, 55],
              backgroundColor: [
                brand.primary,
                brand.secondary,
                '#1A8AB8',
                '#2FC491',
                brand.warning,
                '#3B82F6',
              ],
              borderRadius: 8,
              maxBarThickness: 40,
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
    }

    const doughnutCanvas = document.getElementById('chart-status');
    if (doughnutCanvas) {
      const stats =
        custom?.doughnutData ||
        global.MediCareAppointment?.getAppointmentStats?.() || {
          pending: 8,
          approved: 14,
          completed: 32,
          cancelled: 4,
        };

      charts.status = new Chart(doughnutCanvas, {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'Approved', 'Completed', 'Cancelled'],
          datasets: [
            {
              data: [
                stats.pending ?? 8,
                stats.approved ?? 14,
                stats.completed ?? 32,
                stats.cancelled ?? 4,
              ],
              backgroundColor: [
                brand.warning,
                brand.secondary,
                brand.primary,
                brand.danger,
              ],
              borderWidth: 0,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 16 },
            },
          },
        },
      });
    }

    return charts;
  }

  /* ================================================================== */
  /*  Table search / filter                                             */
  /* ================================================================== */

  /**
   * Wire a search input to filter table rows.
   * @param {string|HTMLElement} input
   * @param {string|HTMLElement} table
   */
  function initTableSearch(input, table) {
    const searchEl =
      typeof input === 'string' ? document.querySelector(input) : input;
    const tableEl =
      typeof table === 'string' ? document.querySelector(table) : table;

    if (!searchEl || !tableEl) {
      // Auto-bind common patterns
      document.querySelectorAll('[data-table-search]').forEach((inp) => {
        const target =
          document.querySelector(inp.getAttribute('data-table-search')) ||
          inp.closest('.card, .panel, section')?.querySelector('table');
        if (target) bindSearch(inp, target);
      });
      return;
    }

    bindSearch(searchEl, tableEl);
  }

  function bindSearch(input, table) {
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const rows = table.tBodies[0]
        ? Array.from(table.tBodies[0].rows)
        : Array.from(table.querySelectorAll('tbody tr'));

      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = !q || text.includes(q) ? '' : 'none';
      });

      table.dispatchEvent(
        new CustomEvent('table:filtered', { detail: { query: q } })
      );
    });
  }

  /**
   * Filter table by data-status / select value
   */
  function initTableFilter(select, table, attr) {
    const sel =
      typeof select === 'string' ? document.querySelector(select) : select;
    const tableEl =
      typeof table === 'string' ? document.querySelector(table) : table;
    if (!sel || !tableEl) {
      document.querySelectorAll('[data-table-filter]').forEach((s) => {
        const t =
          document.querySelector(s.getAttribute('data-table-filter')) ||
          s.closest('.card, .panel, section')?.querySelector('table');
        if (t) bindStatusFilter(s, t, s.getAttribute('data-filter-attr') || 'data-status');
      });
      return;
    }
    bindStatusFilter(sel, tableEl, attr || 'data-status');
  }

  function bindStatusFilter(select, table, attr) {
    select.addEventListener('change', () => {
      const value = select.value.toLowerCase();
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      rows.forEach((row) => {
        if (!value || value === 'all') {
          row.style.display = '';
          return;
        }
        const status =
          (row.getAttribute(attr) ||
            row.querySelector('.badge')?.textContent ||
            '').toLowerCase();
        row.style.display = status.includes(value) ? '' : 'none';
      });
    });
  }

  /* ================================================================== */
  /*  Pagination                                                        */
  /* ================================================================== */

  /**
   * Simple client-side pagination for a table or list of items.
   * @param {object} options
   *   - table | container
   *   - pageSize (default 8)
   *   - paginationEl selector/element for controls
   */
  function initPagination(options) {
    const opts = options || {};
    const table =
      typeof opts.table === 'string'
        ? document.querySelector(opts.table)
        : opts.table || document.querySelector('[data-paginate]');

    if (!table) return null;

    const pageSize = Number(opts.pageSize) || Number(table.dataset.pageSize) || 8;
    let page = 1;

    const getRows = () =>
      Array.from(table.querySelectorAll('tbody tr')).filter(
        (r) => r.style.display !== 'none' || !r.hasAttribute('data-paginated-hide')
      );

    // Prefer all rows for pagination source
    const allRows = () => Array.from(table.querySelectorAll('tbody tr'));

    let paginationEl =
      typeof opts.paginationEl === 'string'
        ? document.querySelector(opts.paginationEl)
        : opts.paginationEl;

    if (!paginationEl) {
      paginationEl = document.createElement('div');
      paginationEl.className = 'pagination';
      table.parentElement?.appendChild(paginationEl);
    }

    function render() {
      const rows = allRows().filter((r) => {
        // Respect search filter: skip display:none from search unless we track separately
        return r.dataset.searchHide !== '1';
      });
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      if (page > pages) page = pages;

      rows.forEach((row, i) => {
        const start = (page - 1) * pageSize;
        const visible = i >= start && i < start + pageSize;
        row.style.display = visible ? '' : 'none';
      });

      paginationEl.innerHTML = `
        <button type="button" class="btn btn-sm btn-outline" data-page="prev" ${page <= 1 ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="pagination-info">Page ${page} of ${pages}</span>
        <button type="button" class="btn btn-sm btn-outline" data-page="next" ${page >= pages ? 'disabled' : ''}>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      `;

      paginationEl.querySelector('[data-page="prev"]')?.addEventListener('click', () => {
        page -= 1;
        render();
      });
      paginationEl.querySelector('[data-page="next"]')?.addEventListener('click', () => {
        page += 1;
        render();
      });
    }

    // Integrate with search: mark search-hidden rows
    const searchInput = document.querySelector(
      `[data-table-search="${opts.table || ''}"], [data-table-search]`
    );
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        allRows().forEach((row) => {
          const match = !q || row.textContent.toLowerCase().includes(q);
          row.dataset.searchHide = match ? '0' : '1';
        });
        page = 1;
        render();
      });
    }

    render();
    return { goTo: (p) => { page = p; render(); }, refresh: render };
  }

  /* ================================================================== */
  /*  Notifications                                                     */
  /* ================================================================== */

  function defaultNotifications() {
    return [
      {
        id: 'n1',
        title: 'New appointment request',
        text: 'Demo Patient booked Cardiology for Jul 22.',
        time: '10 min ago',
        read: false,
        type: 'appointment',
      },
      {
        id: 'n2',
        title: 'Lab results ready',
        text: 'Blood panel for Marcus Johnson is available.',
        time: '1 hour ago',
        read: false,
        type: 'lab',
      },
      {
        id: 'n3',
        title: 'System reminder',
        text: 'Weekly inventory check for pharmacy is due.',
        time: 'Yesterday',
        read: true,
        type: 'system',
      },
      {
        id: 'n4',
        title: 'Review received',
        text: 'A patient left a 5-star review for Dr. Mitchell.',
        time: '2 days ago',
        read: true,
        type: 'review',
      },
    ];
  }

  function readNotifications() {
    try {
      const raw = localStorage.getItem(NOTIF_KEY);
      if (!raw) {
        const seed = defaultNotifications();
        localStorage.setItem(NOTIF_KEY, JSON.stringify(seed));
        return seed;
      }
      return JSON.parse(raw);
    } catch {
      return defaultNotifications();
    }
  }

  function writeNotifications(list) {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(list));
  }

  function markNotificationsRead(id) {
    const list = readNotifications();
    list.forEach((n) => {
      if (!id || n.id === id) n.read = true;
    });
    writeNotifications(list);
    updateNotificationUI();
    return list;
  }

  function addNotification(notif) {
    const list = readNotifications();
    list.unshift({
      id: `n-${Date.now()}`,
      title: notif.title || 'Notification',
      text: notif.text || '',
      time: notif.time || 'Just now',
      read: false,
      type: notif.type || 'system',
    });
    writeNotifications(list);
    updateNotificationUI();
    return list;
  }

  /**
   * Build / refresh notification dropdown.
   * Expects: [data-notifications] trigger, #notification-dropdown panel
   */
  function initNotifications() {
    const trigger = document.querySelector(
      '[data-notifications], .notification-toggle'
    );
    let dropdown = document.getElementById('notification-dropdown');

    if (!trigger) return;

    if (!dropdown) {
      dropdown = document.createElement('div');
      dropdown.id = 'notification-dropdown';
      dropdown.className = 'notification-dropdown';
      trigger.parentElement?.appendChild(dropdown);
    }

    const render = () => {
      const list = readNotifications();
      const unread = list.filter((n) => !n.read).length;

      let badge = trigger.querySelector('.notif-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-badge';
        trigger.appendChild(badge);
      }
      badge.textContent = unread > 0 ? String(unread) : '';
      badge.style.display = unread > 0 ? '' : 'none';

      dropdown.innerHTML = `
        <div class="notification-header">
          <strong>Notifications</strong>
          <button type="button" class="btn-link" data-mark-all-read>Mark all read</button>
        </div>
        <ul class="notification-list">
          ${
            list.length
              ? list
                  .map(
                    (n) => `
            <li class="notification-item ${n.read ? 'read' : 'unread'}" data-id="${n.id}">
              <div class="notification-icon"><i class="fa-solid fa-bell"></i></div>
              <div>
                <strong>${escapeHtml(n.title)}</strong>
                <p>${escapeHtml(n.text)}</p>
                <small>${escapeHtml(n.time)}</small>
              </div>
            </li>`
                  )
                  .join('')
              : '<li class="notification-empty">No notifications</li>'
          }
        </ul>
      `;

      dropdown.querySelector('[data-mark-all-read]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        markNotificationsRead();
      });

      dropdown.querySelectorAll('.notification-item').forEach((item) => {
        item.addEventListener('click', () => {
          markNotificationsRead(item.getAttribute('data-id'));
        });
      });
    };

    render();

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // Expose refresh
    trigger._refreshNotifications = render;
  }

  function updateNotificationUI() {
    const trigger = document.querySelector(
      '[data-notifications], .notification-toggle'
    );
    if (trigger && typeof trigger._refreshNotifications === 'function') {
      trigger._refreshNotifications();
    }
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ================================================================== */
  /*  CSV export stub                                                   */
  /* ================================================================== */

  /**
   * Export an HTML table to CSV and download.
   * @param {string|HTMLElement} table
   * @param {string} filename
   */
  function exportTableCSV(table, filename) {
    const tableEl =
      typeof table === 'string' ? document.querySelector(table) : table;
    if (!tableEl) {
      if (global.MediCareComponents?.showToast) {
        global.MediCareComponents.showToast('Table not found for export.', 'error');
      }
      return false;
    }

    const rows = Array.from(tableEl.querySelectorAll('tr')).filter(
      (r) => r.style.display !== 'none'
    );

    const csv = rows
      .map((row) => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells
          .map((cell) => {
            // Skip action columns
            if (cell.classList.contains('table-actions')) return '';
            let text = cell.innerText.replace(/\s+/g, ' ').trim();
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
              text = `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          })
          .filter((_, i, arr) => {
            // drop trailing empty action col
            return true;
          })
          .join(',');
      })
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `medicare-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (global.MediCareComponents?.showToast) {
      global.MediCareComponents.showToast('CSV downloaded.', 'success');
    }
    return true;
  }

  /**
   * Auto-bind [data-export-csv] buttons
   */
  function initExportButtons() {
    document.querySelectorAll('[data-export-csv]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sel = btn.getAttribute('data-export-csv');
        const name = btn.getAttribute('data-filename') || 'medicare-export.csv';
        exportTableCSV(sel || 'table', name);
      });
    });
  }

  /* ================================================================== */
  /*  Dashboard user chip                                               */
  /* ================================================================== */

  function renderUserChip(selector) {
    const el = document.querySelector(selector || '[data-user-chip]');
    if (!el) return;
    const user = global.MediCareAuth?.getCurrentUser?.();
    if (!user) {
      el.innerHTML = '<span class="text-muted">Guest</span>';
      return;
    }
    el.innerHTML = `
      <img src="${user.avatar || ''}" alt="" class="user-avatar" width="36" height="36"
           onerror="this.style.display='none'" />
      <span>
        <strong>${escapeHtml(user.name)}</strong>
        <small>${escapeHtml(user.role)}</small>
      </span>
    `;
  }

  /* ================================================================== */
  /*  Bootstrap all dashboard widgets on a page                         */
  /* ================================================================== */

  function initDashboardPage(options) {
    initSidebar(options?.sidebar);
    initDashboardCharts(options?.charts);
    initTableSearch();
    initTableFilter();
    initNotifications();
    initExportButtons();
    renderUserChip();

    document.querySelectorAll('table[data-paginate]').forEach((table) => {
      initPagination({ table, pageSize: options?.pageSize });
    });
  }

  /* ================================================================== */
  /*  Public API                                                        */
  /* ================================================================== */

  const MediCareDashboard = {
    initSidebar,
    initDashboardCharts,
    initTableSearch,
    initTableFilter,
    initPagination,
    initNotifications,
    markNotificationsRead,
    addNotification,
    readNotifications,
    exportTableCSV,
    initExportButtons,
    renderUserChip,
    initDashboardPage,
  };

  global.MediCareDashboard = MediCareDashboard;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareDashboard;
  }
})(typeof window !== 'undefined' ? window : globalThis);

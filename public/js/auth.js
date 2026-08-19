/**
 * MediCare Plus — Auth Simulation (localStorage)
 * Roles: patient | doctor | admin
 * Session key: medicare_session
 *
 * Demo accounts:
 *   patient@medicare.com / patient123
 *   doctor@medicare.com  / doctor123
 *   admin@medicare.com   / admin123
 */
(function (global) {
  'use strict';

  const STORAGE = {
    session: 'medicare_session',
    users: 'medicare_users',
    resetTokens: 'medicare_reset_tokens',
  };

  const ROLES = Object.freeze({
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    ADMIN: 'admin',
  });

  /* ------------------------------------------------------------------ */
  /*  Demo seed users                                                   */
  /* ------------------------------------------------------------------ */
  const DEMO_USERS = [
    {
      id: 'u-patient',
      name: 'Demo Patient',
      email: 'patient@medicare.com',
      password: 'patient123',
      role: ROLES.PATIENT,
      phone: '+1 555-0101',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      address: '42 Oak Street, Health City',
      bloodGroup: 'O+',
      age: 34,
      dob: '1992-03-14',
      gender: 'female',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'u-doctor',
      name: 'Dr. Sarah Mitchell',
      email: 'doctor@medicare.com',
      password: 'doctor123',
      role: ROLES.DOCTOR,
      phone: '+1 555-0201',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
      doctorId: 'd1',
      departmentId: 'cardiology',
      specialty: 'Interventional Cardiologist',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'u-admin',
      name: 'System Admin',
      email: 'admin@medicare.com',
      password: 'admin123',
      role: ROLES.ADMIN,
      phone: '+1 555-0301',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  /* ------------------------------------------------------------------ */
  /*  Storage helpers                                                   */
  /* ------------------------------------------------------------------ */
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

  function ensureUsers() {
    let users = readJSON(STORAGE.users, null);
    if (!Array.isArray(users) || users.length === 0) {
      users = DEMO_USERS.map((u) => ({ ...u }));
      writeJSON(STORAGE.users, users);
    } else {
      // Ensure demo accounts always exist (merge by email)
      DEMO_USERS.forEach((demo) => {
        const idx = users.findIndex((u) => u.email.toLowerCase() === demo.email.toLowerCase());
        if (idx === -1) {
          users.push({ ...demo });
        }
      });
      writeJSON(STORAGE.users, users);
    }
    return users;
  }

  function findUserByEmail(email) {
    const users = ensureUsers();
    return users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase()) || null;
  }

  function findUserById(id) {
    const users = ensureUsers();
    return users.find((u) => u.id === id) || null;
  }

  function saveUsers(users) {
    writeJSON(STORAGE.users, users);
  }

  function stripPassword(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /* ------------------------------------------------------------------ */
  /*  Session                                                           */
  /* ------------------------------------------------------------------ */
  function setSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar || '',
      loggedInAt: new Date().toISOString(),
    };
    writeJSON(STORAGE.session, session);
    return session;
  }

  function clearSession() {
    localStorage.removeItem(STORAGE.session);
  }

  function getSession() {
    return readJSON(STORAGE.session, null);
  }

  /**
   * @returns {object|null} Current user without password
   */
  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.userId) return null;
    const user = findUserById(session.userId);
    if (!user) {
      clearSession();
      return null;
    }
    return stripPassword(user);
  }

  /**
   * Check if a user is logged in. Optionally require a specific role
   * (or array of roles).
   */
  function isAuthenticated(role) {
    const user = getCurrentUser();
    if (!user) return false;
    if (!role) return true;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }

  /**
   * Guard a page: redirect if not authenticated (or wrong role).
   * @param {string|string[]} role
   * @param {string} redirectPath
   * @returns {object|null} current user if allowed
   */
  function requireAuth(role, redirectPath) {
    if (isAuthenticated(role)) {
      return getCurrentUser();
    }
    const target = redirectPath || resolveLoginPath();
    if (typeof window !== 'undefined') {
      const returnUrl = encodeURIComponent(window.location.href);
      const sep = target.includes('?') ? '&' : '?';
      window.location.href = `${target}${sep}redirect=${returnUrl}`;
    }
    return null;
  }

  function resolveLoginPath() {
    // Heuristic for nested panel pages
    const path = (typeof window !== 'undefined' && window.location.pathname) || '';
    if (/\/(customer|doctor|admin)\//i.test(path)) return '../login.html';
    return 'login.html';
  }

  /* ------------------------------------------------------------------ */
  /*  Login / Register / Logout                                          */
  /* ------------------------------------------------------------------ */
  /**
   * @returns {{ success: boolean, user?: object, message: string }}
   */
  function login(email, password) {
    ensureUsers();
    const emailTrim = String(email || '').trim();
    const pass = String(password || '');

    if (!emailTrim || !pass) {
      return { success: false, message: 'Email and password are required.' };
    }

    const user = findUserByEmail(emailTrim);
    if (!user || user.password !== pass) {
      return { success: false, message: 'Invalid email or password.' };
    }

    setSession(user);
    return {
      success: true,
      user: stripPassword(user),
      message: `Welcome back, ${user.name}!`,
    };
  }

  /**
   * Register a new patient (default role). Admins/doctors are demo-only.
   * @param {object} formData
   */
  function register(formData) {
    ensureUsers();
    const data = formData || {};
    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const phone = String(data.phone || '').trim();
    const role = data.role === ROLES.DOCTOR || data.role === ROLES.ADMIN
      ? data.role
      : ROLES.PATIENT;

    if (!name || !email || !password) {
      return { success: false, message: 'Name, email, and password are required.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }
    if (findUserByEmail(email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const users = ensureUsers();
    const newUser = {
      id: uid('u'),
      name,
      email,
      password,
      role,
      phone,
      avatar:
        data.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      address: data.address || '',
      bloodGroup: data.bloodGroup || '',
      age: data.age ? Number(data.age) : null,
      gender: data.gender || '',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Auto-login after register
    setSession(newUser);

    return {
      success: true,
      user: stripPassword(newUser),
      message: 'Account created successfully.',
    };
  }

  function logout(redirectPath) {
    clearSession();
    if (redirectPath && typeof window !== 'undefined') {
      window.location.href = redirectPath;
    }
    return { success: true, message: 'You have been logged out.' };
  }

  /* ------------------------------------------------------------------ */
  /*  Password reset (token simulation)                                 */
  /* ------------------------------------------------------------------ */
  /**
   * Create a reset token for an email. In this demo the token is returned
   * so the UI can show it (no real email is sent).
   */
  function requestPasswordReset(email) {
    const user = findUserByEmail(email);
    if (!user) {
      // Don't reveal whether email exists in a real app; for demo we can be honest.
      return { success: false, message: 'No account found with that email.' };
    }

    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    const tokens = readJSON(STORAGE.resetTokens, {});
    tokens[user.email.toLowerCase()] = {
      token,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      userId: user.id,
    };
    writeJSON(STORAGE.resetTokens, tokens);

    return {
      success: true,
      token,
      message: `Reset token generated (demo): ${token}. Use it within 30 minutes.`,
    };
  }

  /**
   * Reset password with email + token + new password.
   */
  function resetPassword(email, token, newPassword) {
    const emailKey = String(email || '').toLowerCase();
    const tokens = readJSON(STORAGE.resetTokens, {});
    const entry = tokens[emailKey];

    if (!entry || entry.token !== String(token || '').toUpperCase()) {
      return { success: false, message: 'Invalid or expired reset token.' };
    }
    if (Date.now() > entry.expiresAt) {
      delete tokens[emailKey];
      writeJSON(STORAGE.resetTokens, tokens);
      return { success: false, message: 'Reset token has expired. Please request a new one.' };
    }
    if (!newPassword || String(newPassword).length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }

    const users = ensureUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === emailKey);
    if (idx === -1) {
      return { success: false, message: 'User not found.' };
    }

    users[idx].password = String(newPassword);
    saveUsers(users);

    delete tokens[emailKey];
    writeJSON(STORAGE.resetTokens, tokens);

    return { success: true, message: 'Password updated. You can log in now.' };
  }

  /* ------------------------------------------------------------------ */
  /*  Profile / password change                                         */
  /* ------------------------------------------------------------------ */
  function updateProfile(data) {
    const session = getSession();
    if (!session) {
      return { success: false, message: 'You must be logged in.' };
    }

    const users = ensureUsers();
    const idx = users.findIndex((u) => u.id === session.userId);
    if (idx === -1) {
      return { success: false, message: 'User not found.' };
    }

    const allowed = [
      'name',
      'phone',
      'avatar',
      'address',
      'bloodGroup',
      'age',
      'dob',
      'gender',
      'specialty',
      'departmentId',
    ];

    allowed.forEach((key) => {
      if (data[key] !== undefined) {
        users[idx][key] = key === 'age' ? (data[key] === '' ? null : Number(data[key])) : data[key];
      }
    });

    saveUsers(users);
    setSession(users[idx]); // refresh session display fields

    return {
      success: true,
      user: stripPassword(users[idx]),
      message: 'Profile updated successfully.',
    };
  }

  function changePassword(oldPassword, newPassword) {
    const session = getSession();
    if (!session) {
      return { success: false, message: 'You must be logged in.' };
    }

    const users = ensureUsers();
    const idx = users.findIndex((u) => u.id === session.userId);
    if (idx === -1) {
      return { success: false, message: 'User not found.' };
    }

    if (users[idx].password !== String(oldPassword || '')) {
      return { success: false, message: 'Current password is incorrect.' };
    }
    if (!newPassword || String(newPassword).length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }
    if (String(oldPassword) === String(newPassword)) {
      return { success: false, message: 'New password must be different from the current password.' };
    }

    users[idx].password = String(newPassword);
    saveUsers(users);

    return { success: true, message: 'Password changed successfully.' };
  }

  /**
   * Dashboard path for a role after login.
   */
  function getDashboardPath(role, basePath) {
    const base = basePath != null ? basePath : '';
    switch (role) {
      case ROLES.ADMIN:
        return `${base}admin/dashboard.html`;
      case ROLES.DOCTOR:
        return `${base}doctor/dashboard.html`;
      case ROLES.PATIENT:
      default:
        return `${base}customer/dashboard.html`;
    }
  }

  /**
   * List all users (admin helper) — passwords stripped.
   */
  function getAllUsers() {
    return ensureUsers().map(stripPassword);
  }

  /* ------------------------------------------------------------------ */
  /*  Init                                                              */
  /* ------------------------------------------------------------------ */
  ensureUsers();

  const MediCareAuth = {
    ROLES,
    STORAGE_KEYS: STORAGE,
    DEMO_USERS: DEMO_USERS.map(stripPassword),
    login,
    register,
    logout,
    getCurrentUser,
    getSession,
    isAuthenticated,
    requireAuth,
    requestPasswordReset,
    resetPassword,
    updateProfile,
    changePassword,
    getDashboardPath,
    getAllUsers,
  };

  global.MediCareAuth = MediCareAuth;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediCareAuth;
  }
})(typeof window !== 'undefined' ? window : globalThis);

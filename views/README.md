# MediCare Plus — Hospital & Clinic Management Website

Premium multi-specialty hospital frontend with public marketing site plus Patient, Doctor, and Admin dashboards. Pure HTML/CSS/JavaScript — open `index.html` to run (no build step). Ready to connect to PHP, Node.js, or Django later.

## Quick Start

1. Open `index.html` in a modern browser (Chrome, Edge, Firefox).
2. For dashboards, use the demo accounts on the login page.

**Note:** Because the site uses ES-free scripts and `localStorage`, a local static server is recommended if your browser blocks some CDN assets under `file://`:

```bash
npx serve .
# or: python -m http.server 8080
```

## Demo Logins

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Patient | patient@medicare.com   | patient123  |
| Doctor  | doctor@medicare.com    | doctor123   |
| Admin   | admin@medicare.com     | admin123    |

Admin panel also has a dedicated entry at `admin/login.html`.

## Folder Structure

```
Hospital-Website/
├── index.html                 # Home
├── about.html … contact.html  # Public pages
├── login.html / register.html / forgot-password.html
├── customer/                  # Patient portal
├── doctor/                    # Doctor portal
├── admin/                     # Hospital admin
├── css/                       # Modular stylesheets
├── js/                        # Shared + panel scripts
├── images/ icons/ fonts/ assets/
└── README.md
```

## Features

- Hero slider, appointment booking, departments, doctors, treatments
- Gallery, testimonials, blog, FAQ, pricing, contact + map
- Dark/light mode, sticky header, mega menu, WhatsApp & scroll-top floats
- Patient: appointments, history, reports, prescriptions, payments, chat UI, notifications
- Doctor: schedule, patients, treatment notes, prescription generator, reports
- Admin: CRUD for doctors/patients/appointments/departments/medicines, analytics, CMS settings
- Offline demo data via `localStorage` (appointments, auth session, admin CRUD)

## Tech

- HTML5, CSS3, Vanilla JS
- Font Awesome 6, Google Fonts (Outfit + DM Sans)
- AOS, Swiper, Chart.js (CDN)

## Backend Hookup

Forms and JS modules are structured for later API integration:

- `js/auth.js` — replace localStorage with JWT/session API calls
- `js/appointment.js` — POST/GET `/api/appointments`
- `js/data.js` — swap seed data for REST/GraphQL responses
- Keep HTML field `name` attributes stable for PHP/Django form binding

## License

Frontend demo for portfolio / educational use. Medical imagery from Unsplash.

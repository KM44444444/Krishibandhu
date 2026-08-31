# 🌾 KrishiBandhu — Agricultural Web Platform

A complete, role-based agricultural web ecosystem connecting **Farmers, Government, Admin, Buyers, Sellers, and Agricultural Experts**.

## What's implemented (working, not mocked)

- **Authentication** — registration, login, JWT sessions, role-based route protection (frontend + backend)
- **6 role dashboards** — Farmer, Government, Admin, Buyer, Seller, Expert (43 pages total)
- **Farm & Land Management** — full CRUD
- **Soil Testing Workflow** — farmer requests → government enters verified results → official report → farmer views it, with notifications at each step
- **Crop Recommendation** & **Fertilizer Recommendation** — rule-based decision support generated from the farmer's actual verified soil report
- **Crop Calendar** — manual activities + auto-generated schedules from crop templates
- **Expert Support** — chat and consultation request/response flows with real message threads
- **Marketplace** — sellers list products, buyers/farmers purchase, stock decrements, sellers manage order status
- **Notifications** — central system firing on soil reports, orders, consultations, government alerts
- **Learning Center** — YouTube video guides, admin-managed
- **Admin tools** — user management (activate/deactivate), crop database management, marketplace oversight, **consultations monitoring**, learning video management, system stats
- **File uploads** — government can attach a real scanned/lab report file (PDF/image) to a soil report; sellers can upload a real product image. Both are validated (type + 8MB size limit) and served back from `/uploads/...`

## Known remaining gaps (honestly, not everything is done)

- **Automated test suite** — the `tests/` folder from the original spec isn't populated with actual Jest/Mocha files. All testing so far has been manual `curl`-based smoke testing across all 6 roles (passing), plus a full syntax check of every JS file and every page's inline script (all pass). No one has clicked through the UI in an actual browser.
- **Production hardening** — no rate limiting, no `helmet`, minimal input sanitization. Fine for a demo/final-year project, not production-ready as-is.
- **Payment gateway** — not integrated (this was always flagged in the original spec as a later production step).

## Honestly labeled as NOT fully implemented (per the spec's own rule)

- **🤖 Plant Disease Detection** — UI built, clearly marked `COMING SOON`, disabled. No AI model wired in.
- **🧪 Soil Image Detection** — same: UI built, `COMING SOON`, disabled.
- **📹 Live Video Calling** — the request/scheduling workflow is fully functional (creates real consultation records, notifies experts), but the actual in-browser WebRTC video call is marked `REQUIRES PRODUCTION IMPLEMENTATION` and shows a disabled preview interface instead of a live call.
- **Payment gateway** — orders are created and tracked, but no real payment processor is integrated (marked as a production step, per the original spec).

## Tech Stack

- **Backend**: Node.js, Express, SQLite (via `better-sqlite3`), JWT auth, bcrypt password hashing
- **Frontend**: Plain HTML/CSS/JavaScript (no build step), Font Awesome icons via CDN

## Setup

### 1. Backend

```bash
cd backend
npm install
npm run seed     # creates & seeds the SQLite database with demo data
npm start         # or: npm run dev (with nodemon)
```

The API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`

### 2. Frontend

The frontend is static — no build step. Simplest option:

```bash
cd frontend
npx serve .
# or just open frontend/index.html directly in a browser
```

Make sure the backend is running on port 5000 (the frontend's `assets/js/api.js` points to `http://localhost:5000/api`).

## Demo Accounts

All demo accounts use the password: **`password123`**

| Role | Email |
|---|---|
| Farmer | farmer@krishibandhu.com |
| Government | government@krishibandhu.com |
| Admin | admin@krishibandhu.com |
| Buyer | buyer@krishibandhu.com |
| Seller | seller@krishibandhu.com |
| Expert | expert@krishibandhu.com |

Or register a new account and pick any role from the registration screen.

## Project Structure

```
KRISHIBANDHU/
├── backend/
│   ├── server.js              # Express entry point
│   ├── config/database.js     # SQLite connection + schema loader
│   ├── middleware/            # auth (JWT), role (authorization), errorHandler
│   ├── routes/                # one file per resource
│   ├── controllers/           # business logic
│   ├── services/               # notification + recommendation logic
│   └── database/seed.js       # demo data
├── database/
│   └── schema.sql             # full relational schema
└── frontend/
    ├── index.html, login.html, register.html, unauthorized.html
    ├── assets/{css,js}/        # shared design system + layout engine
    ├── farmer/ (17 pages)
    ├── government/ (4 pages)
    ├── admin/ (5 pages)
    ├── buyer/ (4 pages)
    ├── seller/ (4 pages)
    └── expert/ (4 pages)
```

## Security Notes

- Passwords are hashed with bcrypt, never stored in plaintext.
- All protected API routes require a valid JWT; role-restricted routes verify `req.user.role` server-side (not just hidden in the UI) — verified in testing that a Farmer token gets `403` on Admin-only endpoints.
- The `.env` file contains a demo JWT secret — **replace it before any real deployment.**

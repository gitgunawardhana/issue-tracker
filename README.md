# Issue Tracker

A full-stack issue tracker with CRUD operations, multi-user collaboration, JWT authentication with refresh tokens, and a polished minimal UI.

**Live demo:** _(set after deploy)_
- Frontend: <https://issue-tracker-puce-nine.vercel.app/>
- Backend: <https://issue-tracker-ofq7.onrender.com>

---

## Tech Stack

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** (CSS-first config, class-based dark mode)
- **Ant Design v6** (multi-select dropdowns, inputs)
- **Zustand** — state management (auth, theme, toasts, issues)
- **nuqs** — URL-synced filter state (search, page, filters in querystring)
- **use-debounce** — debounced search input
- **React Router v7** + **NuqsAdapter**
- **Axios** with refresh-token interceptor

### Backend
- **Node.js** + **Express 5** + **TypeScript**
- **MongoDB** + **Mongoose**
- **JWT** access tokens (15 min) + **httpOnly refresh-token cookies** (7 days)
- **bcryptjs** password hashing
- **Zod** request validation
- **PDFKit** for PDF exports
- **cookie-parser** + CORS with credentials

---

## Features

### Authentication & Authorization
- Register / login with email + password
- bcrypt password hashing (salt rounds = 10)
- **Dual-token JWT**: short-lived access token in localStorage + long-lived refresh token in httpOnly cookie
- Axios interceptor auto-refreshes access tokens on 401
- Concurrent-request queue prevents race conditions during refresh
- Auto-logout on refresh failure
- Show / hide password toggle with real-time validation criteria (length, upper/lower case, number, symbol)
- Confirm-password match indicator

### Issue Management (CRUD)
- Create / read / update / delete issues
- Fields: title, description, priority (Low/Medium/High), severity (Low/Medium/High/Critical), status (Open/In Progress/Resolved), reporter, assignee
- **Reporter-only edit/delete** — authorization checked client and server side
- **Take / Untake assignment** — anyone can assign to themselves
- **Mark as Resolved** with optional resolution note saved with the issue

### Dashboard
- Stat cards (Open, In Progress, Resolved, Assigned to Me) — clickable to filter
- Color-coded badges for status, priority, severity (with dark-mode variants)
- Responsive table (desktop) ↔ card list (mobile)
- Avatar component with deterministic colors based on name
- Empty / loading skeleton states

### Search, Filter & Pagination
- Debounced search (400 ms) by title + description
- Multi-select filters: Status, Priority, Severity, Assignees (with search inside Assignees)
- "My issues" / "Unassigned" pseudo-options for assignee filter
- Clear-all-filters button shown when any filter active
- **URL-synced state** — filters and pagination preserved on refresh and shareable via link
- Smart pagination with ellipsis (`< 1 … 4 5 6 … 10 >`)

### Export
- Export filtered list as **PDF** (PDFKit, server-side) or **JSON**
- Loading spinner on export button
- Filters applied to export — only matching issues are exported

### UX & Theming
- **Dark mode** toggle (sun/moon) — persisted in localStorage
- Class-based theming via Tailwind v4 `@custom-variant`
- Ant Design dark algorithm synced with theme store
- Toast notifications (success/error/info) with slide-in animation
- Modal dialogs with backdrop blur, click-outside close, Esc key handling, sticky footer for action buttons
- Sticky navbar and filter bar
- Draggable scroll-to-top button (snaps to bottom-left or bottom-right corner)
- Logo in monochrome (auto-inverts in dark mode)

---

## Project Structure

```
issue-tracker/
├── backend/
│   ├── src/
│   │   ├── controllers/      # issueController, exportController
│   │   ├── middleware/       # authenticateToken (JWT verify)
│   │   ├── models/           # User, Issue (Mongoose schemas)
│   │   ├── routes/           # auth, issues, users
│   │   ├── types/            # shared TS types
│   │   └── server.ts         # entry point
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── logo.png
│   ├── src/
│   │   ├── components/       # Modal, ConfirmDialog, ResolveDialog,
│   │   │                     # Avatar, PasswordInput, IssueForm,
│   │   │                     # IssueList, IssueDetail, Pagination,
│   │   │                     # ExportMenu, ScrollToTopButton,
│   │   │                     # ToastContainer, AuthLayout, Icons
│   │   ├── pages/            # Login, Register, Dashboard
│   │   ├── services/         # api.ts (axios + interceptors)
│   │   ├── store/            # authStore, themeStore, toastStore, issueStore
│   │   ├── types/            # shared TS types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── vercel.json           # SPA rewrites for /login, /register, etc.
│   ├── tsconfig.app.json
│   └── package.json
├── README.md
└── .gitignore
```

---

## Prerequisites

- **Node.js** v18 or higher
- **MongoDB** v6+ (local) or MongoDB Atlas connection string
- **npm** v9+

---

## Setup

### 1. Clone

```bash
git clone <repo-url>
cd issue-tracker
```

### 2. Backend

```bash
cd backend
yarn install
cp .env.example .env
```

Edit `backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/issue-tracker
JWT_SECRET=long-random-string-32-chars-or-more
REFRESH_TOKEN_SECRET=different-long-random-string-32-chars-or-more
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
CROSS_SITE_COOKIES=false
```

Start MongoDB (local):
```bash
mongod
```

Run backend:
```bash
yarn run dev          # ts-node-dev with hot reload
# OR
yarn run build && yarn start    # production
```

Server runs on `http://localhost:5000`.

### Seed sample data (optional)

Pre-populated users + issues live in `backend/seed/`:

- `users.json` — 3 test accounts (Ishan, Nuwan, Athula)
- `issues.json` — sample issues

**npm script:**
```bash
cd backend
yarn run seed       # wipes users + issues, then inserts seed data
```

Seed user credentials (use any to log in):

| Email | Name | Password |
|-------|------|----------|
| `t.gunawardana864@gmail.com` | Ishan Tharindu | `Password123!` |
| `t.gunawardana864+1@gmail.com` | Nuwan K | `Password123!` |
| `t.gunawardana864+2@gmail.com` | Athula Chamath | `Password123!` |

> Passwords are pre-hashed with bcrypt in the seed file. All three accounts share the same password: **`Password123!`**.

### 3. Frontend

```bash
cd frontend
yarn install
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Run frontend:
```bash
yarn run dev          # vite dev server
```

App runs on `http://localhost:5173`.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/issue-tracker` |
| `JWT_SECRET` | Secret for access tokens | `random-32-char-string` |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens | `another-random-32-char-string` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CORS_ORIGIN` | Allowed frontend origin(s) (comma-separated) | `http://localhost:5173` |
| `CROSS_SITE_COOKIES` | `true` if frontend & backend are on different sites in production (HTTPS required) | `false` |

### Frontend (`.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## API Reference

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ email, password, name }` | Register new user |
| POST | `/api/auth/login` | `{ email, password }` | Returns `accessToken` + sets `refreshToken` httpOnly cookie |
| POST | `/api/auth/refresh` | — (reads cookie) | Returns new `accessToken`; rotates refresh cookie |
| POST | `/api/auth/logout` | — | Clears refresh cookie |

### Issues (all require `Authorization: Bearer <accessToken>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/issues` | List with filters, pagination, status counts |
| POST | `/api/issues` | Create issue |
| GET | `/api/issues/:id` | Get single issue |
| PUT | `/api/issues/:id` | Update issue (reporter only) |
| DELETE | `/api/issues/:id` | Delete issue (reporter only) |
| PATCH | `/api/issues/:id/status` | Change status (optional `note` for Resolved) |
| PATCH | `/api/issues/:id/assign` | Assign issue (`assignedTo: userId` or `null`) |
| GET | `/api/issues/export?format=pdf\|json` | Export filtered issues |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (for assignee dropdown) |

### Filters for `GET /api/issues`

| Param | Example | Notes |
|-------|---------|-------|
| `search` | `?search=login` | Searches title + description |
| `status` | `?status=Open,In Progress` | Comma-separated multi-select |
| `priority` | `?priority=High,Medium` | Comma-separated |
| `severity` | `?severity=Critical` | Comma-separated |
| `assignedTo` | `?assignedTo=me,unassigned,<userId>` | `me` resolves to current user |
| `page` | `?page=2` | Defaults to 1 |
| `limit` | `?limit=20` | Defaults to 10 |

---

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "password": "<bcrypt-hash>",
  "name": "Ishan Tharindu",
  "createdAt": "2026-05-20T...",
  "updatedAt": "2026-05-21T..."
}
```

### Issue
```json
{
  "_id": "ObjectId",
  "title": "Login button broken",
  "description": "Long description...",
  "status": "Open | In Progress | Resolved",
  "priority": "Low | Medium | High",
  "severity": "Low | Medium | High | Critical",
  "createdBy": "ObjectId (ref: User)",
  "assignedTo": "ObjectId (ref: User) | null",
  "resolutionNote": "Fixed by updating dependency",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Usage Guide

1. **Register** at `/register` — password must satisfy strength criteria
2. **Login** at `/login` — JWT issued, refresh cookie set
3. **Dashboard** opens after login
4. **Create issue** via "+ New Issue" — fill form in modal
5. **Filter** using Status / Priority / Severity / Assignees multi-selects + search bar
6. **Click any row** to see full issue details in modal
7. **Take** an unassigned issue, **Untake** to release
8. **Mark as Resolved** — optionally add a resolution note
9. **Export** filtered list as PDF or JSON
10. **Toggle dark mode** via sun/moon icon in navbar
11. **Drag scroll-to-top button** to your preferred corner (bottom-left or bottom-right)

---

## Build & Deploy

### Local Production Build

**Backend:**
```bash
cd backend
yarn run build
yarn start
```

**Frontend:**
```bash
cd frontend
yarn run build
# Output: frontend/dist/
```

---

## Author

Built as a take-home assignment showcasing full-stack TypeScript, secure authentication, server-side PDF generation, and modern React patterns (URL-synced state, debouncing, reusable component design).

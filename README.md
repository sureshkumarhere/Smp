# SMP Chat — Features & Advantages

[![CI Checks](https://github.com/sureshkumarhere/Smp/actions/workflows/ci.yml/badge.svg)](https://github.com/sureshkumarhere/Smp/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/Tests-21%20Passed-brightgreen?logo=jest&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8.4-47A248?logo=mongodb&logoColor=white)

SMP Chat is a collaborative chat platform designed for mentors and students. It focuses on group collaboration, easy meeting coordination, clear attendance tracking, and real-time audio/video interaction so teams can stay connected without losing context.

---

## Key features

### Messaging & Real-Time Communication
- Real-time private and group chat with Socket.IO for instant messages and typing indicators.
- **WebRTC Calling Signaling** — 1-on-1 peer-to-peer audio and video call signaling with clean disconnect handling.
- **Message reactions** — like/emoji-react to any message, broadcast live to all members.
- **Reply to messages** — reply previews render inline in the conversation.
- **Media sharing** — upload images, videos, and generic files directly in chat (Cloudinary integration).
- **Unread counts & badges** — per-chat unread badges with a "99+" cap.
- **Online presence** — live online/offline status dots for direct chats (role-aware visibility).

### Collaboration & Administration
- Mentor roles and group administration (add/remove members, assign mentors).
- Schedule group meetings and attach a meeting time to each session.
- **Meeting reminders** — a banner in group chats and a calendar icon in the chat list highlight scheduled meetings.
- Attendance tracking per meeting with `present`, `absent`, and `pending` states.
- Push-style notifications for new messages and attendance changes.

### Auth & Profiles
- **Google OAuth 2.0 / OpenID Connect** — seamless one-click sign in and auto-registration with Google profile avatars.
- **Smart Registration Number Resolution** — automatically extracts the 8-digit roll number from institutional `@mnnit.ac.in` emails (`name.<regNo>@mnnit.ac.in`), or assigns unique generic IDs for Gmail/testing accounts.
- **Configurable Email Restrictions** — environment-driven domain whitelisting (`ALLOWED_EMAIL_DOMAINS`).
- JWT-based session security with bcrypt password hashing.
- Modern split-screen **Sign In / Sign Up** pages with password visibility toggle and inline validation.

### UI/UX
- Modern glassmorphism UI with gradients, ambient background blobs, and smooth animations.
- Responsive chat layout that **fits the screen** without page scroll (flexbox-based).
- Shimmer loaders and refined loading states.

---

## Tech Stack

- **Frontend:** React 18, Vite 5, Redux Toolkit, Tailwind CSS, `@react-oauth/google`, Socket.IO client, React Router, React Toastify.
- **Backend:** Node.js (v20), Express, MongoDB (Mongoose), Socket.IO, `google-auth-library`, Cloudinary, JWT authentication.
- **Testing:** Jest + Supertest (Backend), Vitest (Frontend).
- **CI/CD:** GitHub Actions automated testing, ESLint verification, and build validation.

---

## Installation & Setup

### 1. Prerequisites
- **Node.js:** `v20.x` or higher
- **npm:** `v10.x` or higher
- **MongoDB:** Local MongoDB instance (`mongodb://127.0.0.1:27017/chat-app`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cloud cluster.

### 2. Clone Repository
```bash
git clone https://github.com/sureshkumarhere/Smp.git
cd Smp
```

### 3. Install Dependencies
Install dependencies for both backend and frontend with a single command from root:
```bash
npm run install:all
```
*(Or manually run `npm install` inside both `/backend` and `/frontend`).*

---

## Environment Variables

### Backend Configuration (`backend/.env`)
Create a file named `.env` in the `backend/` directory (refer to `backend/.env.example`):

```env
PORT=9000
MONGODB_URI=mongodb://127.0.0.1:27017/chat-app
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Allowed email domains (* for any, or comma-separated list like mnnit.ac.in,gmail.com)
ALLOWED_EMAIL_DOMAINS=*

# Google OAuth (Optional: for Google Sign-in)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Cloudinary (Optional: for media/file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Configuration (`frontend/.env`)
Create a file named `.env` in the `frontend/` directory (refer to `frontend/.env.example`):

```env
VITE_BACKEND_URL=http://localhost:9000
VITE_ALLOWED_EMAIL_DOMAINS=*

# Google OAuth Client ID (must match backend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## Running the Application

### One-Command Local Startup
From the project root:
```bash
npm start
```
This starts both services concurrently:
* **Backend:** Runs on [http://localhost:9000](http://localhost:9000)
* **Frontend:** Runs on [http://localhost:5173](http://localhost:5173)

---

## Running Automated Tests

Run the full test suite (21 unit tests across backend & frontend):
```bash
npm test
```

Or run individually:
```bash
# Backend tests only (Jest)
npm run test:backend

# Frontend tests only (Vitest)
npm run test:frontend
```

---

## Production Deployment

- **Backend (Render):**
  - **Root Directory:** `backend`
  - **Build Command:** `npm install`
  - **Start Command:** `node server.js`
  - **Environment Variables:** Add all variables from `backend/.env`. Set `NODE_VERSION=20.18.0`.
- **Frontend (Vercel):**
  - **Root Directory:** `frontend`
  - **Framework Preset:** `Vite`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Environment Variables:** Set `VITE_BACKEND_URL` to your live Render backend URL.

---

## Author

**Suresh Kumar**

# SMP Hub Feature Roadmap & TODO

Daily development milestones for SMP Hub (Collaborative Chat, WebRTC Calling & Attendance Platform).

---

## 📅 Execution Roadmap

- [x] **Step 1: Attendance Export to CSV / Excel** *(Completed)*
  - One-click export button for mentors on each scheduled meeting card.
  - Generates structured CSV with Roll No, Student Name, Email, Status, Timestamp, Meeting Title, Scheduled Time, and Group Name.
  - Fully compatible with Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice.
  - Endpoints & Components:
    - Backend: `GET /api/chat/attendance/export/:meetingId` with mentor authorization & CSV headers.
    - Frontend: `Attendance.jsx` export handler with automatic fallback for offline reliability.

- [x] **Step 2: In-Meeting Interactive Whiteboard / Canvas** *(Completed)*
  - Real-time collaborative whiteboard during audio/video calls.
  - Freehand drawing, shapes (line / rectangle / circle), color picker, stroke size, eraser, undo, and clear board.
  - Socket.IO live stroke previews and committed strokes synced between mentor and participating students.
  - Shared board per meeting / direct call with late-join replay and bounded in-memory history.
  - Entry points: whiteboard button in both the 1-on-1 and group call overlays.
  - Backend: `whiteboard:join`, `whiteboard:preview`, `whiteboard:stroke`, `whiteboard:undo`, `whiteboard:clear`, `whiteboard:leave` events in `backend/socket.js`.
  - Frontend: `components/call/Whiteboard.jsx`, `utils/whiteboard.js`, whiteboard state in `context/CallContext.jsx`.

- [ ] **Step 3: Call History & Missed Call Alerts** *(Scheduled: Next)*
  - Persistent call activity logs inside direct and group chat threads.
  - Inline event messages: `"Voice call ended • 12m 45s"`, `"Missed video call"`, `"Group meeting started"`.
  - Database schema & Socket.IO broadcast integration.

- [ ] **Step 4: AWS Coturn Setup (TURN Server)**
  - Self-hosted Coturn TURN/STUN media relay server on AWS EC2.
  - Ensures 100% WebRTC peer connectivity across strict university Wi-Fi, enterprise firewalls, and symmetric mobile NATs (4G/5G).

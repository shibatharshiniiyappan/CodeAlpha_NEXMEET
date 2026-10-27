# NEXMEET — Real-Time Communication & Collaboration Platform

[![CodeAlpha Internship Project](https://img.shields.io/badge/CodeAlpha-Full--Stack%20Web%20Development%20Internship-cyan?style=for-the-badge)](https://codealpha.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![WebRTC](https://img.shields.io/badge/WebRTC-DTLS--SRTP-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **“Connect. Create. Collaborate. Without Limits.”**  
> NEXMEET is an enterprise-grade real-time collaboration application combining direct peer-to-peer WebRTC video conferencing, low-latency screen broadcasting, synchronized vector whiteboard drawing, quarantined file transfers, 2.5D spatial workspaces, structured idea-to-action brainstorming, and AI-assisted mission control.

---

## 1. CodeAlpha Internship Submission Details

- **Internship Organization**: [CodeAlpha](https://codealpha.tech/)
- **Domain / Track**: Full-Stack Web Development / Real-Time Communication Systems
- **Project Name**: NEXMEET Real-Time Communication & Collaboration Platform
- **Submission Author / Intern**: `[Author / CodeAlpha Intern]` (shibatharshiniiyappan07@gmail.com)
- **Primary Technologies**: React 19, TypeScript, Vite, Tailwind CSS v4, Node.js, Express, Socket.IO, WebRTC, Google Gemini API
- **Deployment Platform**: Render (`render.yaml` blueprint included)

---

## 2. Feature-to-Requirement Mapping Matrix

| Category | Internship Requirement | NEXMEET Implementation | Status |
| :--- | :--- | :--- | :---: |
| **Video & Audio Calling** | Multi-peer video and audio conferencing with device controls | Native WebRTC `RTCPeerConnection` full-mesh network with STUN NAT traversal. Live mute/unmute, video pause/resume, and Web Audio API `AnalyserNode` speaking detection with cyan border glow. | **Verified** |
| **Screen Sharing** | Seamless presentation sharing during live meetings | Native `navigator.mediaDevices.getDisplayMedia()` integration. Replaces outgoing video track via `sender.replaceTrack()` without tearing down the peer connection. | **Verified** |
| **Collaborative Whiteboard** | Real-time synchronized drawing canvas for meeting participants | HTML5 Canvas vector engine supporting pen, lines, rectangles, circles, text, color picker, brush sizes, undo/redo, PNG export, and sub-millisecond Socket.IO stroke broadcast. | **Verified** |
| **Chat & File Transfer** | Secure in-meeting messaging and document sharing | Real-time chat stream with timestamps and avatars. Quarantined file upload pipeline via Multer (25MB cap, MIME validation, path traversal neutralization). | **Verified** |
| **Spatial Rooms** | Immersive 2.5D virtual collaboration workspaces | 4 selectable virtual environments (*Innovation Lab, Focus Room, Creative Studio, Executive Boardroom*) featuring 2.5D perspective grids, video podiums, and ambient focus soundscapes. | **Verified** |
| **Idea-to-Action Canvas** | Structured brainstorming to actionable task conversion | 5 color-coded note categories (*Ideas, Questions, Challenges, Decisions, Action Items*). Supports voting, Kanban/Freeform views, and 1-click conversion into trackable tasks. | **Verified** |
| **Meeting Pulse** | Live conversational analytics & speaking time distribution | Client-side audio telemetry calculating speaking duration per participant, percentage share bar, and conversation balance indicators without storing raw microphone audio. | **Verified** |
| **AI Mission Control** | Strategic workload analysis and idea decomposition | Server-side Google Gemini 3.8 Flash integration with transparent approval-based recommendations and deterministic offline rule fallback. | **Verified** |
| **Authentication & Security** | User management, session protection, and access control | Salted `crypto.scryptSync` password hashing, hex session tokens, Zoom-style meeting ID generation (`849-392-1849`), pre-meeting hardware test lobby, and DTLS-SRTP encryption specs. | **Verified** |

---

## 3. System Architecture & Media Flow

```
[ Client A (Browser) ] <====== WebRTC DTLS-SRTP (Audio, Video, Screen) ======> [ Client B (Browser) ]
         |                                                                                |
         |  WSS / TLS 1.3                                                    WSS / TLS 1.3 |
         v                                                                                v
+-----------------------------------------------------------------------------------------------+
|                                      NEXMEET Backend                                          |
|  - Express HTTP API (Port 3000 / dynamic PORT)                                                |
|  - Socket.IO Signaling Server (SDP Offers, Answers, ICE Candidates, Presence, Whiteboard)    |
|  - Salted Scrypt Password Hashing & 64-char Hex Session Tokens                                |
|  - Quarantined Multer File Store (25MB Limit & MIME Validation)                              |
|  - Persistent JSON Storage Seed (/data/meetings.json, /data/users.json)                      |
|  - Google Gemini 3.8 Flash AI Integration (Idea Planning & Workload Telemetry)                |
+-----------------------------------------------------------------------------------------------+
         ^                                                                                ^
         |                                                                                |
         +------------------- Google STUN Servers (NAT Traversal) -----------------------+
```

### Media Transport & Encryption
- **Direct P2P Media**: Real-time audio and video packets are encrypted end-to-end via **DTLS-SRTP** (`SRTP_AEAD_AES_256_GCM`). Media frames flow directly between browser peers without server decoding.
- **Signaling & State Sync**: Socket.IO signaling messages (SDP offers/answers, ICE candidates), chat messages, whiteboard vectors, and spatial theme updates are transported over **WSS / TLS 1.3**.
- **File Quarantine**: Shared files undergo MIME type verification and path traversal neutralization on the server. Executables are blocked.

---

## 4. Visual Demonstration & Screenshots

Screenshots of the interface can be placed under `docs/screenshots/`:

| Feature | Screenshot Reference | Description |
| :--- | :--- | :--- |
| **Landing Page** | `docs/screenshots/01_landing_page.png` | Public landing page with instant meeting launcher and security specs |
| **Collaboration Workspace** | `docs/screenshots/02_dashboard_workspace.png` | Main hub with Personal Meeting ID (PMI), spatial rooms, and recent meetings |
| **Live WebRTC Call** | `docs/screenshots/03_webrtc_meeting_room.png` | Multi-peer video mesh with speaker indicators and in-call controls |
| **Collaborative Whiteboard** | `docs/screenshots/04_collaborative_whiteboard.png` | Real-time synchronized drawing canvas with shapes and color palette |
| **Spatial Rooms** | `docs/screenshots/05_spatial_rooms.png` | 2.5D themed virtual environment with video podiums and ambient soundscapes |
| **Idea-to-Action Canvas** | `docs/screenshots/06_idea_action_canvas.png` | 5-category brainstorming board with task conversion workflows |
| **Meeting Pulse** | `docs/screenshots/07_meeting_pulse.png` | Speaking duration distribution bar and conversation balance metrics |
| **AI Mission Control** | `docs/screenshots/08_ai_mission_control.png` | Strategic productivity briefings and deadline conflict detection |

*(Detailed capture guidelines are available in [`docs/screenshots/README.md`](docs/screenshots/README.md)).*

---

## 5. Technology Stack

- **Frontend**:
  - React 19 (`react`, `react-dom`)
  - TypeScript 5.0+
  - Vite 8.3
  - Tailwind CSS v4 (`@tailwindcss/vite`)
  - Lucide React (Icons)
  - Framer Motion (Transitions)
- **Backend & Real-Time**:
  - Node.js 18+ / 22+
  - Express 4.21
  - Socket.IO 4.8 & Socket.IO Client
  - Multer 2.4 (Quarantined multipart file uploads)
  - TSX (TypeScript execution runtime)
- **AI & Intelligence**:
  - Google GenAI SDK (`@google/genai` with Gemini 3.8 Flash)
  - Deterministic offline rule fallback engine
- **Media & Signaling Protocols**:
  - WebRTC Native APIs (`RTCPeerConnection`, `MediaStream`, `getDisplayMedia`)
  - STUN (`stun.l.google.com:19302`)
  - DTLS-SRTP & TLS 1.3

---

## 6. Local Development & Setup

### Prerequisites
- Node.js 18+ (tested on Node.js 22 LTS)
- npm 9+
- Modern WebRTC-compatible browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Safari)

### 1. Clone the Repository
```bash
git clone https://github.com/[your-username]/nexmeet.git
cd nexmeet
```

### 2. Configure Environment Variables
Copy the template file to `.env`:
```bash
cp .env.example .env
```
Edit `.env` (optional for local testing; all core features work offline without an API key):
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY="your_optional_gemini_key"
APP_URL="http://localhost:3000"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Build & Quality Verification

To verify the codebase prior to submission:

```bash
# 1. TypeScript Static Typecheck
npm run lint

# 2. Production Bundle Compilation
npm run build

# 3. Clean Build Artifacts
npm run clean
```

---

## 8. Multi-Browser Testing Guide

To verify multi-user WebRTC conferencing and real-time synchronization locally:

1. Open `http://localhost:3000` in **Browser Window #1** (e.g. Chrome).
2. Click **Create Meeting** (or use the default Personal Meeting ID `849-392-1849`).
3. In the pre-meeting lobby, check camera/mic levels and click **Join Meeting**.
4. Open an **Incognito Window** or **Browser Window #2** (e.g. Firefox).
5. Navigate to `http://localhost:3000` and enter the same meeting code.
6. Verify the following interactions:
   - **Video/Audio**: Both participants' video feeds stream directly via WebRTC with low latency.
   - **Active Speaker Detection**: Speaking into the microphone illuminates the participant card with an electric cyan border.
   - **Whiteboard**: Click the pen icon to open the whiteboard; strokes drawn on one window update live on the other.
   - **Chat & Files**: Send text messages and upload files; verify real-time receipt in the side panel.
   - **Spatial Rooms**: Toggle spatial mode to view participant streams rendered on 2.5D holographic podiums.

---

## 9. Render Deployment Instructions

NEXMEET is configured as a unified single-service web application on Render.

### Option A: 1-Click Deployment via `render.yaml`
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), select **New > Blueprint**.
3. Connect your repository. Render will automatically read `render.yaml` and configure the service.

### Option B: Manual Web Service Setup
1. Create a **New Web Service** on Render.
2. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (executes `tsx server.ts`)
   - **Plan**: `Free`
3. Add Environment Variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API Key.
4. Render automatically assigns and binds `PORT`. Once deployed, access your live URL at `https://[your-service-name].onrender.com`.

---

## 10. Mesh vs. SFU Scalability Architecture

- **P2P Full Mesh (Current Implementation)**:
  - Each participant sends $(N-1)$ streams and receives $(N-1)$ streams.
  - Optimal for 2 to 6 participants: provides zero server media transcoding overhead, minimum bandwidth costs, and end-to-end cryptographic privacy.
- **Enterprise Scaling (8+ Participants)**:
  - For large rooms (10–50+ peers), an SFU (Selective Forwarding Unit) architecture like *mediasoup* or *LiveKit* can be layered onto the signaling pipeline to receive 1 upstream stream per participant and selectively route downstreams.

---

## 11. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

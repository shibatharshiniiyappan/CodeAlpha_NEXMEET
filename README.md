# NEXMEET — Real-Time Communication & Collaboration Platform

> **“Connect. Create. Collaborate. Without Limits.”**

NEXMEET is a real-time collaboration web application combining peer-to-peer WebRTC video conferencing, low-latency screen sharing, synchronous collaborative canvas drawing, authenticated file sharing, and encrypted real-time chat.

---

## 1. System Architecture

```
[ Client A (Browser) ] <====== WebRTC DTLS-SRTP (Audio, Video, Screen) ======> [ Client B (Browser) ]
         |                                                                                |
         |  WSS / TLS 1.3                                                    WSS / TLS 1.3 |
         v                                                                                v
+-----------------------------------------------------------------------------------------------+
|                                      NEXMEET Backend                                         |
|  - Express HTTP API (Port 3000)                                                               |
|  - Socket.IO Signaling Server (SDP Offers, Answers, ICE Candidates, Presence)                 |
|  - Scrypt Password Hashing & Token Sessions                                                  |
|  - In-Memory & Quarantined Multer File Store (25MB Limit)                                     |
|  - Synchronized Canvas Vector State Cache                                                     |
+-----------------------------------------------------------------------------------------------+
         ^                                                                                ^
         |                                                                                |
         +------------------- Google STUN Servers (NAT Traversal) -----------------------+
```

### Media Transport & Encryption
- **Direct P2P Media**: Real-time audio and video packets are encrypted end-to-end via **DTLS-SRTP** (`SRTP_AEAD_AES_256_GCM`). Video and audio frames flow directly between browser peers without server decoding.
- **Signaling & Coordination**: Socket.IO signaling messages (SDP offers/answers, ICE candidates) and chat packets are transported over **WSS / TLS 1.3**.
- **File Quarantine**: Shared files undergo MIME type verification and path traversal neutralization on the server. Executables are blocked.

---

## 2. Core Features

1. **Multi-User Video Conferencing**
   - Native WebRTC `RTCPeerConnection` full-mesh network
   - Adaptive audio/video track controls (Mute / Unmute / Cam Toggle)
   - Real-time speech activity detection via Web Audio API `AnalyserNode`
   - Responsive multi-participant video grid layout with pinned speaker focus

2. **Screen Sharing**
   - High-definition screen capture via `navigator.mediaDevices.getDisplayMedia()`
   - Dynamic track replacement (`sender.replaceTrack()`) without renegotiation teardown
   - Automatic camera fallback when screen sharing ends

3. **Synchronized Collaborative Whiteboard**
   - Canvas-based vector drawing engine
   - Freehand pen, straight lines, rectangles, circles, text annotations, and eraser
   - Hex color palette & brush width sliders
   - Undo/redo capabilities and export to PNG
   - Synchronized stroke broadcasting and new participant state reconstitution via Socket.IO

4. **Real-Time Chat & File Sharing**
   - Encrypted room message delivery with timestamps and avatars
   - Quarantined file uploads (max 25 MB)
   - In-chat file download cards with size indicators

5. **Pre-Meeting Lobby**
   - Live camera preview and mic volume meter before entering calls
   - Device availability checks and permission failure handling

6. **Authentication & Session Security**
   - Salted `crypto.scryptSync` password hashing
   - Random session token authorization
   - Instant guest profile generation for low-friction joining

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express, Socket.IO, Multer
- **Media & Signaling**: WebRTC native APIs, STUN (`stun.l.google.com:19302`)
- **Security**: DTLS-SRTP, TLS 1.3, Scrypt hashing

---

## 4. Getting Started

### Prerequisites
- Node.js 18+
- Modern WebRTC-compatible browser (Chrome, Edge, Firefox, Safari)

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack development server (Express + Socket.IO + Vite)
npm run dev

# 3. Access in browser
# Visit http://localhost:3000
```

---

## 5. Multi-Browser Testing Instructions

To verify multi-user WebRTC conferencing locally:
1. Open `http://localhost:3000` in Browser Window #1.
2. Click **Start Instant Meeting** (or use room code `nex-studio-live`).
3. Allow camera/mic permissions, click **Join Meeting Now**.
4. Open an **Incognito Window** or second browser (e.g., Firefox/Chrome).
5. Navigate to `http://localhost:3000` and enter the same room code.
6. Observe:
   - Peer video tiles establish two-way media streams.
   - Whiteboard drawings update simultaneously on both windows.
   - Chat messages and file uploads appear in real time.
   - Audio visualizer highlights speaking user with an electric cyan border glow.

---

## 6. Mesh vs. SFU Scalability Limitations

- **Current Architecture (P2P Mesh)**:
  - In a full mesh, each client sends $N-1$ streams and receives $N-1$ streams.
  - Ideal for 2 to 6 participants (zero relay server costs, maximum privacy).
- **Scaling Beyond 8+ Participants**:
  - For large rooms (10–50+ peers), an **SFU (Selective Forwarding Unit)** such as *mediasoup* or *LiveKit* should be introduced to receive 1 upstream per client and selectively route downstreams.

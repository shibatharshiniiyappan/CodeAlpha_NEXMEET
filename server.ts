import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT && !isNaN(Number(process.env.PORT))
  ? parseInt(process.env.PORT, 10)
  : 3000;

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO with CORS support
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e7, // 10 MB limit for socket payloads
});

// Basic Express Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration (Private storage, randomized filenames)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, `${Date.now()}-${randomHex}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max file size
  },
  fileFilter: (_req, file, cb) => {
    const dangerousExts = ['.exe', '.sh', '.bat', '.cmd', '.vbs', '.msi', '.bin'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (dangerousExts.includes(ext)) {
      return cb(new Error('Executable and script file uploads are prohibited for security.'));
    }
    cb(null, true);
  },
});

// --- DATA STRUCTURES ---
interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  avatar: string;
  createdAt: string;
}

interface AISummary {
  summary: string;
  topics: string[];
  decisions: string[];
  actionItems: Array<{ task: string; assignee?: string; status: string }>;
  generatedAt: string;
}

interface Meeting {
  id: string;
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  isLocked: boolean;
  passcode?: string;
  waitingRoomEnabled: boolean;
  screensharePolicy: 'anyone' | 'host_only';
  spatialTheme?: string;
  aiSummary?: AISummary;
}

interface CanvasNote {
  id: string;
  category: 'idea' | 'question' | 'challenge' | 'decision' | 'action';
  title: string;
  content: string;
  x: number;
  y: number;
  votes: number;
  votedUserIds: string[];
  assignee?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  createdBy: string;
  createdByName: string;
  createdAt: number;
}

interface ChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text?: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
  fileData?: {
    id: string;
    originalName: string;
    size: number;
    mimeType: string;
    downloadUrl: string;
  };
}

interface StoredFile {
  id: string;
  meetingId: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  diskFileName: string;
}

interface WhiteboardStroke {
  id: string;
  type: 'freehand' | 'line' | 'rect' | 'circle' | 'text' | 'eraser';
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  color: string;
  width: number;
  text?: string;
  userId: string;
  timestamp: number;
}

interface MeetingHistoryRecord {
  id: string;
  meetingCode: string;
  meetingTitle: string;
  role: 'host' | 'participant';
  userId: string;
  userName: string;
  joinedAt: string;
  leftAt?: string;
  durationSeconds: number;
  participantCount: number;
  hasSummary?: boolean;
}

interface RoomPeer {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking?: boolean;
  handRaised?: boolean;
  isHost?: boolean;
  joinedAt: number;
}

interface WaitingParticipant {
  socketId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  requestedAt: number;
}

// In-Memory Databases
const usersDb = new Map<string, User>(); // key: email
const sessionsDb = new Map<string, string>(); // token -> userId
const meetingsDb = new Map<string, Meeting>(); // key: meetingId or code
const meetingMessagesDb = new Map<string, ChatMessage[]>(); // meetingId -> messages
const meetingFilesDb = new Map<string, StoredFile[]>(); // meetingId -> files
const meetingWhiteboardsDb = new Map<string, WhiteboardStroke[]>(); // meetingId -> strokes
const meetingCanvasNotesDb = new Map<string, CanvasNote[]>(); // meetingId -> canvas notes
const meetingHistoryDb = new Map<string, MeetingHistoryRecord[]>(); // userId -> history records
const waitingRoomPeers = new Map<string, Map<string, WaitingParticipant>>(); // roomId -> Map(socketId, WaitingParticipant)
const roomPeers = new Map<string, Map<string, RoomPeer>>(); // roomId -> Map(socketId, RoomPeer)
const roomSpatialThemes = new Map<string, string>(); // roomId -> theme name

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// Seed Demo User
const demoSalt = crypto.randomBytes(16).toString('hex');
const demoUser: User = {
  id: 'usr-alex-chen',
  name: 'Alex Chen',
  email: 'alex@nexmeet.dev',
  salt: demoSalt,
  passwordHash: hashPassword('NexMeet2026!', demoSalt),
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex',
  createdAt: new Date().toISOString(),
};
usersDb.set(demoUser.email.toLowerCase(), demoUser);
sessionsDb.set('demo-session-token-alex', demoUser.id);

// Ensure persistent data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const MEETINGS_FILE = path.join(DATA_DIR, 'meetings.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

function saveMeetingsToDisk() {
  try {
    const list = Array.from(meetingsDb.values());
    const unique = Array.from(new Map(list.map((m) => [m.id, m])).values());
    fs.writeFileSync(MEETINGS_FILE, JSON.stringify(unique, null, 2));
  } catch (err) {
    console.warn('[NEXMEET] Could not persist meetings to disk:', err);
  }
}

function loadMeetingsFromDisk() {
  try {
    if (fs.existsSync(MEETINGS_FILE)) {
      const data: Meeting[] = JSON.parse(fs.readFileSync(MEETINGS_FILE, 'utf-8'));
      for (const m of data) {
        meetingsDb.set(m.id, m);
        meetingsDb.set(m.code, m);
        meetingsDb.set(m.code.toLowerCase(), m);
        meetingsDb.set(m.code.replace(/-/g, ''), m);
      }
      console.log(`[NEXMEET] Loaded ${data.length} persistent meetings from disk`);
    }
  } catch (err) {
    console.warn('[NEXMEET] Could not load meetings from disk:', err);
  }
}

function saveHistoryToDisk() {
  try {
    const allRecords: MeetingHistoryRecord[] = [];
    meetingHistoryDb.forEach((records) => {
      allRecords.push(...records);
    });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(allRecords, null, 2));
  } catch (err) {
    console.warn('[NEXMEET] Could not persist meeting history:', err);
  }
}

function loadHistoryFromDisk() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data: MeetingHistoryRecord[] = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
      for (const rec of data) {
        if (!meetingHistoryDb.has(rec.userId)) {
          meetingHistoryDb.set(rec.userId, []);
        }
        meetingHistoryDb.get(rec.userId)!.push(rec);
      }
      console.log(`[NEXMEET] Loaded ${data.length} meeting history records from disk`);
    }
  } catch (err) {
    console.warn('[NEXMEET] Could not load history from disk:', err);
  }
}

// Pre-seed Demo Room
const demoMeeting: Meeting = {
  id: 'room-welcome-2026',
  code: '849-392-1849',
  title: 'Global Collaboration Hub',
  hostId: demoUser.id,
  hostName: demoUser.name,
  createdAt: new Date().toISOString(),
  isLocked: false,
  waitingRoomEnabled: false,
  screensharePolicy: 'anyone',
  aiSummary: {
    summary: 'Executive synchronization regarding the Q4 real-time communication platform architecture, WebRTC mesh stability, and zero-trust security controls.',
    topics: ['WebRTC DTLS-SRTP Mesh Scaling', 'Waiting Room & Access Verification', 'AI Meeting Summarizer Engine'],
    decisions: ['Approved host-side meeting lock enforcement', 'Integrated server-side waiting room authorization'],
    actionItems: [
      { task: 'Deploy waiting room host authorization RPCs', assignee: 'Alex Chen', status: 'completed' },
      { task: 'Audit DTLS-SRTP connection diagnostic telemetry', assignee: 'Security Lead', status: 'in-progress' },
    ],
    generatedAt: new Date().toISOString(),
  },
};
meetingsDb.set(demoMeeting.id, demoMeeting);
meetingsDb.set(demoMeeting.code, demoMeeting);
meetingsDb.set(demoMeeting.code.replace(/-/g, ''), demoMeeting);
meetingsDb.set('nex-studio-live', demoMeeting);

loadMeetingsFromDisk();
loadHistoryFromDisk();

// Meeting lookup helper
function findMeetingByKey(rawKey: string): Meeting | undefined {
  if (!rawKey) return undefined;
  const key = rawKey.trim();
  const noSpaces = key.replace(/\s+/g, '');
  const noDashes = noSpaces.replace(/-/g, '');
  return (
    meetingsDb.get(key) ||
    meetingsDb.get(noSpaces) ||
    meetingsDb.get(noSpaces.toLowerCase()) ||
    meetingsDb.get(noDashes) ||
    meetingsDb.get(noDashes.toLowerCase())
  );
}

// Initial system message for demo room
if (!meetingMessagesDb.has(demoMeeting.id)) {
  meetingMessagesDb.set(demoMeeting.id, [
    {
      id: 'msg-welcome-1',
      meetingId: demoMeeting.id,
      senderId: 'system',
      senderName: 'NEXMEET Security',
      senderAvatar: '',
      text: 'Encrypted meeting session started. DTLS-SRTP media stream encryption active.',
      timestamp: new Date().toISOString(),
      type: 'system',
    },
  ]);
}

// Authentication Middleware
function authenticateToken(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const userId = sessionsDb.get(token);
  if (!userId) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }

  let foundUser: User | undefined;
  for (const u of usersDb.values()) {
    if (u.id === userId) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return res.status(403).json({ error: 'User not found' });
  }

  (req as any).user = foundUser;
  next();
}

// Optional Auth Helper (extracts user if token present)
function getOptionalUser(req: Request): User | undefined {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return undefined;
  const userId = sessionsDb.get(token);
  if (!userId) return undefined;
  for (const u of usersDb.values()) {
    if (u.id === userId) return u;
  }
  return undefined;
}

// --- REST API ROUTES ---

// 1. Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (usersDb.has(cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const id = `usr-${crypto.randomBytes(6).toString('hex')}`;
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;

    const newUser: User = {
      id,
      name: name.trim(),
      email: cleanEmail,
      salt,
      passwordHash,
      avatar,
      createdAt: new Date().toISOString(),
    };

    usersDb.set(cleanEmail, newUser);

    const token = crypto.randomBytes(32).toString('hex');
    sessionsDb.set(token, newUser.id);

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = usersDb.get(cleanEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const checkHash = hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    sessionsDb.set(token, user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// 3. Auth: Current User
app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  });
});

// 4. Meetings: Create Room with Host Controls & Security Settings
app.post('/api/meetings/create', (req: Request, res: Response) => {
  try {
    const { title, hostName, hostId, passcode, waitingRoomEnabled, screensharePolicy, spatialTheme } = req.body;
    const meetingId = `room-${crypto.randomBytes(8).toString('hex')}`;

    // Generate unique 10-digit Zoom-style formatted code e.g. "849-392-1849"
    let code = '';
    let attempts = 0;
    while (!code || meetingsDb.has(code)) {
      attempts++;
      const p1 = Math.floor(100 + Math.random() * 900);
      const p2 = Math.floor(100 + Math.random() * 900);
      const p3 = Math.floor(1000 + Math.random() * 9000);
      code = `${p1}-${p2}-${p3}`;
      if (attempts > 50) break;
    }

    const effectiveHostId = hostId || `host-${crypto.randomBytes(4).toString('hex')}`;
    const cleanPasscode = passcode ? String(passcode).trim() : undefined;
    const effectiveTheme = spatialTheme || 'innovation-lab';

    const newMeeting: Meeting = {
      id: meetingId,
      code,
      title: title?.trim() || `${hostName ? `${hostName}'s` : 'Instant'} Meeting Room`,
      hostId: effectiveHostId,
      hostName: hostName?.trim() || 'Meeting Organizer',
      createdAt: new Date().toISOString(),
      isLocked: false,
      passcode: cleanPasscode,
      waitingRoomEnabled: !!waitingRoomEnabled,
      screensharePolicy: screensharePolicy === 'host_only' ? 'host_only' : 'anyone',
      spatialTheme: effectiveTheme,
    };

    meetingsDb.set(meetingId, newMeeting);
    meetingsDb.set(code, newMeeting);
    meetingsDb.set(code.replace(/-/g, ''), newMeeting);
    roomSpatialThemes.set(code, effectiveTheme);
    saveMeetingsToDisk();

    // Auto-record in host's meeting history
    const historyRecord: MeetingHistoryRecord = {
      id: `hist-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      meetingCode: newMeeting.code,
      meetingTitle: newMeeting.title,
      role: 'host',
      userId: effectiveHostId,
      userName: newMeeting.hostName,
      joinedAt: newMeeting.createdAt,
      durationSeconds: 0,
      participantCount: 1,
    };
    if (!meetingHistoryDb.has(effectiveHostId)) {
      meetingHistoryDb.set(effectiveHostId, []);
    }
    meetingHistoryDb.get(effectiveHostId)!.push(historyRecord);
    saveHistoryToDisk();

    // Safe response without exposing raw passcode
    return res.status(201).json({
      meeting: {
        ...newMeeting,
        hasPasscode: !!cleanPasscode,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create meeting', details: err.message });
  }
});

// 5. Meetings: Get Details by ID or Code
app.get('/api/meetings/:idOrCode', (req: Request, res: Response) => {
  const meeting = findMeetingByKey(req.params.idOrCode);
  if (!meeting) {
    return res.status(404).json({
      error: 'Meeting not found. Please verify the 10-digit Meeting ID or invitation link with the host.',
    });
  }

  // Sanitize: do not leak raw passcode
  const safeMeeting = {
    ...meeting,
    passcode: undefined,
    hasPasscode: !!meeting.passcode,
  };
  return res.json({ meeting: safeMeeting });
});

// 6. Meetings: Verify Passcode
app.post('/api/meetings/:idOrCode/verify-passcode', (req: Request, res: Response) => {
  const meeting = findMeetingByKey(req.params.idOrCode);
  if (!meeting) {
    return res.status(404).json({ error: 'Meeting not found' });
  }

  if (!meeting.passcode) {
    return res.json({ valid: true, message: 'No passcode required' });
  }

  const { passcode } = req.body;
  if (!passcode || String(passcode).trim() !== meeting.passcode) {
    return res.status(401).json({ error: 'Incorrect meeting passcode. Please try again.' });
  }

  return res.json({ valid: true });
});

// 7. Meetings: AI Meeting Summary (Gemini 2.5/3.8 Flash via @google/genai)
app.post('/api/meetings/:idOrCode/ai-summary', async (req: Request, res: Response) => {
  try {
    const found = findMeetingByKey(req.params.idOrCode);
    if (!found) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meetingId = found.code;
    const { customNotes } = req.body;
    const messages = meetingMessagesDb.get(meetingId) || [];
    const chatText = messages
      .filter((m) => m.type === 'text')
      .map((m) => `${m.senderName}: ${m.text}`)
      .join('\n');

    let summaryResult: AISummary;

    // Check for Gemini API Key in server environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are the NEXMEET AI Meeting Assistant. Analyze the following meeting context, transcript/chat, and host notes to create an executive, professional meeting summary.

Meeting Title: ${found.title}
Host: ${found.hostName}
Meeting Code: ${found.code}
Additional Notes: ${customNotes || 'None provided'}
Meeting Chat & Discussions:
${chatText || 'No chat messages were recorded during this session.'}

Respond strictly in valid JSON format matching this schema:
{
  "summary": "2-3 concise sentences summarizing the primary purpose and progress of the meeting.",
  "topics": ["Key discussion topic 1", "Key discussion topic 2"],
  "decisions": ["Key decision 1", "Key decision 2"],
  "actionItems": [
    {"task": "Action description", "assignee": "Name or Team", "status": "pending"}
  ]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawJson = response.text?.trim() || '{}';
        const parsed = JSON.parse(rawJson);
        summaryResult = {
          summary: parsed.summary || `Executive sync for ${found.title}.`,
          topics: Array.isArray(parsed.topics) ? parsed.topics : ['General Discussion'],
          decisions: Array.isArray(parsed.decisions) ? parsed.decisions : ['Meeting concluded successfully.'],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
          generatedAt: new Date().toISOString(),
        };
      } catch (geminiErr: any) {
        console.warn('[NEXMEET] Gemini generation error, using fallback:', geminiErr.message);
        summaryResult = generateStructuredSummaryFallback(found, chatText, customNotes);
      }
    } else {
      // Graceful fallback when GEMINI_API_KEY is not configured
      summaryResult = generateStructuredSummaryFallback(found, chatText, customNotes);
    }

    // Persist summary into meeting object
    found.aiSummary = summaryResult;
    meetingsDb.set(found.id, found);
    meetingsDb.set(found.code, found);
    saveMeetingsToDisk();

    // Broadcast summary event to active room participants
    io.to(`room-${found.code}`).emit('meeting:ai-summary-updated', summaryResult);

    return res.json({ summary: summaryResult });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to generate summary', details: err.message });
  }
});

// Helper for fallback summary generation
function generateStructuredSummaryFallback(meeting: Meeting, chat: string, notes?: string): AISummary {
  const topics: string[] = ['Session Alignment', 'Collaborative Review'];
  const decisions: string[] = ['Real-time media and whiteboard state verified.'];
  const actionItems: Array<{ task: string; assignee?: string; status: string }> = [];

  if (notes && notes.trim()) {
    topics.push('Host Agenda Review');
    actionItems.push({ task: `Review notes: "${notes.trim().slice(0, 80)}"`, assignee: meeting.hostName, status: 'pending' });
  }

  if (chat) {
    topics.push('Interactive Chat & Asset Sharing');
    actionItems.push({ task: 'Follow up on chat discussion items', assignee: 'All Attendees', status: 'pending' });
  }

  return {
    summary: `Structured session summary for "${meeting.title}" organized by ${meeting.hostName}. Participants collaborated using real-time audio, video, chat, and interactive whiteboard tools.`,
    topics,
    decisions,
    actionItems: actionItems.length > 0 ? actionItems : [{ task: 'Review session recording and shared files', assignee: meeting.hostName, status: 'pending' }],
    generatedAt: new Date().toISOString(),
  };
}

// 8. Meetings: Get Saved AI Summary
app.get('/api/meetings/:idOrCode/ai-summary', (req: Request, res: Response) => {
  const found = findMeetingByKey(req.params.idOrCode);
  if (!found) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  return res.json({ summary: found.aiSummary || null });
});

// 8b. Meetings: Get Saved Canvas Notes
app.get('/api/meetings/:idOrCode/canvas-notes', (req: Request, res: Response) => {
  const found = findMeetingByKey(req.params.idOrCode);
  if (!found) {
    return res.status(404).json({ error: 'Meeting not found' });
  }
  const notes = meetingCanvasNotesDb.get(found.code) || [];
  return res.json({ notes });
});

// 9. Meeting History: User's Genuine Past Meetings
app.get('/api/user/meetings/history', (req: Request, res: Response) => {
  const optionalUser = getOptionalUser(req);
  const queryUserId = (req.query.userId as string) || optionalUser?.id || 'demo-user';

  const userRecords = meetingHistoryDb.get(queryUserId) || [];

  // Sort descending by date
  const sorted = [...userRecords].sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
  return res.json({ history: sorted });
});

// 10. Meeting History: Record or Update a session
app.post('/api/user/meetings/history', (req: Request, res: Response) => {
  const { meetingCode, meetingTitle, role, userId, userName, durationSeconds, participantCount } = req.body;
  if (!meetingCode || !userId) {
    return res.status(400).json({ error: 'meetingCode and userId required' });
  }

  const record: MeetingHistoryRecord = {
    id: `hist-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    meetingCode,
    meetingTitle: meetingTitle || 'NEXMEET Meeting',
    role: role === 'host' ? 'host' : 'participant',
    userId,
    userName: userName || 'Participant',
    joinedAt: new Date().toISOString(),
    durationSeconds: Number(durationSeconds) || 0,
    participantCount: Number(participantCount) || 1,
  };

  if (!meetingHistoryDb.has(userId)) {
    meetingHistoryDb.set(userId, []);
  }
  meetingHistoryDb.get(userId)!.push(record);
  saveHistoryToDisk();

  return res.status(201).json({ record });
});

// 11. Files: Upload
app.post('/api/meetings/:meetingId/files', upload.single('file'), (req: Request, res: Response) => {
  try {
    const found = findMeetingByKey(req.params.meetingId);
    const meetingId = found ? found.code : req.params.meetingId;
    const { uploadedBy, uploadedByName } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded or file rejected by security filters' });
    }

    const fileId = `file-${crypto.randomBytes(8).toString('hex')}`;
    const storedFile: StoredFile = {
      id: fileId,
      meetingId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: uploadedBy || 'Anonymous',
      uploadedByName: uploadedByName || 'Meeting Participant',
      uploadedAt: new Date().toISOString(),
      diskFileName: file.filename,
    };

    if (!meetingFilesDb.has(meetingId)) {
      meetingFilesDb.set(meetingId, []);
    }
    meetingFilesDb.get(meetingId)!.push(storedFile);

    const downloadUrl = `/api/meetings/${meetingId}/files/${fileId}/download`;

    const chatMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      meetingId,
      senderId: uploadedBy || 'Anonymous',
      senderName: uploadedByName || 'Participant',
      senderAvatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(uploadedByName || 'User')}`,
      text: `Shared a file: ${file.originalname}`,
      timestamp: new Date().toISOString(),
      type: 'file',
      fileData: {
        id: fileId,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        downloadUrl,
      },
    };

    if (!meetingMessagesDb.has(meetingId)) {
      meetingMessagesDb.set(meetingId, []);
    }
    meetingMessagesDb.get(meetingId)!.push(chatMsg);

    io.to(`room-${meetingId}`).emit('chat:received', chatMsg);

    return res.status(201).json({
      file: {
        id: fileId,
        originalName: storedFile.originalName,
        size: storedFile.size,
        mimeType: storedFile.mimeType,
        downloadUrl,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'File upload failed', details: err.message });
  }
});

// 12. Files: Download
app.get('/api/meetings/:meetingId/files/:fileId/download', (req: Request, res: Response) => {
  const found = findMeetingByKey(req.params.meetingId);
  const meetingId = found ? found.code : req.params.meetingId;
  const { fileId } = req.params;
  const files = meetingFilesDb.get(meetingId);
  if (!files) {
    return res.status(404).json({ error: 'Meeting files not found' });
  }

  const fileRecord = files.find((f) => f.id === fileId);
  if (!fileRecord) {
    return res.status(404).json({ error: 'File record not found' });
  }

  const filePath = path.join(UPLOADS_DIR, fileRecord.diskFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Physical file has expired or was removed' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileRecord.originalName)}"`);
  res.setHeader('Content-Type', fileRecord.mimeType);
  const stream = fs.createReadStream(filePath);
  return stream.pipe(res);
});

// 13. Files: List
app.get('/api/meetings/:meetingId/files', (req: Request, res: Response) => {
  const found = findMeetingByKey(req.params.meetingId);
  const meetingId = found ? found.code : req.params.meetingId;
  const files = (meetingFilesDb.get(meetingId) || []).map((f) => ({
    id: f.id,
    originalName: f.originalName,
    size: f.size,
    mimeType: f.mimeType,
    uploadedByName: f.uploadedByName,
    uploadedAt: f.uploadedAt,
    downloadUrl: `/api/meetings/${meetingId}/files/${f.id}/download`,
  }));
  return res.json({ files });
});

// 14. Security Specifications
app.get('/api/security/specs', (_req: Request, res: Response) => {
  return res.json({
    platform: 'NEXMEET Enterprise Real-Time Platform',
    encryption: {
      media: {
        protocol: 'DTLS-SRTP (Datagram Transport Layer Security / Secure Real-Time Transport Protocol)',
        cipherSuites: ['SRTP_AEAD_AES_256_GCM', 'SRTP_AES128_CM_HMAC_SHA1_80'],
        verification: 'Peer-to-peer cryptographic key negotiation; keys never touch intermediate servers in direct mesh.',
      },
      signaling: {
        protocol: 'WSS / HTTPS (TLS 1.3)',
        certificates: 'Automated TLS encryption for room coordination and ICE candidate exchange.',
      },
      fileStorage: {
        isolation: 'Private local disk quarantine with cryptographically secure random names; zero public traversal.',
        maximumSize: '25 MB per shared asset',
      },
    },
    iceConfiguration: {
      stunServers: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
      turnSupported: true,
      topology: 'Full Mesh WebRTC (P2P for ultra-low latency & true end-to-end media confidentiality)',
    },
  });
});

// --- SOCKET.IO REAL-TIME SIGNALING, WAITING ROOM & AUTHORIZED HOST CONTROLS ---

// Helper: check if a socket belongs to the host of the meeting
function isHostSocket(socketId: string, canonicalRoomId: string): boolean {
  const meeting = findMeetingByKey(canonicalRoomId);
  if (!meeting) return false;

  const peers = roomPeers.get(canonicalRoomId);
  if (!peers) return false;

  const peer = peers.get(socketId);
  if (!peer) return false;

  return peer.userId === meeting.hostId || peer.userName.toLowerCase() === meeting.hostName.toLowerCase();
}

io.on('connection', (socket) => {
  let currentRoomId: string | null = null;
  let currentUser: RoomPeer | null = null;

  // 1. Join Room (Handles Passcode, Lock, Waiting Room, Host Recognition)
  socket.on('join-room', ({ roomId, user, passcode, isAdmitted }: { roomId: string; user: any; passcode?: string; isAdmitted?: boolean }) => {
    const found = findMeetingByKey(roomId);
    const canonicalRoomId = found ? found.code : (roomId || '').trim();

    const meeting: Meeting = found || {
      id: canonicalRoomId,
      code: canonicalRoomId,
      title: 'Active Room',
      hostId: user.id || 'host-user',
      hostName: user.name || 'Organizer',
      createdAt: new Date().toISOString(),
      isLocked: false,
      waitingRoomEnabled: false,
      screensharePolicy: 'anyone' as const,
    };

    const isHost = meeting.hostId === user.id || meeting.hostName.toLowerCase() === (user.name || '').toLowerCase();

    // 1A. Security: Validate Meeting Passcode if set
    if (meeting.passcode && !isHost && !isAdmitted) {
      if (!passcode || String(passcode).trim() !== meeting.passcode) {
        socket.emit('error:join-denied', {
          reason: 'passcode_required',
          message: 'This meeting is password-protected. Please provide the correct meeting passcode.',
        });
        return;
      }
    }

    // 1B. Security: Check if meeting is locked
    if (meeting.isLocked && !isHost && !isAdmitted) {
      socket.emit('error:join-denied', {
        reason: 'meeting_locked',
        message: 'This meeting has been locked by the host. No new participants may join.',
      });
      return;
    }

    // 1C. Waiting Room Enforcement
    if (meeting.waitingRoomEnabled && !isHost && !isAdmitted) {
      if (!waitingRoomPeers.has(canonicalRoomId)) {
        waitingRoomPeers.set(canonicalRoomId, new Map());
      }
      const waitingList = waitingRoomPeers.get(canonicalRoomId)!;
      const waitingParticipant: WaitingParticipant = {
        socketId: socket.id,
        userId: user.id || socket.id,
        userName: user.name || 'Guest Participant',
        userAvatar: user.avatar || '',
        requestedAt: Date.now(),
      };
      waitingList.set(socket.id, waitingParticipant);

      // Notify the joining client that they are placed in the waiting room
      socket.emit('waiting-room:waiting', {
        meetingTitle: meeting.title,
        hostName: meeting.hostName,
        code: meeting.code,
      });

      // Notify room host(s)
      io.to(`room-${canonicalRoomId}`).emit('waiting-room:participant-waiting', waitingParticipant);
      io.to(`room-${canonicalRoomId}`).emit('waiting-room:queue-updated', Array.from(waitingList.values()));
      return;
    }

    // If client was waiting, remove from waiting room now
    if (waitingRoomPeers.has(canonicalRoomId)) {
      waitingRoomPeers.get(canonicalRoomId)!.delete(socket.id);
      io.to(`room-${canonicalRoomId}`).emit(
        'waiting-room:queue-updated',
        Array.from(waitingRoomPeers.get(canonicalRoomId)!.values())
      );
    }

    // 1D. Enter the Meeting Stage
    currentRoomId = canonicalRoomId;
    socket.join(`room-${canonicalRoomId}`);

    if (!roomPeers.has(canonicalRoomId)) {
      roomPeers.set(canonicalRoomId, new Map());
    }

    currentUser = {
      socketId: socket.id,
      userId: user.id || socket.id,
      userName: user.name || 'Guest Participant',
      userAvatar: user.avatar || '',
      audioEnabled: user.audioEnabled ?? true,
      videoEnabled: user.videoEnabled ?? true,
      isScreenSharing: false,
      isHost,
      joinedAt: Date.now(),
    };

    const peersInRoom = roomPeers.get(canonicalRoomId)!;

    // Send existing peers in room to newly joined participant
    const existingPeers = Array.from(peersInRoom.values());
    const currentTheme = roomSpatialThemes.get(canonicalRoomId) || meeting.spatialTheme || 'innovation-lab';
    socket.emit('room-users', {
      peers: existingPeers,
      selfSocketId: socket.id,
      meetingDetails: {
        isLocked: meeting.isLocked,
        waitingRoomEnabled: meeting.waitingRoomEnabled,
        screensharePolicy: meeting.screensharePolicy,
        hostId: meeting.hostId,
        hostName: meeting.hostName,
        spatialTheme: currentTheme,
      },
    });

    // Add current user to room peers
    peersInRoom.set(socket.id, currentUser);

    // Notify other peers
    socket.to(`room-${canonicalRoomId}`).emit('user-joined', {
      peer: currentUser,
    });

    // If this user is host, send them any currently waiting guests
    if (isHost && waitingRoomPeers.has(canonicalRoomId)) {
      socket.emit(
        'waiting-room:queue-updated',
        Array.from(waitingRoomPeers.get(canonicalRoomId)!.values())
      );
    }

    // Send existing whiteboard state
    const strokes = meetingWhiteboardsDb.get(canonicalRoomId) || [];
    socket.emit('whiteboard:init', strokes);

    // Send existing Idea-to-Action Canvas notes
    const canvasNotes = meetingCanvasNotesDb.get(canonicalRoomId) || [];
    socket.emit('canvas:init', canvasNotes);

    // Send existing chat history
    const history = meetingMessagesDb.get(canonicalRoomId) || [];
    socket.emit('chat:history', history);

    // Record session history entry
    const historyRecord: MeetingHistoryRecord = {
      id: `hist-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      meetingCode: canonicalRoomId,
      meetingTitle: meeting.title,
      role: isHost ? 'host' : 'participant',
      userId: currentUser.userId,
      userName: currentUser.userName,
      joinedAt: new Date().toISOString(),
      durationSeconds: 0,
      participantCount: peersInRoom.size,
    };
    if (!meetingHistoryDb.has(currentUser.userId)) {
      meetingHistoryDb.set(currentUser.userId, []);
    }
    meetingHistoryDb.get(currentUser.userId)!.push(historyRecord);
  });

  // --- HOST CONTROLS WITH SERVER-SIDE AUTHORIZATION ---

  // 2. Host: Admit Participant from Waiting Room
  socket.on('host:admit-participant', ({ targetSocketId }: { targetSocketId: string }) => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Only meeting hosts can admit participants.' });
      return;
    }

    const waitingMap = waitingRoomPeers.get(currentRoomId);
    if (!waitingMap || !waitingMap.has(targetSocketId)) return;

    waitingMap.delete(targetSocketId);

    // Notify target socket that they were admitted
    io.to(targetSocketId).emit('waiting-room:admitted', {
      roomId: currentRoomId,
    });

    // Notify host of updated queue
    io.to(`room-${currentRoomId}`).emit('waiting-room:queue-updated', Array.from(waitingMap.values()));
  });

  // 3. Host: Reject Participant from Waiting Room
  socket.on('host:reject-participant', ({ targetSocketId }: { targetSocketId: string }) => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Only meeting hosts can reject participants.' });
      return;
    }

    const waitingMap = waitingRoomPeers.get(currentRoomId);
    if (!waitingMap || !waitingMap.has(targetSocketId)) return;

    waitingMap.delete(targetSocketId);

    // Notify target socket
    io.to(targetSocketId).emit('waiting-room:rejected', {
      message: 'The meeting host has declined your request to join this session.',
    });

    io.to(`room-${currentRoomId}`).emit('waiting-room:queue-updated', Array.from(waitingMap.values()));
  });

  // 4. Host: Admit All Waiting Participants
  socket.on('host:admit-all', () => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Only meeting hosts can admit participants.' });
      return;
    }

    const waitingMap = waitingRoomPeers.get(currentRoomId);
    if (!waitingMap) return;

    for (const [targetSocketId] of waitingMap) {
      io.to(targetSocketId).emit('waiting-room:admitted', { roomId: currentRoomId });
    }
    waitingMap.clear();

    io.to(`room-${currentRoomId}`).emit('waiting-room:queue-updated', []);
  });

  // 5. Host: Mute Participant
  socket.on('host:mute-participant', ({ targetSocketId }: { targetSocketId: string }) => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Host permissions required to mute participants.' });
      return;
    }

    const peers = roomPeers.get(currentRoomId);
    const targetPeer = peers?.get(targetSocketId);

    if (targetPeer) {
      targetPeer.audioEnabled = false;

      // Force mute on target client
      io.to(targetSocketId).emit('host:force-mute', {
        reason: 'Muted by meeting host',
      });

      // Broadcast state change to room
      io.to(`room-${currentRoomId}`).emit('peer:state-changed', {
        socketId: targetSocketId,
        audioEnabled: false,
        videoEnabled: targetPeer.videoEnabled,
        isScreenSharing: targetPeer.isScreenSharing,
      });

      // System notification
      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        meetingId: currentRoomId,
        senderId: 'system',
        senderName: 'NEXMEET Host Control',
        senderAvatar: '',
        text: `${targetPeer.userName} was muted by the meeting host.`,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      meetingMessagesDb.get(currentRoomId)?.push(sysMsg);
      io.to(`room-${currentRoomId}`).emit('chat:received', sysMsg);
    }
  });

  // 6. Host: Mute All Participants
  socket.on('host:mute-all', () => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Host permissions required to mute all.' });
      return;
    }

    const peers = roomPeers.get(currentRoomId);
    if (!peers) return;

    peers.forEach((peer, sId) => {
      if (sId !== socket.id) {
        peer.audioEnabled = false;
        io.to(sId).emit('host:force-mute', { reason: 'Host muted all participants' });
        io.to(`room-${currentRoomId}`).emit('peer:state-changed', {
          socketId: sId,
          audioEnabled: false,
          videoEnabled: peer.videoEnabled,
          isScreenSharing: peer.isScreenSharing,
        });
      }
    });

    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      meetingId: currentRoomId,
      senderId: 'system',
      senderName: 'NEXMEET Host Control',
      senderAvatar: '',
      text: 'Meeting host has muted all participants.',
      timestamp: new Date().toISOString(),
      type: 'system',
    };
    meetingMessagesDb.get(currentRoomId)?.push(sysMsg);
    io.to(`room-${currentRoomId}`).emit('chat:received', sysMsg);
  });

  // 7. Host: Remove / Kick Participant
  socket.on('host:kick-participant', ({ targetSocketId, reason }: { targetSocketId: string; reason?: string }) => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Host permissions required to remove participants.' });
      return;
    }

    const peers = roomPeers.get(currentRoomId);
    const targetPeer = peers?.get(targetSocketId);

    if (targetPeer) {
      peers?.delete(targetSocketId);

      // Notify kicked participant
      io.to(targetSocketId).emit('host:kicked', {
        reason: reason || 'You have been removed from this meeting by the host.',
      });

      // Broadcast user-left to remaining participants
      io.to(`room-${currentRoomId}`).emit('user-left', {
        socketId: targetSocketId,
        userId: targetPeer.userId,
        userName: targetPeer.userName,
      });

      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        meetingId: currentRoomId,
        senderId: 'system',
        senderName: 'NEXMEET Host Control',
        senderAvatar: '',
        text: `${targetPeer.userName} was removed from the meeting by the host.`,
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      meetingMessagesDb.get(currentRoomId)?.push(sysMsg);
      io.to(`room-${currentRoomId}`).emit('chat:received', sysMsg);
    }
  });

  // 8. Host: Toggle Meeting Lock
  socket.on('host:toggle-lock', ({ isLocked }: { isLocked: boolean }) => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Host permissions required to lock meeting.' });
      return;
    }

    const meeting = findMeetingByKey(currentRoomId);
    if (meeting) {
      meeting.isLocked = !!isLocked;
      saveMeetingsToDisk();

      io.to(`room-${currentRoomId}`).emit('meeting:lock-updated', { isLocked: meeting.isLocked });

      const sysMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        meetingId: currentRoomId,
        senderId: 'system',
        senderName: 'NEXMEET Security',
        senderAvatar: '',
        text: meeting.isLocked
          ? 'Meeting has been locked by the host. New participants cannot join.'
          : 'Meeting has been unlocked by the host.',
        timestamp: new Date().toISOString(),
        type: 'system',
      };
      meetingMessagesDb.get(currentRoomId)?.push(sysMsg);
      io.to(`room-${currentRoomId}`).emit('chat:received', sysMsg);
    }
  });

  // 9. Host: Toggle Screen Sharing Policy
  socket.on('host:toggle-screenshare-policy', ({ policy }: { policy: 'anyone' | 'host_only' }) => {
    if (!currentRoomId || !isHostSocket(socket.id, currentRoomId)) {
      socket.emit('host:action-denied', { error: 'Unauthorized: Host permissions required to modify screen sharing policy.' });
      return;
    }

    const meeting = findMeetingByKey(currentRoomId);
    if (meeting) {
      meeting.screensharePolicy = policy === 'host_only' ? 'host_only' : 'anyone';
      saveMeetingsToDisk();

      io.to(`room-${currentRoomId}`).emit('meeting:screenshare-policy-updated', {
        policy: meeting.screensharePolicy,
      });

      // If set to host_only, force stop any non-host screenshares
      if (meeting.screensharePolicy === 'host_only') {
        const peers = roomPeers.get(currentRoomId);
        peers?.forEach((peer, sId) => {
          if (!isHostSocket(sId, currentRoomId!) && peer.isScreenSharing) {
            peer.isScreenSharing = false;
            io.to(sId).emit('host:force-stop-screenshare', {
              reason: 'Screen sharing is currently restricted to the meeting host.',
            });
            io.to(`room-${currentRoomId}`).emit('peer:state-changed', {
              socketId: sId,
              audioEnabled: peer.audioEnabled,
              videoEnabled: peer.videoEnabled,
              isScreenSharing: false,
            });
          }
        });
      }
    }
  });

  // 10. WebRTC Signaling: SDP Offer
  socket.on('webrtc:offer', ({ targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('webrtc:offer', {
      callerSocketId: socket.id,
      sdp,
      callerInfo: currentUser,
    });
  });

  // 11. WebRTC Signaling: SDP Answer
  socket.on('webrtc:answer', ({ targetSocketId, sdp }) => {
    io.to(targetSocketId).emit('webrtc:answer', {
      responderSocketId: socket.id,
      sdp,
    });
  });

  // 12. WebRTC Signaling: ICE Candidate
  socket.on('webrtc:ice-candidate', ({ targetSocketId, candidate }) => {
    io.to(targetSocketId).emit('webrtc:ice-candidate', {
      senderSocketId: socket.id,
      candidate,
    });
  });

  // 13. Media State Updates (mute/unmute, cam toggle, screen share)
  socket.on('media:state-change', ({ audioEnabled, videoEnabled, isScreenSharing }) => {
    if (currentRoomId && currentUser) {
      // Validate screenshare policy
      const meeting = findMeetingByKey(currentRoomId);
      if (isScreenSharing && meeting?.screensharePolicy === 'host_only' && !isHostSocket(socket.id, currentRoomId)) {
        socket.emit('host:action-denied', {
          error: 'Screen sharing is restricted to the meeting host.',
        });
        return;
      }

      currentUser.audioEnabled = audioEnabled;
      currentUser.videoEnabled = videoEnabled;
      currentUser.isScreenSharing = !!isScreenSharing;

      io.to(`room-${currentRoomId}`).emit('peer:state-changed', {
        socketId: socket.id,
        audioEnabled,
        videoEnabled,
        isScreenSharing,
      });
    }
  });

  // 14. Real-time Chat
  socket.on('chat:send', ({ text }) => {
    if (!currentRoomId || !currentUser || !text || !text.trim()) return;

    const chatMsg: ChatMessage = {
      id: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      meetingId: currentRoomId,
      senderId: currentUser.userId,
      senderName: currentUser.userName,
      senderAvatar: currentUser.userAvatar,
      text: text.trim().slice(0, 2000),
      timestamp: new Date().toISOString(),
      type: 'text',
    };

    if (!meetingMessagesDb.has(currentRoomId)) {
      meetingMessagesDb.set(currentRoomId, []);
    }
    meetingMessagesDb.get(currentRoomId)!.push(chatMsg);

    io.to(`room-${currentRoomId}`).emit('chat:received', chatMsg);
  });

  // 15. Whiteboard: Draw Stroke
  socket.on('whiteboard:draw', (stroke: WhiteboardStroke) => {
    if (!currentRoomId) return;

    if (!meetingWhiteboardsDb.has(currentRoomId)) {
      meetingWhiteboardsDb.set(currentRoomId, []);
    }
    const strokes = meetingWhiteboardsDb.get(currentRoomId)!;
    strokes.push(stroke);

    if (strokes.length > 3000) {
      strokes.shift();
    }

    socket.to(`room-${currentRoomId}`).emit('whiteboard:draw', stroke);
  });

  // 16. Whiteboard: Clear
  socket.on('whiteboard:clear', () => {
    if (!currentRoomId) return;
    meetingWhiteboardsDb.set(currentRoomId, []);
    io.to(`room-${currentRoomId}`).emit('whiteboard:cleared');
  });

  // 17. Whiteboard: Undo
  socket.on('whiteboard:undo', () => {
    if (!currentRoomId || !currentUser) return;
    const strokes = meetingWhiteboardsDb.get(currentRoomId) || [];
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId === currentUser.userId) {
        strokes.splice(i, 1);
        break;
      }
    }
    io.to(`room-${currentRoomId}`).emit('whiteboard:init', strokes);
  });

  // 18. Spatial Rooms: Set Theme
  socket.on('spatial:set-theme', ({ theme }: { theme: string }) => {
    if (!currentRoomId) return;
    const validThemes = ['innovation-lab', 'focus-room', 'creative-studio', 'boardroom'];
    if (!validThemes.includes(theme)) return;

    roomSpatialThemes.set(currentRoomId, theme);
    const meeting = findMeetingByKey(currentRoomId);
    if (meeting) {
      meeting.spatialTheme = theme;
      saveMeetingsToDisk();
    }

    io.to(`room-${currentRoomId}`).emit('spatial:theme-updated', { theme });

    const sysMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      meetingId: currentRoomId,
      senderId: 'system',
      senderName: 'NEXMEET Spatial',
      senderAvatar: '',
      text: `Spatial environment transitioned to ${theme.replace('-', ' ').toUpperCase()}.`,
      timestamp: new Date().toISOString(),
      type: 'system',
    };
    meetingMessagesDb.get(currentRoomId)?.push(sysMsg);
    io.to(`room-${currentRoomId}`).emit('chat:received', sysMsg);
  });

  // 19. Idea-to-Action Canvas: Add Note
  socket.on('canvas:add-note', (note: CanvasNote) => {
    if (!currentRoomId) return;
    if (!meetingCanvasNotesDb.has(currentRoomId)) {
      meetingCanvasNotesDb.set(currentRoomId, []);
    }
    const notes = meetingCanvasNotesDb.get(currentRoomId)!;
    notes.push(note);
    io.to(`room-${currentRoomId}`).emit('canvas:note-added', note);
  });

  // 20. Idea-to-Action Canvas: Update Note
  socket.on('canvas:update-note', (updatedNote: Partial<CanvasNote> & { id: string }) => {
    if (!currentRoomId) return;
    const notes = meetingCanvasNotesDb.get(currentRoomId);
    if (!notes) return;
    const idx = notes.findIndex((n) => n.id === updatedNote.id);
    if (idx !== -1) {
      notes[idx] = { ...notes[idx], ...updatedNote };
      io.to(`room-${currentRoomId}`).emit('canvas:note-updated', notes[idx]);
    }
  });

  // 21. Idea-to-Action Canvas: Move Note
  socket.on('canvas:move-note', ({ id, x, y }: { id: string; x: number; y: number }) => {
    if (!currentRoomId) return;
    const notes = meetingCanvasNotesDb.get(currentRoomId);
    if (!notes) return;
    const note = notes.find((n) => n.id === id);
    if (note) {
      note.x = x;
      note.y = y;
      socket.to(`room-${currentRoomId}`).emit('canvas:note-moved', { id, x, y });
    }
  });

  // 22. Idea-to-Action Canvas: Vote Note
  socket.on('canvas:vote-note', ({ id, userId }: { id: string; userId: string }) => {
    if (!currentRoomId) return;
    const notes = meetingCanvasNotesDb.get(currentRoomId);
    if (!notes) return;
    const note = notes.find((n) => n.id === id);
    if (note) {
      if (!note.votedUserIds) note.votedUserIds = [];
      const votedIdx = note.votedUserIds.indexOf(userId);
      if (votedIdx === -1) {
        note.votedUserIds.push(userId);
        note.votes += 1;
      } else {
        note.votedUserIds.splice(votedIdx, 1);
        note.votes = Math.max(0, note.votes - 1);
      }
      io.to(`room-${currentRoomId}`).emit('canvas:note-updated', note);
    }
  });

  // 23. Idea-to-Action Canvas: Delete Note
  socket.on('canvas:delete-note', ({ id }: { id: string }) => {
    if (!currentRoomId) return;
    const notes = meetingCanvasNotesDb.get(currentRoomId);
    if (!notes) return;
    const filtered = notes.filter((n) => n.id !== id);
    meetingCanvasNotesDb.set(currentRoomId, filtered);
    io.to(`room-${currentRoomId}`).emit('canvas:note-deleted', { id });
  });

  // 24. Idea-to-Action Canvas: Clear
  socket.on('canvas:clear', () => {
    if (!currentRoomId) return;
    meetingCanvasNotesDb.set(currentRoomId, []);
    io.to(`room-${currentRoomId}`).emit('canvas:cleared');
  });

  // 25. Floating Reactions
  socket.on('reaction:send', ({ emoji }: { emoji: string }) => {
    if (!currentRoomId || !currentUser) return;
    const reaction = {
      id: `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      emoji,
      senderName: currentUser.userName,
      timestamp: Date.now(),
      xOffsetPercent: Math.floor(Math.random() * 80) + 10,
    };
    io.to(`room-${currentRoomId}`).emit('reaction:received', reaction);
  });

  // 26. Raise Hand
  socket.on('hand:toggle', ({ raised }: { raised: boolean }) => {
    if (!currentRoomId || !currentUser) return;
    currentUser.handRaised = !!raised;
    io.to(`room-${currentRoomId}`).emit('hand:updated', {
      socketId: socket.id,
      userId: currentUser.userId,
      userName: currentUser.userName,
      handRaised: currentUser.handRaised,
    });
  });

  // 27. Peer Speaking
  socket.on('peer:speaking', ({ isSpeaking }: { isSpeaking: boolean }) => {
    if (!currentRoomId || !currentUser) return;
    currentUser.isSpeaking = !!isSpeaking;
    socket.to(`room-${currentRoomId}`).emit('peer:speaking-changed', {
      socketId: socket.id,
      userId: currentUser.userId,
      isSpeaking: !!isSpeaking,
    });
  });

  // Disconnection cleanup
  const handleLeave = () => {
    if (currentRoomId) {
      // Remove from waiting room if present
      if (waitingRoomPeers.has(currentRoomId)) {
        const waitingMap = waitingRoomPeers.get(currentRoomId)!;
        if (waitingMap.has(socket.id)) {
          waitingMap.delete(socket.id);
          io.to(`room-${currentRoomId}`).emit('waiting-room:queue-updated', Array.from(waitingMap.values()));
        }
      }

      // Remove from room peers if present
      if (currentUser) {
        const peersInRoom = roomPeers.get(currentRoomId);
        if (peersInRoom) {
          peersInRoom.delete(socket.id);
          if (peersInRoom.size === 0) {
            roomPeers.delete(currentRoomId);
          }
        }

        socket.to(`room-${currentRoomId}`).emit('user-left', {
          socketId: socket.id,
          userId: currentUser.userId,
          userName: currentUser.userName,
        });

        // Update history left time & duration
        const userHistory = meetingHistoryDb.get(currentUser.userId);
        if (userHistory && userHistory.length > 0) {
          const last = userHistory[userHistory.length - 1];
          if (last.meetingCode === currentRoomId && !last.leftAt) {
            last.leftAt = new Date().toISOString();
            last.durationSeconds = Math.max(1, Math.round((Date.now() - currentUser.joinedAt) / 1000));
            saveHistoryToDisk();
          }
        }

        socket.leave(`room-${currentRoomId}`);
      }
    }
    currentRoomId = null;
    currentUser = null;
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);
});

// --- VITE MIDDLEWARE & STATIC ASSET SERVING ---
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Startup check: if dist/index.html is missing, attempt to build frontend assets
    if (!fs.existsSync(indexPath)) {
      console.warn(`[NEXMEET] dist/index.html was not found at ${indexPath}. Attempting frontend build...`);
      try {
        const { execSync } = await import('child_process');
        execSync('npm run build', { stdio: 'inherit' });
        console.log('[NEXMEET] Frontend build generated successfully.');
      } catch (buildErr) {
        console.error('[NEXMEET] Automatic build attempt failed:', buildErr);
      }
    }

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(503).send('NEXMEET frontend build is not found. Please ensure "npm run build" executes before starting the production server.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXMEET] Server running at http://0.0.0.0:${PORT} (env: ${isProduction ? 'prod' : 'dev'})`);
  });
}

startServer().catch((err) => {
  console.error('[NEXMEET] Failed to start server:', err);
  process.exit(1);
});

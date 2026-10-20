import { Meeting, User, FileItem, SecuritySpecs, AISummary, MeetingHistoryRecord, CanvasNote, SpatialRoomTheme } from '../types';

const BASE_URL = '';

export async function registerUser(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to register');
  return data;
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to log in');
  return data;
}

export async function getMe(token: string): Promise<{ user: User }> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session expired');
  return data;
}

export async function createMeeting(
  title?: string,
  hostName?: string,
  hostId?: string,
  options?: {
    passcode?: string;
    waitingRoomEnabled?: boolean;
    screensharePolicy?: 'anyone' | 'host_only';
    spatialTheme?: SpatialRoomTheme;
  }
): Promise<{ meeting: Meeting }> {
  const res = await fetch(`${BASE_URL}/api/meetings/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      hostName,
      hostId,
      passcode: options?.passcode,
      waitingRoomEnabled: options?.waitingRoomEnabled ?? false,
      screensharePolicy: options?.screensharePolicy ?? 'anyone',
      spatialTheme: options?.spatialTheme || 'innovation-lab',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create meeting');
  return data;
}

export async function getMeetingCanvasNotes(idOrCode: string): Promise<{ notes: CanvasNote[] }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(idOrCode)}/canvas-notes`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch canvas notes');
  return data;
}

export async function getMeeting(idOrCode: string): Promise<{ meeting: Meeting }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(idOrCode)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Meeting not found');
  return data;
}

export async function verifyMeetingPasscode(meetingId: string, passcode: string): Promise<{ valid: boolean }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}/verify-passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Incorrect passcode');
  return data;
}

export async function generateMeetingAISummary(
  meetingId: string,
  customNotes?: string
): Promise<{ summary: AISummary }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}/ai-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customNotes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to generate AI summary');
  return data;
}

export async function getMeetingAISummary(meetingId: string): Promise<{ summary: AISummary | null }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}/ai-summary`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch summary');
  return data;
}

export async function getMeetingHistory(token?: string, userId?: string): Promise<{ history: MeetingHistoryRecord[] }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${BASE_URL}/api/user/meetings/history${query}`, { headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to load meeting history');
  return data;
}

export async function recordMeetingHistory(record: Partial<MeetingHistoryRecord>): Promise<{ record: MeetingHistoryRecord }> {
  const res = await fetch(`${BASE_URL}/api/user/meetings/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record meeting history');
  return data;
}

export async function uploadMeetingFile(
  meetingId: string,
  file: File,
  uploadedBy: string,
  uploadedByName: string
): Promise<{ file: FileItem }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadedBy', uploadedBy);
  formData.append('uploadedByName', uploadedByName);

  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/files`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to upload file');
  return data;
}

export async function getMeetingFiles(meetingId: string): Promise<{ files: FileItem[] }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/files`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch files');
  return data;
}

export async function getSecuritySpecs(): Promise<SecuritySpecs> {
  const res = await fetch(`${BASE_URL}/api/security/specs`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to get security specs');
  return data;
}

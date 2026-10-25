import { Meeting, User, FileItem, SecuritySpecs, AISummary, MeetingHistoryRecord, CanvasNote, SpatialRoomTheme } from '../types';

/**
 * Determine the API base URL:
 * 1. Explicit environment variable if configured (VITE_API_URL)
 * 2. In browser environment, resolve to window.location.origin (e.g. https://codealpha-nexmeet.onrender.com)
 * 3. Fallback to empty string for relative paths
 */
export const getBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env as any).VITE_API_URL) {
    return String((import.meta.env as any).VITE_API_URL).replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return '';
};

export const BASE_URL = getBaseUrl();

/**
 * Helper to safely parse API responses and provide informative error messages
 * even when the server returns 502/503 during spin-up.
 */
async function parseApiResponse<T>(res: Response, defaultError: string): Promise<T> {
  let data: any = null;
  const contentType = res.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await res.text();
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('NEXMEET server is waking up or temporarily unavailable. Please retry in a few seconds.');
    }
    const message = data?.error || data?.message || `${defaultError} (${res.status} ${res.statusText})`;
    throw new Error(message);
  }

  if (data === null) {
    throw new Error('Invalid JSON response from server');
  }

  return data as T;
}

export async function registerUser(name: string, email: string, password: string): Promise<{ token: string; user: User }> {
  const url = `${BASE_URL}/api/auth/register`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    return await parseApiResponse<{ token: string; user: User }>(res, 'Failed to register');
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.toLowerCase().includes('failed to fetch')) {
      throw new Error('Unable to connect to NEXMEET authentication service. If running on Render free tier, the server may be waking up—please retry in a few seconds.');
    }
    throw err;
  }
}

export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const url = `${BASE_URL}/api/auth/login`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    return await parseApiResponse<{ token: string; user: User }>(res, 'Failed to log in');
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.toLowerCase().includes('failed to fetch')) {
      throw new Error('Unable to connect to NEXMEET authentication service. If running on Render free tier, the server may be waking up—please retry in a few seconds.');
    }
    throw err;
  }
}

export async function getMe(token: string): Promise<{ user: User }> {
  const url = `${BASE_URL}/api/auth/me`;
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    return await parseApiResponse<{ user: User }>(res, 'Session expired');
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.toLowerCase().includes('failed to fetch')) {
      throw new Error('Session verification could not reach server.');
    }
    throw err;
  }
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
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
  return parseApiResponse<{ meeting: Meeting }>(res, 'Failed to create meeting');
}

export async function getMeetingCanvasNotes(idOrCode: string): Promise<{ notes: CanvasNote[] }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(idOrCode)}/canvas-notes`, {
    headers: { 'Accept': 'application/json' },
  });
  return parseApiResponse<{ notes: CanvasNote[] }>(res, 'Failed to fetch canvas notes');
}

export async function getMeeting(idOrCode: string): Promise<{ meeting: Meeting }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(idOrCode)}`, {
    headers: { 'Accept': 'application/json' },
  });
  return parseApiResponse<{ meeting: Meeting }>(res, 'Meeting not found');
}

export async function verifyMeetingPasscode(meetingId: string, passcode: string): Promise<{ valid: boolean }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}/verify-passcode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  return parseApiResponse<{ valid: boolean }>(res, 'Incorrect passcode');
}

export async function generateMeetingAISummary(
  meetingId: string,
  customNotes?: string
): Promise<{ summary: AISummary }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}/ai-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ customNotes }),
  });
  return parseApiResponse<{ summary: AISummary }>(res, 'Failed to generate AI summary');
}

export async function getMeetingAISummary(meetingId: string): Promise<{ summary: AISummary | null }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${encodeURIComponent(meetingId)}/ai-summary`, {
    headers: { 'Accept': 'application/json' },
  });
  return parseApiResponse<{ summary: AISummary | null }>(res, 'Failed to fetch summary');
}

export async function getMeetingHistory(token?: string, userId?: string): Promise<{ history: MeetingHistoryRecord[] }> {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${BASE_URL}/api/user/meetings/history${query}`, { headers });
  return parseApiResponse<{ history: MeetingHistoryRecord[] }>(res, 'Failed to load meeting history');
}

export async function recordMeetingHistory(record: Partial<MeetingHistoryRecord>): Promise<{ record: MeetingHistoryRecord }> {
  const res = await fetch(`${BASE_URL}/api/user/meetings/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(record),
  });
  return parseApiResponse<{ record: MeetingHistoryRecord }>(res, 'Failed to record meeting history');
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
    headers: { 'Accept': 'application/json' },
    body: formData,
  });
  return parseApiResponse<{ file: FileItem }>(res, 'Failed to upload file');
}

export async function getMeetingFiles(meetingId: string): Promise<{ files: FileItem[] }> {
  const res = await fetch(`${BASE_URL}/api/meetings/${meetingId}/files`, {
    headers: { 'Accept': 'application/json' },
  });
  return parseApiResponse<{ files: FileItem[] }>(res, 'Failed to fetch files');
}

export async function getSecuritySpecs(): Promise<SecuritySpecs> {
  const res = await fetch(`${BASE_URL}/api/security/specs`, {
    headers: { 'Accept': 'application/json' },
  });
  return parseApiResponse<SecuritySpecs>(res, 'Failed to get security specs');
}

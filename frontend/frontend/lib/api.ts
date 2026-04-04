const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * BACKEND TYPES (Direct from FastAPI)
 */
export interface BackendSegment {
  segment_id: string;
  speaker: string;
  role: string;
  text: string;
  emotion: string;
  emotion_score: number;
}

export interface BackendActionItem {
  who: string;
  task: string;
  deadline: string;
  status: string;
  completed: boolean;
  id?: number;
}

export interface BackendDecisionTrace {
  decision: string;
  evidence: { segment_id: string; speaker: string; text: string }[];
}

export interface BackendAnalysis {
  meeting_name: string;
  date: string;
  summary?: string;
  decisions: string[];
  action_items: BackendActionItem[];
  decision_traces?: BackendDecisionTrace[];
  word_count: number;
  speakers_identified: number;
}

export interface BackendMeeting {
  _id: string;
  analysis: BackendAnalysis;
  segments: BackendSegment[];
}

/**
 * UI MAPPED TYPES
 */
export interface MappedMeeting {
  id: string;
  title: string;
  date: string;
  speakers: number;
  words: number;
  dominantEmotion: string;
  avatars: string[];
  totalDecisions: number;
  totalActionItems: number;
  pendingActionItems: number;
}

export interface MappedActionItem {
  id: number;
  meetingId: string;
  meetingName: string;
  title: string;
  status: "DONE" | "PENDING" | "OVERDUE";
  assignee: { name: string; avatar: string };
  dueDate: string;
  completed: boolean;
}

export interface MappedDecision {
  id: string;
  meetingId: string;
  date: string;
  title: string;
  meeting: string;
  quote: string;
  evidence: { segment_id: string; speaker: string; text: string }[];
}

export interface ChatResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: { segment_id: string; meeting_id: string; speaker: string; text: string; emotion: string }[];
  meetings_used: number;
}

/**
 * UTILS & MAPPING
 */
const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
];

export function avatarFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_POOL.length;
  return AVATAR_POOL[hash];
}

export function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
}

export const isTaskCompleted = (item: BackendActionItem) =>
  item.completed || ["completed", "done"].includes((item.status || "").toLowerCase());

function getStatus(item: BackendActionItem): "DONE" | "PENDING" | "OVERDUE" {
  if (isTaskCompleted(item)) return "DONE";
  if ((item.status || "").toLowerCase() === "overdue") return "OVERDUE";
  return "PENDING";
}

export function normalizeMeeting(m: BackendMeeting): MappedMeeting {
  const analysis = m.analysis || {} as BackendAnalysis;
  const segments = m.segments || [];
  
  // Find dominant emotion
  const counts: Record<string, number> = {};
  segments.forEach(s => counts[s.emotion] = (counts[s.emotion] || 0) + 1);
  const domEmotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "neutral";

  const speakers = Array.from(new Set(segments.map(s => s.speaker).filter(Boolean)));

  return {
    id: m._id,
    title: analysis.meeting_name || "Untitled Meeting",
    date: analysis.date || "Unknown",
    speakers: analysis.speakers_identified || speakers.length,
    words: analysis.word_count || 0,
    dominantEmotion: domEmotion,
    avatars: speakers.slice(0, 3),
    totalDecisions: (analysis.decisions || []).length,
    totalActionItems: (analysis.action_items || []).length,
    pendingActionItems: (analysis.action_items || []).filter(i => !isTaskCompleted(i)).length,
  };
}

export function normalizeActionItem(item: BackendActionItem, idx: number, mId: string, mName: string): MappedActionItem {
  return {
    id: item.id ?? idx,
    meetingId: mId,
    meetingName: mName,
    title: item.task || "Untitled Task",
    status: getStatus(item),
    assignee: { name: item.who || "Unassigned", avatar: avatarFor(item.who) },
    dueDate: item.deadline || "No deadline",
    completed: isTaskCompleted(item),
  };
}

/**
 * API CALLS
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const error = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${res.status}: ${error}`);
  }
  return res.json() as Promise<T>;
}

export const getMeetings = () => apiFetch<BackendMeeting[]>("/meetings");
export const getMeeting = (id: string) => apiFetch<BackendMeeting>(`/meetings/${id}`);
export const deleteMeeting = (id: string) => apiFetch(`/meetings/${id}`, { method: "DELETE" });
export const deleteAllMeetings = () => apiFetch("/meetings/all", { method: "DELETE" });

export async function uploadTranscript(file: File, meetingName?: string): Promise<BackendMeeting> {
  const form = new FormData();
  form.append("file", file);
  if (meetingName) form.append("meeting_name", meetingName);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(await res.text().catch(() => "Upload failed"));
  return res.json();
}

export const chat = (query: string, meetingId?: string) => {
  const params = new URLSearchParams({ query });
  if (meetingId) params.set("meeting_id", meetingId);
  return apiFetch<ChatResponse>(`/chat?${params.toString()}`);
};

export const updateTaskStatus = (meetingId: string, taskId: number, status: string) =>
  apiFetch("/update-task", {
    method: "POST",
    body: JSON.stringify({ meeting_id: meetingId, task_id: taskId, status }),
  });

export function normalizeDecision(decision: string, idx: number, mId: string, analysis: BackendAnalysis): MappedDecision {
  const trace = (analysis.decision_traces || []).find(t => t.decision === decision);
  return {
    id: `${mId}-d${idx}`,
    meetingId: mId,
    date: analysis.date || "Unknown",
    title: decision,
    meeting: analysis.meeting_name || "Unknown Meeting",
    quote: decision,
    evidence: (trace?.evidence || []).map(e => ({ segment_id: e.segment_id, speaker: e.speaker, text: e.text })),
  };
}

export const getSpeakerAnalytics = (mId?: string) => 
  apiFetch<{ speakers: any[] }>(`/speaker-analytics?${new URLSearchParams(mId ? { meeting_id: mId } : {}).toString()}`);

export const getSentimentFlow = (mId?: string) => 
  apiFetch<{ flow: any[] }>(`/sentiment-flow?${new URLSearchParams(mId ? { meeting_id: mId } : {}).toString()}`);

export const getSentimentInsight = (mId?: string) => 
  apiFetch<{ insight: string }>(`/sentiment-insight?${new URLSearchParams(mId ? { meeting_id: mId } : {}).toString()}`);

export const getAllActionItems = async (): Promise<MappedActionItem[]> => {
  const meetings = await getMeetings();
  const res: MappedActionItem[] = [];
  meetings.forEach(m => {
    (m.analysis?.action_items || []).forEach((i, idx) => 
      res.push(normalizeActionItem(i, idx, m._id, m.analysis?.meeting_name))
    );
  });
  return res;
};

export const downloadReport = async (data: BackendMeeting, format: "csv" | "pdf") => {
  const res = await fetch(`${BASE}/download?format=${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data.analysis),
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `meeting_report.${format}`;
  a.click();
}
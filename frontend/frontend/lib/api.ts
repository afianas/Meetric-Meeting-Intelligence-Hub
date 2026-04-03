const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  evidence: { segment_id: string; speaker: string; role: string; text: string; overlap_score: number }[];
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

export interface MappedMeeting {
  id: string;
  title: string;
  date: string;
  speakers: number;
  words: number;
  tag: string;
  tagColor: string;
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
  status: string;
  statusColor: string;
  assignee: { name: string; role: string; avatar: string };
  dueDate: string;
  dueDateColor: string;
  completed: boolean;
}

export interface MappedDecision {
  id: string;
  meetingId: string;
  date: string;
  title: string;
  meeting: string;
  type: "executive" | "product" | "design";
  quote: string;
  evidence: { segment_id: string; speaker: string; text: string }[];
}

export interface ChatResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: { segment_id: string; meeting_id: string; speaker: string; role: string; text: string; emotion: string }[];
  meetings_used: number;
}

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=50&h=50&fit=crop&crop=face",
];

function avatarFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_POOL.length;
  return AVATAR_POOL[hash];
}

function emotionToTag(emotion: string): { tag: string; tagColor: string } {
  const e = (emotion || "neutral").toLowerCase();
  if (["agreement", "joy", "admiration", "approval"].includes(e))
    return { tag: "AGR (Agreement)", tagColor: "bg-green-100 text-green-700" };
  if (["conflict", "anger", "disgust", "disapproval"].includes(e))
    return { tag: "CON (Conflict)", tagColor: "bg-orange-100 text-orange-700" };
  if (["concern", "fear", "sadness", "uncertainty"].includes(e))
    return { tag: "CNC (Concern)", tagColor: "bg-yellow-100 text-yellow-700" };
  return { tag: "NEU (Neutral)", tagColor: "bg-gray-100 text-gray-700" };
}

function dominantEmotion(segments: BackendSegment[]): string {
  if (!segments || segments.length === 0) return "neutral";
  const counts: Record<string, number> = {};
  for (const s of segments) counts[s.emotion] = (counts[s.emotion] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function uiStatus(item: BackendActionItem): { label: string; color: string } {
  const isDone = item.completed || item.status === "completed" || item.status === "done";
  if (isDone) return { label: "DONE", color: "bg-green-100 text-green-700" };
  const s = (item.status || "pending").toLowerCase();
  if (s === "overdue") return { label: "OVERDUE", color: "bg-red-100 text-red-700" };
  return { label: "PENDING", color: "bg-amber-100 text-amber-700" };
}

export function mapMeeting(m: BackendMeeting): MappedMeeting {
  const analysis = m.analysis || {} as BackendAnalysis;
  const emotion = dominantEmotion(m.segments || []);
  const tagInfo = emotionToTag(emotion);
  const speakers = Array.from(new Set((m.segments || []).map(s => s.speaker).filter(Boolean)));
  return {
    id: m._id,
    title: analysis.meeting_name || "Untitled Meeting",
    date: analysis.date || "Unknown date",
    speakers: analysis.speakers_identified || speakers.length,
    words: analysis.word_count || 0,
    tag: tagInfo.tag,
    tagColor: tagInfo.tagColor,
    avatars: speakers.slice(0, 3).map(n => avatarFor(n)),
    totalDecisions: (analysis.decisions || []).length,
    totalActionItems: (analysis.action_items || []).length,
    pendingActionItems: (analysis.action_items || []).filter(item => {
      const isDone = item.completed === true || 
                     item.status === "completed" || 
                     item.status === "done";
      return !isDone;
    }).length,
  };
}

export function mapActionItem(
  item: BackendActionItem,
  idx: number,
  meetingId: string,
  meetingName: string
): MappedActionItem {
  const { label, color } = uiStatus(item);
  return {
    id: item.id !== undefined ? item.id : idx,
    meetingId,
    meetingName,
    title: item.task || "Untitled Task",
    status: label,
    statusColor: color,
    assignee: { name: item.who || "Unknown", role: "Team Member", avatar: avatarFor(item.who || "Unknown") },
    dueDate: item.deadline || "No deadline",
    dueDateColor: label === "OVERDUE" ? "text-red-600" : "text-muted-foreground",
    completed: item.completed === true || item.status === "completed" || item.status === "done",
  };
}

export function mapDecision(
  decision: string,
  idx: number,
  meetingId: string,
  analysis: BackendAnalysis
): MappedDecision {
  const trace = (analysis.decision_traces || []).find(t => t.decision === decision);
  const types: ("executive" | "product" | "design")[] = ["executive", "product", "design"];
  return {
    id: `${meetingId}-d${idx}`,
    meetingId,
    date: analysis.date || "Unknown",
    title: decision,
    meeting: analysis.meeting_name || "Unknown Meeting",
    type: types[idx % 3],
    quote: decision,
    evidence: (trace?.evidence || []).map(e => ({ segment_id: e.segment_id, speaker: e.speaker, text: e.text })),
  };
}

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

export async function getMeetings(): Promise<BackendMeeting[]> {
  return apiFetch<BackendMeeting[]>("/meetings");
}

export async function getMeeting(id: string): Promise<BackendMeeting> {
  return apiFetch<BackendMeeting>(`/meetings/${id}`);
}

export async function deleteMeeting(id: string): Promise<void> {
  await fetch(`${BASE}/meetings/${id}`, { method: "DELETE" });
}

export async function deleteAllMeetings(): Promise<void> {
  await fetch(`${BASE}/meetings/all`, { method: "DELETE" });
}

export async function uploadTranscript(file: File, meetingName?: string): Promise<BackendMeeting> {
  const form = new FormData();
  form.append("file", file);
  if (meetingName) form.append("meeting_name", meetingName);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.text().catch(() => "Upload failed");
    throw new Error(err);
  }
  return res.json();
}

export async function chat(query: string, meetingId?: string): Promise<ChatResponse> {
  const params = new URLSearchParams({ query });
  if (meetingId) params.set("meeting_id", meetingId);
  return apiFetch<ChatResponse>(`/chat?${params.toString()}`);
}

export async function getSpeakerAnalytics(meetingId?: string): Promise<{
  speakers: { speaker: string; total_segments: number; emotion_distribution: Record<string, number> }[];
}> {
  const params = new URLSearchParams();
  if (meetingId) params.set("meeting_id", meetingId);
  return apiFetch(`/speaker-analytics?${params.toString()}`);
}

export async function getSentimentFlow(meetingId?: string): Promise<{
  flow: { segment_id: string; speaker: string; emotion: string; text: string; confidence: number; meeting_id: string }[];
}> {
  const params = new URLSearchParams();
  if (meetingId) params.set("meeting_id", meetingId);
  return apiFetch(`/sentiment-flow?${params.toString()}`);
}

export async function getSentimentInsight(meetingId?: string): Promise<{
  insight: string;
}> {
  const params = new URLSearchParams();
  if (meetingId) params.set("meeting_id", meetingId);
  return apiFetch(`/sentiment-insight?${params.toString()}`);
}

export async function updateTask(meetingId: string, taskId: number, status: string): Promise<void> {
  await apiFetch("/update-task", {
    method: "POST",
    body: JSON.stringify({ meeting_id: meetingId, task_id: taskId, status }),
  });
}

export async function downloadReport(data: BackendMeeting, format: "csv" | "pdf"): Promise<void> {
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
  a.download = `meeting_summary.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getAllActionItems(): Promise<MappedActionItem[]> {
  const meetings = await getMeetings();
  const result: MappedActionItem[] = [];
  for (const m of meetings) {
    (m.analysis?.action_items || []).forEach((item, idx) => {
      result.push(mapActionItem(item, idx, m._id, m.analysis?.meeting_name || "Unknown"));
    });
  }
  return result;
}

export async function getAllDecisions(): Promise<MappedDecision[]> {
  const meetings = await getMeetings();
  const result: MappedDecision[] = [];
  for (const m of meetings) {
    (m.analysis?.decisions || []).forEach((d, idx) => {
      result.push(mapDecision(d, idx, m._id, m.analysis));
    });
  }
  return result;
}
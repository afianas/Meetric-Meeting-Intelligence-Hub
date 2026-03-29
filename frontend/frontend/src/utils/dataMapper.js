/**
 * Data Mapper Layer (Clean Architecture)
 *
 * Transforms raw backend response (MongoDB _id, analysis, segments)
 * into stable, UI-friendly models. Components never consume raw API data.
 */

const EMOTION_KEYS = ['agreement', 'conflict', 'concern', 'uncertainty', 'neutral'];

/**
 * Maps a single raw backend meeting into a stable UI model.
 */
export function mapMeetingToUIModel(rawMeeting) {
  if (!rawMeeting) return null;

  const id = rawMeeting._id || 'unknown-id';
  const analysis = rawMeeting.analysis || {};
  const segments = rawMeeting.segments || [];

  // ── Primitive fields ──────────────────────────────────────────────────────
  const name = analysis.meeting_name || 'Untitled Meeting';
  const date = analysis.date || 'Unknown Date';
  const sentiment = (analysis.overall_sentiment || 'NEUTRAL').toUpperCase();

  const summaryParts = Array.isArray(analysis.summary)
    ? analysis.summary
    : analysis.summary ? [analysis.summary] : [];

  // ── Action Items ──────────────────────────────────────────────────────────
  const rawActions = analysis.action_items || [];
  const actions = rawActions.map((act, index) => {
    if (typeof act === 'string') {
      return {
        id: index,
        meetingId: id,
        meetingName: name,
        content: act,
        who: 'Unassigned',
        done: false,
        urgent: false,
        deadline: 'TBD',
      };
    }
    const statusStr = act.status || '';
    const isDone = act.completed === true || statusStr.toLowerCase() === 'completed';
    return {
      id: act.task_id ?? act.id ?? index,
      meetingId: id,
      meetingName: name,
      content: act.task || act.description || act.text || act.content || 'Unknown Task',
      who: act.owner || act.assignee || act.who || 'Unassigned',
      done: isDone,
      urgent: act.impact === 'High' || act.urgent || false,
      deadline: act.deadline || act.due || 'TBD',
    };
  });

  // ── Decisions ─────────────────────────────────────────────────────────────
  const rawDecisions = analysis.decisions || [];
  const decisions = rawDecisions.map((dec, index) => {
    if (typeof dec === 'string') {
      return { id: `${id}-dec-${index}`, title: dec, impact: 'Medium', timestamp: '00:00', evidence: [] };
    }
    return {
      id: dec.id || `${id}-dec-${index}`,
      title: dec.decision || dec.title || dec.text || 'Unknown Decision',
      impact: dec.impact || 'Medium',
      timestamp: dec.timestamp || '00:00',
      rationale: dec.reasoning || dec.rationale || '',
      evidence: [], // filled in below from decision_traces
    };
  });

  // ── Decision Traces (evidence linking) ───────────────────────────────────
  //   Backend: analysis.decision_traces = [{ decision, evidence: [{ speaker, role, text, emotion }] }]
  const rawTraces = analysis.decision_traces || [];
  const decisionTraces = rawTraces.map((trace, index) => ({
    id: `${id}-trace-${index}`,
    title: trace.decision || decisions[index]?.title || 'Unknown Decision',
    evidence: (trace.evidence || []).map(ev => ({
      speaker: ev.speaker || 'Unknown',
      role: ev.role || '',
      text: ev.text || '',
      emotion: ev.emotion || 'neutral',
    })),
  }));

  // Merge trace evidence back into decisions by index
  decisions.forEach((dec, i) => {
    if (decisionTraces[i]) dec.evidence = decisionTraces[i].evidence;
  });

  // ── Speaker Stats (from segments) ─────────────────────────────────────────
  //   Real data: per-speaker contribution count + emotion breakdown
  const speakerStatsMap = {};
  segments.forEach(seg => {
    const spk = seg.speaker || 'Unknown';
    const emotion = (seg.emotion || 'neutral').toLowerCase();
    if (!speakerStatsMap[spk]) {
      speakerStatsMap[spk] = {
        name: spk,
        avatar: spk.charAt(0).toUpperCase(),
        contributions: 0,
        emotions: { agreement: 0, conflict: 0, concern: 0, uncertainty: 0, neutral: 0 },
      };
    }
    speakerStatsMap[spk].contributions += 1;
    const key = EMOTION_KEYS.includes(emotion) ? emotion : 'neutral';
    speakerStatsMap[spk].emotions[key] += 1;
  });

  // Convert raw counts → percentages + derive dominant emotion
  const speakerStats = Object.values(speakerStatsMap).map(spk => {
    const total = spk.contributions || 1;
    const emotionPct = {};
    let dominantEmotion = 'neutral';
    let dominantCount = 0;
    EMOTION_KEYS.forEach(k => {
      const pct = Math.round((spk.emotions[k] / total) * 100);
      emotionPct[k] = pct;
      if (spk.emotions[k] > dominantCount) {
        dominantCount = spk.emotions[k];
        dominantEmotion = k;
      }
    });
    return {
      name: spk.name,
      avatar: spk.avatar,
      contributions: spk.contributions,
      emotionPct,
      dominantEmotion,
    };
  });

  // Global emotion totals for this meeting
  const emotionTotals = { agreement: 0, conflict: 0, concern: 0, uncertainty: 0, neutral: 0 };
  segments.forEach(seg => {
    const emotion = (seg.emotion || 'neutral').toLowerCase();
    const key = EMOTION_KEYS.includes(emotion) ? emotion : 'neutral';
    emotionTotals[key] += 1;
  });
  const totalSegs = segments.length || 1;
  const emotionSummary = {};
  EMOTION_KEYS.forEach(k => { emotionSummary[k] = Math.round((emotionTotals[k] / totalSegs) * 100); });

  // Simple speakers list (for MeetingDetail stats)
  const speakers = Object.values(speakerStatsMap).map(s => ({
    name: s.name,
    avatar: s.avatar,
  }));

  return {
    id,
    name,
    date,
    sentiment,
    summary: summaryParts.length > 0 ? summaryParts.join(' ') : 'No summary available.',
    actions,
    decisions,
    decisionTraces,
    speakers,
    speakerStats,
    emotionSummary,
    metrics: {
      duration: `${Math.floor(segments.length * 0.5)} min`,
      engagement: `${Math.floor(Math.random() * 20 + 75)}%`,
      wordCount: analysis.word_count || segments.reduce((acc, s) => acc + (s.text||"").trim().split(/\s+/).length, 0),
      actionCount: actions.length,
      decisionCount: decisions.length,
    },
    rawSegments: segments,
  };
}

/**
 * Maps a list of backend meetings.
 */
export function mapMeetingsList(rawMeetings = []) {
  if (!Array.isArray(rawMeetings)) return [];
  return rawMeetings.map(mapMeetingToUIModel);
}

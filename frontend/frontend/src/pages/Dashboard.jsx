import { apiClient } from "../utils/apiClient";

export default function Dashboard({ setPage, openDetail, meetings, isLoading, error, onRefresh }) {
  const allActions = meetings.flatMap(m => m.actions || []);
  const allDecisions = meetings.flatMap(m => m.decisions || []);
  const urgentActionsCount = allActions.filter(a => a.impact === 'High' && !a.isCompleted).length || 0;

  // Dynamically calculate the general tone from all indexed meetings
  const totalMeetings = meetings.length;

  let dominantTone = "--";
  if (totalMeetings > 0) {
    const counts = {};
    meetings.forEach(m => {
      const s = m.sentiment || 'NEUTRAL';
      counts[s] = (counts[s] || 0) + 1;
    });

    let max = 0;
    for (const [s, c] of Object.entries(counts)) {
      if (s !== 'NEUTRAL' && c > max) {
        max = c;
        dominantTone = s;
      }
    }
    // Default to Neutral if no strong specific tones exist
    if (dominantTone === "--" && counts['NEUTRAL']) {
      dominantTone = 'NEUTRAL';
    }
  }

  // Title case the output
  const displayTone = dominantTone === "--" ? "--" : dominantTone.charAt(0) + dominantTone.slice(1).toLowerCase();

  if (isLoading) {
    return (
      <div className="content page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--text2)', fontFamily: 'var(--fm)' }}>Syncing workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'red', fontFamily: 'var(--fm)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="content page">
      <div className="d-greet">Good morning. <em>Intelligence ready.</em></div>
      <div className="d-sub">{totalMeetings} transcripts indexed · Live synced</div>
      <div className="mg">
        {[
          { val: String(totalMeetings), lbl: "Transcripts", d: "Total indexed" },
          { val: String(allDecisions.length), lbl: "Decisions", d: "Recorded historically" },
          { val: String(allActions.length), lbl: "Action Items", d: "Found across all records" },
          { val: displayTone, lbl: "Dominant Tone", d: "Across all records" },
        ].map(m => (
          <div key={m.lbl} className="mc">
            <div className="mc-lbl">{m.lbl}</div>
            <div className="mc-val">{m.val}</div>
            <div className="mc-d">{m.d}</div>
            <div className="mc-bar" />
          </div>
        ))}
      </div>
      <div className="g3" style={{ gridTemplateColumns: "1fr" }}>
        <div className="card">
          <div className="card-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Recent Meetings</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="card-act" style={{ color: '#ef4444', borderColor: '#fecaca' }} onClick={async () => {
                if (confirm("Clear ALL meetings? This cannot be undone.")) {
                  await apiClient.clearAllMeetings();
                  onRefresh?.();
                }
              }}>clear all</div>
              <div className="card-act" onClick={() => setPage("upload")}>+ upload →</div>
            </div>
          </div>
          {meetings.length === 0 ? (
            <div style={{ padding: '20px 16px', color: 'var(--text3)', fontFamily: 'var(--fm)', fontSize: 12 }}>
              No meetings found. Upload a transcript to get started.
            </div>
          ) : meetings.slice(0, 10).map(m => (
            <div key={m.id} className="mr" onClick={() => openDetail(m)}>
              <div className="mr-dot" style={{ background: '#6366f1' }} />
              <div className="mr-info">
                <div className="mr-name">{m.name}</div>
                <div className="mr-meta">
                  {m.date} · {m.speakers?.length || 0} speakers · {m.metrics?.wordCount?.toLocaleString() || 0} words · {m.metrics?.actionCount || 0} actions · {m.metrics?.decisionCount || 0} decisions
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`mr-score ${m.sentiment === 'AGREEMENT' ? 'sp-agr' :
                    m.sentiment === 'CONFLICT' ? 'sp-con' :
                      m.sentiment === 'UNCERTAINTY' ? 'sp-unc' :
                        m.sentiment === 'CONCERN' ? 'sp-cnr' : 'sp-neu'
                  }`}>
                  {m.sentiment ? m.sentiment.substring(0, 3) : "NEU"}
                </div>
                <button
                  className="mr-del-btn"
                  title="Delete Meeting"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${m.name}"? This will also remove its context from the AI chatbot.`)) {
                      await apiClient.deleteMeeting(m.id);
                      onRefresh?.();
                    }
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

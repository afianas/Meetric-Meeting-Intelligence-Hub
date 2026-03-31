import { useState } from "react";
import { apiClient } from "../utils/apiClient";

export default function Dashboard({ setPage, openDetail, meetings = [], isLoading, error, onRefresh }) {
  const [groupBy, setGroupBy] = useState("none"); // "none" | "date" | "name"

  const allActions = meetings.flatMap(m => m.actions || []);
  const allDecisions = meetings.flatMap(m => m.decisions || []);
  const totalMeetings = meetings.length;

  // Grouping logic
  const groupedMeetings = {};
  let groupKeys = [];

  if (groupBy === "date") {
    meetings.forEach(m => {
      const date = m.date || "Unknown Date";
      if (!groupedMeetings[date]) groupedMeetings[date] = [];
      groupedMeetings[date].push(m);
    });
    groupKeys = Object.keys(groupedMeetings).sort((a, b) => new Date(b) - new Date(a));
  } else if (groupBy === "name") {
    meetings.forEach(m => {
      const name = m.name || "Untitled Meeting";
      if (!groupedMeetings[name]) groupedMeetings[name] = [];
      groupedMeetings[name].push(m);
    });
    groupKeys = Object.keys(groupedMeetings).sort((a, b) => a.localeCompare(b));
  }


  // Dynamically calculate the general tone from all indexed meetings
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
    if (dominantTone === "--" && counts['NEUTRAL']) dominantTone = 'NEUTRAL';
  }

  // Title case the output
  const displayTone = dominantTone === "--" ? "--" : dominantTone.charAt(0) + dominantTone.slice(1).toLowerCase();

  const renderMeetingRow = (m) => (
    <div key={m.id} className="mr" onClick={() => openDetail(m)}>
      <div className="mr-dot" style={{ background: '#6366f1' }} />
      <div className="mr-info">
        <div className="mr-name">{m.name}</div>
        <div className="mr-meta">
          {m.date} · {m.speakers?.length || 0} speakers · {m.metrics?.wordCount?.toLocaleString() || 0} words · {m.metrics?.actionCount || 0} actions
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
            if (confirm(`Delete "${m.name}"?`)) {
              await apiClient.deleteMeeting(m.id);
              onRefresh?.();
            }
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
        </button>
      </div>
    </div>
  );

  if (isLoading) return <div className="content page d-sub">Syncing workspace...</div>;
  if (error) return <div className="content page" style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="content page">
      <div className="d-greet">Good morning. <em>Intelligence ready.</em></div>
      <div className="d-sub">{totalMeetings} transcripts indexed · Live synced</div>
      
      <div className="mg">
        {[
          { val: String(totalMeetings), lbl: "Transcripts", d: "Total indexed" },
          { val: String(allDecisions.length), lbl: "Decisions", d: "Recorded historically" },
          { val: String(allActions.length), lbl: "Action Items", d: "Across all records" },
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
        <div className="card" style={{ paddingBottom: 8 }}>
          <div className="card-hd" style={{ padding: '4px 20px 0' }}>
            <div className="card-title">All Meetings</div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--fm)' }}>Group by:</span>
                <select 
                  value={groupBy} 
                  onChange={(e) => setGroupBy(e.target.value)}
                  style={{
                    background: 'var(--bg3)',
                    border: '1px solid var(--border2)',
                    borderRadius: 'var(--r-sm)',
                    padding: '2px 8px',
                    fontSize: 11,
                    fontFamily: 'var(--fm)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="none">None</option>
                  <option value="date">Date</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div className="card-act" style={{ color: '#ef4444' }} onClick={async () => {
                if (confirm("Clear ALL meetings?")) {
                  await apiClient.clearAllMeetings();
                  onRefresh?.();
                }
              }}>clear all</div>
              <div className="card-act" onClick={() => setPage("upload")}>+ upload</div>
            </div>
          </div>

          <div style={{ padding: '0 10px 10px' }}>
            {meetings.length === 0 ? (
              <div style={{ padding: '20px 10px', color: 'var(--text3)', fontFamily: 'var(--fm)', fontSize: 12 }}>
                No meetings found.
              </div>
            ) : groupBy === 'none' ? (
              meetings.map(renderMeetingRow)
            ) : (
              groupKeys.map(key => (
                <div key={key} style={{ marginTop: 20 }}>
                  <div style={{ 
                    fontSize: 10, 
                    textTransform: 'uppercase', 
                    letterSpacing: '.1em', 
                    color: 'var(--text3)', 
                    fontFamily: 'var(--fm)',
                    marginBottom: 8,
                    paddingLeft: 10,
                    borderLeft: '2px solid var(--border2)'
                  }}>
                    {key}
                  </div>
                  {groupedMeetings[key].map(renderMeetingRow)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


import { useState } from "react";
import { apiClient } from "../utils/apiClient";

export default function MeetingHistory({ meetings, openDetail, onRefresh, isLoading }) {
  const [groupBy, setGroupBy] = useState("date"); // "date" | "name"

  if (isLoading) {
    return (
      <div className="content page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: 'var(--text2)', fontFamily: 'var(--fm)' }}>Loading history...</div>
      </div>
    );
  }

  // Grouping logic
  const groupedMeetings = {};
  if (groupBy === "date") {
    meetings.forEach(m => {
      const date = m.date || "Unknown Date";
      if (!groupedMeetings[date]) groupedMeetings[date] = [];
      groupedMeetings[date].push(m);
    });
  } else {
    meetings.forEach(m => {
      const name = m.name || "Untitled Meeting";
      if (!groupedMeetings[name]) groupedMeetings[name] = [];
      groupedMeetings[name].push(m);
    });
  }

  // Sort groups (dates descending, names ascending)
  const groupKeys = Object.keys(groupedMeetings).sort((a, b) => {
    if (groupBy === "date") return new Date(b) - new Date(a);
    return a.localeCompare(b);
  });

  const handleDelete = async (e, m) => {
    e.stopPropagation();
    if (confirm(`Delete "${m.name}"? This will also remove its context from the AI chatbot.`)) {
      await apiClient.deleteMeeting(m.id);
      onRefresh?.();
    }
  };

  return (
    <div className="content page">
      <div className="card-hd" style={{ marginBottom: 24 }}>
        <div>
          <div className="d-greet" style={{ fontSize: 24 }}>Meeting History</div>
          <div className="d-sub">Review and manage all indexed transcripts</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--fm)' }}>Group by:</span>
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--r-sm)',
              padding: '4px 8px',
              fontSize: 12,
              fontFamily: 'var(--fm)',
              color: 'var(--text)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="date">Date</option>
            <option value="name">Meeting Name</option>
          </select>
        </div>
      </div>

      {groupKeys.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          No meetings found. Upload a transcript to see it here.
        </div>
      ) : (
        groupKeys.map(key => (
          <div key={key} style={{ marginBottom: 32 }}>
            <div style={{ 
              fontSize: 11, 
              textTransform: 'uppercase', 
              letterSpacing: '.1em', 
              color: 'var(--text3)', 
              fontFamily: 'var(--fm)',
              marginBottom: 12,
              paddingLeft: 4,
              borderLeft: '2px solid var(--border2)'
            }}>
              {key}
            </div>
            <div className="card" style={{ padding: '8px' }}>
              {groupedMeetings[key].map(m => (
                <div key={m.id} className="mr" onClick={() => openDetail(m)}>
                  <div className="mr-dot" style={{ background: '#6366f1' }} />
                  <div className="mr-info">
                    <div className="mr-name">{m.name}</div>
                    <div className="mr-meta">
                      {m.date} · {m.speakers?.length || 0} speakers · {m.metrics?.wordCount?.toLocaleString() || 0} words
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
                      onClick={(e) => handleDelete(e, m)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

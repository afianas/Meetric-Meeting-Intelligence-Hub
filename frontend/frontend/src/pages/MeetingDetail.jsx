import { useState } from "react";
import ScopedChatbot from "../components/ScopedChatbot";
import { exportActionsCSV, exportDecisionsCSV, exportMeetingReport } from "../utils/exportUtils";

export default function MeetingDetail({ meeting, onToggleAction, onRefresh, onClose }) {
  const [expandedDecId, setExpandedDecId] = useState(null);

  if (!meeting) return null;

  const meetDecs = meeting.decisions || [];
  const meetActions = meeting.actions || [];
  const segments = meeting.rawSegments || [];
  const doneCount = meetActions.filter(a => a.done).length;
  const pct = meetActions.length ? Math.round((doneCount / meetActions.length) * 100) : 0;


  return (
    <div className="content page" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 28px" }}>
      <div className="detail-hero" style={{ marginBottom: 20 }}>
        <div className="detail-hero-top">
          <div className="detail-hero-dot" style={{ background: '#14b8a6' }} />
          <div className="detail-hero-name">{meeting.name}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className="tb-back"
              style={{ background: 'rgba(220, 38, 38, 0.05)', color: '#dc2626', borderColor: 'rgba(220, 38, 38, 0.2)', fontSize: 11 }}
              onClick={async () => {
                if (confirm(`Permanently delete "${meeting.name}"?`)) {
                  const { apiClient } = await import("../utils/apiClient");
                  await apiClient.deleteMeeting(meeting.id);
                  onRefresh?.();
                  onClose?.();
                }
              }}
            >
              Delete Meeting
            </button>
            <div className="detail-hero-proj">{meeting.date}</div>
          </div>
        </div>
        <div className="detail-stats">
          {[
            { lbl: "Speakers", val: meeting.speakers?.length || 0, c: "var(--text)" },
            {
              lbl: "Sentiment",
              val: meeting.sentiment,
              c: meeting.sentiment === 'AGREEMENT' ? "#16a34a" :
                meeting.sentiment === 'CONFLICT' ? "#dc2626" :
                  meeting.sentiment === 'CONCERN' ? "#ea580c" :
                    meeting.sentiment === 'UNCERTAINTY' ? "#ca8a04" : "#64748b"
            },
            { lbl: "Decisions", val: meetDecs.length, c: "var(--text)" },
            { lbl: "Action Items", val: meetActions.length, c: "var(--text)" }
          ].map(s => (
            <div key={s.lbl} className="ds">
              <div className="ds-v" style={{ color: s.c }}>{s.val}</div>
              <div className="ds-l">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
        <div style={{ fontFamily: "var(--fd)", fontSize: 14, color: "var(--text2)" }}>Summary & Extractions</div>
        <button className="tb-back" style={{ background: "var(--bg2)", color: "var(--text)" }} onClick={() => exportMeetingReport(meeting, 'pdf')}>↓ Download Full PDF Report</button>
      </div>


      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Action Items Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 16 }}>Action Items ({doneCount}/{meetActions.length})</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="tb-back" style={{ fontSize: 10 }} onClick={() => exportActionsCSV(meetActions)}>CSV</button>
                </div>
              </div>
              {meetActions.length > 0 && <div className="trk-prog" style={{ margin: "0 20px 16px" }}><div className="trk-bar"><div className="trk-fill" style={{ width: `${pct}%` }} /></div><div className="trk-lbl">{pct}%</div></div>}

              {meetActions.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "var(--text3)", fontFamily: "var(--fm)" }}>No action items found.</div>
              ) : (
                <table className="md-table">
                  <thead>
                    <tr><th style={{ width: 40 }}>Status</th><th>What</th><th>Who</th><th>By When</th></tr>
                  </thead>
                  <tbody>
                    {meetActions.map(a => (
                      <tr key={a.id}>
                        <td style={{ textAlign: "center" }}>
                          <input type="checkbox" checked={a.done} onChange={() => onToggleAction(a.meetingId, a.id, a.done)} style={{ cursor: "pointer", transform: "scale(1.2)" }} />
                        </td>
                        <td style={{ fontWeight: 500 }}>{a.content}</td>
                        <td style={{ fontFamily: "var(--fm)", fontSize: 12 }}>{a.who || "—"}</td>
                        <td style={{ fontFamily: "var(--fm)", fontSize: 12 }}>{a.deadline || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Decisions Table */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--fd)", fontSize: 16 }}>Traced Decisions ({meetDecs.length})</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="tb-back" style={{ fontSize: 10 }} onClick={() => exportDecisionsCSV(meetDecs)}>CSV</button>
                </div>
              </div>

              {meetDecs.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "var(--text3)", fontFamily: "var(--fm)" }}>No decisions recorded.</div>
              ) : (
                <table className="md-table">
                  <thead><tr><th>Decision</th><th>Rationale & Evidence</th></tr></thead>
                  <tbody>
                    {meetDecs.map(d => {
                      const isExp = expandedDecId === d.id;
                      return (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 500, minWidth: 200 }}>{d.title || d.content}</td>
                          <td style={{ fontFamily: "var(--fm)", fontSize: 12 }}>
                            <div style={{ cursor: "pointer", color: "#14b8a6", textDecoration: "underline" }} onClick={() => setExpandedDecId(isExp ? null : d.id)}>
                              {isExp ? "Hide" : "View Details"}
                            </div>
                            {isExp && (
                              <div style={{ marginTop: 8, padding: 10, background: "var(--bg3)", borderRadius: 6, border: "1px solid var(--border)" }}>
                                <div><strong>Snippets:</strong> {d.evidence?.length || 0} found</div>
                                {(d.evidence || []).map((ev, i) => (
                                  <div key={i} style={{ marginTop: 6, paddingLeft: 8, borderLeft: "2px solid #ccc", fontStyle: "italic", color: "var(--text2)" }}>
                                    "{ev.text}" — {ev.speaker}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Chatbot Column */}
          <div>
            <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 400, color: "var(--text)", letterSpacing: "-.01em", marginBottom: 12 }}>Meeting Assistant</div>
            <ScopedChatbot meeting={meeting} />
          </div>
        </div>
      </div>
    </div>
  );
}

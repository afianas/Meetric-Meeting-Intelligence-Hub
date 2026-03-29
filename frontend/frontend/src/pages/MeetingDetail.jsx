import { useState } from "react";
import ScopedChatbot from "../components/ScopedChatbot";
import { exportActionsCSV, exportDecisionsCSV } from "../utils/exportUtils";

export default function MeetingDetail({ meeting, onToggleAction, onRefresh }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [expandedDecId, setExpandedDecId] = useState(null);

  if (!meeting) return null;

  const meetDecs = meeting.decisions || [];
  const meetActions = meeting.actions || [];
  const segments = meeting.rawSegments || [];
  const doneCount = meetActions.filter(a => a.done).length;
  const pct = meetActions.length ? Math.round((doneCount/meetActions.length)*100) : 0;
  
  // Minimal Timeline
  const speakersMap = {};
  segments.forEach(seg => {
    const spk = seg.speaker || "Unknown";
    if (!speakersMap[spk]) speakersMap[spk] = [];
    speakersMap[spk].push(seg);
  });
  const totalSegs = segments.length || 1;
  const EMOTION_KEYS = ["agreement", "conflict", "concern", "uncertainty", "neutral"];
  const EMOTION_SEG_CLASS = {
    agreement:   "seg-pos",
    conflict:    "seg-conflict",
    concern:     "seg-enthus",
    uncertainty: "seg-neu",
    neutral:     "seg-neu",
  };

  return (
    <div className="content page" style={{display:"flex", flexDirection:"column", height:"100%", padding:"20px 28px"}}>
      <div className="detail-hero" style={{marginBottom: 20}}>
        <div className="detail-hero-top">
          <div className="detail-hero-dot" style={{background: '#14b8a6'}}/>
          <div className="detail-hero-name">{meeting.name}</div>
          <div className="detail-hero-proj">{meeting.date}</div>
        </div>
        <div className="detail-stats">
          {[
            {lbl:"Speakers",val:meeting.speakers?.length || 0,c:"var(--text)"},
            {lbl:"Sentiment",val:meeting.sentiment,c:meeting.sentiment === 'POSITIVE'?"#16a34a":meeting.sentiment === 'NEGATIVE'?"#dc2626":"#d97706"},
            {lbl:"Decisions",val:meetDecs.length,c:"var(--text)"},
            {lbl:"Action Items",val:meetActions.length,c:"var(--text)"}
          ].map(s => (
            <div key={s.lbl} className="ds">
              <div className="ds-v" style={{color:s.c}}>{s.val}</div>
              <div className="ds-l">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display:"flex", gap:16, marginBottom: 20, borderBottom:"1px solid var(--border)", paddingBottom:4}}>
        <div className={`tab-btn${activeTab==="summary"?" active":""}`} onClick={()=>setActiveTab("summary")}>Summary & Tables</div>
        <div className={`tab-btn${activeTab==="sentiment"?" active":""}`} onClick={()=>setActiveTab("sentiment")}>Sentiment Timeline</div>
      </div>

      <div style={{flex:1, minHeight:0, overflowY:"auto"}}>
        {activeTab === "summary" && (
          <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:24}}>
            <div style={{display:"flex", flexDirection:"column", gap:24}}>
              
              {/* Action Items Table */}
              <div className="card" style={{padding: 0, overflow:"hidden"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:16}}>Action Items ({doneCount}/{meetActions.length})</div>
                  <button className="tb-back" onClick={() => exportActionsCSV(meetActions)}>↓ Export CSV</button>
                </div>
                {meetActions.length > 0 && <div className="trk-prog" style={{margin:"0 20px 16px"}}><div className="trk-bar"><div className="trk-fill" style={{width:`${pct}%`}}/></div><div className="trk-lbl">{pct}%</div></div>}
                
                {meetActions.length === 0 ? (
                  <div style={{padding:"20px", textAlign:"center", fontSize:12, color:"var(--text3)", fontFamily:"var(--fm)"}}>No action items found.</div>
                ) : (
                  <table className="md-table">
                    <thead>
                      <tr><th style={{width:40}}>Status</th><th>What</th><th>Who</th><th>By When</th></tr>
                    </thead>
                    <tbody>
                      {meetActions.map(a => (
                        <tr key={a.id}>
                          <td style={{textAlign:"center"}}>
                            <input type="checkbox" checked={a.done} onChange={() => onToggleAction(a.meetingId, a.id, a.done)} style={{cursor:"pointer", transform:"scale(1.2)"}}/>
                          </td>
                          <td style={{fontWeight:500}}>{a.content}</td>
                          <td style={{fontFamily:"var(--fm)", fontSize:12}}>{a.who || "—"}</td>
                          <td style={{fontFamily:"var(--fm)", fontSize:12}}>{a.deadline || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Decisions Table */}
              <div className="card" style={{padding: 0, overflow:"hidden"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontFamily:"var(--fd)",fontSize:16}}>Traced Decisions ({meetDecs.length})</div>
                  <button className="tb-back" onClick={() => exportDecisionsCSV(meetDecs)}>↓ Export CSV</button>
                </div>
                
                {meetDecs.length === 0 ? (
                  <div style={{padding:"20px", textAlign:"center", fontSize:12, color:"var(--text3)", fontFamily:"var(--fm)"}}>No decisions recorded.</div>
                ) : (
                  <table className="md-table">
                    <thead><tr><th>Decision</th><th>Impact</th><th>Rationale & Evidence</th></tr></thead>
                    <tbody>
                      {meetDecs.map(d => {
                        const isExp = expandedDecId === d.id;
                        return (
                          <tr key={d.id}>
                            <td style={{fontWeight:500, minWidth:200}}>{d.title || d.content}</td>
                            <td style={{fontFamily:"var(--fm)", fontSize:12}}><span className="dec-impact-badge">{d.impact || "Medium"}</span></td>
                            <td style={{fontFamily:"var(--fm)", fontSize:12}}>
                              <div style={{cursor:"pointer", color:"#14b8a6", textDecoration:"underline"}} onClick={()=>setExpandedDecId(isExp?null:d.id)}>
                                {isExp ? "Hide" : "View Details"}
                              </div>
                              {isExp && (
                                <div style={{marginTop:8, padding:10, background:"var(--bg3)", borderRadius:6, border:"1px solid var(--border)"}}>
                                    <div style={{marginBottom:6}}><strong>AI Rationale:</strong> {d.rationale || "None provided"}</div>
                                    <div><strong>Snippets:</strong> {d.evidence?.length || 0} found</div>
                                    {(d.evidence||[]).map((ev, i) => (
                                      <div key={i} style={{marginTop:6, paddingLeft:8, borderLeft:"2px solid #ccc", fontStyle:"italic", color:"var(--text2)"}}>
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
              <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em",marginBottom:12}}>Meeting Assistant</div>
              <ScopedChatbot meeting={meeting}/>
            </div>
          </div>
        )}

        {activeTab === "sentiment" && (
          <div className="card" style={{padding:"24px"}}>
            <div style={{fontFamily:"var(--fd)", fontSize:18, marginBottom: 8}}>Sentiment & Tone Timeline</div>
            <div style={{fontSize:12, color:"var(--text3)", fontFamily:"var(--fm)", marginBottom: 24}}>
              Color-coded by AI-detected emotion across {segments.length} segments.
            </div>

            <div className="legend" style={{marginBottom: 20}}>
              {[
                { cls: "seg-pos",      lbl: "Agreement"   },
                { cls: "seg-conflict", lbl: "Conflict"     },
                { cls: "seg-enthus",   lbl: "Concern"      },
                { cls: "seg-neu",      lbl: "Neutral/Uncertainty" },
              ].map(l => (
                <div key={l.lbl} className="leg-item">
                  <div className={`leg-dot ${l.cls}`} />
                  {l.lbl}
                </div>
              ))}
            </div>

            <div>
              {Object.entries(speakersMap).map(([spk, segs]) => (
                <div key={spk} className="tl-row" style={{marginBottom: 16}}>
                  <div className="tl-spk">
                    <span style={{fontWeight:500}}>{spk}</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{segs.length} segments</span>
                  </div>
                  <div className="tl-bar" style={{height: 12}}>
                    {segs.map((s, si) => {
                      const emotion = (s.emotion || "neutral").toLowerCase();
                      const normEmo = EMOTION_KEYS.includes(emotion) ? emotion : "neutral";
                      const w = Math.max(1.5, (1 / totalSegs) * 100);
                      return (
                        <div
                          key={si}
                          className={`seg ${EMOTION_SEG_CLASS[normEmo]}`}
                          style={{ width: `${w}%` }}
                          title={`"${s.text}" — ${normEmo}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
              {Object.keys(speakersMap).length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--text3)" }}>
                  No segment data available for this meeting.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

const NO_ANSWER_SIGNAL = "not found in the transcripts";

function ConfidenceBadge({ score }) {
  const pct = Math.round(score * 100);
  const level = pct >= 70 ? "high" : pct >= 40 ? "med" : "low";
  const label = pct >= 70 ? "High" : pct >= 40 ? "Medium" : "Low";
  return (
    <span className={`conf-badge conf-${level}`}>
      {label} · {pct}%
    </span>
  );
}

function SourceGroup({ sources, meetings, openDetail }) {
  // Group by meeting_id
  const groups = {};
  sources.forEach(src => {
    const mid = src.meeting_id || "unknown";
    if (!groups[mid]) groups[mid] = [];
    groups[mid].push(src);
  });

  const getMeetingName = (mid) => {
    if (!mid || mid === "unknown") return "Global Context";
    const m = meetings.find(m => m.id === mid);
    return m ? m.name : "Meeting " + mid.slice(0, 8);
  };

  return (
    <div className="src-groups">
      {Object.entries(groups).map(([mid, segs]) => {
        const mtg = meetings.find(m => m.id === mid);
        return (
          <div key={mid} className="src-group">
            <div
              className={`src-group-hd${mtg ? " clickable" : ""}`}
              onClick={() => mtg && openDetail && openDetail(mtg)}
            >
              <span className="src-group-dot" />
              <span className="src-group-name">{getMeetingName(mid)}</span>
              {mtg && <span className="src-group-arrow">↗</span>}
            </div>
            {segs.map((src, i) => (
              <div key={i} className="src-item">
                <div className="src-item-meta">
                  <span className="src-speaker">{src.speaker || "Participant"}</span>
                  <span className={`src-emotion emo-${(src.emotion || "neutral").toLowerCase()}`}>
                    {src.emotion || "neutral"}
                  </span>
                </div>
                <div className="src-snippet">"{src.text || "Transcript segment not found in database."}"</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function Chatbot({ meetings = [], openDetail }) {
  const [messages, setMessages] = useState([{
    role: "ai",
    text: "Hello. I'm connected to the live intelligence backend. Ask me anything about your uploaded transcripts.",
    data: null,
  }]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  // Dynamic suggestions from real meeting names
  const [availableSuggestions, setAvailableSuggestions] = useState([]);
  
  useEffect(() => {
    const defaultSuggs = meetings.length > 0
      ? [
          "Who is handling the most action items?",
          "Summarize the main progress on key projects across all meetings.",
          "Identify any recurring blockers or risks mentioned in help transcripts.",
        ]
      : [
          "Who is handling the most action items?",
          "What are the overarching themes of the recent transcripts?",
          "Identify any recurring blockers or risks mentioned recently.",
        ];
    setAvailableSuggestions(defaultSuggs);
  }, [meetings]);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q || thinking) return;
    setInput("");
    
    // Remove from suggestions if it was one of them
    setAvailableSuggestions(prev => prev.filter(s => s.toLowerCase() !== q.toLowerCase()));
    
    setMessages(p => [...p, { role: "user", text: q, data: null }]);
    setThinking(true);

    try {
      const data = await apiClient.queryChat(q);
      const isNoAnswer = !data.answer || 
                         data.answer.toLowerCase().includes(NO_ANSWER_SIGNAL) || 
                         data.answer.toLowerCase().includes("no relevant information");
      setMessages(p => [...p, {
        role: "ai",
        text: isNoAnswer ? null : data.answer,
        data: {
          noAnswer: isNoAnswer,
          confidence: data.confidence,
          sources: data.sources || [],
          meetingsUsed: data.meetings_used || 0,
        },
      }]);
    } catch (err) {
      setMessages(p => [...p, { role: "ai", text: "⚠ Server error. Could not reach the intelligence backend.", data: null }]);
    } finally {
      setThinking(false);
    }
  };

  const toggleSources = (idx) => setExpandedSources(p => ({ ...p, [idx]: !p[idx] }));

  return (
    <div className="content page" style={{ padding: 14, height: "calc(100vh - 54px)" }}>
      <div className="chat-layout">
        <div className="chat-win">
          <div className="chat-hd">
            <div style={{ fontFamily: "var(--fd)", fontSize: 16, fontWeight: 400, flex: 1, color: "var(--text)", letterSpacing: "-.01em" }}>
              Cross-Meeting Query
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--fm)" }}>Live Vector Search</div>
          </div>
          <div className="chat-msgs">
            {messages.map((m, i) => {
              const isNoAnswer = m.data?.noAnswer;
              return (
                <div key={i} className={`msg ${m.role === "user" ? "u" : "ai"}`}>
                  <div className={`msg-av ${m.role === "user" ? "u" : "ai"}`}>{m.role === "ai" ? "AI" : "You"}</div>
                  <div style={{ maxWidth: "78%", minWidth: 0 }}>
                    {isNoAnswer ? (
                      <div className="no-answer-state">
                        <div className="no-answer-icon">🔍</div>
                        <div className="no-answer-title">No relevant information found</div>
                        <div className="no-answer-sub">
                          No segments in your uploaded meetings matched this query. Try rephrasing or upload more transcripts.
                        </div>
                      </div>
                    ) : (
                      <div className="msg-bub">
                        {m.data && (
                          <div className="msg-meta-row">
                            <ConfidenceBadge score={m.data.confidence} />
                            {m.data.meetingsUsed > 0 && (
                              <span className="msg-meetings-used">
                                Synthesized from {m.data.meetingsUsed} meeting{m.data.meetingsUsed !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ marginBottom: m.data?.sources?.length > 0 ? 10 : 0 }}>{m.text}</div>
                        {m.data?.sources?.length > 0 && (
                          <div className="src-footer">
                            <button
                              className="src-toggle-btn"
                              onClick={() => toggleSources(i)}
                            >
                              {expandedSources[i] ? "▲ Hide" : "▼ View"} {m.data.sources.length} source{m.data.sources.length !== 1 ? "s" : ""}
                            </button>
                            {expandedSources[i] && (
                              <SourceGroup
                                sources={m.data.sources}
                                meetings={meetings}
                                openDetail={openDetail}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {thinking && (
              <div className="msg ai">
                <div className="msg-av ai">AI</div>
                <div className="msg-bub">
                  <div className="typing"><div className="td" /><div className="td" /><div className="td" /></div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="chat-in-row">
            <textarea
              className="chat-in"
              placeholder="Ask anything across all transcripts…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
            />
            <button className="send-btn" onClick={() => send()} disabled={thinking || !input.trim()}>→</button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="card-hd" style={{ marginBottom: 10 }}>
              <div className="card-title">Suggested queries</div>
            </div>
            {availableSuggestions.map(s => (
              <div key={s} className="sug-chip" onClick={() => send(s)}>{s}</div>
            ))}
          </div>
          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="card-title" style={{ marginBottom: 10 }}>System Status</div>
            <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--fm)", marginBottom: 6 }}>
              {meetings.length} transcript{meetings.length !== 1 ? "s" : ""} indexed in vector store
            </div>
            <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--fm)", marginBottom: 6 }}>Backend FAISS store connected.</div>
            <div style={{ fontSize: 11, color: "var(--text2)", fontFamily: "var(--fm)" }}>Reranker active.</div>
          </div>
          <div className="card" style={{ padding: "14px 16px" }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Confidence Guide</div>
            {[["high", "High", "≥70%"], ["med", "Medium", "40–70%"], ["low", "Low", "<40%"]].map(([cls, lbl, rng]) => (
              <div key={cls} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span className={`conf-badge conf-${cls}`}>{lbl}</span>
                <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--fm)" }}>{rng} relevance</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

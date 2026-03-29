export default function Topbar({ page, isDetail, onBack, meetingName }) {
  const titles = {
    dashboard: "Command Center",
    upload: "Upload Transcripts",
    decisions: "Decision Traceability",
    tracker: "Action Tracker",
    chatbot: "Query Engine",
    sentiment: "Sentiment & Tone"
  };
  return (
    <div className="topbar">
      {isDetail && <div className="tb-back" onClick={onBack}>← Back</div>}
      <div className="tb-title">{isDetail ? meetingName : titles[page]}</div>
      <div className="tb-badge">v2.5</div>
      <div className="tb-rag"><div className="tb-rag-dot"/><span>RAG active</span></div>
    </div>
  );
}

import { useState } from "react";

export default function DecisionCard({ d }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`dec-card${open?" open":""}`}>
      <div className="dec-header" onClick={() => setOpen(o => !o)}>
        <span className="dec-badge">decision</span>
        <div className="dec-content">
          <div className="dec-text">{d.content}</div>
          <div className="dec-meta">{d.meeting} · {d.date}</div>
        </div>
        <span className="dec-chevron">{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div className="dec-trace"><div className="dec-trace-inner">
          <div className="dec-divider">RAG Evidence</div>
          <div className="dec-snippet">
            <div className="dec-who">
              <div className="dec-av">{d.initials}</div>
              <div><div className="dec-spk">{d.speaker}</div><div className="dec-ts">{d.timestamp} · {d.meeting}</div></div>
            </div>
            <div className="dec-quote">"…{d.quote.split(d.highlight).map((part,i,arr)=>(
              <span key={i}>{part}{i<arr.length-1&&<em>{d.highlight}</em>}</span>
            ))}…"</div>
            <div className="dec-ctx">{d.context}</div>
          </div>
          <div className="dec-reasons" style={{marginTop:8}}>
            <span style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--fm)",alignSelf:"center",textTransform:"uppercase",letterSpacing:".06em"}}>reasons:</span>
            {d.reasons.map(r => <span key={r} className="dec-reason">{r}</span>)}
          </div>
        </div></div>
      )}
    </div>
  );
}

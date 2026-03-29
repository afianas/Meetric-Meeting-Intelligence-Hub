import { useState, useRef, useEffect } from "react";
import { SCOPED_QA } from "../data/mockData";

export default function ScopedChatbot({ meeting }) {
  const qa = SCOPED_QA[meeting.name] || {};
  const suggestions = Object.keys(qa);
  const [messages, setMessages] = useState([{role:"ai", text:`Scoped exclusively to "${meeting.name}". I can only answer from this transcript.`, citation:null}]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, thinking]);

  const send = (text) => {
    const q = (text||input).trim(); if (!q||thinking) return;
    setInput("");
    setMessages(p => [...p, {role:"user", text:q, citation:null}]);
    setThinking(true);
    setTimeout(() => {
      const resp = qa[q] || {text:`No exact match in "${meeting.name}". Try one of the suggested questions.`, citation:{segment:"Full transcript searched",speakers:[],excerpt:null}};
      setMessages(p => [...p, {role:"ai", text:resp.text, citation:{...resp.citation, meeting:meeting.name}}]);
      setThinking(false);
    }, 800 + Math.random()*500);
  };

  return (
    <div className="scoped-chat">
      <div className="sc-hd">
        <div className="sc-hd-title">Meeting Q&A</div>
        <div className="sc-scope-badge"><div className="sc-scope-dot"/>Scoped: {meeting.name.split(" ").slice(0,3).join(" ")}…</div>
      </div>
      <div className="sc-msgs">
        {messages.map((m,i) => (
          <div key={i} className={`sc-msg ${m.role==="user"?"u":"ai"}`}>
            <div className={`sc-av ${m.role==="user"?"u":"ai"}`}>{m.role==="ai"?"AI":"You"}</div>
            <div style={{maxWidth:"85%"}}>
              <div className="sc-bub">
                {m.text}
                {m.citation?.segment && (
                  <div className="sc-cite">
                    <div className="sc-cite-hd"><span>📌</span><span className="sc-cite-mtg">{m.citation.meeting}</span></div>
                    <div className="sc-cite-body">
                      <div className="sc-cite-row"><span className="sc-cite-k">Segment</span><span className="sc-cite-v">{m.citation.segment}</span></div>
                      {m.citation.speakers?.length>0 && <div className="sc-cite-row"><span className="sc-cite-k">Speakers</span><span className="sc-cite-v">{m.citation.speakers.join(", ")}</span></div>}
                      {m.citation.excerpt && <div className="sc-cite-ex">{m.citation.excerpt}</div>}
                    </div>
                  </div>
                )}
              </div>
              {i===0 && suggestions.length>0 && (
                <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                  {suggestions.map(s => <div key={s} style={{fontSize:11,color:"#475569",cursor:"pointer",fontFamily:"var(--fm)",padding:"5px 10px",background:"#fff",borderRadius:6,border:"1px solid #e2e8f0",transition:"all 0.2s"}} onMouseOver={(e) => {e.target.style.background="#fafafa";e.target.style.borderColor="#000";e.target.style.color="#000";}} onMouseOut={(e) => {e.target.style.background="#fff";e.target.style.borderColor="#e2e8f0";e.target.style.color="#475569";}} onClick={() => send(s)}>↗ {s}</div>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && <div className="sc-msg ai"><div className="sc-av ai">AI</div><div className="sc-bub"><div className="sc-typing"><div className="sc-td"/><div className="sc-td"/><div className="sc-td"/></div></div></div>}
        <div ref={bottomRef}/>
      </div>
      <div className="sc-in-row">
        <textarea className="sc-in" placeholder={`Ask about "${meeting.name.split(" ").slice(0,2).join(" ")}"…`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1}/>
        <button className="sc-send" onClick={() => send()} disabled={thinking||!input.trim()}>→</button>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { GLOBAL_QA, MEETINGS } from "../data/mockData";

export default function Chatbot() {
  const [messages, setMessages] = useState([{role:"ai", text:"Hello. I've indexed all 5 meeting transcripts — 52,900 words. Every answer includes a cited source.", citation:null}]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, thinking]);
  const SUGGS = Object.keys(GLOBAL_QA);

  const send = (text) => {
    const q = (text||input).trim(); if (!q||thinking) return;
    setInput("");
    setMessages(p => [...p, {role:"user", text:q, citation:null}]);
    setThinking(true);
    setTimeout(() => {
      const resp = GLOBAL_QA[q] || {text:`I searched all 5 transcripts for "${q}". Try one of the suggested queries for a precise cited answer.`, citation:{meeting:"Cross-meeting",date:"All",segment:"RAG synthesis",speakers:[],excerpt:null}};
      setMessages(p => [...p, {role:"ai", text:resp.text, citation:resp.citation}]);
      setThinking(false);
    }, 900 + Math.random()*600);
  };

  return (
    <div className="content page" style={{padding:14,height:"calc(100vh - 54px)"}}>
      <div className="chat-layout">
        <div className="chat-win">
          <div className="chat-hd">
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400,flex:1,color:"var(--text)",letterSpacing:"-.01em"}}>Cross-Meeting Query</div>
            <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--fm)"}}>5 transcripts indexed</div>
          </div>
          <div className="chat-msgs">
            {messages.map((m,i) => (
              <div key={i} className={`msg ${m.role==="user"?"u":"ai"}`}>
                <div className={`msg-av ${m.role==="user"?"u":"ai"}`}>{m.role==="ai"?"AI":"You"}</div>
                <div style={{maxWidth:"78%"}}>
                  <div className="msg-bub">
                    {m.text}
                    {m.citation && (
                      <div className="citation">
                        <div className="cite-hd"><span>📌</span><span className="cite-mtg">{m.citation.meeting}</span></div>
                        <div className="cite-body">
                          {m.citation.date && <div className="cite-row"><span className="cite-k">Date</span><span className="cite-v">{m.citation.date}</span></div>}
                          <div className="cite-row"><span className="cite-k">Segment</span><span className="cite-v">{m.citation.segment}</span></div>
                          {m.citation.speakers?.length>0 && <div className="cite-row"><span className="cite-k">Speakers</span><span className="cite-v">{m.citation.speakers.join(", ")}</span></div>}
                          {m.citation.excerpt && <div className="cite-ex">{m.citation.excerpt}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {thinking && <div className="msg ai"><div className="msg-av ai">AI</div><div className="msg-bub"><div className="typing"><div className="td"/><div className="td"/><div className="td"/></div></div></div>}
            <div ref={bottomRef}/>
          </div>
          <div className="chat-in-row">
            <textarea className="chat-in" placeholder="Ask anything across all 5 transcripts…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} rows={1}/>
            <button className="send-btn" onClick={() => send()} disabled={thinking||!input.trim()}>→</button>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div className="card" style={{padding:"14px 16px"}}>
            <div className="card-hd" style={{marginBottom:10}}><div className="card-title">Suggested queries</div></div>
            {SUGGS.map(s => <div key={s} className="sug-chip" onClick={() => send(s)}>{s}</div>)}
          </div>
          <div className="card" style={{padding:"14px 16px"}}>
            <div className="card-title" style={{marginBottom:10}}>Scope</div>
            {MEETINGS.map(m => (
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:7,marginBottom:7}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:m.color,flexShrink:0}}/>
                <div style={{fontSize:11,color:"var(--text2)",fontFamily:"var(--fm)",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{m.name.split(" ").slice(0,3).join(" ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

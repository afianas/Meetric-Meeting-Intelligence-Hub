import { useState, useRef, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export default function ScopedChatbot({ meeting }) {
  const suggestions = ["Summarize the discussions", "What were the main blockers?", "What was decided regarding timelines?"];
  const [messages, setMessages] = useState([{role:"ai", text:`I can answer questions only about this meeting. How can I help?`, citation:null}]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef();
  useEffect(() => { 
    if (messages.length > 1 || thinking) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); 
    }
  }, [messages, thinking]);

  const send = async (text) => {
    const q = (text||input).trim(); if (!q||thinking) return;
    setInput("");
    setMessages(p => [...p, {role:"user", text:q, citation:null}]);
    setThinking(true);
    
    try {
        const data = await apiClient.queryChat(q, meeting.id);
        
        setMessages(p => [...p, {role:"ai", text:data.answer, citation:{
            sources: data.sources || [],
            meeting: meeting.name,
            confidence: data.confidence
        }}]);
    } catch(err) {
        setMessages(p => [...p, {role:"ai", text:"Server error.", citation:null}]);
    } finally {
        setThinking(false);
    }
  };

  return (
    <div className="scoped-chat">
      <div className="sc-hd">
        <div className="sc-hd-title">Meeting Q&A</div>
        <div className="sc-scope-badge"><div className="sc-scope-dot"/>🔒 Scoped to: {meeting.name}</div>
      </div>
      <div className="sc-msgs">
        {messages.map((m,i) => (
          <div key={i} className={`sc-msg ${m.role==="user"?"u":"ai"}`}>
            <div className={`sc-av ${m.role==="user"?"u":"ai"}`}>{m.role==="ai"?"AI":"You"}</div>
            <div style={{maxWidth:"85%"}}>
              <div className="sc-bub">
                {m.text}
                {m.citation?.sources && m.citation.sources.length > 0 && (
                  <div className="sc-cite" style={{marginTop: 14, borderTop:"1px dashed #e2e8f0", paddingTop:12}}>
                    <div className="sc-cite-hd" style={{marginBottom: 10}}>
                      <span style={{fontSize:9, color:"var(--text3)", textTransform:"uppercase", fontWeight:700, letterSpacing:"0.05em"}}>Verified Context Snippets</span>
                    </div>
                    <div className="sc-cite-sources" style={{display:"flex", flexDirection:"column", gap:8}}>
                      {m.citation.sources.map((s, si) => {
                        const snip = (s.text || "").trim();
                        return (
                          <div key={si} style={{padding:"10px 12px", background:"#fcfcfc", borderRadius:8, border:"1px solid #edf2f7", fontSize:11, boxShadow:"0 1px 2px rgba(0,0,0,0.02)"}}>
                            <div style={{fontWeight:600, color:"var(--text1)", marginBottom:4, display:"flex", justifyContent:"space-between"}}>
                              <span>{s.speaker}</span>
                              <span style={{fontSize:9, color:"var(--text3)", fontWeight:400}}>{s.role}</span>
                            </div>
                            <div style={{color:"var(--text2)", fontStyle: snip ? "italic" : "normal", lineHeight:1.5}}>
                              {snip ? `"${snip}"` : <span style={{color:"#94a3b8"}}>(Snippet content temporarily unavailable)</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{marginTop:12, fontSize:10, color:"var(--text3)", fontFamily:"var(--fm)", display:"flex", alignItems:"center", gap:6}}>
                       <div style={{width:6, height:6, borderRadius:"50%", background:"#10b981"}}/>
                       AI Confidence: {Math.max(1, Math.round((m.citation.confidence || 0) * 100))}%
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

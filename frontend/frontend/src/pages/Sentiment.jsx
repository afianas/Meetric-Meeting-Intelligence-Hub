import { useState } from "react";
import { TL_DATA, TIME_TICKS, SEG_TEXTS, SPEAKERS_SENT } from "../data/mockData";

export default function Sentiment() {
  const [sel, setSel] = useState(null);
  return (
    <div className="content page">
      <div className="legend">
        {[{cls:"seg-pos",lbl:"Positive"},{cls:"seg-neg",lbl:"Negative"},{cls:"seg-neu",lbl:"Neutral"},{cls:"seg-conflict",lbl:"Conflict"},{cls:"seg-enthus",lbl:"Enthusiasm"}].map(l => (
          <div key={l.lbl} className="leg-item"><div className={`leg-dot ${l.cls}`}/>{l.lbl}</div>
        ))}
      </div>
      <div className="sent-layout">
        <div>
          <div className="card" style={{marginBottom:14}}>
            <div className="card-hd"><div className="card-title">Speaker Timeline · API Launch · 60 min</div></div>
            {TL_DATA.map((row,i) => (
              <div key={i} className="tl-row">
                <div className="tl-spk"><span>{row.speaker}</span><span style={{fontSize:9,color:"var(--text3)"}}>{row.segs.length} segments</span></div>
                <div className="tl-bar">{row.segs.map((s,si) => <div key={si} className={`seg seg-${s.t}`} style={{width:`${s.w}%`}} onClick={() => setSel({speaker:row.speaker,type:s.t,time:`${si*10}:00 — ${(si+1)*10}:00`})}/>)}</div>
                <div className="tl-ticks">{TIME_TICKS.map(t => <div key={t} className="tl-tick">{t}</div>)}</div>
              </div>
            ))}
          </div>
          {sel ? (
            <div className="card">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div className="card-title">{sel.speaker} · {sel.time}</div>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:"var(--bg3)",color:"var(--text2)",fontFamily:"var(--fm)",textTransform:"capitalize",border:"1px solid var(--border)"}}>{sel.type}</span>
              </div>
              <div className="tp">{SEG_TEXTS[sel.type]}</div>
            </div>
          ) : (
            <div className="card" style={{textAlign:"center",padding:"28px"}}>
              <div style={{color:"var(--text3)",fontSize:12,fontFamily:"var(--fm)"}}>← click any segment to view excerpt</div>
            </div>
          )}
        </div>
        <div>
          <div style={{marginBottom:10,fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em"}}>Per-Speaker</div>
          {SPEAKERS_SENT.map(s => (
            <div key={s.name} className="spk-card">
              <div className="spk-top">
                <div>
                  <div className="spk-name">{s.name}</div>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--fm)",marginTop:2}}>{s.score>=60?"positive":s.score>=45?"mixed":"negative"}</div>
                </div>
                <div className="spk-ring" style={{background:s.ringBg,color:s.ring,border:`1px solid ${s.ring}40`}}>{s.score}%</div>
              </div>
              <div className="mbars">{s.bars.map((b,i) => <div key={i} className="mbar" style={{height:`${b*3}px`,background:b>=7?s.ring:b>=5?"#d1d5db":"#fca5a5"}}/>)}</div>
            </div>
          ))}
          <div className="card" style={{marginTop:10,padding:"13px 16px"}}>
            <div style={{fontSize:11,fontFamily:"var(--fd)",marginBottom:10,color:"var(--text)"}}>Meeting summary</div>
            {[{lbl:"Overall",val:"Mixed → Tense",c:"#dc2626"},{lbl:"Peak conflict",val:"23:40",c:"#dc2626"},{lbl:"Peak consensus",val:"41:00",c:"#16a34a"},{lbl:"Avg sentiment",val:"51%",c:"var(--text)"},{lbl:"Flagged",val:"3 conflict segs",c:"#dc2626"}].map(r => (
              <div key={r.lbl} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                <span style={{color:"var(--text3)",fontFamily:"var(--fm)",fontSize:11}}>{r.lbl}</span>
                <span style={{color:r.c,fontFamily:"var(--fm)",fontWeight:500,fontSize:11}}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

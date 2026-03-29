import { DECISIONS } from "../data/mockData";
import DecisionCard from "../components/DecisionCard";
import ActionCard from "../components/ActionCard";
import ScopedChatbot from "../components/ScopedChatbot";

export default function MeetingDetail({ meeting, actions, onToggleAction }) {
  const meetDecs = DECISIONS.filter(d => d.meeting===meeting.name);
  const meetActions = actions.filter(a => a.meeting===meeting.name);
  const doneCount = meetActions.filter(a => a.done).length;
  const pct = meetActions.length ? Math.round((doneCount/meetActions.length)*100) : 0;
  return (
    <div className="content page">
      <div className="detail-hero">
        <div className="detail-hero-top">
          <div className="detail-hero-dot" style={{background:meeting.color}}/>
          <div className="detail-hero-name">{meeting.name}</div>
          <div className="detail-hero-proj">{meeting.project} · {meeting.date}</div>
        </div>
        <div className="detail-stats">
          {[{lbl:"Speakers",val:meeting.speakers,c:"var(--text)"},{lbl:"Words",val:meeting.words.toLocaleString(),c:"var(--text)"},{lbl:"Sentiment",val:`${meeting.sentiment}%`,c:meeting.sentiment>=60?"#16a34a":meeting.sentiment>=45?"#d97706":"#dc2626"},{lbl:"Decisions",val:meetDecs.length,c:"var(--text)"}].map(s => (
            <div key={s.lbl} className="ds">
              <div className="ds-v" style={{color:s.c}}>{s.val}</div>
              <div className="ds-l">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="detail-cols">
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em"}}>Traced Decisions</div>
            <div style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"var(--bg3)",color:"var(--text2)",fontFamily:"var(--fm)",border:"1px solid var(--border)"}}>{meetDecs.length}</div>
          </div>
          {meetDecs.length===0
            ? <div style={{color:"var(--text3)",fontSize:12,fontFamily:"var(--fm)",padding:"20px",textAlign:"center",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)"}}>No traced decisions</div>
            : meetDecs.map(d => <DecisionCard key={d.id} d={d}/>)}
        </div>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em"}}>Action Items</div>
            <div style={{fontSize:10,padding:"2px 7px",borderRadius:20,background:"var(--bg3)",color:"var(--text2)",fontFamily:"var(--fm)",border:"1px solid var(--border)"}}>{doneCount}/{meetActions.length}</div>
          </div>
          {meetActions.length>0 && <div className="trk-prog"><div className="trk-bar"><div className="trk-fill" style={{width:`${pct}%`}}/></div><div className="trk-lbl">{pct}%</div></div>}
          {meetActions.length===0
            ? <div style={{color:"var(--text3)",fontSize:12,fontFamily:"var(--fm)",padding:"20px",textAlign:"center",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)"}}>No action items</div>
            : meetActions.map(a => <ActionCard key={a.id} a={a} onToggle={onToggleAction}/>)}
        </div>
        <div>
          <div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:400,color:"var(--text)",letterSpacing:"-.01em",marginBottom:12}}>Meeting Assistant</div>
          <ScopedChatbot meeting={meeting}/>
        </div>
      </div>
    </div>
  );
}

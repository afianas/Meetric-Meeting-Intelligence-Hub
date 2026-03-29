import { useState } from "react";
import { INIT_ACTIONS } from "../data/mockData";
import { exportActionsCSV } from "../utils/exportUtils";
import ActionCard from "../components/ActionCard";

export default function ActionTracker() {
  const [actions, setActions] = useState(INIT_ACTIONS);
  const [sf, setSf] = useState("all");
  const [of, setOf] = useState("all");
  const toggle = (id) => setActions(p => p.map(a => a.id===id?{...a,done:!a.done}:a));
  const owners = [...new Set(actions.map(a => a.who))];
  const filtered = actions.filter(a => {
    const ms = sf==="all"||(sf==="done"&&a.done)||(sf==="pending"&&!a.done)||(sf==="urgent"&&a.urgent&&!a.done);
    const mo = of==="all"||a.who===of;
    return ms&&mo;
  });
  const doneCount = actions.filter(a => a.done).length;
  const pct = Math.round((doneCount/actions.length)*100);
  return (
    <div className="content page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:13,color:"var(--text3)",marginBottom:12,fontFamily:"var(--fm)"}}>Mark items complete as tasks get done.</div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
            {["all","pending","urgent","done"].map(f => <div key={f} className={`tk-fc${sf===f?" active":""}`} onClick={() => setSf(f)}>{f==="all"?"All":f==="pending"?"Pending":f==="urgent"?"⚠ Urgent":"✓ Done"}</div>)}
            <select className="own-sel" value={of} onChange={e => setOf(e.target.value)}>
              <option value="all">All owners</option>
              {owners.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--fm)"}}>{doneCount} of {actions.length} complete</div>
          <div className="trk-prog"><div className="trk-bar" style={{width:130}}><div className="trk-fill" style={{width:`${pct}%`}}/></div><div className="trk-lbl">{pct}%</div></div>
          <button className="ex-btn" onClick={() => exportActionsCSV(actions)}>↓ Export CSV</button>
        </div>
      </div>
      {filtered.map(a => <ActionCard key={a.id} a={a} onToggle={toggle}/>)}
      <div style={{marginTop:16,padding:"14px 18px",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        {[{lbl:"Total",val:actions.length},{lbl:"Done",val:actions.filter(a=>a.done).length},{lbl:"Pending",val:actions.filter(a=>!a.done).length},{lbl:"Urgent",val:actions.filter(a=>a.urgent&&!a.done).length}].map(s => (
          <div key={s.lbl} style={{textAlign:"center"}}>
            <div style={{fontFamily:"var(--fd)",fontSize:26,fontWeight:400,color:"var(--text)",letterSpacing:"-.02em"}}>{s.val}</div>
            <div style={{fontSize:9,color:"var(--text3)",fontFamily:"var(--fm)",textTransform:"uppercase",letterSpacing:".07em"}}>{s.lbl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

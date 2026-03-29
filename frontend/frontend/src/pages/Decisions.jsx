import { useState } from "react";
import { DECISIONS } from "../data/mockData";
import DecisionCard from "../components/DecisionCard";

export default function Decisions() {
  const [filter, setFilter] = useState("all");
  const meetings = [...new Set(DECISIONS.map(d => d.meeting))];
  const filtered = filter==="all" ? DECISIONS : DECISIONS.filter(d => d.meeting===filter);
  return (
    <div className="content page">
      <div style={{marginBottom:18}}>
        <div style={{fontSize:13,color:"var(--text3)",marginBottom:12,fontFamily:"var(--fm)"}}>Click any decision to reveal the exact transcript snippet and reasoning.</div>
        <div className="fr">
          <div className={`fc${filter==="all"?" active":""}`} onClick={() => setFilter("all")}>All</div>
          {meetings.map(m => <div key={m} className={`fc${filter===m?" active":""}`} onClick={() => setFilter(m)}>{m.split(" ").slice(0,3).join(" ")}</div>)}
        </div>
      </div>
      {filtered.map(d => <DecisionCard key={d.id} d={d}/>)}
    </div>
  );
}

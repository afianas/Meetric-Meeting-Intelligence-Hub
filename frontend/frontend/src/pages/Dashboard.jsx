import { MEETINGS, INIT_ACTIONS } from "../data/mockData";

export default function Dashboard({ setPage, openDetail }) {
  return (
    <div className="content page">
      <div className="d-greet">Good morning. <em>Intelligence ready.</em></div>
      <div className="d-sub">5 transcripts indexed · last sync 2 min ago · 52,900 words</div>
      <div className="mg">
        {[
          {val:"5",    lbl:"Transcripts", d:"↑ 2 this week"},
          {val:String(INIT_ACTIONS.length), lbl:"Action Items",  d:"↑ 7 this session"},
          {val:String(INIT_ACTIONS.filter(a=>a.urgent&&!a.done).length), lbl:"Urgent", d:"⚠ attention needed"},
          {val:"59%",  lbl:"Avg Sentiment", d:"↓ 8pts vs last week"},
        ].map(m => (
          <div key={m.lbl} className="mc">
            <div className="mc-lbl">{m.lbl}</div>
            <div className="mc-val">{m.val}</div>
            <div className="mc-d">{m.d}</div>
            <div className="mc-bar"/>
          </div>
        ))}
      </div>
      <div className="g3">
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Recent Meetings</div>
            <div className="card-act" onClick={() => setPage("upload")}>+ upload →</div>
          </div>
          {MEETINGS.map(m => (
            <div key={m.id} className="mr" onClick={() => openDetail(m)}>
              <div className="mr-dot" style={{background:m.color}}/>
              <div className="mr-info">
                <div className="mr-name">{m.name}</div>
                <div className="mr-meta">{m.date} · {m.speakers} speakers · {m.words.toLocaleString()} words</div>
              </div>
              <div className={`mr-score ${m.sentiment>=60?"sp":m.sentiment>=45?"su":"sn"}`}>{m.sentiment}%</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-title">Activity</div></div>
          {[
            {icon:"↑", t:<><strong>API Launch Strategy</strong> transcript processed</>, time:"2 min ago"},
            {icon:"◈", t:<><strong>5 decisions</strong> traced with RAG evidence</>, time:"10 min ago"},
            {icon:"✓", t:<><strong>Action tracker</strong> — 2 items completed</>, time:"1 hr ago"},
            {icon:"◑", t:<><strong>Conflict detected</strong> Finance Sync 23:40</>, time:"3 hrs ago"},
            {icon:"◎", t:<><strong>Query</strong>: "Why delay the API launch?"</>, time:"4 hrs ago"},
          ].map((a,i) => (
            <div key={i} className="ai-item">
              <div className="ai-icon">{a.icon}</div>
              <div><div className="ai-text">{a.t}</div><div className="ai-time">{a.time}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

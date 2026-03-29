import { DECISIONS, INIT_ACTIONS } from "../data/mockData";

export default function Sidebar({ active, setActive, onHome }) {
  const nav = [
    {id:"dashboard", icon:"⬛", label:"Dashboard"},
    {id:"upload",    icon:"↑",  label:"Upload"},
    {id:"decisions", icon:"◈",  label:"Decisions"},
    {id:"tracker",   icon:"✓",  label:"Action Tracker"},
    {id:"chatbot",   icon:"◎",  label:"Query Engine"},
    {id:"sentiment", icon:"◑",  label:"Sentiment"},
  ];
  return (
    <div className="sb">
      <div className="sb-logo" onClick={onHome}>
        <div className="sb-logo-mark">meetric</div>
        <div className="sb-logo-dot"/>
      </div>
      <div className="sb-nav">
        <div className="nav-sec">Workspace</div>
        {nav.map(n => (
          <div key={n.id} className={`nav-item${active===n.id?" active":""}`} onClick={() => setActive(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
          </div>
        ))}
      </div>
      <div className="sb-footer">
        <div className="sf"><div className="sf-v">?</div><div className="sf-l">Meetings</div></div>
        <div className="sf"><div className="sf-v">?</div><div className="sf-l">Decisions</div></div>
        <div className="sf"><div className="sf-v">?</div><div className="sf-l">Actions</div></div>
      </div>
    </div>
  );
}

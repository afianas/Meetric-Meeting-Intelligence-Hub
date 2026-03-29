export default function ActionCard({ a, onToggle }) {
  return (
    <div className={`at-card${a.done?" done-c":""}`}>
      <div className={`at-check${a.done?" ticked":""}`} onClick={() => onToggle(a.id)}>
        {a.done && <span className="at-check-mark">✓</span>}
      </div>
      <div className="at-body">
        <div className="at-text">{a.content}</div>
        <div className="at-row2">
          <div className="at-who">{a.who}</div>
          {a.deadline && <div className={`at-dl${a.done?" dn":a.urgent?" urg":" ok"}`}>{a.done?"✓ ":a.urgent?"⚠ ":""}{a.deadline}</div>}
        </div>
      </div>
      <div className={`at-status${a.done?" done-s":a.urgent?" ovrd":" pend"}`}>{a.done?"Done":a.urgent?"Urgent":"Pending"}</div>
    </div>
  );
}

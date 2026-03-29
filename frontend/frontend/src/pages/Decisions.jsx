import { useState } from "react";
import DecisionCard from "../components/DecisionCard";

export default function Decisions({ meetings, isLoading }) {
  const [filter, setFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="content page" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading decisions...
      </div>
    );
  }

  // Flatten all decisions and tag them with their meeting name + date for display
  const allDecisions = meetings.flatMap(m =>
    (m.decisions || []).map(d => ({
      ...d,
      meetingName: m.name,
      date: m.date,
    }))
  );

  const meetingNames = [...new Set(allDecisions.map(d => d.meetingName))];
  const filtered = filter === "all" ? allDecisions : allDecisions.filter(d => d.meetingName === filter);

  const totalEvidence = allDecisions.reduce((acc, d) => acc + (d.evidence?.length || 0), 0);

  return (
    <div className="content page">
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--text3)", fontFamily: "var(--fm)" }}>
            Click any decision to reveal the exact transcript snippet and AI reasoning.
          </div>
          {totalEvidence > 0 && (
            <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--fm)", padding: "3px 9px", background: "var(--bg3)", borderRadius: 20, border: "1px solid var(--border)" }}>
              {totalEvidence} evidence snippet{totalEvidence !== 1 ? "s" : ""} linked
            </div>
          )}
        </div>
        <div className="fr">
          <div className={`fc${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>All</div>
          {meetingNames.map(m => (
            <div
              key={m}
              className={`fc${filter === m ? " active" : ""}`}
              onClick={() => setFilter(m)}
            >
              {m.split(" ").slice(0, 3).join(" ")}
            </div>
          ))}
        </div>
      </div>

      {allDecisions.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text3)", fontFamily: "var(--fm)" }}>
          No decisions recorded yet. Upload a transcript to get started.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text3)", fontFamily: "var(--fm)" }}>
          No decisions match your filter.
        </div>
      ) : (
        filtered.map(d => <DecisionCard key={d.id} d={d} />)
      )}
    </div>
  );
}

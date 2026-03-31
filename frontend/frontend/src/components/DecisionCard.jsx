import { useState } from "react";

const EMOTION_META = {
  agreement: { label: "Agreement", cls: "emo-agreement" },
  conflict: { label: "Conflict", cls: "emo-conflict" },
  concern: { label: "Concern", cls: "emo-concern" },
  uncertainty: { label: "Uncertainty", cls: "emo-uncertainty" },
  neutral: { label: "Neutral", cls: "emo-neutral" },
};

function EmotionBadge({ emotion }) {
  const key = (emotion || "neutral").toLowerCase();
  const meta = EMOTION_META[key] || EMOTION_META.neutral;
  return <span className={`ev-emotion ${meta.cls}`}>{meta.label}</span>;
}

export default function DecisionCard({ d }) {
  const [open, setOpen] = useState(false);
  const evidence = d.evidence || [];
  const hasEvidence = evidence.length > 0;

  return (
    <div className={`dec-card${open ? " open" : ""}`}>
      <div className="dec-header" onClick={() => setOpen(o => !o)}>
        <span className="dec-badge">decision</span>
        <div className="dec-content">
          <div className="dec-text">{d.title || d.content || "Unknown Decision"}</div>
          <div className="dec-meta">
            {d.meetingName && <span>{d.meetingName}</span>}
            {d.meetingName && d.date && <span> · </span>}
            {d.date && <span>{d.date}</span>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span className="dec-chevron">{open ? "▲" : "▼"}</span>
          <span className="dec-ev-hint">{hasEvidence ? `${evidence.length} snippet${evidence.length !== 1 ? "s" : ""}` : "no evidence"}</span>
        </div>
      </div>

      {open && (
        <div className="dec-trace">
          <div className="dec-trace-inner">
            <div className="dec-divider">
              {hasEvidence ? "Transcript Evidence" : "No Evidence Found"}
            </div>

            {!hasEvidence && (
              <div className="dec-no-evidence">
                No direct transcript snippet could be matched to this decision.
                This may be a high-level inference by the AI.
              </div>
            )}

            {evidence.map((ev, i) => (
              <div key={i} className="ev-item">
                <div className="ev-header">
                  <div className="dec-av">{(ev.speaker || "?").charAt(0).toUpperCase()}</div>
                  <div className="ev-speaker-info">
                    <span className="dec-spk">{ev.speaker || "Unknown Speaker"}</span>
                    {ev.role && <span className="ev-role">· {ev.role}</span>}
                  </div>
                  <EmotionBadge emotion={ev.emotion} />
                </div>
                <div className="ev-text">"{ev.text}"</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

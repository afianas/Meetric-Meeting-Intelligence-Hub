import { useState } from "react";

const EMOTION_KEYS = ["agreement", "conflict", "concern", "uncertainty", "neutral"];
const EMOTION_COLORS = {
  agreement:   "#16a34a",
  conflict:    "#dc2626",
  concern:     "#d97706",
  uncertainty: "#7c3aed",
  neutral:     "#94a3b8",
};
const EMOTION_SEG_CLASS = {
  agreement:   "seg-pos",
  conflict:    "seg-conflict",
  concern:     "seg-enthus",
  uncertainty: "seg-neu",
  neutral:     "seg-neu",
};

function SegmentTimeline({ segments, onSelect }) {
  const speakersMap = {};
  segments.forEach(seg => {
    const spk = seg.speaker || "Unknown";
    if (!speakersMap[spk]) speakersMap[spk] = [];
    speakersMap[spk].push(seg);
  });

  const totalSegs = segments.length || 1;

  return (
    <div>
      {Object.entries(speakersMap).map(([spk, segs]) => (
        <div key={spk} className="tl-row">
          <div className="tl-spk">
            <span>{spk}</span>
            <span style={{ fontSize: 9, color: "var(--text3)" }}>{segs.length} segments</span>
          </div>
          <div className="tl-bar">
            {segs.map((s, si) => {
              const emotion = (s.emotion || "neutral").toLowerCase();
              const normEmo = EMOTION_KEYS.includes(emotion) ? emotion : "neutral";
              const w = Math.max(1.5, (1 / totalSegs) * 100);
              return (
                <div
                  key={si}
                  className={`seg ${EMOTION_SEG_CLASS[normEmo]}`}
                  style={{ width: `${w}%`, cursor: "pointer" }}
                  title={`${spk} — ${normEmo}`}
                  onClick={() => onSelect({ speaker: spk, emotion: normEmo, text: s.text })}
                />
              );
            })}
          </div>
        </div>
      ))}
      {Object.keys(speakersMap).length === 0 && (
        <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--text3)" }}>
          No segment data available for this meeting.
        </div>
      )}
    </div>
  );
}

function SpeakerCard({ spk, maxContribs }) {
  const barW = maxContribs > 0 ? Math.round((spk.contributions / maxContribs) * 100) : 0;
  const posScore = spk.emotionPct?.agreement || 0;
  const conflictScore = spk.emotionPct?.conflict || 0;
  const ringScore = spk.emotionPct?.[spk.dominantEmotion] || 0;
  const ring = posScore >= 50 ? "#16a34a" : conflictScore >= 30 ? "#dc2626" : "#d97706";
  const ringBg = posScore >= 50 ? "rgba(22,163,74,0.1)" : conflictScore >= 30 ? "rgba(220,38,38,0.08)" : "rgba(217,119,6,0.08)";

  return (
    <div className="spk-card">
      <div className="spk-top">
        <div>
          <div className="spk-name">{spk.name}</div>
          <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--fm)", marginTop: 2 }}>
            {spk.contributions} segments · <span style={{ textTransform: "capitalize" }}>{spk.dominantEmotion}</span>
          </div>
        </div>
        <div className="spk-ring" style={{ background: ringBg, color: ring, border: `1px solid ${ring}40` }}>
          {ringScore}%
        </div>
      </div>
      {/* Contribution bar */}
      <div style={{ margin: "10px 0 8px", height: 3, background: "var(--bg3)", borderRadius: 4 }}>
        <div style={{ height: "100%", width: `${barW}%`, background: ring, borderRadius: 4, transition: "width .4s" }} />
      </div>
      {/* Emotion breakdown bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {EMOTION_KEYS.map(k => (
          <div key={k} className="emo-bar-row">
            <span className="emo-label">{k}</span>
            <div className="emo-bar-track">
              <div
                className="emo-bar-fill"
                style={{ width: `${spk.emotionPct?.[k] || 0}%`, background: EMOTION_COLORS[k] }}
              />
            </div>
            <span className="emo-pct">{spk.emotionPct?.[k] || 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Sentiment({ meetings = [], isLoading }) {
  const [selMeeting, setSelMeeting] = useState(0);
  const [selSeg, setSelSeg] = useState(null);

  if (isLoading) return (
    <div className="content page" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      Loading sentiment data...
    </div>
  );
  if (!meetings.length) return (
    <div className="content page" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      No meetings available. Upload a transcript to see sentiment analysis.
    </div>
  );

  const meeting = meetings[selMeeting] || meetings[0];
  const segments = meeting.rawSegments || [];
  const speakerStats = meeting.speakerStats || [];
  const emotionSummary = meeting.emotionSummary || {};
  const maxContribs = speakerStats.length ? Math.max(...speakerStats.map(s => s.contributions)) : 1;

  // Insights
  const mostActive = [...speakerStats].sort((a, b) => b.contributions - a.contributions)[0];
  const mostConflicted = [...speakerStats].sort((a, b) => (b.emotionPct?.conflict || 0) - (a.emotionPct?.conflict || 0))[0];
  const mostPositive = [...speakerStats].sort((a, b) => (b.emotionPct?.agreement || 0) - (a.emotionPct?.agreement || 0))[0];

  return (
    <div className="content page">
      {/* Meeting Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--fm)" }}>Meeting:</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {meetings.map((m, i) => (
            <div
              key={m.id}
              className={`fc${selMeeting === i ? " active" : ""}`}
              onClick={() => { setSelMeeting(i); setSelSeg(null); }}
            >
              {m.name.split(" ").slice(0, 3).join(" ")}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="legend" style={{ marginBottom: 14 }}>
        {[
          { cls: "seg-pos",      lbl: "Agreement"   },
          { cls: "seg-conflict", lbl: "Conflict"     },
          { cls: "seg-enthus",   lbl: "Concern"      },
          { cls: "seg-neu",      lbl: "Neutral/Uncertainty" },
        ].map(l => (
          <div key={l.lbl} className="leg-item">
            <div className={`leg-dot ${l.cls}`} />
            {l.lbl}
          </div>
        ))}
      </div>

      <div className="sent-layout">
        {/* Left column */}
        <div>
          {/* Emotion Summary Pills */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {EMOTION_KEYS.map(k => (
              <div key={k} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontFamily: "var(--fm)", background: `${EMOTION_COLORS[k]}18`, color: EMOTION_COLORS[k], border: `1px solid ${EMOTION_COLORS[k]}40` }}>
                {k}: {emotionSummary[k] || 0}%
              </div>
            ))}
          </div>

          {/* Speaker Timeline */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-hd">
              <div className="card-title">Speaker Timeline · {meeting.name}</div>
              <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--fm)" }}>{segments.length} segments</span>
            </div>
            <SegmentTimeline segments={segments} onSelect={setSelSeg} />
          </div>

          {/* Selected Segment Detail */}
          {selSeg ? (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <div className="card-title">{selSeg.speaker}</div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${EMOTION_COLORS[selSeg.emotion] || "#94a3b8"}18`, color: EMOTION_COLORS[selSeg.emotion] || "#94a3b8", fontFamily: "var(--fm)", textTransform: "capitalize", border: `1px solid ${EMOTION_COLORS[selSeg.emotion] || "#94a3b8"}40` }}>
                  {selSeg.emotion}
                </span>
              </div>
              <div className="tp">{selSeg.text || "No text available."}</div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: "center", padding: "28px" }}>
              <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--fm)" }}>← click any segment to view transcript excerpt</div>
            </div>
          )}

          {/* Insights */}
          {speakerStats.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Meeting Insights</div>
              {[
                { label: "Most Active",     value: mostActive?.name,     sub: `${mostActive?.contributions} segments` },
                { label: "Most Conflicted", value: mostConflicted?.name, sub: `${mostConflicted?.emotionPct?.conflict || 0}% conflict` },
                { label: "Most Agreeable",  value: mostPositive?.name,   sub: `${mostPositive?.emotionPct?.agreement || 0}% agreement` },
              ].map(ins => (
                <div key={ins.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                  <span style={{ color: "var(--text3)", fontFamily: "var(--fm)", fontSize: 11 }}>{ins.label}</span>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "var(--text)", fontFamily: "var(--fb)", fontWeight: 500, fontSize: 12 }}>{ins.value || "—"}</div>
                    <div style={{ color: "var(--text3)", fontFamily: "var(--fm)", fontSize: 10 }}>{ins.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column — Per-Speaker cards */}
        <div>
          <div style={{ marginBottom: 10, fontFamily: "var(--fd)", fontSize: 14, fontWeight: 400, color: "var(--text)", letterSpacing: "-.01em" }}>
            Per-Speaker Analysis
          </div>
          {speakerStats.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 12, fontFamily: "var(--fm)", padding: "20px", textAlign: "center", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)" }}>
              No speaker data for this meeting.
            </div>
          ) : (
            speakerStats.map(spk => (
              <SpeakerCard key={spk.name} spk={spk} maxContribs={maxContribs} />
            ))
          )}

          {/* Overall sentiment card */}
          <div className="card" style={{ marginTop: 10, padding: "13px 16px" }}>
            <div style={{ fontSize: 11, fontFamily: "var(--fd)", marginBottom: 10, color: "var(--text)" }}>Meeting summary</div>
            {[
              {
                lbl: "Overall Sentiment",
                val: meeting.sentiment,
                c: meeting.sentiment === "POSITIVE" ? "#16a34a" : meeting.sentiment === "NEGATIVE" ? "#dc2626" : "var(--text)"
              },
              { lbl: "Total Segments", val: segments.length, c: "var(--text)" },
              { lbl: "Speakers", val: speakerStats.length, c: "var(--text)" },
            ].map(r => (
              <div key={r.lbl} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                <span style={{ color: "var(--text3)", fontFamily: "var(--fm)", fontSize: 11 }}>{r.lbl}</span>
                <span style={{ color: r.c, fontFamily: "var(--fm)", fontWeight: 500, fontSize: 11 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

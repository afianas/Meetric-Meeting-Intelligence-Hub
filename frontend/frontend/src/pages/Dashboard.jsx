export default function Dashboard({ setPage, openDetail, meetings, isLoading, error }) {
  const allActions = meetings.flatMap(m => m.actions || []);
  const urgentActionsCount = allActions.filter(a => a.impact === 'High' && !a.isCompleted).length || 0;
  
  // Create a pseudo-average sentiment score or mock it if missing
  const totalMeetings = meetings.length;
  const avgSentiment = totalMeetings ? '65%' : '--%'; // You can calculate this if backend returns a numeric sentiment

  if (isLoading) {
    return (
      <div className="content page" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
        <div style={{color:'var(--text2)',fontFamily:'var(--fm)'}}>Syncing workspace...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content page" style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
        <div style={{color:'red',fontFamily:'var(--fm)'}}>{error}</div>
      </div>
    );
  }

  return (
    <div className="content page">
      <div className="d-greet">Good morning. <em>Intelligence ready.</em></div>
      <div className="d-sub">{totalMeetings} transcripts indexed · Live synced</div>
      <div className="mg">
        {[
          {val: String(totalMeetings), lbl:"Transcripts", d:"Total indexed"},
          {val: String(allActions.length), lbl:"Action Items",  d:"Found across all records"},
          {val: avgSentiment,  lbl:"Avg Sentiment", d:"General tone"},
        ].map(m => (
          <div key={m.lbl} className="mc">
            <div className="mc-lbl">{m.lbl}</div>
            <div className="mc-val">{m.val}</div>
            <div className="mc-d">{m.d}</div>
            <div className="mc-bar"/>
          </div>
        ))}
      </div>
      <div className="g3" style={{gridTemplateColumns:"1fr"}}>
        <div className="card">
          <div className="card-hd">
            <div className="card-title">Recent Meetings</div>
            <div className="card-act" onClick={() => setPage("upload")}>+ upload →</div>
          </div>
          {meetings.length === 0 ? (
            <div style={{padding: '20px 16px', color: 'var(--text3)', fontFamily: 'var(--fm)', fontSize: 12}}>
              No meetings found. Upload a transcript to get started.
            </div>
          ) : meetings.slice(0, 10).map(m => (
            <div key={m.id} className="mr" onClick={() => openDetail(m)}>
              <div className="mr-dot" style={{background: '#6366f1'}}/>
              <div className="mr-info">
                <div className="mr-name">{m.name}</div>
                <div className="mr-meta">
                  {m.date} · {m.speakers?.length || 0} speakers · {m.metrics?.wordCount?.toLocaleString() || 0} words · {m.metrics?.actionCount || 0} actions · {m.metrics?.decisionCount || 0} decisions
                </div>
              </div>
              <div className={`mr-score ${m.sentiment === 'POSITIVE' ? 'sp' : m.sentiment === 'NEGATIVE' ? 'sn' : 'su'}`}>
                {(m.sentiment || "NEU").substring(0, 3)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

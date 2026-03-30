import { useState, useRef } from "react";
import { apiClient } from "../utils/apiClient";

export default function Upload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleSelectFiles = (incomingFiles) => {
    const newFiles = Array.from(incomingFiles).map(f => {
      const isValid = f.name.endsWith(".txt") || f.name.endsWith(".vtt");
      // Strip extension for default name
      let defaultName = f.name;
      const lastDot = defaultName.lastIndexOf('.');
      if (lastDot !== -1) defaultName = defaultName.substring(0, lastDot);
      
      return {
        id: Math.random().toString(36).substring(7), // Unique ID for state mapping
        fileObj: f,
        name: f.name,
        resolvedName: defaultName,
        size: Math.max(1, Math.round(f.size/1024)),
        status: isValid ? "staged" : "error",
        progress: 0,
        errorMsg: isValid ? "" : "Unsupported format. Only .txt and .vtt are allowed."
      };
    });

    setFiles(p => [...p, ...newFiles]);
  };

  const startUpload = async (fileState) => {
    // Transition to processing
    setFiles(p => p.map(f => f.id === fileState.id ? { ...f, status: 'proc', progress: 0 } : f));
    
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 4 + 2;
        if (progress > 90) progress = 90;
        setFiles(p => p.map(f => f.id === fileState.id && f.status === 'proc' 
            ? { ...f, progress: Math.min(Math.round(progress), 90) } 
            : f
        ));
    }, 500);

    try {
        const data = await apiClient.uploadTranscript(fileState.fileObj, fileState.resolvedName.trim() || fileState.name);
        
        clearInterval(progressInterval);
        setFiles(p => p.map(f => f.id === fileState.id ? {
            ...f,
            status: "done",
            progress: 100,
            resolvedName: data.meeting_name || f.resolvedName,
            segmentsCount: data.segments_count || 0,
            decisionsCount: data.analysis?.decisions?.length || 0,
            actionsCount: data.analysis?.action_items?.length || 0,
            speakersCount: data.speakers_identified || 0,
            wordCount: data.word_count || 0,
            date: data.analysis?.date || "Today",
        } : f));

        if (onUploadSuccess) onUploadSuccess();

    } catch (error) {
        clearInterval(progressInterval);
        setFiles(p => p.map(f => f.id === fileState.id ? {
            ...f,
            status: "error",
            progress: 0,
            errorMsg: error.message
        } : f));
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm("This will permanently delete ALL meetings from the database. Continue?")) return;
    try {
      const result = await apiClient.deleteAllMeetings();
      alert(`Cleared: ${result.message}`);
      if (onUploadSuccess) onUploadSuccess(); // refresh dashboard
    } catch (err) {
      alert("Failed to clear database: " + err.message);
    }
  };

  return (
    <div className="content page">
      {/* Drop Zone */}
      <div
        className={`up-zone${drag ? " drag" : ""}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handleSelectFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current.click()}
        style={{marginTop: 0}}
      >
        <input ref={inputRef} type="file" multiple accept=".txt,.vtt" className="up-hidden"
          onChange={e => { handleSelectFiles(e.target.files); e.target.value = ""; }}
          onClick={e => e.stopPropagation()}
        />
        <div className="up-zone-icon">⬆</div>
        <div className="up-zone-title">Drop transcripts here</div>
        <div className="up-zone-sub">Drag & drop or click to browse · .txt and .vtt</div>
        <div className="up-formats">{[".txt", ".vtt", "WebVTT", "Plain text"].map(f => <div key={f} className="fmt-badge">{f}</div>)}</div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="pg-hdr">
            <div className="pg-name">Upload Queue</div>
            <div className="pg-cnt">— {files.length} file{files.length !== 1 ? "s" : ""}</div>
          </div>
          {files.map((f, i) => (
            <div key={i} className="fs-card">
              <div className="fs-top">
                <div className="fs-icon">{f.name.endsWith(".vtt") ? "📋" : "📄"}</div>
                <div className="fs-info">
                  <div className="fs-name">{f.resolvedName || f.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--fm)", marginTop: 2 }}>{f.name}</div>
                  {f.status === "proc" && <div className="prog-bar"><div className="prog-fill" style={{ width: `${f.progress}%` }} /></div>}
                  {f.status === "error" && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>⚠ {f.errorMsg}</div>}
                </div>
                <div className={`fs-stat st-${f.status}`}>
                  {f.status === "done" ? "✓ Indexed" : f.status === "proc" ? `${f.progress}%` : f.status === "error" ? "Error" : "Staged"}
                </div>
                <div className="fs-del" onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}>✕</div>
              </div>
              {f.status === "staged" && (
                <div style={{marginTop: 16, display: "flex", gap: 10, alignItems: "center"}}>
                  <input 
                    value={f.resolvedName} 
                    onChange={e => setFiles(p => p.map(x => x.id === f.id ? {...x, resolvedName: e.target.value} : x))}
                    placeholder="Enter Meeting Label..."
                    className="up-inp"
                    style={{flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 13, fontFamily: "var(--fm)"}}
                  />
                  <button onClick={() => startUpload(f)} style={{background: "#14b8a6", color: "#fff", border: "none", borderRadius: 6, padding: "9px 20px", fontSize: 13, fontFamily: "var(--fm)", cursor: "pointer", fontWeight: 600}}>
                    Upload & Process →
                  </button>
                </div>
              )}
              {f.status === "done" && (
                <div className="fs-summary">
                  {[
                    { lbl: "Meeting Date", val: f.date },
                    { lbl: "Speakers", val: f.speakersCount },
                    { lbl: "Word Count", val: f.wordCount.toLocaleString() },
                    { lbl: "Decisions", val: f.decisionsCount },
                    { lbl: "Action Items", val: f.actionsCount },
                  ].map((s, idx) => (
                    <div key={idx}>
                      <div className="fs-sum-lbl">{s.lbl}</div>
                      <div className="fs-sum-val">{s.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div style={{ marginTop: 32, padding: "14px 20px", background: "var(--surface)", borderRadius: 10, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: "var(--fb)", fontWeight: 500, color: "var(--text)", marginBottom: 3 }}>Clear All Meetings</div>
          <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--fm)" }}>Remove all existing meetings from the database.</div>
        </div>
        <button onClick={handleClearDB} style={{ background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "7px 14px", fontSize: 11, fontFamily: "var(--fm)", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
          Clear All Meetings
        </button>
      </div>
    </div>
  );
}



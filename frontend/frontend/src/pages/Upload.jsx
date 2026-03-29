import { useState, useRef } from "react";
import { apiClient } from "../utils/apiClient";

export default function Upload({ onUploadSuccess }) {
  const [files, setFiles] = useState([]);
  const [drag, setDrag] = useState(false);
  const [meetingName, setMeetingName] = useState("");
  const inputRef = useRef();

  const handleUpload = async (incomingFiles) => {
    const newFiles = Array.from(incomingFiles).map(f => {
      const isValid = f.name.endsWith(".txt") || f.name.endsWith(".vtt");
      return {
        fileObj: f,
        name: f.name,
        resolvedName: meetingName.trim() || f.name.rsplit?.(".", 1)[0] || f.name,
        size: Math.max(1, Math.round(f.size/1024)),
        status: isValid ? "proc" : "error",
        progress: 0,
        errorMsg: isValid ? "" : "Unsupported format. Only .txt and .vtt are allowed."
      };
    });

    setFiles(p => [...p, ...newFiles]);

    const validFiles = newFiles.filter(f => f.status === "proc");
    for (const fileObj of validFiles) {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 4 + 2;
            if (progress > 90) progress = 90;
            setFiles(p => p.map(f => f.name === fileObj.name && f.status === 'proc' 
                ? { ...f, progress: Math.min(Math.round(progress), 90) } 
                : f
            ));
        }, 500);

        try {
            const data = await apiClient.uploadTranscript(fileObj.fileObj, meetingName.trim());
            
            clearInterval(progressInterval);
            setFiles(p => p.map(f => f.name === fileObj.name ? {
                ...f,
                status: "done",
                progress: 100,
                resolvedName: data.meeting_name || fileObj.resolvedName,
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
            setFiles(p => p.map(f => f.name === fileObj.name ? {
                ...f,
                status: "error",
                progress: 0,
                errorMsg: error.message
            } : f));
        }
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm("This will permanently delete ALL meetings from the database. Continue?")) return;
    try {
        const result = await apiClient.deleteAllMeetings();
        alert(`Cleared: ${result.message}`);
        if (onUploadSuccess) onUploadSuccess(); // refresh dashboard
    } catch(err) {
        alert("Failed to clear database: " + err.message);
    }
  };

  return (
    <div className="content page">
      {/* Meeting Name Input */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:12,fontFamily:"var(--fm)",color:"var(--text3)",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>Meeting Label</div>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
          <input
            className="up-inp"
            style={{flex:1,minWidth:200}}
            placeholder="e.g. Q3 Product Sync, API Review, Budget Meeting…"
            value={meetingName}
            onChange={e => setMeetingName(e.target.value)}
          />
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--fm)",flexShrink:0}}>
            Applied to next upload · leave blank to auto-name
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`up-zone${drag?" drag":""}`}
        onDragOver={e => {e.preventDefault();setDrag(true);}}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {e.preventDefault();setDrag(false);handleUpload(e.dataTransfer.files);}}
        onClick={() => inputRef.current.click()}
      >
        <input ref={inputRef} type="file" multiple accept=".txt,.vtt" className="up-hidden"
          onChange={e => {handleUpload(e.target.files);e.target.value="";}}
          onClick={e => e.stopPropagation()}
        />
        <div className="up-zone-icon">⬆</div>
        <div className="up-zone-title">Drop transcripts here</div>
        <div className="up-zone-sub">Drag & drop or click to browse · .txt and .vtt</div>
        <div className="up-formats">{[".txt",".vtt","WebVTT","Plain text"].map(f => <div key={f} className="fmt-badge">{f}</div>)}</div>
      </div>

      {/* File Queue */}
      {files.length > 0 && (
        <div style={{marginTop:20}}>
          <div className="pg-hdr">
            <div className="pg-name">Upload Queue</div>
            <div className="pg-cnt">— {files.length} file{files.length!==1?"s":""}</div>
          </div>
          {files.map((f,i) => (
            <div key={i} className="fs-card">
              <div className="fs-top">
                <div className="fs-icon">{f.name.endsWith(".vtt")?"📋":"📄"}</div>
                <div className="fs-info">
                  <div className="fs-name">{f.resolvedName || f.name}</div>
                  <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--fm)",marginTop:2}}>{f.name}</div>
                  {f.status==="proc" && <div className="prog-bar"><div className="prog-fill" style={{width:`${f.progress}%`}}/></div>}
                  {f.status==="error" && <div style={{color:'#dc2626',fontSize:11,marginTop:4}}>⚠ {f.errorMsg}</div>}
                </div>
                <div className={`fs-stat st-${f.status}`}>
                  {f.status==="done" ? "✓ Indexed" : f.status==="proc" ? `${f.progress}%` : "Error"}
                </div>
                <div className="fs-del" onClick={() => setFiles(p => p.filter(x => x!==f))}>✕</div>
              </div>
              {f.status==="done" && (
                <div className="fs-summary">
                  {[
                    {lbl:"Meeting Date", val: f.date},
                    {lbl:"Speakers",     val: f.speakersCount},
                    {lbl:"Word Count",   val: f.wordCount.toLocaleString()},
                    {lbl:"Decisions",    val: f.decisionsCount},
                    {lbl:"Action Items", val: f.actionsCount},
                  ].map((s, idx) => (
                    <div key={idx}>
                      <div className="fs-sum-lbl">{s.lbl}</div>
                      <div className="fs-sum-val" style={{fontSize: s.lbl === "Meeting Name" ? 11 : 13, fontFamily: s.lbl === "Meeting Name" ? "var(--fm)" : "var(--fd)"}}>{s.val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Danger Zone */}
      <div style={{marginTop:32,padding:"14px 20px",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:12,fontFamily:"var(--fd)",color:"var(--text)",marginBottom:3}}>Clear All Meetings</div>
          <div style={{fontSize:11,color:"var(--text3)",fontFamily:"var(--fm)"}}>Remove all existing meetings from the database. Use this to reset stale or untitled records.</div>
        </div>
        <button onClick={handleClearDB} style={{background:"#dc2626",color:"#fff",border:"none",borderRadius:6,padding:"8px 16px",fontSize:11,fontFamily:"var(--fm)",cursor:"pointer",whiteSpace:"nowrap"}}>
          🗑 Clear All Meetings
        </button>
      </div>
    </div>
  );
}



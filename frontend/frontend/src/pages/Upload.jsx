import { useState, useRef } from "react";
import { DEMO_FILES } from "../data/mockData";
import { exportFileCSV } from "../utils/exportUtils";

export default function Upload() {
  const [files, setFiles] = useState(DEMO_FILES);
  const [drag, setDrag] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDate, setProjDate] = useState("");
  const inputRef = useRef();
  const cRef = useRef(files.length);
  const groups = {};
  files.forEach(f => { if (!groups[f.project]) groups[f.project]=[]; groups[f.project].push(f); });

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => f.name.endsWith(".txt")||f.name.endsWith(".vtt"));
    if (!valid.length) return;
    const proj = projName.trim()||"Unassigned";
    const date = projDate||new Date().toISOString().slice(0,10);
    const start = cRef.current; cRef.current += valid.length;
    const added = valid.map(f => ({name:f.name,size:Math.max(1,Math.round(f.size/1024)),status:"proc",progress:0,project:proj,date,speakers:0,words:0}));
    setFiles(p => [...p, ...added]);
    added.forEach((_,i) => {
      const fi = start+i; let prog = 0;
      const iv = setInterval(() => {
        prog += Math.random()*18+8;
        if (prog>=100) { clearInterval(iv); setFiles(p => p.map((f,idx) => idx===fi?{...f,status:"done",progress:100,speakers:Math.floor(Math.random()*4)+2,words:Math.floor(Math.random()*8000)+3000}:f)); }
        else setFiles(p => p.map((f,idx) => idx===fi?{...f,progress:Math.round(prog)}:f));
      }, 200);
    });
  };

  return (
    <div className="content page">
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:12,fontFamily:"var(--fd)",fontSize:14,marginBottom:12,color:"var(--text)"}}>Group Settings</div>
        <div className="up-meta-row">
          <div className="up-meta-grp"><div className="up-lbl">Project Name</div><input className="up-inp" placeholder="e.g. Product Team, Q3 Finance…" value={projName} onChange={e => setProjName(e.target.value)}/></div>
          <div className="up-meta-grp" style={{maxWidth:190}}><div className="up-lbl">Meeting Date</div><input className="up-inp" type="date" value={projDate} onChange={e => setProjDate(e.target.value)}/></div>
        </div>
      </div>
      <div className={`up-zone${drag?" drag":""}`} onDragOver={e => {e.preventDefault();setDrag(true);}} onDragLeave={() => setDrag(false)} onDrop={e => {e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}} onClick={() => inputRef.current.click()}>
        <input ref={inputRef} type="file" multiple accept=".txt,.vtt" className="up-hidden" onChange={e => {addFiles(e.target.files);e.target.value="";}} onClick={e => e.stopPropagation()}/>
        <div className="up-zone-icon">⬆</div>
        <div className="up-zone-title">Drop transcripts here</div>
        <div className="up-zone-sub">Drag & drop or click to browse · .txt and .vtt</div>
        <div className="up-formats">{[".txt",".vtt","WebVTT","Plain text"].map(f => <div key={f} className="fmt-badge">{f}</div>)}</div>
      </div>
      {files.length>0 && (
        <div style={{marginTop:20}}>
          {Object.entries(groups).map(([proj, pfiles]) => (
            <div key={proj}>
              <div className="pg-hdr"><div className="pg-name">{proj}</div><div className="pg-cnt">— {pfiles.length} file{pfiles.length!==1?"s":""}</div></div>
              {pfiles.map((f,i) => (
                <div key={i} className="fs-card">
                  <div className="fs-top">
                    <div className="fs-icon">{f.name.endsWith(".vtt")?"📋":"📄"}</div>
                    <div className="fs-info">
                      <div className="fs-name">{f.name}</div>
                      <div className="fs-proj">{f.project}{f.date?` · ${f.date}`:""}</div>
                      {f.status==="proc" && <div className="prog-bar"><div className="prog-fill" style={{width:`${f.progress}%`}}/></div>}
                    </div>
                    <div className={`fs-stat st-${f.status}`}>{f.status==="done"?"✓ Indexed":f.status==="proc"?`${f.progress}%`:"Error"}</div>
                    <div className="fs-del" onClick={() => setFiles(p => p.filter(x => x!==f))}>✕</div>
                  </div>
                  {f.status==="done" && (
                    <>
                      <div className="fs-summary">
                        {[{lbl:"File",val:f.name},{lbl:"Date",val:f.date},{lbl:"Speakers",val:f.speakers},{lbl:"Words",val:f.words.toLocaleString()}].map(s => (
                          <div key={s.lbl}><div className="fs-sum-lbl">{s.lbl}</div><div className="fs-sum-val" style={{fontSize:s.lbl==="File"?11:13,fontFamily:s.lbl==="File"?"var(--fm)":"var(--fd)"}}>{s.val}</div></div>
                        ))}
                      </div>
                      <div className="fs-acts">
                        <button className="fs-btn" onClick={() => exportFileCSV(f)}>↓ CSV</button>
                        <div style={{flex:1}}/>
                        <div style={{fontSize:10,color:"var(--text3)",fontFamily:"var(--fm)",alignSelf:"center"}}>{f.size} KB</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

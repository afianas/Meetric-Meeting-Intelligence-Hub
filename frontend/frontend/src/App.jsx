import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://127.0.0.1:8000/upload", formData);
      setData(res.data.analysis);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h1>Meeting Intelligence Hub</h1>

      {/* Upload */}
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>

      {/* Decisions */}
      {data && (
        <>
          <h2>Decisions</h2>
          <ul>
            {data.decisions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>

          {/* Action Items */}
          <h2>Action Items</h2>
          {data.action_items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <input type="checkbox" />
              <strong>{item.who}</strong> — {item.task}
              <br />
              <small>Deadline: {item.deadline || "N/A"}</small>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;
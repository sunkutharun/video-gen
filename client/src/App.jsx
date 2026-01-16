import { useState } from "react";
import axios from "axios";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

 const generate = async () => {
  try {
    setStatus("Starting...");
    setVideoUrl("");
    setJobId(null);

    const res = await axios.post("http://localhost:5000/api/video/generate", { prompt });
    setJobId(res.data.jobId);
    setStatus("Processing...");
  } catch (e) {
    console.log("GENERATE ERROR:", e.response?.data || e.message);
    setStatus("Error: " + (e.response?.data?.error || e.message));
    alert(JSON.stringify(e.response?.data || e.message, null, 2));
  }
};


  const checkStatus = async () => {
    if (!jobId) return;
    const res = await axios.get(`http://localhost:5000/api/video/status/${jobId}`);

    setStatus(res.data.status);

    if (res.data.status === "succeeded") {
      setVideoUrl(res.data.outputUrl);
    }
    if (res.data.status === "failed") {
      setStatus("failed: " + (res.data.error || "unknown error"));
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h2>Text → Video Generator</h2>

      <textarea
        rows={4}
        style={{ width: "100%" }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the video you want..."
      />

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button onClick={generate} disabled={!prompt.trim()}>
          Generate
        </button>
        <button onClick={checkStatus} disabled={!jobId}>
          Check Status
        </button>
      </div>

      <p style={{ marginTop: 10 }}>Status: {status}</p>

      {videoUrl && (
        <div>
          <video src={videoUrl} controls style={{ width: "100%", marginTop: 12 }} />
          <a href={videoUrl} download>
            Download video
          </a>
        </div>
      )}
    </div>
  );
}

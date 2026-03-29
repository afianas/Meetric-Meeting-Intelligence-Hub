import { useState, useEffect, useCallback } from "react";
import { apiClient } from "./utils/apiClient";
import { mapMeetingsList } from "./utils/dataMapper";

// Components
import Landing from "./components/Landing";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Pages
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Decisions from "./pages/Decisions";
import ActionTracker from "./pages/ActionTracker";
import Chatbot from "./pages/Chatbot";
import Sentiment from "./pages/Sentiment";
import MeetingDetail from "./pages/MeetingDetail";

export default function App() {
  const [view, setView] = useState("landing"); // "landing" | "app"
  const [page, setPage] = useState("dashboard");
  const [detail, setDetail] = useState(null);

  // Global State for APIs
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rawData = await apiClient.getMeetings();
      setMeetings(mapMeetingsList(rawData));
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the backend server. Please ensure the FastAPI server is running.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch immediately on mount, and whenever view opens "app"
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Derived state to pass down action items (extracts from all meetings)
  const allActions = meetings.flatMap(m => m.actions || []);

  const toggleAction = async (meetingId, taskId, currentDone) => {
    try {
        await apiClient.updateTaskStatus(meetingId, taskId, !currentDone);
        fetchMeetings(); // Refresh globally as source of truth
    } catch(err) {
        console.error("Failed to update task", err);
        alert("Failed to update task. Is the backend running?");
    }
  };

  const openDetail = (m) => setDetail(m);
  const closeDetail = () => setDetail(null);
  const navTo = (p) => { setDetail(null); setPage(p); };

  if (view === "landing") {
    return <Landing onEnter={() => setView("app")}/>;
  }

  const renderContent = () => {
    if (detail) return <MeetingDetail meeting={detail} onToggleAction={toggleAction} onRefresh={fetchMeetings} />;
    switch(page) {
      case "dashboard": return <Dashboard setPage={navTo} openDetail={openDetail} meetings={meetings} isLoading={isLoading} error={error} />;
      case "upload":    return <Upload onUploadSuccess={fetchMeetings} />;
      case "decisions": return <Decisions meetings={meetings} isLoading={isLoading} />;
      case "tracker":   return <ActionTracker actions={allActions} onToggleAction={toggleAction} isLoading={isLoading} />;
      case "chatbot":   return <Chatbot />;
      case "sentiment": return <Sentiment meetings={meetings} isLoading={isLoading} />;
      default:          return <Dashboard setPage={navTo} openDetail={openDetail} meetings={meetings} isLoading={isLoading} error={error} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar active={page} setActive={navTo} onHome={() => setView("landing")}/>
      <div className="main">
        <Topbar page={page} isDetail={!!detail} onBack={closeDetail} meetingName={detail?.name}/>
        {renderContent()}
      </div>
    </div>
  );
}
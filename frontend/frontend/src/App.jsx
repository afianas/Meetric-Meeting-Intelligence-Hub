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
  const [selectedMeetingId, setSelectedMeetingId] = useState(null);

  // Global State for APIs
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMeetings = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const rawData = await apiClient.getMeetings();
      setMeetings(mapMeetingsList(rawData));
    } catch (err) {
      console.error(err);
      setError("Failed to connect to the backend server. Please ensure the FastAPI server is running.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Fetch immediately on mount, and whenever view opens "app"
  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  // Derived state to pass down action items (extracts from all meetings)
  const allActions = meetings.flatMap(m => m.actions || []);
  const allDecisions = meetings.flatMap(m => m.decisions || []);

  const toggleAction = async (meetingId, taskId, currentDone) => {
    // Optimistic UI update for instant feedback
    setMeetings(prev => prev.map(m => m.id === meetingId ? {
      ...m,
      actions: (m.actions || []).map(a => a.id === taskId ? { ...a, done: !currentDone } : a)
    } : m));

    try {
        await apiClient.updateTaskStatus(meetingId, taskId, !currentDone);
        fetchMeetings(false); // Background refresh without spinner
    } catch(err) {
        console.error("Failed to update task", err);
        alert("Failed to update task. Is the backend running?");
        fetchMeetings(false); // Revert optimistic update on failure
    }
  };

  const openDetail = (m) => setSelectedMeetingId(m.id);
  const closeDetail = () => setSelectedMeetingId(null);
  const navTo = (p) => { setSelectedMeetingId(null); setPage(p); };

  if (view === "landing") {
    return <Landing onEnter={() => setView("app")}/>;
  }

  const renderContent = () => {
    const activeMeeting = selectedMeetingId ? meetings.find(m => m.id === selectedMeetingId) : null;

    if (activeMeeting) return <MeetingDetail meeting={activeMeeting} onToggleAction={toggleAction} onRefresh={fetchMeetings} onClose={closeDetail} />;
    
    switch(page) {
      case "dashboard": return <Dashboard setPage={navTo} openDetail={openDetail} meetings={meetings} isLoading={isLoading} error={error} onRefresh={fetchMeetings} />;
      case "upload":    return <Upload onUploadSuccess={fetchMeetings} />;
      case "decisions": return <Decisions meetings={meetings} isLoading={isLoading} />;
      case "tracker":   return <ActionTracker actions={allActions} onToggleAction={toggleAction} isLoading={isLoading} />;
      case "chatbot":   return <Chatbot meetings={meetings} openDetail={openDetail} />;
      case "sentiment": return <Sentiment meetings={meetings} isLoading={isLoading} />;
      default:          return <Dashboard setPage={navTo} openDetail={openDetail} meetings={meetings} isLoading={isLoading} error={error} onRefresh={fetchMeetings} />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar 
        active={page} 
        setActive={navTo} 
        onHome={() => setView("landing")}
        stats={{ meetings: meetings.length, decisions: allDecisions.length, actions: allActions.length }}
      />
      <div className="main">
        <Topbar page={page} isDetail={!!selectedMeetingId} onBack={closeDetail} meetingName={meetings.find(m => m.id === selectedMeetingId)?.name}/>
        {renderContent()}
      </div>
    </div>
  );
}
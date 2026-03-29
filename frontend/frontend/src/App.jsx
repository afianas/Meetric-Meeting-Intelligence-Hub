import { useState } from "react";
import { INIT_ACTIONS } from "./data/mockData";

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
  const [actions, setActions] = useState(INIT_ACTIONS);

  const toggleAction = (id) => setActions(p => p.map(a => a.id===id?{...a,done:!a.done}:a));
  const openDetail = (m) => setDetail(m);
  const closeDetail = () => setDetail(null);
  const navTo = (p) => { setDetail(null); setPage(p); };

  if (view === "landing") {
    return <Landing onEnter={() => setView("app")}/>;
  }

  const renderContent = () => {
    if (detail) return <MeetingDetail meeting={detail} actions={actions} onToggleAction={toggleAction}/>;
    switch(page) {
      case "dashboard": return <Dashboard setPage={navTo} openDetail={openDetail}/>;
      case "upload":    return <Upload/>;
      case "decisions": return <Decisions/>;
      case "tracker":   return <ActionTracker/>;
      case "chatbot":   return <Chatbot/>;
      case "sentiment": return <Sentiment/>;
      default:          return <Dashboard setPage={navTo} openDetail={openDetail}/>;
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
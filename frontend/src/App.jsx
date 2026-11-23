import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import PersonalisedLearning from "./pages/PersonalisedLearning.jsx";
import AcademicPerformance from "./pages/AcademicPerformance.jsx";
import PlacementEligibility from "./pages/PlacementEligibility.jsx";
import MentorDashboard from "./pages/MentorDashboard.jsx";
import HODDashboard from "./pages/HODDashboard.jsx";
import SmartCampus from "./pages/SmartCampus.jsx";
import UnifiedLogin from "./pages/UnifiedLogin.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/personalised-learning" element={<PersonalisedLearning />} />
            <Route path="/academic-performance" element={<AcademicPerformance />} />
            <Route path="/placement" element={<PlacementEligibility />} />
            <Route path="/login" element={<UnifiedLogin />} />
            <Route path="/mentor-login" element={<UnifiedLogin />} />
            <Route path="/hod-login" element={<UnifiedLogin />} />
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/hod" element={<HODDashboard />} />
            <Route path="/smart-campus" element={<SmartCampus />} />
          </Routes>
        </main>
        <footer className="border-t bg-white py-6 text-center text-xs text-slate-500">
          CampusPulse — Unified Personalised Learning & Academic Performance Workspace.
        </footer>
      </div>
    </AuthProvider>
  );
}

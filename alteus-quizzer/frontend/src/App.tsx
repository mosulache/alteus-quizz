import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { MobileLayout } from "./layouts/MobileLayout";
import { TVLayout } from "./layouts/TVLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Join } from "./pages/participant/Join";
import { Lobby } from "./pages/participant/Lobby";
import { Game } from "./pages/participant/Game";
import { HostLobby } from "./pages/presenter/HostLobby";
import { HostGame } from "./pages/presenter/HostGame";
import { HostResults } from "./pages/presenter/HostResults";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { QuizEditor } from "./pages/admin/QuizEditor";
import { Settings } from "./pages/admin/Settings";

// Landing Component
const Landing = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6 p-4">
    <h1 className="text-4xl font-bold text-slate-900 mb-8">Alteus Quizzer Dev Portal</h1>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      <Link to="/join" className="group block p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200 text-center">
        <div className="text-4xl mb-4">📱</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary">Participant</h2>
        <p className="text-slate-500">Join a quiz session from your phone.</p>
      </Link>
      <Link to="/host" className="group block p-8 bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-800 text-center">
        <div className="text-4xl mb-4">📺</div>
        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400">Host (TV)</h2>
        <p className="text-slate-400">Display the quiz on the big screen.</p>
      </Link>
      <Link to="/admin" className="group block p-8 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-slate-200 text-center">
        <div className="text-4xl mb-4">⚡</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-primary">Admin</h2>
        <p className="text-slate-500">Create and manage quizzes.</p>
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Participant Routes */}
        <Route element={<MobileLayout />}>
          <Route path="/join" element={<Join />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game" element={<Game />} />
          <Route path="/feedback" element={<div>Feedback Redirect Logic handled in Game</div>} />
        </Route>

        {/* Presenter Routes */}
        <Route path="/host" element={<TVLayout />}>
            <Route index element={<HostLobby />} />
            <Route path="game" element={<HostGame />} />
            <Route path="results" element={<HostResults />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="create" element={<QuizEditor />} />
            <Route path="settings" element={<Settings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;

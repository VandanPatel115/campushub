import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Notices from './pages/Notices';
import StudyHub from './pages/StudyHub';
import Timetable from './pages/Timetable';
import Events from './pages/Events';
import Clubs from './pages/Clubs';
import Discussions from './pages/Discussions';
import DiscussionDetail from './pages/DiscussionDetail';
import Profile from './pages/Profile';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
          <Route path="/notices" element={<PrivateRoute><AppLayout><Notices /></AppLayout></PrivateRoute>} />
          <Route path="/study-hub" element={<PrivateRoute><AppLayout><StudyHub /></AppLayout></PrivateRoute>} />
          <Route path="/timetable" element={<PrivateRoute><AppLayout><Timetable /></AppLayout></PrivateRoute>} />
          <Route path="/events" element={<PrivateRoute><AppLayout><Events /></AppLayout></PrivateRoute>} />
          <Route path="/clubs" element={<PrivateRoute><AppLayout><Clubs /></AppLayout></PrivateRoute>} />
          <Route path="/discussions" element={<PrivateRoute><AppLayout><Discussions /></AppLayout></PrivateRoute>} />
          <Route path="/discussions/:id" element={<PrivateRoute><AppLayout><DiscussionDetail /></AppLayout></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><AppLayout><Profile /></AppLayout></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import AppShell from "./layouts/AppShell";
import MarketingLayout from "./layouts/MarketingLayout";
import RequireAuth from "./layouts/RequireAuth";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import StudentHome from "./pages/student/Home";
import DailyYogaPage from "./pages/student/DailyYoga";
import ExplorePage from "./pages/student/Explore";
import ClassDetailsPage from "./pages/student/ClassDetails";
import PlayPage from "./pages/student/Play";
import SchedulePage from "./pages/student/Schedule";
import HistoryPage from "./pages/student/History";
import ProfilePage from "./pages/student/Profile";
import InstructorDashboard from "./pages/instructor/Dashboard";
import CreateClassPage from "./pages/instructor/CreateClass";
import ClassWorkspace from "./pages/instructor/ClassWorkspace";
import MediaPage from "./pages/instructor/MediaPage";
import ScriptPage from "./pages/instructor/ScriptPage";
import PreviewPage from "./pages/instructor/PreviewPage";
import AdminPage from "./pages/admin/Admin";

function GuestOnly({ children }) {
  const { isAuthenticated, homePath } = useAuth();
  if (isAuthenticated) return <Navigate to={homePath()} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<HomePage />} />
      </Route>
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="dashboard" element={<StudentHome />} />
          <Route path="daily-yoga" element={<DailyYogaPage />} />
          <Route path="classes" element={<ExplorePage />} />
          <Route path="classes/:id" element={<ClassDetailsPage />} />
          <Route path="classes/:id/play" element={<PlayPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route element={<RequireAuth roles={["instructor", "admin"]} />}>
            <Route path="instructor/dashboard" element={<InstructorDashboard />} />
            <Route path="instructor/classes/create" element={<CreateClassPage />} />
            <Route path="instructor/classes/:id" element={<ClassWorkspace />} />
            <Route path="instructor/classes/:id/media" element={<MediaPage />} />
            <Route path="instructor/classes/:id/script" element={<ScriptPage />} />
            <Route path="instructor/classes/:id/preview" element={<PreviewPage />} />
          </Route>
          <Route element={<RequireAuth roles={["admin"]} />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

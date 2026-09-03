import { Navigate, Route, Routes } from "react-router";

import ProtectedRoute from "./auth/ProtectedRoute";
import ManagementLayout from "./layouts/ManagementLayout";

import LoginPage from "./pages/Loginpage";
import OverviewPage from "./pages/Overviewpage";
import TasksPage from "./pages/Taskspage";
import ScenariosPage from "./pages/Scenariopage";
import ScenarioBuilderPage from "./pages/ScenarioBuilderPage";
import MembersPage from "./pages/Memberspage";
import ReportsPage from "./pages/Reportspage";
import SettingsPage from "./pages/Settingspage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ManagementLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />

          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/scenarios/:scenarioId" element={<ScenarioBuilderPage/>}/>
          <Route path="/members" element={<MembersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
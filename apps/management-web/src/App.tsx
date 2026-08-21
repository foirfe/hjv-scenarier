import { Navigate, Route, Routes } from "react-router";

import ManagementLayout from "./layouts/ManagementLayout";

import OverviewPage from "./pages/Overviewpage";
import TasksPage from "./pages/Taskspage";
import ScenariosPage from "./pages/Scenariopage";
import MembersPage from "./pages/Memberspage";
import ReportsPage from "./pages/Reportspage";
import SettingsPage from "./pages/Settingspage";

export default function App(){
  return(
    <Routes>
        <Route element={<ManagementLayout/>}>
          <Route index element={<Navigate to="/overview" replace />} />

          <Route path="/overview" element={<OverviewPage/>} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/scenarios" element={<ScenariosPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          </Route>
    </Routes>
  )
}

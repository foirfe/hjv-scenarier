import { Navigate, Route, Routes } from "react-router";

import ProtectedRoute from "./auth/ProtectedRoute";
import ManagementLayout from "./layouts/ManagementLayout";

import LoginPage from "./pages/Loginpage";
import OverviewPage from "./pages/Overviewpage";
import TasksPage from "./pages/Taskspage";
import ScenariosPage from "./pages/Scenariopage";
import ScenarioBuilderPage from "./pages/ScenarioBuilderpage";
import UsersPage from "./pages/Userspage";
import RunsPage from "./pages/Runspage";
import RunSetupPage from "./pages/RunSetuppage";


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
          <Route path="/scenarios/:scenarioId" element={<ScenarioBuilderPage />} />
          <Route path="/runs" element={<RunsPage />} />
          <Route path="/runs/:runId" element={<RunSetupPage/>}/>
          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
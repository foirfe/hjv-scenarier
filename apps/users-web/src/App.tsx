import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import ProtectedRoute from "./auth/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RunsPage from "./pages/RunsPage";
import RunPage from "./pages/RunPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />}/>

      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/runs" replace/>}/>
        <Route path="/runs" element={<RunsPage />}/>
        <Route path="/runs/:runId" element={<RunPage />}/>
      </Route>

      <Route path="*" element={<Navigate to="/runs" replace/>} />
    </Routes>
  );
}

export default App;
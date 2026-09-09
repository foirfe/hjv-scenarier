import { Navigate, Route, Routes } from "react-router"
import ProtectedRoute from "./auth/ProtectedRoute"
import LoginPage from "./pages/Loginpage"


function App() {

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/overview" replace />} />
        </Route>
    </Routes>
  )
}

export default App

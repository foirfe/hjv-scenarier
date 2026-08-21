import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";

export default function ManagementLayout() {
  return (
    <div className="management-layout">
      <Sidebar />

      <main className="management-content">
        <Outlet />
      </main>
    </div>
  );
}
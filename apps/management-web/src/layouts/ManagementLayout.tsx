import { Outlet } from "react-router";
import Sidebar from "../components/Sidebar";
import styles from "./ManagementLayout.module.css"

export default function ManagementLayout() {
  return (
    <div className={styles.managementLayout}>
      <Sidebar />

      <main className={styles.managementContent}>
        <Outlet />
      </main>
    </div>
  );
}
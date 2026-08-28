import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import styles from "./Siderbar.module.css";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}>
        <strong>HJEMMEVÆRNET</strong>
        <span>ØVELSESSYSTEM</span>
      </div>

      <nav className={styles.sidebarNav}>
        <NavLink to="/overview" className={getNavLinkClass}>
          Oversigt
        </NavLink>
        <NavLink to="/tasks" className={getNavLinkClass}>
          Opgaver
        </NavLink>
        <NavLink to="/scenarios" className={getNavLinkClass}>
          Scenarier
        </NavLink>
        <NavLink to="/members" className={getNavLinkClass}>
          Deltagere
        </NavLink>
        <NavLink to="/reports" className={getNavLinkClass}>
          Rapporter
        </NavLink>
        <NavLink to="/settings" className={getNavLinkClass}>
          Indstillinger
        </NavLink>
      </nav>

      <div className={styles.sidebarUser}>
        <span className={styles.userName}>{user?.displayName}</span>

        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          Log ud
        </button>
      </div>
    </aside>
  );
}
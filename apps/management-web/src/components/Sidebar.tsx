import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
  
    function handleLogout() {
    logout();
    navigate("/login");
  }


  return (
  <aside className="sidebar">
      <div className="sidebar-logo">
        <strong>HJEMMEVÆRNET</strong>
        <span>ØVELSESSYSTEM</span>
      </div>

      <nav>
        <NavLink to="/overview">Oversigt</NavLink>
        <NavLink to="/tasks">Opgaver</NavLink>
        <NavLink to="/scenarios">Scenarier</NavLink>
        <NavLink to="/members">Deltagere</NavLink>
        <NavLink to="/reports">Rapporter</NavLink>
        <NavLink to="/settings">Indstillinger</NavLink>
      </nav>

      <div className="sidebar-user">
        <span>{user?.displayName}</span>

        <button type="button" onClick={handleLogout}>
          Log ud
        </button>
      </div>
    </aside>
  );
}
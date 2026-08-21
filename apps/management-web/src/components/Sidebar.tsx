import { NavLink } from "react-router";

export default function Sidebar() {
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
    </aside>
  );
}
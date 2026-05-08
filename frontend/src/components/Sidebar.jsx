import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "~" },
  { to: "/habits", label: "Habits", icon: "#" },
  { to: "/tasks", label: "Tasks", icon: "[" },
  { to: "/photos", label: "Photos", icon: "*" },
  { to: "/videos", label: "Videos", icon: ">" },
  { to: "/books", label: "Books", icon: "B" },
  { to: "/documents", label: "Documents", icon: "D" },
  { to: "/knowledge", label: "Knowledge", icon: "K" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <h1 className="sidebar-title">MyWorld</h1>
      <ul className="sidebar-nav">
        {links.map(({ to, label, icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

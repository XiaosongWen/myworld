import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="main-container">
        <header className="app-header">
          <div className="search-bar">
            <span style={{ fontSize: "16px" }}>🔍</span>
            <input type="text" placeholder="Search commitments, logs, or type a command... (Cmd+K)" />
          </div>
          <div className="header-actions">
            <button className="icon-btn" style={{ fontSize: "18px" }}>🔔</button>
            <div className="user-profile">
              <img src="https://avatars.githubusercontent.com/u/6759395?v=4" alt="User" />
            </div>
          </div>
        </header>
        {children}
      </main>
    </>
  );
}

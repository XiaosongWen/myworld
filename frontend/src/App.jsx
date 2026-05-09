import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./views/Dashboard";
import Habits from "./views/Habits";
import Tasks from "./views/Tasks";
import Photos from "./views/Photos";
import Videos from "./views/Videos";
import Books from "./views/Books";
import Documents from "./views/Documents";
import Knowledge from "./views/Knowledge";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/habits" element={<Habits />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/books" element={<Books />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/knowledge" element={<Knowledge />} />
      </Routes>
    </Layout>
  );
}

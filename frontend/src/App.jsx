import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import DailyLog from "./views/DailyLog";
import Commitments from "./views/Commitments";
import Photos from "./views/Photos";
import Videos from "./views/Videos";
import Books from "./views/Books";
import Documents from "./views/Documents";
import Knowledge from "./views/Knowledge";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DailyLog />} />
        <Route path="/commitments" element={<Commitments />} />
        <Route path="/commitments/:tab" element={<Commitments />} />
        <Route path="/photos" element={<Photos />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/books" element={<Books />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/knowledge" element={<Knowledge />} />
      </Routes>
    </Layout>
  );
}

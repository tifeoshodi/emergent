import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Components from "./Components";
import PMFusionApp from "./components/PMFusionApp";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Home Page Component
const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const statsResponse = await axios.get(`${API}/stats`);
      setStats(statsResponse.data);

      const activityResponse = await axios.get(`${API}/activity`);
      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error("Error fetching home data:", error);
    }
  };

  return (
    <div className="home-container">
      <h1>Welcome to Emergent</h1>
      <p>Your central hub for project management and document control</p>

      {stats && (
        <div className="stats-container">
          <div className="stat-box">
            <h3>Projects</h3>
            <p className="stat-number">{stats.projects}</p>
          </div>
          <div className="stat-box">
            <h3>Documents</h3>
            <p className="stat-number">{stats.documents}</p>
          </div>
          <div className="stat-box">
            <h3>Users</h3>
            <p className="stat-number">{stats.users}</p>
          </div>
        </div>
      )}

      <h2>Recent Activity</h2>
      <div className="activity-list">
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <div key={index} className="activity-item">
              <p>
                <strong>{activity.user}</strong> {activity.action}{" "}
                <span className="activity-time">{activity.time}</span>
              </p>
            </div>
          ))
        ) : (
          <p>No recent activity</p>
        )}
      </div>
    </div>
  );
};

// Document Management Component
const DocumentManagement = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="documents-container">
      <h1>Document Management</h1>
      {loading ? (
        <p>Loading documents...</p>
      ) : (
        <div className="document-list">
          {documents.length > 0 ? (
            documents.map((doc) => (
              <div key={doc.id} className="document-item">
                <h3>{doc.filename}</h3>
                <p>Type: {doc.document_type}</p>
                <p>Uploaded: {new Date(doc.upload_time).toLocaleString()}</p>
                <a href={`${API}/documents/${doc.id}`} target="_blank" rel="noreferrer">
                  Download
                </a>
              </div>
            ))
          ) : (
            <p>No documents found</p>
          )}
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <h1>Emergent</h1>
          <nav>
            <ul className="nav-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/documents">Documents</Link>
              </li>
              <li>
                <Link to="/components">Components</Link>
              </li>
              <li>
                <Link to="/pmfusion">PMFusion</Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className="App-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/documents" element={<DocumentManagement />} />
            <Route path="/components" element={<Components />} />
            <Route path="/pmfusion" element={<PMFusionApp />} />
          </Routes>
        </main>

        <footer className="App-footer">
          <p>&copy; 2025 Emergent. All rights reserved.</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

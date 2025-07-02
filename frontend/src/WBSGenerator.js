import React, { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const WBSGenerator = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API}/projects`);
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject(res.data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch projects', e);
      }
    };
    fetchProjects();
  }, []);

  const generateWBS = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setMessage(null);
    setError(null);
    try {
      await axios.post(`${API}/projects/${selectedProject}/wbs`);
      setMessage('WBS successfully generated');
    } catch (err) {
      setError('Failed to generate WBS');
      console.error('Generate WBS error', err);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Generate Project WBS</h1>
      <form onSubmit={generateWBS} className="space-y-4">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="w-full border-gray-300 rounded-md"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
        >
          Generate WBS
        </button>
      </form>
      {message && <p className="text-green-600 mt-4">{message}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default WBSGenerator;

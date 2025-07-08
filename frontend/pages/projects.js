import { useEffect, useState } from 'react';
import pmfusionAPI from '../src/lib/api';

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    pmfusionAPI.getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Projects</h1>
      {projects.length === 0 ? (
        <p>No Projects Found</p>
      ) : (
        <ul className="list-disc pl-5">
          {projects.map(p => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectsPage;

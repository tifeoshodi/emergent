import React from 'react';
import KanbanBoard from './KanbanBoard';

const KanbanView = ({
  selectedProject,
  selectedDiscipline,
  projects,
  disciplines,
  setSelectedProject,
  setSelectedDiscipline,
  currentUser
}) => {
  if (!selectedProject || !selectedDiscipline) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Select a project and discipline to view the kanban board</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Project and Discipline Selector */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
          <select
            value={selectedProject?.id || ''}
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value);
              setSelectedProject(project);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
          <select
            value={selectedDiscipline?.id || ''}
            onChange={(e) => {
              const discipline = disciplines.find(d => d.id === e.target.value);
              setSelectedDiscipline(discipline);
            }}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            {disciplines.map(discipline => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.name} ({discipline.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        disciplineId={selectedDiscipline.id}
        projectId={selectedProject.id}
        currentUser={currentUser}
      />
    </div>
  );
};

export default KanbanView;

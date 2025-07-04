import React from 'react';

const DashboardView = ({ projects, disciplines }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Total Projects</h3>
        <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Active Disciplines</h3>
        <p className="text-3xl font-bold text-green-600">{disciplines.length}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
        <p className="text-3xl font-bold text-purple-600">Demo</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Workflow Phase</h3>
        <p className="text-lg font-bold text-purple-600">Three-Phase</p>
      </div>
    </div>

    {/* Three-Phase Workflow Overview */}
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Three-Phase Project Management Workflow</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-lg">
          <h4 className="text-lg font-semibold text-blue-600 mb-2">Phase 1: Project Creation</h4>
          <p className="text-sm text-gray-600 mb-3">
            Scheduler role creates projects using CTR/MDR documents with WBS generation and CPM analysis.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• 4-step project wizard</li>
            <li>• Document intake (Manual/OCR)</li>
            <li>• WBS generation</li>
            <li>• Dashboard configuration</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="text-lg font-semibold text-green-600 mb-2">Phase 2: Teams Execution</h4>
          <p className="text-sm text-gray-600 mb-3">
            Discipline-based kanban boards with task assignment and status tracking through review stages.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Kanban task boards</li>
            <li>• Team lead assignment</li>
            <li>• DIC → IDC → DCC workflow</li>
            <li>• Real-time collaboration</li>
          </ul>
        </div>

        <div className="p-4 border rounded-lg">
          <h4 className="text-lg font-semibold text-purple-600 mb-2">Phase 3: Document Control</h4>
          <p className="text-sm text-gray-600 mb-3">
            DCC officers manage client communication, approvals, and document lifecycle.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Document review queues</li>
            <li>• Client approval workflow</li>
            <li>• Version control</li>
            <li>• Compliance tracking</li>
          </ul>
        </div>
      </div>
    </div>

    {/* Recent Projects */}
    {projects.length > 0 && (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Active Projects</h3>
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project.id} className="flex justify-between items-center p-3 border rounded">
              <div>
                <h4 className="font-medium text-gray-900">{project.name}</h4>
                <p className="text-sm text-gray-600">{project.code || 'No code'}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                project.status === 'active' ? 'bg-green-100 text-green-800' :
                project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {project.status || 'Unknown'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default DashboardView;

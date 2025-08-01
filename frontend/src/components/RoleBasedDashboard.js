import React from 'react';
import SchedulerDashboard from './dashboards/SchedulerDashboard';
import TeamLeaderDashboard from './dashboards/TeamLeaderDashboard';
import EngineerDashboard from './dashboards/EngineerDashboard';
import ProjectManagerDashboard from './dashboards/ProjectManagerDashboard';

const RoleBasedDashboard = ({ user, onLogout }) => {
  const renderDashboard = () => {
    switch (user.role) {
      case 'scheduler':
        return <SchedulerDashboard user={user} onLogout={onLogout} />;
      case 'engineering_manager':
        return <TeamLeaderDashboard user={user} onLogout={onLogout} />;
      case 'senior_engineer_1':
      case 'senior_engineer_2':
      case 'intermediate_engineer':
      case 'junior_engineer':
        return <EngineerDashboard user={user} onLogout={onLogout} />;
      case 'project_manager':
      case 'contractor':
        return <ProjectManagerDashboard user={user} onLogout={onLogout} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-4">Your role ({user.role}) does not have access to this system.</p>
              <button 
                onClick={onLogout}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Return to Login
              </button>
            </div>
          </div>
        );
    }
  };

  return renderDashboard();
};

export default RoleBasedDashboard;
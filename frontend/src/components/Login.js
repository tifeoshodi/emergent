import React, { useEffect, useState } from 'react';
import pmfusionAPI from '../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from './ui';

const Login = ({ onLogin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [loginMode, setLoginMode] = useState('select'); // 'select' or 'credentials'

  useEffect(() => {
    let isMounted = true;
    pmfusionAPI
      .request('/users')
      .then((data) => {
        if (isMounted) setUsers(data);
      })
      .catch(() => {
        if (isMounted) setError('Failed to load users');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = () => {
    if (selectedUser) {
      onLogin(selectedUser);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'scheduler': 'Scheduler',
      'engineering_manager': 'Senior Engineer (Team Leader)',
      'senior_engineer_1': 'Senior Engineer',
      'senior_engineer_2': 'Senior Engineer',
      'intermediate_engineer': 'Engineer',
      'junior_engineer': 'Junior Engineer',
      'project_manager': 'Project Manager',
      'contractor': 'Contractor'
    };
    return roleMap[role] || role.replace('_', ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 px-4">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">PMFusion</h2>
          <p className="mt-2 text-sm text-gray-600">Project Management & Document Control System</p>
        </div>

        {/* Login Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl text-center">Access Your Workspace</CardTitle>
            <p className="text-sm text-gray-500 text-center">Select your role to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Selection */}
            <div className="space-y-3">
              <Label htmlFor="user-select" className="text-sm font-medium text-gray-700">
                Select User Account
              </Label>
              <select 
                id="user-select"
                value={selectedUser} 
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose your account...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {getRoleDisplayName(user.role)} ({user.discipline || 'General'})
                  </option>
                ))}
              </select>
            </div>

            {/* Role Description */}
            {selectedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm">
                  {(() => {
                    const user = users.find(u => u.id === selectedUser);
                    const role = user?.role;
                    if (role === 'scheduler') {
                      return (
                        <div>
                          <p className="font-medium text-blue-800">Scheduler Access</p>
                          <p className="text-blue-600">Upload MDR files, generate WBS, sync activities to disciplines</p>
                        </div>
                      );
                    } else if (role === 'engineering_manager') {
                      return (
                        <div>
                          <p className="font-medium text-blue-800">Team Leader Access</p>
                          <p className="text-blue-600">Manage discipline dashboard, assign tasks to team members</p>
                        </div>
                      );
                    } else if (['senior_engineer_1', 'senior_engineer_2', 'intermediate_engineer', 'junior_engineer'].includes(role)) {
                      return (
                        <div>
                          <p className="font-medium text-blue-800">Engineer Access</p>
                          <p className="text-blue-600">View assigned tasks, manage deliverables, collaborate with team</p>
                        </div>
                      );
                    } else {
                      return (
                        <div>
                          <p className="font-medium text-blue-800">Standard Access</p>
                          <p className="text-blue-600">Project management and oversight capabilities</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Login Button */}
            <Button 
              onClick={handleLogin} 
              disabled={!selectedUser}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Access Workspace
            </Button>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Secure access to project management and document control workflows
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

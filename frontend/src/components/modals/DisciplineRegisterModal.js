import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';
import useClickOutside from '../../hooks/useClickOutside';

const DisciplineRegisterModal = ({ project, onClose, currentUser }) => {
  const [disciplines, setDisciplines] = useState([]);
  const [projectDisciplines, setProjectDisciplines] = useState([]);
  const [mdrEntries, setMdrEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  
  // Add click outside functionality
  const modalRef = useClickOutside(onClose);

  const defaultDisciplines = [
    { name: 'Project Management', enabled: false, taskCount: 0 },
    { name: 'Process', enabled: false, taskCount: 0 },
    { name: 'Piping', enabled: false, taskCount: 0 },
    { name: 'Instrumentation', enabled: false, taskCount: 0 },
    { name: 'Electrical', enabled: false, taskCount: 0 },
    { name: 'Structural', enabled: false, taskCount: 0 },
    { name: 'Civil', enabled: false, taskCount: 0 },
    { name: 'Mechanical', enabled: false, taskCount: 0 },
    { name: 'Safety', enabled: false, taskCount: 0 },
    { name: 'Environmental', enabled: false, taskCount: 0 }
  ];

  useEffect(() => {
    loadData();
  }, [project.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load MDR entries to see what disciplines are involved
      const mdrData = await pmfusionAPI.getMDREntries(project.id).catch(() => []);
      setMdrEntries(mdrData);
      
      // Analyze MDR entries to determine involved disciplines
      const disciplineMap = {};
      mdrData.forEach(entry => {
        const disciplineName = entry.category || 'Unknown';
        if (!disciplineMap[disciplineName]) {
          disciplineMap[disciplineName] = 0;
        }
        disciplineMap[disciplineName]++;
      });

      // Update disciplines with MDR data
      const updatedDisciplines = defaultDisciplines.map(discipline => {
        const taskCount = disciplineMap[discipline.name] || disciplineMap[`${discipline.name} & Administration`] || 0;
        return {
          ...discipline,
          enabled: taskCount > 0,
          taskCount,
          fromMDR: taskCount > 0
        };
      });

      // Add any additional disciplines found in MDR that aren't in default list
      Object.keys(disciplineMap).forEach(disciplineName => {
        if (!updatedDisciplines.find(d => d.name === disciplineName || `${d.name} & Administration` === disciplineName)) {
          updatedDisciplines.push({
            name: disciplineName,
            enabled: true,
            taskCount: disciplineMap[disciplineName],
            fromMDR: true,
            custom: true
          });
        }
      });

      setDisciplines(updatedDisciplines);
    } catch (error) {
      console.error('Failed to load discipline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisciplineToggle = (disciplineIndex) => {
    setDisciplines(prev => 
      prev.map((discipline, index) => 
        index === disciplineIndex 
          ? { ...discipline, enabled: !discipline.enabled }
          : discipline
      )
    );
  };

  const handleSyncDiscipline = async (discipline) => {
    setSyncing(true);
    setSyncStatus(prev => ({ ...prev, [discipline.name]: 'syncing' }));
    
    try {
      // Generate WBS for the project to create tasks
      await pmfusionAPI.generateProjectWBS(project.id);
      
      // Sync tasks from WBS to discipline dashboards
      await pmfusionAPI.syncTasksFromWBS(project.id);
      
      setSyncStatus(prev => ({ ...prev, [discipline.name]: 'success' }));
      
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [discipline.name]: null }));
      }, 3000);
      
    } catch (error) {
      console.error(`Failed to sync ${discipline.name}:`, error);
      setSyncStatus(prev => ({ ...prev, [discipline.name]: 'error' }));
      
      setTimeout(() => {
        setSyncStatus(prev => ({ ...prev, [discipline.name]: null }));
      }, 3000);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllDisciplines = async () => {
    const enabledDisciplines = disciplines.filter(d => d.enabled && d.taskCount > 0);
    
    if (enabledDisciplines.length === 0) {
      alert('No disciplines with tasks to sync. Please upload an MDR file first.');
      return;
    }

    setSyncing(true);
    
    try {
      // Generate WBS for the project
      await pmfusionAPI.generateProjectWBS(project.id);
      
      // Sync tasks from WBS
      await pmfusionAPI.syncTasksFromWBS(project.id);
      
      // Update status for all enabled disciplines
      const successStatus = {};
      enabledDisciplines.forEach(discipline => {
        successStatus[discipline.name] = 'success';
      });
      setSyncStatus(successStatus);
      
      setTimeout(() => {
        setSyncStatus({});
      }, 3000);
      
    } catch (error) {
      console.error('Failed to sync all disciplines:', error);
      alert('Failed to sync disciplines. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (discipline) => {
    const status = syncStatus[discipline.name];
    
    if (status === 'syncing') {
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      );
    } else if (status === 'success') {
      return (
        <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } else if (status === 'error') {
      return (
        <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    
    return null;
  };

  const enabledDisciplines = disciplines.filter(d => d.enabled);
  const totalTasks = disciplines.reduce((sum, d) => sum + (d.enabled ? d.taskCount : 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">Discipline Register</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Manage disciplines for <strong>{project.name}</strong> and sync tasks to their dashboards
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading discipline information...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{enabledDisciplines.length}</div>
                    <div className="text-sm text-blue-700">Active Disciplines</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{totalTasks}</div>
                    <div className="text-sm text-green-700">Total Tasks</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{mdrEntries.length}</div>
                    <div className="text-sm text-purple-700">MDR Entries</div>
                  </div>
                </div>

                {/* Disciplines List */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Project Disciplines</h3>
                    <Button
                      onClick={handleSyncAllDisciplines}
                      disabled={syncing || enabledDisciplines.length === 0}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                    >
                      {syncing ? 'Syncing All...' : 'Sync All Disciplines'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {disciplines.map((discipline, index) => (
                      <div
                        key={discipline.name}
                        className={`border rounded-lg p-4 ${
                          discipline.enabled 
                            ? 'border-blue-200 bg-blue-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={discipline.enabled}
                              onChange={() => handleDisciplineToggle(index)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {discipline.name}
                                </span>
                                {discipline.fromMDR && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    From MDR
                                  </span>
                                )}
                                {discipline.custom && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {discipline.taskCount > 0 
                                  ? `${discipline.taskCount} task${discipline.taskCount > 1 ? 's' : ''} available`
                                  : 'No tasks found'
                                }
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getStatusIcon(discipline)}
                            
                            {discipline.enabled && discipline.taskCount > 0 && (
                              <Button
                                onClick={() => handleSyncDiscipline(discipline)}
                                disabled={syncing}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                              >
                                {syncStatus[discipline.name] === 'syncing' ? 'Syncing...' : 'Sync'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">How to Use Discipline Register</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>1. <strong>Review Disciplines:</strong> Disciplines are automatically detected from uploaded MDR files</p>
                    <p>2. <strong>Enable/Disable:</strong> Check or uncheck disciplines to include them in the project</p>
                    <p>3. <strong>Sync Tasks:</strong> Click "Sync" to create tasks in each discipline's dashboard</p>
                    <p>4. <strong>Team Access:</strong> Team leaders can then assign tasks to engineers in their discipline</p>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    onClick={onClose}
                    className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisciplineRegisterModal;
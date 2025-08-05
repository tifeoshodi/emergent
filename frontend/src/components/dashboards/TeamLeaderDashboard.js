import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../ui';
import TaskAssignmentModal from '../modals/TaskAssignmentModal';

const TeamLeaderDashboard = ({ user, onLogout }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [kanbanData, setKanbanData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [disciplineStats, setDisciplineStats] = useState({});
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    loadProjects();
    loadTeamMembers();
  }, []);

  useEffect(() => {
    if (selectedProject && user.discipline) {
      loadKanbanData();
      loadDisciplineStats();
      loadRecentFiles();
    }
  }, [selectedProject, user.discipline]);

  const loadProjects = async () => {
    try {
      const data = await pmfusionAPI.request('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const data = await pmfusionAPI.request('/users');
      // Filter team members by discipline (excluding team leader)
      const members = data.filter(u => 
        u.discipline === user.discipline && 
        u.id !== user.id &&
        ['senior_engineer_1', 'senior_engineer_2', 'intermediate_engineer', 'junior_engineer'].includes(u.role)
      );
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const loadKanbanData = async () => {
    try {
      setLoading(true);
      const data = await pmfusionAPI.request(`/disciplines/${user.discipline}/kanban?project_id=${selectedProject}`);
      setKanbanData(data);
    } catch (error) {
      console.error('Failed to load kanban data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDisciplineStats = async () => {
    try {
      const stats = await pmfusionAPI.request(`/mdr/dashboard/${selectedProject}`);
      setDisciplineStats(stats);
    } catch (error) {
      console.error('Failed to load discipline stats:', error);
    }
  };

  const loadRecentFiles = async () => {
    try {
      // Get files uploaded by team members across all disciplines in this project
      const response = await pmfusionAPI.request(`/documents?project_id=${selectedProject}`);
      
      // Sort by upload date and take the 10 most recent
      const sortedFiles = response
        .filter(doc => doc.task_id) // Only show task attachments
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
      
      // Enhance files with uploader information
      const enhancedFiles = await Promise.all(sortedFiles.map(async (file) => {
        try {
          // Get user information for the uploader
          const users = await pmfusionAPI.request('/users');
          const uploader = users.find(u => u.id === file.created_by);
          return {
            ...file,
            uploader_name: uploader ? uploader.name : 'Unknown User'
          };
        } catch (error) {
          console.error('Failed to get uploader info:', error);
          return {
            ...file,
            uploader_name: 'Unknown User'
          };
        }
      }));
      
      setRecentFiles(enhancedFiles);
    } catch (error) {
      console.error('Failed to load recent files:', error);
      setRecentFiles([]);
    }
  };

  const handleTaskAssignment = async (taskId, assigneeId) => {
    try {
      await pmfusionAPI.request(`/tasks/${taskId}`, 'PUT', {
        assigned_to: assigneeId
      });
      
      // Refresh kanban data
      await loadKanbanData();
      setShowAssignModal(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to assign task:', error);
      alert('Failed to assign task. Please try again.');
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowAssignModal(true);
  };

  const getTaskPriorityColor = (priority) => {
    const colors = {
      'critical': 'border-l-red-500 bg-red-50',
      'high': 'border-l-orange-500 bg-orange-50',
      'medium': 'border-l-yellow-500 bg-yellow-50',
      'low': 'border-l-green-500 bg-green-50'
    };
    return colors[priority] || 'border-l-gray-500 bg-gray-50';
  };

  const getStatusStats = () => {
    if (!kanbanData || !kanbanData.board) return {};
    
    const board = kanbanData.board;
    return {
      backlog: board.backlog?.length || 0,
      todo: board.todo?.length || 0,
      in_progress: board.in_progress?.length || 0,
      review_dic: board.review_dic?.length || 0,
      review_idc: board.review_idc?.length || 0,
      review_dcc: board.review_dcc?.length || 0,
      done: board.done?.length || 0
    };
  };

  // Create a proper TaskCard component to avoid hooks issues
  const TaskCard = ({ task, teamMembers, onTaskClick, getTaskPriorityColor }) => {
    const [taskAttachmentCount, setTaskAttachmentCount] = useState(0);

    useEffect(() => {
      const loadTaskAttachments = async () => {
        try {
          const response = await pmfusionAPI.request(`/documents?task_id=${task.id}`);
          setTaskAttachmentCount(response.length);
        } catch (error) {
          console.error('Failed to load task attachments:', error);
        }
      };
      loadTaskAttachments();
    }, [task.id]);

    return (
      <div
        onClick={() => onTaskClick(task)}
        className={`p-3 mb-3 border-l-4 rounded-r-md cursor-pointer hover:shadow-md transition-shadow ${getTaskPriorityColor(task.priority)}`}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
          <div className="flex items-center space-x-2 ml-2">
            {task.tags?.includes('mdr') && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                MDR
              </span>
            )}
            {taskAttachmentCount > 0 && (
              <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs" title={`${taskAttachmentCount} attachment${taskAttachmentCount > 1 ? 's' : ''}`}>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="font-medium">{taskAttachmentCount}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-gray-500">
          {task.assigned_to ? (
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Assigned to: {teamMembers.find(m => m.id === task.assigned_to)?.name || 'Unknown'}
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Unassigned
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Due: {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
          
          <div className="flex items-center">
            <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Priority: {task.priority}
          </div>
        </div>
      </div>
    );
  };

  const renderTaskCard = (task, columnKey) => (
    <TaskCard 
      key={task.id}
      task={task}
      teamMembers={teamMembers}
      onTaskClick={handleTaskClick}
      getTaskPriorityColor={getTaskPriorityColor}
    />
  );

  const stats = getStatusStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-green-600 rounded-md flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Team Leader Dashboard</h1>
                <p className="text-sm text-gray-500">{user.discipline} Discipline Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Team Leader - {user.discipline}</p>
              </div>
              <Button 
                onClick={onLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 text-sm"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Selection */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Project & Team Management</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Select project and manage {user.discipline} discipline tasks</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Team Members</div>
                <div className="text-lg font-semibold text-green-600">{teamMembers.length}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Active Project
                  </label>
                  <select 
                    id="project-select"
                    value={selectedProject} 
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Choose a project...</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.status?.replace('_', ' ').toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discipline Focus
                  </label>
                  <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                    <span className="text-green-800 font-medium">{user.discipline}</span>
                    <span className="text-green-600 text-sm ml-2">Team Leader</span>
                  </div>
                </div>
              </div>

              {/* Project Info */}
              {selectedProject && projects.find(p => p.id === selectedProject) && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  {(() => {
                    const project = projects.find(p => p.id === selectedProject);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-green-800">Project Status:</span>
                          <div className="text-green-700">{project.status?.replace('_', ' ').toUpperCase()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Start Date:</span>
                          <div className="text-green-700">
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Your Team:</span>
                          <div className="text-green-700">{teamMembers.length} members</div>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Task Overview:</span>
                          <div className="text-green-700">
                            {kanbanData ? Object.values(kanbanData.board || {}).flat().length : 0} total tasks
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Team Members Quick View */}
              {teamMembers.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Your Team ({user.discipline})</h4>
                  <div className="flex flex-wrap gap-2">
                    {teamMembers.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                        <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </div>
                    ))}
                    {teamMembers.length > 5 && (
                      <div className="flex items-center text-sm text-gray-500">
                        +{teamMembers.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedProject && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">{stats.backlog}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Backlog</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{stats.todo}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">To Do</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-yellow-600">{stats.in_progress}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">In Progress</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-600">{stats.review_dic}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">DIC Review</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-indigo-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-600">{stats.review_idc}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">IDC Review</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-orange-600">{stats.review_dcc}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">DCC Review</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">{stats.done}</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Completed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kanban Board */}
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading discipline tasks...</p>
              </div>
            ) : kanbanData && kanbanData.board ? (
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {Object.entries(kanbanData.board).map(([columnKey, tasks]) => {
                  const columnTitles = {
                    backlog: 'Backlog',
                    todo: 'To Do',
                    in_progress: 'In Progress',
                    review_dic: 'DIC Review',
                    review_idc: 'IDC Review',
                    review_dcc: 'DCC Review',
                    done: 'Completed'
                  };

                  const columnColors = {
                    backlog: 'bg-gray-100 border-gray-300',
                    todo: 'bg-blue-100 border-blue-300',
                    in_progress: 'bg-yellow-100 border-yellow-300',
                    review_dic: 'bg-purple-100 border-purple-300',
                    review_idc: 'bg-indigo-100 border-indigo-300',
                    review_dcc: 'bg-orange-100 border-orange-300',
                    done: 'bg-green-100 border-green-300'
                  };

                  return (
                    <div key={columnKey} className="flex flex-col">
                      <div className={`p-3 rounded-t-lg border-t border-l border-r ${columnColors[columnKey]}`}>
                        <h3 className="font-medium text-gray-800">
                          {columnTitles[columnKey]} ({tasks.length})
                        </h3>
                      </div>
                      <div className="bg-white border-l border-r border-b rounded-b-lg min-h-96 p-2">
                        {tasks.map(task => renderTaskCard(task, columnKey))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No tasks found for this discipline and project.</p>
                <p className="text-sm text-gray-400 mt-1">Tasks will appear here after the Scheduler uploads an MDR and generates the WBS.</p>
              </div>
            )}

            {/* Recent Files Section */}
            {selectedProject && recentFiles.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Recent Task Deliverables
                  </CardTitle>
                  <p className="text-sm text-gray-500">Files uploaded by team members across all disciplines</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{file.title}</p>
                            <div className="flex items-center text-xs text-gray-500 space-x-4">
                              <span>Discipline: {file.discipline}</span>
                              <span>Uploader: {file.uploader_name}</span>
                              <span>Uploaded: {new Date(file.created_at).toLocaleDateString()}</span>
                              <span>Size: {(file.file_size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={async () => {
                            try {
                              await pmfusionAPI.downloadFile(`/documents/${file.id}/download`, file.title);
                            } catch (error) {
                              console.error('Download error:', error);
                              alert(`Failed to download ${file.title}: ${error.message}`);
                            }
                          }}
                          className="ml-4 bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Task Assignment Modal */}
      {showAssignModal && selectedTask && (
        <TaskAssignmentModal
          task={selectedTask}
          teamMembers={teamMembers}
          onAssign={handleTaskAssignment}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TeamLeaderDashboard;
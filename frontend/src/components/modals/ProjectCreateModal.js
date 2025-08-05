import React, { useState } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Label } from '../ui';
import useClickOutside from '../../hooks/useClickOutside';

const ProjectCreateModal = ({ onClose, onProjectCreated, currentUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    project_manager_id: currentUser.id
  });
  const [creating, setCreating] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Add click outside functionality
  const modalRef = useClickOutside(onClose);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }
    
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    
    if (formData.end_date && formData.start_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      if (endDate <= startDate) {
        newErrors.end_date = 'End date must be after start date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setCreating(true);
    try {
      const projectData = {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        status: 'planning'
      };
      
      const newProject = await pmfusionAPI.createProject(projectData);
      onProjectCreated(newProject);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({ submit: 'Failed to create project. Please try again.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Create New Project</CardTitle>
                <p className="text-sm text-gray-500 mt-1">Set up a new project for MDR processing and team collaboration</p>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">{errors.submit}</p>
                </div>
              )}
              
              {/* Project Name */}
              <div>
                <Label htmlFor="project-name" className="text-sm font-medium text-gray-700">
                  Project Name *
                </Label>
                <Input
                  id="project-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter project name (e.g., Oil Refinery Upgrade Phase 1)"
                  className={`mt-1 ${errors.name ? 'border-red-500' : ''}`}
                />
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Project Description */}
              <div>
                <Label htmlFor="project-description" className="text-sm font-medium text-gray-700">
                  Project Description *
                </Label>
                <textarea
                  id="project-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Provide a detailed description of the project scope and objectives"
                  className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1">{errors.description}</p>
                )}
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-sm font-medium text-gray-700">
                    Start Date *
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`mt-1 ${errors.start_date ? 'border-red-500' : ''}`}
                  />
                  {errors.start_date && (
                    <p className="text-red-600 text-xs mt-1">{errors.start_date}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="end-date" className="text-sm font-medium text-gray-700">
                    End Date (Optional)
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`mt-1 ${errors.end_date ? 'border-red-500' : ''}`}
                  />
                  {errors.end_date && (
                    <p className="text-red-600 text-xs mt-1">{errors.end_date}</p>
                  )}
                </div>
              </div>

              {/* Project Manager Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <h4 className="font-medium text-blue-800 mb-1">Project Manager</h4>
                <p className="text-sm text-blue-700">{currentUser.name} (You)</p>
                <p className="text-xs text-blue-600">As the scheduler, you will be assigned as the project manager</p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300"
                >
                  {creating ? 'Creating Project...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectCreateModal;
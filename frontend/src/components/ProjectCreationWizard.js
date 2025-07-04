import React, { useState } from 'react';
import pmfusionAPI from '../lib/api';
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from './ui';

const ProjectCreationWizard = ({ onProjectCreated, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    client_name: '',
    start_date: '',
    end_date: ''
  });

  // Dashboard configuration state
  const [dashboardConfig, setDashboardConfig] = useState({
    ganttChartView: true,
    kanbanBoards: true
  });

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Backend integration state
  const [projectId, setProjectId] = useState(null);
  const [wbsTree, setWbsTree] = useState([]);
  const [wbsLoading, setWbsLoading] = useState(false);

  // Accepted file types
  const acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const acceptedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

  // Generate UUID using crypto API with fallback
  const generateUUID = () => {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    } else {
      // Fallback for older browsers
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const updateDashboardConfig = (field, value) => {
    setDashboardConfig(prev => ({ ...prev, [field]: value }));
  };

  // File validation function
  const validateFile = (file) => {
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

    // Check file type
    const hasValidMimeType = file.type && acceptedFileTypes.includes(file.type);
    const hasValidExtension = acceptedExtensions.includes(extension);

    if (!hasValidMimeType && !hasValidExtension) {
      return `File type not supported. Please upload PDF, DOC, DOCX, XLS, or XLSX files.`;
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return `File size too large. Maximum file size is 10MB.`;
    }

    return null;
  };

  // Handle file processing
  const processFiles = (files) => {
    setUploadError('');
    const fileList = Array.from(files);
    const validFiles = [];
    const errors = [];

    fileList.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        // Check for duplicates
        const isDuplicate = uploadedFiles.some(existingFile => 
          existingFile.name === file.name && existingFile.size === file.size
        );
        if (!isDuplicate) {
          validFiles.push({
            id: generateUUID(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'uploaded',
            uploadedAt: new Date().toISOString()
          });
        } else {
          errors.push(`${file.name}: File already uploaded`);
        }
      }
    });

    if (errors.length > 0) {
      setUploadError(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  // File input handler
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFiles(files);
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  // Remove uploaded file
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced form validation with comprehensive checks
  const validateForm = () => {
    const errors = [];
    
    // Validate project name
    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('Project name is required.');
    } else if (formData.name.trim().length < 3) {
      errors.push('Project name must be at least 3 characters long.');
    } else if (formData.name.trim().length > 100) {
      errors.push('Project name must be less than 100 characters.');
    } else if (!/^[a-zA-Z0-9\s\-\_\(\)\[\]\.]+$/.test(formData.name.trim())) {
      errors.push('Project name contains invalid characters. Use only letters, numbers, spaces, and basic punctuation.');
    }
    
    // Validate project code (if provided)
    if (formData.code && formData.code.trim().length > 0) {
      if (formData.code.trim().length < 2) {
        errors.push('Project code must be at least 2 characters long.');
      } else if (formData.code.trim().length > 20) {
        errors.push('Project code must be less than 20 characters.');
      } else if (!/^[A-Z0-9\-\_]+$/i.test(formData.code.trim())) {
        errors.push('Project code can only contain letters, numbers, hyphens, and underscores.');
      }
    }
    
    // Validate description length
    if (formData.description && formData.description.trim().length > 1000) {
      errors.push('Project description must be less than 1000 characters.');
    }
    
    // Validate client name
    if (formData.client_name && formData.client_name.trim().length > 0) {
      if (formData.client_name.trim().length < 2) {
        errors.push('Client name must be at least 2 characters long.');
      } else if (formData.client_name.trim().length > 100) {
        errors.push('Client name must be less than 100 characters.');
      } else if (!/^[a-zA-Z0-9\s\-\_\(\)\[\]\.\&\,]+$/.test(formData.client_name.trim())) {
        errors.push('Client name contains invalid characters.');
      }
    }
    
    // Validate dates
    if (!formData.start_date) {
      errors.push('Start date is required.');
    } else {
      const startDate = new Date(formData.start_date);
      if (isNaN(startDate.getTime())) {
        errors.push('Start date has invalid format.');
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (startDate < today) {
          errors.push('Start date cannot be in the past.');
        }
      }    }
    
    if (!formData.end_date) {
      errors.push('End date is required.');
    } else {
      const endDate = new Date(formData.end_date);
      if (isNaN(endDate.getTime())) {
        errors.push('End date has invalid format.');
      }
    }
    
    // Validate date relationship
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        if (endDate <= startDate) {
          errors.push('End date must be after start date.');
        }
        
        // Check if project duration is reasonable (not more than 10 years)
        const diffTime = Math.abs(endDate - startDate);
        const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
        if (diffYears > 10) {
          errors.push('Project duration cannot exceed 10 years.');
        }
        
        // Check minimum duration (at least 1 day)
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays < 1) {
          errors.push('Project must be at least 1 day long.');
        }
      }
    }
    
    // If there are errors, set them and return false
    if (errors.length > 0) {
      setError(errors.join(' '));
      return false;
    }
    
    // Clear any previous errors
    setError('');
    return true;
  };

  const createProjectIfNeeded = async () => {
    if (projectId) return;

    const payload = {
      name: formData.name.trim(),
      code: formData.code ? formData.code.trim() : '',
      description: formData.description ? formData.description.trim() : '',
      client_name: formData.client_name ? formData.client_name.trim() : '',
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: 'planning'
    };

    setLoading(true);
    try {
      const res = await pmfusionAPI.createProject(payload);
      const created = res.data || res;
      setProjectId(created.id);
    } catch (err) {
      setError('Failed to save project information.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateWBS = async () => {
    if (!projectId) return;
    setWbsLoading(true);
    try {
      await pmfusionAPI.generateProjectWBS(projectId);
      const tree = await pmfusionAPI.getProjectWBS(projectId);
      setWbsTree(tree);
    } catch (err) {
      setError('Failed to generate WBS preview.');
      throw err;
    } finally {
      setWbsLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      if (!validateForm()) return;
      try {
        await createProjectIfNeeded();
      } catch {
        return;
      }
    }

    if (currentStep === 2) {
      try {
        await generateWBS();
      } catch {
        return;
      }
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    // Validate form before submitting
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Create project payload with dashboard configuration and uploaded files
      const projectPayload = {
        name: formData.name.trim(),
        code: formData.code ? formData.code.trim() : '',
        description: formData.description ? formData.description.trim() : '',
        client_name: formData.client_name ? formData.client_name.trim() : '',
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'planning',
        dashboard_config: dashboardConfig,
        uploaded_files: uploadedFiles.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt
        }))
      };
      
      let response;
      if (projectId) {
        console.log('Updating project with payload:', projectPayload);
        response = await pmfusionAPI.updateProject(projectId, projectPayload);
      } else {
        console.log('Creating project with payload:', projectPayload);
        response = await pmfusionAPI.createProject(projectPayload);
      }
      
      // Handle successful creation
      if (response && response.data) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Project created successfully:', response.data);
        }
        onProjectCreated(response.data);
      } else if (response) {
        // Handle case where response doesn't have data property but is successful
        if (process.env.NODE_ENV === 'development') {
            console.log('Project created successfully:', response);
        }
        onProjectCreated(response);
      } else {
        throw new Error('Invalid response from server');
      }
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create project:', error);
      }
      
      // Extract meaningful error message
      let errorMessage = 'Failed to create project. Please try again.';
      
      if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid project data. Please check your inputs and try again.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication required. Please log in and try again.';
        } else if (error.message.includes('403')) {
          errorMessage = 'You do not have permission to create projects.';
        } else if (error.message.includes('409')) {
          errorMessage = 'A project with this name or code already exists.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message !== 'Failed to create project. Please try again.') {
          // If we have a custom error message, use it
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[1, 2, 3, 4].map(step => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-20 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="project-name">Project Name *</Label>
            <Input
              id="project-name"
              type="text"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Catalytic Cracker Unit Revamp"
              required
            />
          </div>
          <div>
            <Label htmlFor="project-code">Project Code</Label>
            <Input
              id="project-code"
              type="text"
              value={formData.code}
              onChange={(e) => updateFormData('code', e.target.value)}
              placeholder="CCU-2024-REV"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="project-desc">Project Description</Label>
          <textarea
            id="project-desc"
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Detailed description of the project scope and objectives..."
          />
        </div>
        <div>
          <Label htmlFor="client-name">Client Name</Label>
          <Input
            id="client-name"
            type="text"
            value={formData.client_name}
            onChange={(e) => updateFormData('client_name', e.target.value)}
            placeholder="Global Refinery Corp"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={formData.start_date}
              onChange={(e) => updateFormData('start_date', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={formData.end_date}
              onChange={(e) => updateFormData('end_date', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Intake</h3>
      <p className="text-sm text-gray-600 mb-4">Upload project documents (CTR/MDR) or configure data extraction method</p>
      
      {/* File Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <div className="text-gray-500 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 mb-1">
          {isDragOver ? 'Drop files here' : 'Drag and drop documents here, or click to select'}
        </p>
        <p className="text-xs text-gray-500">Supported formats: PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)</p>
        
        <input
          id="file-input"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Error Display */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-sm text-red-600 whitespace-pre-line">{uploadError}</div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded Documents ({uploadedFiles.length})
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map(file => (
              <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {file.type.includes('pdf') ? (
                      <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    ) : file.type.includes('word') ? (
                      <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="flex-shrink-0 ml-3 text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderWBSNode = (node, level = 0) => (
    <div
      key={node.id}
      className="flex items-center text-sm"
      style={{ paddingLeft: `${level * 1}rem` }}
    >
      <span className="font-medium text-gray-700 w-24">{node.wbs_code}</span>
      <span className="text-gray-900">{node.title}</span>
      <span className="ml-auto text-gray-500">{Math.round(node.duration_days)} days</span>
    </div>
  );

  const renderWBSTree = (nodes, level = 0) => (
    <>
      {nodes.map(node => (
        <React.Fragment key={node.id}>
          {renderWBSNode(node, level)}
          {node.children && node.children.length > 0 && (
            <div className="pl-4 space-y-1">
              {renderWBSTree(node.children, level + 1)}
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">WBS Preview</h3>
      <p className="text-sm text-gray-600 mb-4">Review the generated Work Breakdown Structure</p>
      <div className="bg-gray-50 rounded-lg p-4">
        {wbsLoading ? (
          <p className="text-sm text-gray-600">Generating WBS...</p>
        ) : (
          <div className="space-y-1">
            {wbsTree && wbsTree.length > 0 ? renderWBSTree(wbsTree) : (
              <p className="text-sm text-gray-500">No WBS data available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dashboard Configuration</h3>
      <p className="text-sm text-gray-600 mb-4">Configure your project dashboard</p>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Gantt Chart View</h4>
            <p className="text-sm text-gray-600">Timeline visualization</p>
          </div>
          <input 
            type="checkbox" 
            checked={dashboardConfig.ganttChartView}
            onChange={(e) => updateDashboardConfig('ganttChartView', e.target.checked)}
            className="h-5 w-5 text-blue-600" 
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Kanban Boards</h4>
            <p className="text-sm text-gray-600">Task management boards</p>
          </div>
          <input 
            type="checkbox" 
            checked={dashboardConfig.kanbanBoards}
            onChange={(e) => updateDashboardConfig('kanbanBoards', e.target.checked)}
            className="h-5 w-5 text-blue-600" 
          />
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    const titles = ['Basic Information', 'Document Intake', 'WBS Preview', 'Dashboard Setup'];
    return titles[currentStep - 1];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h2>
        <p className="text-gray-600">Step {currentStep} of 4: {getStepTitle()}</p>
      </div>

      {renderStepIndicator()}

      <div className="mb-8">
        {/* Error display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Previous
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          
          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={currentStep === 1 && !validateForm()}>
              {currentStep === 3 ? 'Confirm & Continue' : 'Next'}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWizard; 
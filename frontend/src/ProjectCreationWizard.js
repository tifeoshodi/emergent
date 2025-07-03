import React, { useState } from 'react';
import pmfusionAPI from './lib/api';

const ProjectCreationWizard = ({ onProjectCreated, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    client_name: '',
    start_date: '',
    end_date: ''
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => currentStep < 4 && setCurrentStep(currentStep + 1);
  const prevStep = () => currentStep > 1 && setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // For demo, simulate project creation
      const demoProject = {
        id: Date.now().toString(),
        name: formData.name,
        code: formData.code,
        description: formData.description,
        client_name: formData.client_name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        status: 'planning'
      };
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Project created successfully! (Demo mode)');
      onProjectCreated(demoProject);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Catalytic Cracker Unit Revamp"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => updateFormData('code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="CCU-2024-REV"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detailed description of the project scope and objectives..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
        <input
          type="text"
          value={formData.client_name}
          onChange={(e) => updateFormData('client_name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Global Refinery Corp"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={formData.start_date}
            onChange={(e) => updateFormData('start_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={formData.end_date}
            onChange={(e) => updateFormData('end_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Intake</h3>
      <p className="text-sm text-gray-600 mb-4">Upload project documents (CTR/MDR) or configure data extraction method</p>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <div className="text-gray-500 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm text-gray-600">Drag and drop documents here, or click to select</p>
        <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, XLS, XLSX</p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">WBS Preview</h3>
      <p className="text-sm text-gray-600 mb-4">Review the generated Work Breakdown Structure</p>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-24">1.0</span>
            <span className="text-gray-900">Engineering Design</span>
            <span className="ml-auto text-gray-500">120 days</span>
          </div>
          <div className="flex items-center text-sm pl-4">
            <span className="font-medium text-gray-700 w-20">1.1</span>
            <span className="text-gray-900">Process Engineering Package</span>
            <span className="ml-auto text-gray-500">90 days</span>
          </div>
          <div className="flex items-center text-sm pl-8">
            <span className="font-medium text-gray-700 w-16">1.1.1</span>
            <span className="text-gray-900">Process Flow Diagrams</span>
            <span className="ml-auto text-gray-500">30 days</span>
          </div>
        </div>
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
          <input type="checkbox" defaultChecked className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Kanban Boards</h4>
            <p className="text-sm text-gray-600">Task management boards</p>
          </div>
          <input type="checkbox" defaultChecked className="h-5 w-5 text-blue-600" />
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
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              disabled={currentStep === 1 && !formData.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCreationWizard; 
import React, { useState, useEffect, useRef } from 'react';
import pmfusionAPI from '../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from './ui';
import useClickOutside from '../hooks/useClickOutside';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportGenerator = ({ project, onClose, currentUser }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [activeChart, setActiveChart] = useState('gantt');
  const [mdrData, setMdrData] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [generating, setGenerating] = useState(false);
  
  // Add click outside functionality
  const modalRef = useClickOutside(onClose);
  
  // Chart refs for rendering
  const ganttChartRef = useRef(null);
  const scurveChartRef = useRef(null);

  useEffect(() => {
    loadReportData();
  }, [project.id]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch project data, MDR entries, and tasks
      const [mdrEntries, tasks, projectStats] = await Promise.all([
        pmfusionAPI.request(`/mdr/entries/${project.id}`).catch(() => []),
        pmfusionAPI.request(`/tasks?project_id=${project.id}`).catch(() => []),
        pmfusionAPI.request(`/projects/${project.id}/dashboard`).catch(() => ({}))
      ]);
      
      setMdrData(mdrEntries);
      setTaskData(tasks);
      
      // Process data for reporting
      const processedData = processReportData(mdrEntries, tasks, projectStats);
      setReportData(processedData);
      
    } catch (error) {
      console.error('Failed to load report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (mdrEntries, tasks, projectStats) => {
    // Calculate project timeline
    const projectStart = new Date(project.start_date || Date.now());
    const projectEnd = project.end_date ? new Date(project.end_date) : new Date(projectStart.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Process tasks for Gantt chart
    const ganttTasks = tasks.map(task => ({
      id: task.id,
      name: task.title,
      start: new Date(task.start_date || projectStart),
      end: new Date(task.end_date || task.due_date || projectEnd),
      progress: task.progress_percent || 0,
      discipline: task.discipline,
      status: task.status,
      isMilestone: task.is_milestone
    }));
    
    // Calculate S-curve data (planned vs actual)
    const scurveData = calculateScurveData(mdrEntries, tasks, projectStart, projectEnd);
    
    // Calculate summary statistics
    const summary = {
      totalDocuments: mdrEntries.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'done').length,
      overdueTasks: tasks.filter(t => new Date(t.due_date) < new Date() && t.status !== 'done').length,
      projectProgress: calculateProjectProgress(tasks),
      disciplineBreakdown: calculateDisciplineBreakdown(mdrEntries, tasks)
    };
    
    return {
      ganttTasks,
      scurveData,
      summary,
      projectTimeline: { start: projectStart, end: projectEnd }
    };
  };

  const calculateScurveData = (mdrEntries, tasks, projectStart, projectEnd) => {
    const timeSpan = projectEnd.getTime() - projectStart.getTime();
    const weeks = Math.ceil(timeSpan / (7 * 24 * 60 * 60 * 1000));
    
    const data = [];
    for (let week = 0; week <= weeks; week++) {
      const currentDate = new Date(projectStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
      
      // Calculate planned progress (linear for simplicity)
      const plannedProgress = (week / weeks) * 100;
      
      // Calculate actual progress based on completed tasks up to this date
      const completedTasksAtDate = tasks.filter(task => {
        return task.status === 'done' && new Date(task.updated_at || task.created_at) <= currentDate;
      });
      const actualProgress = (completedTasksAtDate.length / tasks.length) * 100;
      
      data.push({
        week: week,
        date: currentDate.toLocaleDateString(),
        planned: Math.min(plannedProgress, 100),
        actual: Math.min(actualProgress, 100)
      });
    }
    
    return data;
  };

  const calculateProjectProgress = (tasks) => {
    if (tasks.length === 0) return 0;
    const totalProgress = tasks.reduce((sum, task) => sum + (task.progress_percent || 0), 0);
    return Math.round(totalProgress / tasks.length);
  };

  const calculateDisciplineBreakdown = (mdrEntries, tasks) => {
    const disciplines = {};
    
    // Count MDR entries by discipline
    mdrEntries.forEach(entry => {
      const discipline = entry.discipline || 'Unassigned';
      if (!disciplines[discipline]) {
        disciplines[discipline] = { documents: 0, tasks: 0 };
      }
      disciplines[discipline].documents++;
    });
    
    // Count tasks by discipline
    tasks.forEach(task => {
      const discipline = task.discipline || 'Unassigned';
      if (!disciplines[discipline]) {
        disciplines[discipline] = { documents: 0, tasks: 0 };
      }
      disciplines[discipline].tasks++;
    });
    
    return disciplines;
  };

  const generateGanttChart = () => {
    if (!reportData || !ganttChartRef.current) return;
    
    const canvas = ganttChartRef.current;
    const ctx = canvas.getContext('2d');
    const { ganttTasks, projectTimeline } = reportData;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart dimensions
    const margin = { top: 40, right: 20, bottom: 40, left: 200 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // Time scale
    const timeSpan = projectTimeline.end.getTime() - projectTimeline.start.getTime();
    const getXPosition = (date) => {
      const progress = (date.getTime() - projectTimeline.start.getTime()) / timeSpan;
      return margin.left + progress * chartWidth;
    };
    
    // Draw tasks
    const taskHeight = 20;
    const taskSpacing = 30;
    
    ganttTasks.forEach((task, index) => {
      const y = margin.top + index * taskSpacing;
      const startX = getXPosition(task.start);
      const endX = getXPosition(task.end);
      const width = endX - startX;
      
      // Task bar background
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(startX, y, width, taskHeight);
      
      // Progress bar
      ctx.fillStyle = getTaskColor(task.status);
      ctx.fillRect(startX, y, width * (task.progress / 100), taskHeight);
      
      // Task name
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(task.name.substring(0, 25) + (task.name.length > 25 ? '...' : ''), 10, y + 15);
      
      // Milestone marker
      if (task.isMilestone) {
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(endX, y);
        ctx.lineTo(endX + 10, y + 10);
        ctx.lineTo(endX, y + 20);
        ctx.lineTo(endX - 10, y + 10);
        ctx.closePath();
        ctx.fill();
      }
    });
    
    // Draw time axis
    const monthsSpan = Math.ceil(timeSpan / (30 * 24 * 60 * 60 * 1000));
    for (let i = 0; i <= monthsSpan; i++) {
      const date = new Date(projectTimeline.start.getTime() + i * 30 * 24 * 60 * 60 * 1000);
      const x = getXPosition(date);
      
      // Vertical grid line
      ctx.strokeStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, canvas.height - margin.bottom);
      ctx.stroke();
      
      // Month label
      ctx.fillStyle = '#374151';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), x, canvas.height - 10);
    }
  };

  const generateScurveChart = () => {
    if (!reportData || !scurveChartRef.current) return;
    
    const canvas = scurveChartRef.current;
    const ctx = canvas.getContext('2d');
    const { scurveData } = reportData;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Chart dimensions
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;
    
    // Scales
    const xScale = (week) => margin.left + (week / (scurveData.length - 1)) * chartWidth;
    const yScale = (percentage) => margin.top + (1 - percentage / 100) * chartHeight;
    
    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = yScale(i * 10);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(canvas.width - margin.right, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`${i * 10}%`, margin.left - 10, y + 4);
    }
    
    // Vertical grid lines
    const weekInterval = Math.max(1, Math.floor(scurveData.length / 10));
    for (let i = 0; i < scurveData.length; i += weekInterval) {
      const x = xScale(i);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, canvas.height - margin.bottom);
      ctx.stroke();
      
      // X-axis labels
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Week ${i + 1}`, x, canvas.height - 30);
    }
    
    // Draw planned curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    scurveData.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.planned);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw actual curve
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    scurveData.forEach((point, index) => {
      const x = xScale(index);
      const y = yScale(point.actual);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Legend
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(margin.left, 20, 15, 10);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Planned Progress', margin.left + 20, 29);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(margin.left + 150, 20, 15, 10);
    ctx.fillText('Actual Progress', margin.left + 175, 29);
  };

  const getTaskColor = (status) => {
    const colors = {
      'todo': '#6b7280',
      'in_progress': '#f59e0b',
      'review_dic': '#8b5cf6',
      'review_idc': '#06b6d4',
      'review_dcc': '#f97316',
      'done': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const generatePDFReport = async () => {
    setGenerating(true);
    try {
      const reportElement = document.getElementById('report-content');
      if (!reportElement) {
        throw new Error('Report content not found');
      }

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        height: reportElement.scrollHeight,
        width: reportElement.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`${project.name}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateTextReport = async () => {
    setGenerating(true);
    try {
      const reportText = generateReportText();
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}_Report_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to generate text report:', error);
      alert('Failed to generate text report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const generateReportText = () => {
    if (!reportData) return '';
    
    const { summary } = reportData;
    
    return `
PROJECT REPORT: ${project.name}
Generated: ${new Date().toLocaleString()}
Generated by: ${currentUser.name}

PROJECT OVERVIEW
================
Project Status: ${project.status?.replace('_', ' ').toUpperCase()}
Start Date: ${project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
End Date: ${project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
Description: ${project.description || 'No description provided'}

PROJECT STATISTICS
==================
Total Documents: ${summary.totalDocuments}
Total Tasks: ${summary.totalTasks}
Completed Tasks: ${summary.completedTasks}
Overdue Tasks: ${summary.overdueTasks}
Overall Progress: ${summary.projectProgress}%

DISCIPLINE BREAKDOWN
===================
${Object.entries(summary.disciplineBreakdown).map(([discipline, data]) => 
  `${discipline}: ${data.documents} documents, ${data.tasks} tasks`
).join('\n')}

RECOMMENDATIONS
===============
${summary.overdueTasks > 0 ? `- Address ${summary.overdueTasks} overdue tasks immediately` : '- No overdue tasks'}
${summary.projectProgress < 50 ? '- Consider additional resources to accelerate progress' : '- Project is progressing well'}
${summary.totalDocuments === 0 ? '- Upload MDR documents to begin task generation' : '- Continue monitoring document review process'}

This report was generated by PMFusion Project Management System.
    `.trim();
  };

  // Render charts when data changes
  useEffect(() => {
    if (reportData && activeChart === 'gantt') {
      setTimeout(generateGanttChart, 100);
    }
  }, [reportData, activeChart]);

  useEffect(() => {
    if (reportData && activeChart === 'scurve') {
      setTimeout(generateScurveChart, 100);
    }
  }, [reportData, activeChart]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div ref={modalRef} className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Generating report data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <CardTitle className="text-xl mb-2">Project Report - {project.name}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Generated: {new Date().toLocaleDateString()}</span>
                  <span>•</span>
                  <span>By: {currentUser.name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={generatePDFReport}
                  disabled={generating}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm"
                >
                  {generating ? 'Generating...' : 'Export PDF'}
                </Button>
                <Button
                  onClick={generateTextReport}
                  disabled={generating}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
                >
                  {generating ? 'Generating...' : 'Export Text'}
                </Button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6" id="report-content">
            {reportData ? (
              <>
                {/* Summary Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{reportData.summary.totalDocuments}</div>
                    <div className="text-sm text-blue-800">Total Documents</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{reportData.summary.completedTasks}</div>
                    <div className="text-sm text-green-800">Completed Tasks</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{reportData.summary.projectProgress}%</div>
                    <div className="text-sm text-yellow-800">Overall Progress</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{reportData.summary.overdueTasks}</div>
                    <div className="text-sm text-red-800">Overdue Tasks</div>
                  </div>
                </div>

                {/* Chart Tabs */}
                <div className="mb-4">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveChart('gantt')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeChart === 'gantt'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Gantt Chart
                      </button>
                      <button
                        onClick={() => setActiveChart('scurve')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                          activeChart === 'scurve'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        S-Curve Analysis
                      </button>
                    </nav>
                  </div>
                </div>

                {/* Chart Display */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6" style={{ minHeight: '400px' }}>
                  {activeChart === 'gantt' && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Project Timeline - Gantt Chart</h3>
                      <canvas
                        ref={ganttChartRef}
                        width={800}
                        height={400}
                        className="border border-gray-200 bg-white rounded"
                      />
                    </div>
                  )}
                  
                  {activeChart === 'scurve' && (
                    <div>
                      <h3 className="text-lg font-medium mb-4">Progress Analysis - S-Curve</h3>
                      <canvas
                        ref={scurveChartRef}
                        width={800}
                        height={400}
                        className="border border-gray-200 bg-white rounded"
                      />
                    </div>
                  )}
                </div>

                {/* Discipline Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Discipline Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(reportData.summary.disciplineBreakdown).map(([discipline, data]) => (
                      <div key={discipline} className="border border-gray-200 rounded p-3">
                        <div className="font-medium text-gray-900">{discipline}</div>
                        <div className="text-sm text-gray-600">
                          {data.documents} documents • {data.tasks} tasks
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No report data available for this project.</p>
                <p className="text-sm mt-2">Please ensure the project has MDR entries and tasks.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportGenerator;
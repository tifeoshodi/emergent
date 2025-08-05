import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '../ui';
import useClickOutside from '../../hooks/useClickOutside';

const TaskDetailModal = ({ task, onClose, onUpdate, currentUser }) => {
  const [taskData, setTaskData] = useState(task);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  
  // Add click outside functionality
  const modalRef = useClickOutside(onClose);

  useEffect(() => {
    loadComments();
    loadAttachments();
  }, []);

  const loadComments = async () => {
    try {
      // Mock comments for now - in real implementation, this would fetch from API
      setComments([
        {
          id: '1',
          user_name: 'Team Leader',
          content: 'Please prioritize this task as it\'s on the critical path.',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          user_role: 'engineering_manager'
        }
      ]);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const loadAttachments = async () => {
    try {
      setLoading(true);
      // Fetch documents attached to this task using the API client
      const documents = await pmfusionAPI.request(`/documents?task_id=${task.id}`);
      
      // Get user information to resolve uploader names
      const users = await pmfusionAPI.request('/users');
      
      const taskAttachments = documents.map(doc => {
        const uploader = users.find(u => u.id === doc.created_by);
        return {
          id: doc.id,
          name: doc.file_name,
          size: doc.file_size,
          type: doc.file_type,
          uploaded_by: doc.created_by,
          uploader_name: uploader ? uploader.name : 'Unknown User',
          uploaded_at: doc.created_at,
          document_id: doc.id
        };
      });
      setAttachments(taskAttachments);
    } catch (error) {
      console.error('Failed to load attachments:', error);
      // Still set empty array on error to prevent issues
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onUpdate(task.id, { status: newStatus });
      setTaskData({ ...taskData, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleProgressChange = async (newProgress) => {
    try {
      await onUpdate(task.id, { progress_percent: newProgress });
      setTaskData({ ...taskData, progress_percent: newProgress });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) return;

    try {
      // Mock comment submission - in real implementation, this would post to API
      const comment = {
        id: Date.now().toString(),
        user_name: currentUser.name,
        content: newComment,
        created_at: new Date().toISOString(),
        user_role: currentUser.role
      };
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newAttachments = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', file.name);
        formData.append('description', `Uploaded for task: ${taskData.title}`);
        formData.append('category', 'other');
        formData.append('task_id', taskData.id);
        formData.append('project_id', taskData.project_id || '');
        formData.append('tags', 'task-attachment');

        try {
          const uploadedDoc = await pmfusionAPI.uploadFile('/documents/upload', formData);
          const attachment = {
            id: uploadedDoc.id,
            name: uploadedDoc.file_name,
            size: uploadedDoc.file_size,
            type: uploadedDoc.file_type,
            uploaded_by: currentUser.name,
            uploaded_at: uploadedDoc.created_at || new Date().toISOString(),
            document_id: uploadedDoc.id
          };
          newAttachments.push(attachment);
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          alert(`Failed to upload ${file.name}: ${uploadError.message}`);
        }
      }
      
      if (newAttachments.length > 0) {
        setAttachments([...attachments, ...newAttachments]);
        // Reload attachments to get the latest list
        await loadAttachments();
      }
      event.target.value = ''; // Reset file input
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileDownload = async (attachment) => {
    if (attachment.document_id) {
      try {
        await pmfusionAPI.downloadFile(`/documents/${attachment.document_id}/download`, attachment.name);
      } catch (error) {
        console.error('Download error:', error);
        alert(`Failed to download ${attachment.name}: ${error.message}`);
      }
    } else {
      alert(`Downloading ${attachment.name}...`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    const colors = {
      'todo': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'review': 'bg-purple-100 text-purple-800',
      'review_dic': 'bg-purple-100 text-purple-800',
      'review_idc': 'bg-indigo-100 text-indigo-800',
      'review_dcc': 'bg-orange-100 text-orange-800',
      'done': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAssignedByInfo = () => {
    // Mock assigned by info - in real implementation, this would come from API
    return {
      name: 'Team Leader',
      role: 'Engineering Manager',
      assigned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    };
  };

  const assignedBy = getAssignedByInfo();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-start">
              <div className="flex-1 pr-4">
                <CardTitle className="text-xl mb-2">{taskData.title}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(taskData.status)}`}>
                    {taskData.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span>Priority: {taskData.priority?.toUpperCase()}</span>
                  {taskData.tags?.includes('mdr') && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      MDR Document
                    </span>
                  )}
                </div>
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
          
          <CardContent className="p-0">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { key: 'details', label: 'Details' },
                  { key: 'attachments', label: `Attachments (${attachments.length})` },
                  { key: 'comments', label: `Comments (${comments.length})` },
                  { key: 'history', label: 'History' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Task Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{taskData.description}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <p className="text-sm text-gray-900">
                          {taskData.due_date ? new Date(taskData.due_date).toLocaleDateString() : 'Not set'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Discipline</label>
                        <p className="text-sm text-gray-900">{taskData.discipline || 'Not assigned'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                        <p className="text-sm text-gray-900">{currentUser.name} (You)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assigned By</label>
                        <div className="text-sm text-gray-900">
                          <p>{assignedBy.name}</p>
                          <p className="text-xs text-gray-500">{assignedBy.role}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(assignedBy.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                        <p className="text-sm text-gray-900">
                          {taskData.created_at ? new Date(taskData.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={taskData.progress_percent || 0}
                          onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-12">
                        {taskData.progress_percent || 0}%
                      </span>
                    </div>
                  </div>

                  {/* Status Update */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
                    <div className="flex space-x-2">
                      {['todo', 'in_progress', 'review', 'done'].map((status) => (
                        <Button
                          key={status}
                          onClick={() => handleStatusChange(status)}
                          className={`px-3 py-1 text-xs ${
                            taskData.status === status
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {status.replace('_', ' ').toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-4">
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">Upload deliverables</span>
                          <span className="text-gray-500"> or drag and drop</span>
                        </label>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          multiple
                          className="sr-only"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF, DOC, XLS up to 10MB each</p>
                    </div>
                  </div>

                  {uploading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Uploading files...</p>
                    </div>
                  )}

                  {/* Attachments List */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Uploaded Files ({attachments.length})</h4>
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(attachment.size)} • Uploaded by {attachment.uploader_name} • {new Date(attachment.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleFileDownload(attachment)}
                            className="ml-4 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                          >
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {attachments.length === 0 && !uploading && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No files uploaded yet.</p>
                      <p className="text-sm">Upload deliverables to share with your team.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-4">
                  {/* Add Comment */}
                  <div className="border-b border-gray-200 pb-4">
                    <label htmlFor="new-comment" className="block text-sm font-medium text-gray-700 mb-2">
                      Add a comment
                    </label>
                    <div className="space-y-2">
                      <textarea
                        id="new-comment"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Share updates, ask questions, or provide feedback..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button
                          onClick={handleCommentSubmit}
                          disabled={!newComment.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 text-sm"
                        >
                          Add Comment
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No comments yet.</p>
                        <p className="text-sm">Start the conversation by adding a comment above.</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {comment.user_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{comment.user_name}</span>
                              <span className="text-gray-500 ml-2">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="mt-1 text-sm text-gray-700">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="text-center py-8 text-gray-500">
                    <p>Task history will be displayed here.</p>
                    <p className="text-sm">Status changes, assignments, and other updates.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={onClose}
                  className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskDetailModal;
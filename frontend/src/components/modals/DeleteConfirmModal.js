import React from 'react';
import { ConfirmIcon } from '../icons';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', isDanger = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md m-4 modal">
        <div className="flex items-center mb-4">
          <ConfirmIcon className="h-8 w-8 text-red-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-3 rounded-xl font-medium transition-colors`}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

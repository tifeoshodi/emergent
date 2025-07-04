import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const DocumentControlCenter = () => {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API}/documents/dcc`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed fetching DCC documents', err);
    }
  };

  const finalizeDocument = async (id) => {
    try {
      await axios.post(`${API}/documents/${id}/dcc_finalize`);
      fetchDocuments();
      alert('Document finalized and sent to client');
    } catch (err) {
      console.error('Finalize failed', err);
      alert('Finalize failed');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Document Control Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{doc.description}</p>
            <button
              onClick={() => finalizeDocument(doc.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Send to Client
            </button>
          </div>
        ))}
      </div>
      {documents.length === 0 && (
        <p className="text-gray-600">No documents awaiting control.</p>
      )}
    </div>
  );
};

export default DocumentControlCenter;

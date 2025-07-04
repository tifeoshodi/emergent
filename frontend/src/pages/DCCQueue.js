import React, { useState, useEffect } from 'react';
import pmfusionAPI from '../lib/api';

const DCCQueue = () => {
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState({});
  const [filters, setFilters] = useState({ project: '', discipline: '' });
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await pmfusionAPI.getDocuments({ review_step: 'dcc', project_id: filters.project });
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load DCC queue', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, [filters]);

  const toggle = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sendSelected = async () => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    for (const id of ids) {
      try { await pmfusionAPI.finalizeDocument(id); } catch (e) { console.error('Send failed', e); }
    }
    setSelected({});
    fetchDocs();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">DCC Queue</h2>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2"></th>
                  <th className="p-2 text-left">Title</th>
                  <th className="p-2 text-left">Project</th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <tr key={doc.id} className="border-b">
                    <td className="p-2"><input type="checkbox" checked={!!selected[doc.id]} onChange={() => toggle(doc.id)} /></td>
                    <td className="p-2">{doc.title}</td>
                    <td className="p-2">{doc.project_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={sendSelected} className="bg-blue-600 text-white px-4 py-2 rounded">
            Send Selected
          </button>
        </>
      )}
    </div>
  );
};

export default DCCQueue;

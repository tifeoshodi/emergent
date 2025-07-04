import React, { useEffect, useState } from 'react';
import pmfusionAPI from '../lib/api';

const DisciplineRegister = () => {
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [memberId, setMemberId] = useState('');

  const fetchDisciplines = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await pmfusionAPI.getDisciplines();
      setDisciplines(data.disciplines || data);
    } catch (err) {
      setError('Failed to load disciplines');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const openModal = (discipline) => {
    setSelected(discipline);
    setMemberId('');
    setShowModal(true);
  };

  const handleAddMember = async () => {
    if (!memberId) return;
    try {
      await pmfusionAPI.addDisciplineMember(selected.name, memberId);
      await fetchDisciplines();
      setMemberId('');
    } catch (err) {
      alert('Failed to add member');
    }
  };

  const handleRemoveMember = async (uid) => {
    try {
      await pmfusionAPI.removeDisciplineMember(selected.name, uid);
      await fetchDisciplines();
    } catch (err) {
      alert('Failed to remove member');
    }
  };

  const ManageMembersModal = () => {
    if (!showModal || !selected) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 modal">
          <h3 className="text-lg font-semibold mb-4">Manage Members - {selected.name}</h3>
          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
            {selected.members && selected.members.length > 0 ? (
              selected.members.map((m) => (
                <div key={m} className="flex justify-between items-center border px-2 py-1 rounded">
                  <span>{m}</span>
                  <button
                    onClick={() => handleRemoveMember(m)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >Remove</button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No members</p>
            )}
          </div>
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="User ID"
              className="flex-1 border rounded px-2 py-1"
            />
            <button onClick={handleAddMember} className="bg-blue-600 text-white px-3 py-1 rounded">
              Add
            </button>
          </div>
          <div className="text-right">
            <button
              onClick={() => setShowModal(false)}
              className="bg-gray-600 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading disciplines...</div>;
  }
  if (error) {
    return <div className="text-center py-12 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Disciplines</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplines.map((d, idx) => (
          <div key={d.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-4 h-4 rounded-full"
                  style={{ backgroundColor: `var(--discipline-${(idx % 5) + 1})` }}
                ></span>
                <h3 className="font-semibold">{d.name}</h3>
              </div>
              <button
                onClick={() => openModal(d)}
                className="text-sm text-blue-600 hover:underline"
              >
                Manage Members
              </button>
            </div>
            <p className="text-sm text-gray-600">WIP Limit: {d.wip_limit ?? 'N/A'}</p>
            {d.code && <p className="text-xs text-gray-500">Code: {d.code}</p>}
          </div>
        ))}
      </div>
      <ManageMembersModal />
    </div>
  );
};

export default DisciplineRegister;

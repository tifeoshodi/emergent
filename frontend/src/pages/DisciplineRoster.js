import React from 'react';
import DisciplineRegister from '../components/DisciplineRegister';

const DisciplineRoster = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-900">Discipline Roster</h2>
    <p className="text-gray-600">Manage members for each discipline</p>
    <DisciplineRegister />
  </div>
);

export default DisciplineRoster;

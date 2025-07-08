import { useEffect, useState } from 'react';
import pmfusionAPI from '../src/lib/api';
import { DocumentStatus } from '../constants';

const DocumentControlPage = () => {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    pmfusionAPI.getDocuments().then(setDocs).catch(() => setDocs([]));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Document Control</h1>
      {docs.length === 0 ? (
        <p>No Documents</p>
      ) : (
        <ul className="list-disc pl-5">
          {docs.map(d => (
            <li key={d.id}>{d.title} - {d.status ?? DocumentStatus.DRAFT}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentControlPage;

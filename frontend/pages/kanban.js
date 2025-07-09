import dynamic from 'next/dynamic';

const KanbanBoard = dynamic(() => import('../src/components/KanbanBoard'), { ssr: false });

const KanbanPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kanban</h1>
      <KanbanBoard disciplineId="demo" projectId={null} />
    </div>
  );
};

export default KanbanPage;

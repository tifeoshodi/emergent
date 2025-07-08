import { useEffect, useState } from 'react';
import pmfusionAPI from '../src/lib/api';
import { TaskStatus } from '../constants';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    pmfusionAPI.request('/tasks').then(setTasks).catch(() => setTasks([]));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Tasks</h1>
      {tasks.length === 0 ? (
        <p>No Tasks Found</p>
      ) : (
        <ul className="list-disc pl-5">
          {tasks.map(t => (
            <li key={t.id}>{t.title} - {t.status ?? TaskStatus.TODO}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TasksPage;

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const statuses = ['backlog', 'todo', 'in_progress', 'review_dcc', 'done'];

export default function Kanban() {
  const [columns, setColumns] = useState({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('tasks').select('*');
      const grouped = {};
      statuses.forEach((s) => (grouped[s] = []));
      (data || []).forEach((t) => {
        grouped[t.status || 'backlog'].push(t);
      });
      setColumns(grouped);
    };
    load();
  }, []);

  const onDrop = (e, dest) => {
    const taskId = e.dataTransfer.getData('text');
    const source = e.dataTransfer.getData('source');
    if (!taskId || !source) return;
    const task = columns[source].find((t) => t.id === taskId);
    const newSource = columns[source].filter((t) => t.id !== taskId);
    const newDest = [...columns[dest], task];
    setColumns({
      ...columns,
      [source]: newSource,
      [dest]: newDest,
    });
  };

  const onDragStart = (e, taskId, source) => {
    e.dataTransfer.setData('text', taskId);
    e.dataTransfer.setData('source', source);
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Kanban Board</h1>
      <div style={{ display: 'flex', gap: 8 }}>
        {statuses.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, status)}
            style={{ background: '#f0f0f0', padding: 8, width: 200, minHeight: 300 }}
          >
            <h3>{status}</h3>
            {columns[status]?.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => onDragStart(e, task.id, status)}
                style={{
                  padding: 4,
                  marginBottom: 4,
                  background: 'white',
                  border: '1px solid #ccc',
                }}
              >
                {task.name}
              </div>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}

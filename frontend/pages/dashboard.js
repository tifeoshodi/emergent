import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.rpc('get_dashboard_metrics');
      setMetrics(data || {});
    };
    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Project Dashboard</h1>
      <p>Total Tasks: {metrics.total_tasks || 0}</p>
      <p>Completed Tasks: {metrics.completed_tasks || 0}</p>
    </main>
  );
}

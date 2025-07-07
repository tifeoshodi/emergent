import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function DocumentQueue() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('documents').select('*');
      setDocs(data || []);
    };
    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>Document Queue</h1>
      <ul>
        {docs.map((d) => (
          <li key={d.id}>{d.filename || d.name}</li>
        ))}
      </ul>
    </main>
  );
}

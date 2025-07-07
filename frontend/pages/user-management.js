import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.from('users').select('*');
      if (error) setError(error.message);
      else setUsers(data);
    };
    load();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1>User Management</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid black', padding: 4 }}>Email</th>
            <th style={{ border: '1px solid black', padding: 4 }}>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={{ border: '1px solid black', padding: 4 }}>{u.email}</td>
              <td style={{ border: '1px solid black', padding: 4 }}>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

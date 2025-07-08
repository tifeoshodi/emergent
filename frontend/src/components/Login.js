import React, { useEffect, useState } from 'react';
import pmfusionAPI from '../lib/api';
import { Button, Card, CardHeader, CardTitle, CardContent } from './ui';

const Login = ({ onLogin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    pmfusionAPI
      .request('/users')
      .then((data) => {
        if (isMounted) setUsers(data);
      })
      .catch(() => {
        if (isMounted) setError('Failed to load users');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <p>Loading users...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <Card className="max-w-sm">
      <CardHeader>
        <CardTitle>Select a user</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map((u) => (
          <Button key={u.id} className="w-full" onClick={() => onLogin(u.id)}>
            {u.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default Login;

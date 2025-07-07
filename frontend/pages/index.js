import { useEffect, useState } from 'react';

export default function Home() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'}/api/v2/health`;
    fetch(url)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth({ status: 'error', version: '' }));
  }, []);

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>PMFusion Frontend</h1>
      {health ? (
        <p>Backend status: {health.status} {health.version && `(version ${health.version})`}</p>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}

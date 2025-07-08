import Link from 'next/link';
import { useState, useEffect, createContext, useContext } from 'react';
import pmfusionAPI from '../src/lib/api';

export const AuthContext = createContext({ currentUser: null });

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (storedId) {
      pmfusionAPI.request(`/users/${storedId}`).then(user => setCurrentUser(user)).catch(() => {
        localStorage.removeItem('userId');
      });
    }
  }, []);

  const login = async (id) => {
    const user = await pmfusionAPI.request(`/users/${id}`);
    localStorage.setItem('userId', user.id);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const Home = () => {
  const { currentUser, logout } = useContext(AuthContext);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">PMFusion</h1>
      {currentUser ? (
        <>
          <p>Logged in as {currentUser.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Not logged in</p>
      )}
      <nav className="space-x-4">
        <Link href="/projects">Projects</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/kanban">Kanban</Link>
        <Link href="/document-control">Document Control</Link>
      </nav>
    </div>
  );
};

export default Home;

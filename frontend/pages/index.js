import { useState, useEffect, createContext, useContext } from 'react';
import pmfusionAPI from '../src/lib/api';
import Login from '../src/components/Login';
import RoleBasedDashboard from '../src/components/RoleBasedDashboard';

export const AuthContext = createContext({ currentUser: null });

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
    if (storedId) {
      pmfusionAPI.getUser(storedId)
        .then(user => setCurrentUser(user))
        .catch(() => {
          localStorage.removeItem('userId');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (id) => {
    try {
      const user = await pmfusionAPI.getUser(id);
      localStorage.setItem('userId', user.id);
      setCurrentUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const Home = () => {
  const { currentUser, login, logout, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading PMFusion...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentUser ? (
        <RoleBasedDashboard user={currentUser} onLogout={logout} />
      ) : (
        <Login onLogin={login} />
      )}
    </div>
  );
};

export default Home;

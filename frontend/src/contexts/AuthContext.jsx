import React, { createContext, useState, useContext, useEffect } from 'react';


const API_URL = 'http://localhost:8000/auth/'; 

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

 
  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}current-user/`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData); 
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_URL}login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user); 
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error || 'Identifiants incorrects' };
      }
    } catch (error) {
      return { success: false, error: 'Erreur réseau ou du serveur' };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}logout/`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setUser(null);
     
    }
  };

 
  const hasPermission = (requiredPermission) => {
    if (!user) return false;


    if (user.role === 'admin') return true; 

 
    if (requiredPermission === 'can_edit') {
        return user?.permissions?.can_edit === true;
    }
    if (requiredPermission === 'can_validate') {
        return user?.permissions?.can_validate === true;
    }
    
    if (requiredPermission === user.role) {
        return true;
    }

    return false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import axios, { AxiosError } from 'axios';
import { API_URL } from '../config/constants';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  updateUserBalance: (newBalance: number) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Fetch current user
  const refreshUser = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Initial load
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Register
  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/api/users/register`, {
        username,
        email,
        password,
      });

      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(
        axiosErr.response?.data?.message || 'Registration failed. Please try again.'
      );
      throw err;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/api/users/login`, {
        email,
        password,
      });

      const { token: newToken, user: userData } = res.data;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(
        axiosErr.response?.data?.message || 'Login failed. Please try again.'
      );
      throw err;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user balance manually (optimistic UI)
  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({
        ...user,
        balance: newBalance,
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        updateUserBalance,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

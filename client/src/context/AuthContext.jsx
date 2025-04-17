import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Set auth token in axios headers
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      localStorage.removeItem('token');
    }
  };

  // Load user function
  const loadUser = async () => {
    console.log('AuthContext - Loading user with token:', token ? 'Yes' : 'No');
    if (token) {
      setAuthToken(token);

      try {
        console.log('AuthContext - Fetching user data...');
        const res = await axios.get(`${API_URL}/auth/me`);
        console.log('AuthContext - User data received:', res.data);
        setUser(res.data);
        setIsAuthenticated(true);
        return res.data;
      } catch (err) {
        console.error('Error loading user:', err.response?.data?.msg || err.message);
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthToken(null);
        return null;
      }
    } else {
      console.log('AuthContext - No token available');
      return null;
    }
  };

  // Load user if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      await loadUser();
      setLoading(false);
      console.log('AuthContext - Auth loading complete, authenticated:', isAuthenticated);
    };

    initializeAuth();
  }, [token]);

  // Register user
  const register = async (formData) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Sending registration data:', formData);
      const res = await axios.post(`${API_URL}/auth/register`, formData);

      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setAuthToken(res.data.token);

      navigate('/dashboard');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed');
      return { error: err.response?.data?.msg || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      setLoading(true);
      setError(null);
      console.log('AuthContext - Logging in with:', formData.email);

      const res = await axios.post(`${API_URL}/auth/login`, formData);
      console.log('AuthContext - Login successful, user:', res.data.user);

      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setAuthToken(res.data.token);

      navigate('/dashboard');
      return res.data;
    } catch (err) {
      console.error('AuthContext - Login failed:', err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || 'Login failed');
      return { error: err.response?.data?.msg || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Login with QR code
  const loginWithQR = async (qrData) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(`${API_URL}/auth/login/qr`, { qrData });

      setToken(res.data.token);
      setUser(res.data.user);
      setIsAuthenticated(true);
      setAuthToken(res.data.token);

      navigate('/dashboard');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.msg || 'QR login failed');
      return { error: err.response?.data?.msg || 'QR login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAuthToken(null);
    navigate('/login');
  };

  // Get QR code
  const getQRCode = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/qrcode`);
      return res.data.qrCode;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to get QR code');
      return null;
    }
  };

  // Regenerate QR code
  const regenerateQRCode = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/qrcode/regenerate`);
      return res.data.qrCode;
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to regenerate QR code');
      return null;
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
        register,
        login,
        loginWithQR,
        logout,
        getQRCode,
        regenerateQRCode,
        loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

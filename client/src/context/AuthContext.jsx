import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

const API_URL = '/api';

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

      // Navigate directly to the role-specific dashboard instead of the general dashboard
      if (res.data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (res.data.user.role === 'teacher') {
        navigate('/teacher-dashboard');
      } else if (res.data.user.role === 'student') {
        navigate('/student-dashboard');
      } else {
        navigate('/dashboard');
      }

      return res.data;
    } catch (err) {
      console.error('AuthContext - Login failed:', err.response?.data?.msg || err.message);
      setError(err.response?.data?.msg || 'Login failed');
      return { error: err.response?.data?.msg || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login with QR code
   * @param {string|object} qrData - QR code data (string or object)
   * @returns {Promise<object>} Login result
   */
  const loginWithQR = async (qrData) => {
    try {
      // Update state
      setLoading(true);
      setError(null);

      // Process QR data
      const processedData = await processQRData(qrData);

      // Attempt login
      const authData = await performQRLogin(processedData);

      // Handle successful login
      await handleSuccessfulLogin(authData);

      return authData;
    } catch (err) {
      // Handle login error
      console.error('QR Login error:', err);
      const errorMessage = err.response?.data?.msg || 'QR login failed';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process QR code data
   * @param {string|object} qrData - Raw QR code data
   * @returns {Promise<object>} Processed QR data
   */
  const processQRData = async (qrData) => {
    console.log('Processing QR data:', typeof qrData);

    // If already an object, return as is
    if (typeof qrData === 'object' && qrData !== null) {
      return qrData;
    }

    // Try to parse string as JSON
    if (typeof qrData === 'string') {
      try {
        return JSON.parse(qrData);
      } catch (parseError) {
        console.warn('QR data is not valid JSON, using as-is');
        // Return as-is if not valid JSON
        return qrData;
      }
    }

    // Return as-is for any other type
    return qrData;
  };

  /**
   * Perform QR login API call
   * @param {object} processedData - Processed QR data
   * @returns {Promise<object>} Login response
   */
  const performQRLogin = async (processedData) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login/qr`, { qrData: processedData });
      console.log('QR Login successful:', res.data.user.name);

      // Set token immediately
      setToken(res.data.token);
      setAuthToken(res.data.token);

      return res.data;
    } catch (error) {
      console.error('QR Login API error:', error.response?.data?.msg || error.message);
      throw error;
    }
  };

  /**
   * Handle successful login
   * @param {object} authData - Authentication data from login response
   * @returns {Promise<void>}
   */
  const handleSuccessfulLogin = async (authData) => {
    try {
      // Fetch complete user data
      const userData = await fetchUserData();

      // Set authentication state
      setUser(userData);
      setIsAuthenticated(true);

      // Store in session storage for persistence
      storeAuthDataInSession(userData, authData.token);

      // Navigate to appropriate dashboard
      navigateToDashboard(userData);
    } catch (error) {
      console.warn('Could not fetch complete user data, using login response data');

      // Fall back to login response data
      setUser(authData.user);
      setIsAuthenticated(true);

      // Store in session storage
      storeAuthDataInSession(authData.user, authData.token);

      // Navigate based on login response
      navigateToDashboard(authData.user);
    }
  };

  /**
   * Fetch complete user data
   * @returns {Promise<object>} User data
   */
  const fetchUserData = async () => {
    // Wait for token to be set in headers
    await new Promise(resolve => setTimeout(resolve, 300));

    const userRes = await axios.get(`${API_URL}/auth/me`);
    console.log('Complete user data received');

    return userRes.data;
  };

  /**
   * Store authentication data in session storage
   * @param {object} user - User data
   * @param {string} token - Authentication token
   */
  const storeAuthDataInSession = (user, token) => {
    sessionStorage.setItem('authUser', JSON.stringify(user));
    sessionStorage.setItem('authToken', token);
    console.log('Auth data stored in session storage');
  };

  /**
   * Navigate to appropriate dashboard based on user role
   * @param {object} user - User data with role
   */
  const navigateToDashboard = async (user) => {
    // Wait for state to update
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log('Navigating to dashboard for role:', user.role);

    // Navigate based on role
    switch (user.role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'teacher':
        navigate('/teacher-dashboard');
        break;
      case 'student':
        navigate('/student-dashboard');
        break;
      default:
        navigate('/dashboard');
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

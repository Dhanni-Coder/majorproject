import { toast } from 'react-toastify';

/**
 * Custom hook for displaying toast notifications
 * @returns {Object} Toast notification methods
 */
const useToast = () => {
  /**
   * Show a success toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional toast options
   */
  const success = (message, options = {}) => {
    toast.success(message, {
      icon: '🎉',
      ...options
    });
  };

  /**
   * Show an error toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional toast options
   */
  const error = (message, options = {}) => {
    toast.error(message, {
      icon: '❌',
      ...options
    });
  };

  /**
   * Show an info toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional toast options
   */
  const info = (message, options = {}) => {
    toast.info(message, {
      icon: 'ℹ️',
      ...options
    });
  };

  /**
   * Show a warning toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional toast options
   */
  const warning = (message, options = {}) => {
    toast.warning(message, {
      icon: '⚠️',
      ...options
    });
  };

  /**
   * Show a loading toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Additional toast options
   * @returns {string} Toast ID for updating later
   */
  const loading = (message = 'Loading...', options = {}) => {
    return toast.loading(message, {
      ...options
    });
  };

  /**
   * Update an existing toast notification
   * @param {string} toastId - The ID of the toast to update
   * @param {Object} options - New toast options
   */
  const update = (toastId, options) => {
    toast.update(toastId, options);
  };

  /**
   * Dismiss all toast notifications
   */
  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    update,
    dismissAll
  };
};

export default useToast;

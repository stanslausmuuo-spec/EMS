const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiFetch = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    return res;
  } catch (error) {
    console.error(`API Network Error [${endpoint}]:`, error.message);
    throw new Error('Unable to connect to server. Please ensure the backend server is running.');
  }
};

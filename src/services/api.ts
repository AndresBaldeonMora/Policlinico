import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// AGREGAMOS ESTE INTERCEPTOR (EL "PORTERO")
// ============================================================
api.interceptors.request.use(
  (config) => {
    // 1. Buscamos el token en el 'bolsillo' del navegador
    const token = localStorage.getItem('token'); 
    
    // 2. Si existe, lo pegamos en la frente de la petición
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
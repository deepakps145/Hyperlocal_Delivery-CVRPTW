import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const login = async (credentials: any) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const signup = async (userData: any) => {
  const response = await api.post('/signup', userData);
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/orders/');
  return response.data;
};

export const getRiders = async () => {
  const response = await api.get('/users/?role=rider');
  return response.data;
};

export const createOrder = async (orderData: any) => {
  const response = await api.post('/orders/', orderData);
  return response.data;
};

export const assignOrder = async (orderId: number, riderId: number) => {
  const response = await api.post(`/orders/${orderId}/assign/${riderId}`);
  return response.data;
};

export const getRiderOrders = async (riderId: number) => {
  const response = await api.get(`/riders/${riderId}/orders`);
  return response.data;
};

export const optimizeRoute = async (riderId: number, avoidTraffic: boolean = false) => {
  const response = await api.post(`/optimize/${riderId}?avoid_traffic=${avoidTraffic}`);
  return response.data;
};

export const reportTraffic = async (lat: number, lng: number) => {
  const response = await api.post('/traffic', { lat, lng });
  return response.data;
};

export const updateRiderLocation = async (riderId: number, lat: number, lng: number) => {
  const response = await api.put(`/riders/${riderId}/location`, { lat, lng });
  return response.data;
};

export const autoAssignOrders = async () => {
  const response = await api.post('/orders/auto-assign');
  return response.data;
};

export const cancelOrder = async (orderId: number) => {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data;
};

export const getOrder = async (orderId: number) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
  const response = await api.put(`/orders/${orderId}/status?status=${status}`);
  return response.data;
};

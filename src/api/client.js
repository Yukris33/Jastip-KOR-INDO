import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({ //library axios is used to make HTTP requests to the backend API. The base URL for the API is set to "http://
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// STORES
export const getStores = () => api.get("/stores/");
export const createStore = (data) => api.post("/stores/", data);

// CATEGORIES
export const getCategories = () => api.get("/categories/");
export const createCategory = (data) => api.post("/categories/", data);

// PRODUCTS
export const getProducts = () => api.get("/products/");
export const createProduct = (data) => api.post("/products/", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// ORDERS
export const getOrders = () => api.get("/orders/");
export const createOrder = (data) => api.post("/orders/", data);
export const updateOrderStatus = (id, status) =>
  api.patch(`/orders/${id}/status`, { status });
export const editOrder = (id, data) => api.patch(`/orders/${id}`, data);

export default api;

import axios from "axios";

// Fetch the API URL from environment variables.
const API_BASE_URL = (
    process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000'
).replace(/\/+$/, '');

// Configure the Axios instance.
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    withCredentials: true,
});

// Attach the authentication token to every request.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || localStorage.getItem('customer_token');

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle authentication errors.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired or unauthorized. Clearing storage and redirecting...");

            localStorage.removeItem('token');
            localStorage.removeItem('customer_token');
            localStorage.removeItem('persist:root');

            const isAdminRoute = window.location.pathname.includes('/admin');
            const redirectPath = isAdminRoute ? '/admin' : '/login';

            if (window.location.pathname !== redirectPath) {
                window.location.href = redirectPath;
            }
        }

        return Promise.reject(error);
    }
);

// Fetch the Laravel Sanctum CSRF cookie.
export const getCsrfCookie = () => api.get('/sanctum/csrf-cookie');

export default api;
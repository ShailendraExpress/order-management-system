import { createSlice } from '@reduxjs/toolkit';

// ==========================================
// AUTO-HYDRATION (Page refresh hone par data wapas laane ke liye)
// ==========================================
const adminToken = localStorage.getItem('token');
const adminData = JSON.parse(localStorage.getItem('admin_data')) || null;

const customerToken = localStorage.getItem('customer_token');
const customerData = JSON.parse(localStorage.getItem('customer_data')) || null;

const initialState = {
    // ==========================================
    // 1. ADMIN / STAFF STATE
    // ==========================================
    isAuthenticated: !!adminToken,
    user: adminData,
    isAdmin: !!(adminToken && adminData && adminData.role === 'admin'),
    token: adminToken || '',

    // ==========================================
    // 2. CUSTOMER (FRONTEND) STATE
    // ==========================================
    isCustomerAuthenticated: !!customerToken,
    customer: customerData,
    customerToken: customerToken || ''
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // ==========================================
        // ADMIN REDUCERS
        // ==========================================
        adminLogin(state, action) {
            const user = action.payload.user;
            state.user = user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            if (user.role === 'admin') {
                state.isAdmin = true;
            }
        },
        register(state, action) {
            const user = action.payload.user;
            state.user = user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isAdmin = false;
        },

        // ==========================================
        // CUSTOMER REDUCERS
        // ==========================================
        customerLogin(state, action) {
            state.customer = action.payload.customer;
            state.customerToken = action.payload.token;
            state.isCustomerAuthenticated = true;
        },

        // ==========================================
        // MASTER LOGOUT (For Both Admin & Customer)
        // ==========================================
        globalLogout(state) {
            // Redux State ko zero karein
            state.isAuthenticated = false;
            state.user = null;
            state.isAdmin = false;
            state.token = '';
            
            state.isCustomerAuthenticated = false;
            state.customer = null;
            state.customerToken = '';

            // Browser Memory (LocalStorage) ko completely saaf karein
            localStorage.removeItem('token');
            localStorage.removeItem('admin_data');
            localStorage.removeItem('customer_token');
            localStorage.removeItem('customer_data');
        }
    }
});

export const authActions = authSlice.actions;

export default authSlice;
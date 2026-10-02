// import axios from "axios";
import api from "../../utils/api";
import { authActions } from '../auth-slice';
import { uiActions } from "../ui-slice";


export const login = (payload) => {
    return async dispatch => {
        dispatch(uiActions.loginLoading());
        await api.get('/sanctum/csrf-cookie');

        const postData = async () => {
            const response = await api.post("/api/login", payload);

            const data = await response.data;
            return data;
        };

        try {
            const user = await postData();
            await dispatch(authActions.login(user));
            dispatch(uiActions.loginLoading());
        } catch (error) {
            console.log(error);
        }
    }
};




export const register = (payload) => {
    return async dispatch => {
        dispatch(uiActions.registerLoading())
        await api.get('/sanctum/csrf-cookie');

        const postData = async () => {
            const response = await api.post("/api/register", payload);

            const data = await response.data;
            return data;
        };

        try {
            const user = await postData();
            await dispatch(authActions.register(user));
            dispatch(uiActions.registerLoading());
        } catch (error) {
            console.log(error);
        }
    }
};


export const logout = (token) => {
    return async dispatch => {
        try {
            await api.get('/sanctum/csrf-cookie');

         
            await api.post('/api/logout', null, {
                headers: {
                    Authorization: 'Bearer ' + token
                },
            });
        } catch (error) {
            console.warn("Backend logout warning:", error.message);
        } finally {
            sessionStorage.setItem('logout_toast', 'You have been successfully logged out.');
            dispatch(authActions.globalLogout()); 
        }
    };
};
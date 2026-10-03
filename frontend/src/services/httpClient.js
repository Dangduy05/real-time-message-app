import axios from 'axios';

import {
    handleUnauthorized
} from './authService';

axios.interceptors.response.use(
    (response) => response,
    (error) => {

        if (error?.response?.status === 401) {
            handleUnauthorized();
        }

        return Promise.reject(error);

    }
);

export default axios;

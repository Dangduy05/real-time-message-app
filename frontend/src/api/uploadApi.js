import axios from 'axios';

import {
    getToken
} from '../services/authService';

const API =
    import.meta.env.VITE_API_URL || '';

export const uploadFile =
    async (formData) => {

        const response =
            await axios.post(

                `${API}/api/upload`,

                formData,

                {
                    headers: {
                        Authorization:
                            `Bearer ${getToken()}`
                    }
                }

            );

        return response.data;

    };

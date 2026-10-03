import axios from 'axios';

const API =
    import.meta.env.VITE_API_URL || '';

export const loginApi =
    async (data) => {

        const response =
            await axios.post(

                `${API}/api/auth/login`,

                data

            );

        return response.data;

    };

export const registerApi =
    async (data) => {

        const response =
            await axios.post(

                `${API}/api/auth/register`,

                data

            );

        return response.data;

    };

export const changePasswordApi =
    async (data, token) => {

        const response =
            await axios.put(

                `${API}/api/auth/password`,

                data,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const updateProfileApi =
    async (data, token) => {

        const response =
            await axios.put(

                `${API}/api/auth/profile`,

                data,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

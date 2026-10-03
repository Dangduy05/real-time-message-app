import axios from 'axios';

const API =
    import.meta.env.VITE_API_URL || '';

export const getFriends =
    async (token) => {

        const response =
            await axios.get(

                `${API}/api/friend`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const getPendingRequests =
    async (token) => {

        const response =
            await axios.get(

                `${API}/api/friend/requests`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const searchUsers =
    async (query, token) => {

        const response =
            await axios.get(

                `${API}/api/friend/search`,

                {
                    params: {
                        q: query
                    },
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };
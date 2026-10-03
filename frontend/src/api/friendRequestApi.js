import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '';

export const sendRequest = async (recipientId, token) => {

    const response = await axios.post(
        `${API}/api/friend/request`,
        { recipientId },
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;

};

export const acceptRequest = async (requestId, token) => {

    const response = await axios.put(
        `${API}/api/friend/accept/${requestId}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;

};

export const removeFriend = async (userId, token) => {

    const response = await axios.delete(
        `${API}/api/friend/${userId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    );

    return response.data;

};

import axios from 'axios';

const API =
    import.meta.env.VITE_API_URL || '';

export const getMessages =
    async (
        chatId,
        token
    ) => {

        const response =
            await axios.get(

                `${API}/api/chat/${chatId}/messages`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const createPrivateChat =
    async (
        receiverId,
        token
    ) => {

        const response =
            await axios.post(

                `${API}/api/chat/private`,

                {
                    receiverId
                },

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const createGroup =
    async (
        groupData,
        token
    ) => {

        const response =
            await axios.post(

                `${API}/api/chat/group`,

                groupData,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const getChats =
    async (token) => {

        const response =
            await axios.get(

                `${API}/api/chat`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const getChatMembers =
    async (
        chatId,
        token
    ) => {

        const response =
            await axios.get(

                `${API}/api/chat/${chatId}/members`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const addChatMembers =
    async (
        chatId,
        members,
        token
    ) => {

        const response =
            await axios.post(

                `${API}/api/chat/${chatId}/members`,

                {
                    members
                },

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const removeChatMember =
    async (
        chatId,
        memberId,
        token
    ) => {

        const response =
            await axios.delete(

                `${API}/api/chat/${chatId}/members/${memberId}`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const dissolveGroup =
    async (
        chatId,
        token
    ) => {

        const response =
            await axios.delete(

                `${API}/api/chat/${chatId}`,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

export const updateGroup =
    async (
        chatId,
        groupData,
        token
    ) => {

        const response =
            await axios.put(

                `${API}/api/chat/${chatId}`,

                groupData,

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );

        return response.data;

    };

import { create }
    from 'zustand';

const useChatStore =
    create((set) => ({

        chats: [],

        messages: [],

        activeChat: null,

        unreadCounts: {},

        setChats:
            (chats) => {

                set((state) => ({
                    chats: typeof chats === 'function'
                        ? chats(state.chats)
                        : chats
                }));

            },

        setActiveChat:
            (activeChat) => {

                set((state) => ({
                    activeChat: typeof activeChat === 'function'
                        ? activeChat(state.activeChat)
                        : activeChat
                }));

            },

        setMessages:
            (messages) => {

                set({
                    messages: [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                });

            },

        incrementUnread:
            (chatId) => {

                set((state) => ({
                    unreadCounts: {
                        ...state.unreadCounts,
                        [chatId]: (state.unreadCounts[chatId] || 0) + 1
                    }
                }));

            },

        clearUnread:
            (chatId) => {

                set((state) => {
                    if (!state.unreadCounts[chatId]) {
                        return state;
                    }

                    const next = {
                        ...state.unreadCounts
                    };
                    delete next[chatId];

                    return {
                        unreadCounts: next
                    };
                });

            },

        addMessage:
            (message) => {

                set((state) => {
                    const existing = state.messages.some((item) =>
                        String(item._id || item.id) === String(message._id || message.id)
                    );

                    if (existing) {
                        return state;
                    }

                    return {
                        messages: [...state.messages, message].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    };
                });

            }

    }));

export default useChatStore;

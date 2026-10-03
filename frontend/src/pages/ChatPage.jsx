import {
    useEffect
} from 'react';

import Sidebar
    from '../components/sidebar/Sidebar';

import ChatWindow
    from '../components/chat/ChatWindow';

import {
    getToken
} from '../services/authService';

import {
    getFriends
} from '../api/friendApi';

import {
    getChats
} from '../api/chatApi';

import {
    connectSocket
} from '../services/socket';

import socket from '../services/socket';
import { playSound } from '../services/soundService';

import useAuthStore
    from '../store/authStore';

import useFriendStore
    from '../store/friendStore';

import useChatStore
    from '../store/chatStore';

const ChatPage =
    () => {

        const {
            user,
            setStatus,
            updateUser
        } = useAuthStore();

        const {
            setFriends
        } = useFriendStore();

        const {
            activeChat,
            setActiveChat,
            setChats,
            incrementUnread
        } = useChatStore();

        const refreshChats =
            async () => {

                const token = getToken();

                if (!token || !user?._id) {
                    return;
                }

                const chatRecords =
                    await getChats(token);

                setChats(chatRecords || []);
                setActiveChat((current) => {
                    if (!current) {
                        return current;
                    }

                    const currentId = current._id || current.id;
                    const updated =
                        (chatRecords || []).find((chat) => String(chat._id || chat.id) === String(currentId));

                    return updated ? {
                        ...current,
                        ...updated,
                        members: updated.members || current.members
                    } : current;
                });

                return chatRecords || [];

            };

        const refreshFriends =
            async () => {

                const token = getToken();

                if (!token || !user?._id) {
                    return;
                }

                const friendRecords =
                    await getFriends(token);

                setFriends(
                    friendRecords.map((friend) => {

                        const requesterId =
                            friend.requester?._id
                            || friend.requester?.id;

                        const otherUser =
                            requesterId === user._id
                                ? friend.recipient
                                : friend.requester;

                        return {
                            ...friend,
                            currentUserId: user._id,
                            displayName:
                                otherUser?.fullName
                        };

                    })
                );

            };

        useEffect(() => {
            const token = getToken();

            if (!user?._id || !token) {
                return;
            }

            connectSocket(token);

            if (user.status !== 'online') {
                setStatus('online');
            }

            refreshFriends();
            refreshChats();
        }, [setFriends, setChats, setStatus, user?._id, user?.status]);

        useEffect(() => {
            const handleChatListUpdated = async () => {
                await refreshChats();
            };

            const handleFriendUpdated = async () => {
                await refreshFriends();
                await refreshChats();
            };

            const handleProfileUpdated = async ({ user: updatedUser }) => {
                if (updatedUser?._id && String(updatedUser._id) === String(user._id)) {
                    updateUser(updatedUser);
                }

                await handleFriendUpdated();
            };

            socket.on('chatListUpdated', handleChatListUpdated);
            socket.on('friendRequestUpdated', handleFriendUpdated);
            socket.on('profileUpdated', handleProfileUpdated);

            return () => {
                socket.off('chatListUpdated', handleChatListUpdated);
                socket.off('friendRequestUpdated', handleFriendUpdated);
                socket.off('profileUpdated', handleProfileUpdated);
            };
        }, [user?._id, updateUser]);

        useEffect(() => {
            const handleMessageNotification = ({ chatId, message }) => {
                if (!chatId || !message) {
                    return;
                }

                const activeChatId = activeChat?._id || activeChat?.id;
                if (activeChatId && String(activeChatId) === String(chatId)) {
                    return;
                }

                incrementUnread(String(chatId));
                playSound('ping');
            };

            socket.on('messageNotification', handleMessageNotification);

            return () => {
                socket.off('messageNotification', handleMessageNotification);
            };
        }, [activeChat?._id, activeChat?.id, incrementUnread]);

        return (

            <div className="app-shell">

                <Sidebar onAfterAction={async () => {
                    await refreshFriends();
                    await refreshChats();
                }} />

                <ChatWindow />

            </div>

        );

    };

export default ChatPage;

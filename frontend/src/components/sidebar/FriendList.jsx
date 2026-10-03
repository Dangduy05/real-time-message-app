import { useEffect, useState } from 'react';

import useFriendStore
    from '../../store/friendStore';

import useChatStore
    from '../../store/chatStore';

import socket from '../../services/socket';

import {
    getToken
} from '../../services/authService';

import {
    createPrivateChat,
    getMessages
} from '../../api/chatApi';
import { resolveFileUrl } from '../../utils/fileUrl';

const FriendList = () => {

    const {
        friends
    } = useFriendStore();

    const {
        activeChat,
        chats,
        clearUnread,
        setActiveChat,
        setMessages,
        unreadCounts
    } = useChatStore();

    const [onlineUserIds, setOnlineUserIds] = useState([]);

    const handleSelectFriend =
        async (friend) => {

            const token = getToken();

            if (!token) {
                return;
            }

            const receiver =
                friend.requester?._id === friend.currentUserId
                    ? friend.recipient
                    : friend.requester;

            const receiverId =
                receiver?._id || receiver?.id;

            if (!receiverId) {
                return;
            }

            const chat =
                await createPrivateChat(
                    receiverId,
                    token
                );

            const displayName =
                receiver?.fullName || receiver?.email || 'Friend';

            setActiveChat({
                ...chat,
                displayName,
                selectedFriendId: receiverId,
                selectedFriend: receiver
            });
            clearUnread(String(chat._id || chat.id));

            const messages =
                await getMessages(
                    chat._id || chat.id,
                    token
                );

            setMessages(messages);

        };

    useEffect(() => {
        const handleOnlineUsers = (users) => {
            setOnlineUserIds(users || []);
        };

        socket.on('onlineUsers', handleOnlineUsers);

        return () => {
            socket.off('onlineUsers', handleOnlineUsers);
        };
    }, []);

    return (

        <div className="section">

            {friends.length === 0 ? (
                <div className="text-sm text-slate-400">
                    No friends yet. Accept a request or search for someone to connect.
                </div>
            ) : (
                <>
                <div className="section-title"><span>Direct messages</span></div>
                <div className="list-stack">
                {friends.map((friend) => {
                    const receiver =
                        friend.requester?._id === friend.currentUserId
                            ? friend.recipient
                            : friend.requester;
                    const receiverId =
                        receiver?._id || receiver?.id;
                    const status =
                        onlineUserIds.some((id) => String(id) === String(receiverId))
                            ? 'online'
                            : receiver?.status || 'offline';
                    const isActive =
                        activeChat?.selectedFriendId === receiverId;
                    const avatarUrl =
                        resolveFileUrl(receiver?.avatar);
                    const matchingChat =
                        chats.find((chat) => (
                            chat.type === 'private'
                            && String(chat.selectedFriendId) === String(receiverId)
                        ));
                    const chatId =
                        matchingChat?._id || matchingChat?.id || friend.chatId || friend.privateChatId || null;
                    const unreadCount =
                        chatId ? unreadCounts[String(chatId)] || 0 : 0;

                    return (
                        <div
                            key={friend._id}
                            onClick={() => handleSelectFriend(friend)}
                            className={`list-item cursor-pointer ${isActive ? 'is-active' : ''}`}
                        >
                            <div className="avatar avatar--sm">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={receiver?.fullName || receiver?.email || 'Friend avatar'}
                                        className="avatar-image"
                                    />
                                ) : (
                                    receiver?.fullName?.slice(0, 2) || receiver?.email?.charAt(0)?.toUpperCase()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="truncate-text text-sm font-medium">
                                    {receiver?.fullName || receiver?.email}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className={`status-dot ${status === 'online' ? 'is-online' : ''}`} />
                                    {status === 'online' ? 'Online' : 'Offline'}
                                </div>
                            </div>
                            {unreadCount > 0 && (
                                <span className="unread-badge">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </div>
                    );
                })}
                </div>
                </>
            )}

        </div>

    );

};

export default FriendList;

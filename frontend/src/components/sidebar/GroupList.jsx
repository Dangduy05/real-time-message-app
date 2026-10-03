import { useEffect, useState } from 'react';
import { FiHash } from 'react-icons/fi';

import useChatStore from '../../store/chatStore';
import { getToken } from '../../services/authService';
import { getMessages, getChatMembers } from '../../api/chatApi';
import { resolveFileUrl } from '../../utils/fileUrl';

const GroupList = () => {

    const {
        chats,
        activeChat,
        clearUnread,
        setActiveChat,
        setMessages,
        unreadCounts
    } = useChatStore();

    const [groups, setGroups] = useState([]);

    useEffect(() => {
        setGroups(chats.filter((chat) => chat.type === 'group'));
    }, [chats]);

    const handleSelectGroup = async (group) => {
        const token = getToken();
        if (!token) return;

        const members = await getChatMembers(group._id || group.id, token);
        const messages = await getMessages(group._id || group.id, token);

        setActiveChat({
            ...group,
            members
        });
        clearUnread(String(group._id || group.id));

        setMessages(messages);
    };

    if (groups.length === 0) {
        return (
            <div className="p-4 text-sm text-slate-400">
                No group chats yet.
            </div>
        );
    }

    return (
        <div className="section">
            <div className="section-title"><span>Group chats</span></div>
            <div className="list-stack">
            {groups.map((group) => {
                const isActive = activeChat?.type === 'group' && String(activeChat._id || activeChat.id) === String(group._id || group.id);
                const avatarUrl = resolveFileUrl(group.groupAvatar);
                const unreadCount =
                    unreadCounts[String(group._id || group.id)] || 0;

                return (
                    <button
                        key={group._id || group.id}
                        type="button"
                        onClick={() => handleSelectGroup(group)}
                        className={`list-item ${isActive ? 'is-active' : ''}`}
                    >
                        <div className="avatar avatar--sm">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={group.groupName || 'Group avatar'}
                                    className="avatar-image"
                                />
                            ) : (
                                <FiHash />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate-text text-sm font-medium">{group.groupName || 'Unnamed group'}</div>
                            <div className="text-xs text-slate-400">{group.memberCount || (group.members?.length || 0)} members</div>
                        </div>
                        {unreadCount > 0 && (
                            <span className="unread-badge">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                );
            })}
            </div>
        </div>
    );

};

export default GroupList;

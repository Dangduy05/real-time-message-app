import {
    useEffect,
    useRef,
    useState
} from 'react';
import { FiFileText, FiMessageCircle, FiPhone, FiSettings, FiTrash2, FiUpload, FiUserPlus, FiUsers, FiVideo, FiX } from 'react-icons/fi';

import { getToken } from '../../services/authService';

import { getMessages, getChatMembers, addChatMembers, removeChatMember, dissolveGroup, updateGroup } from '../../api/chatApi';
import { removeFriend } from '../../api/friendRequestApi';
import { uploadFile } from '../../api/uploadApi';

import useAuthStore from '../../store/authStore';
import useFriendStore from '../../store/friendStore';

import ChatBubble
    from './ChatBubble';

import MessageInput
    from './MessageInput';

import TypingIndicator
    from './TypingIndicator';

import socket
    from '../../services/socket';

import useChatStore
    from '../../store/chatStore';
import IncomingCallModal from '../video/IncomingCallModal';
import VideoCall from '../video/VideoCall';
import useVideoCall from '../../hooks/useVideoCall';
import { playSound, stopSound } from '../../services/soundService';
import { resolveFileUrl } from '../../utils/fileUrl';

const ChatWindow = () => {

    const {
        chats,
        messages,
        addMessage,
        activeChat,
        setActiveChat,
        setChats,
        setMessages
    } = useChatStore();

    const { friends } = useFriendStore();
    const { user } = useAuthStore();
    const [typingUser, setTypingUser] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [memberModalOpen, setMemberModalOpen] = useState(false);
    const [memberActionError, setMemberActionError] = useState('');
    const [selectedInvitees, setSelectedInvitees] = useState([]);
    const [groupNameDraft, setGroupNameDraft] = useState('');
    const [groupAvatarDraft, setGroupAvatarDraft] = useState('');
    const [groupSaving, setGroupSaving] = useState(false);
    const [confirmUnfriend, setConfirmUnfriend] = useState(false);
    const [toast, setToast] = useState(null);
    const [callState, setCallState] = useState({
        active: false,
        ringing: false,
        peerId: null,
        audioOnly: false,
        incoming: null
    });

    const currentRoomRef = useRef(null);
    const messagesEndRef = useRef(null);
    const callActiveRef = useRef(false);
    const toastTimerRef = useRef(null);
    const incomingCallTimerRef = useRef(null);

    const {
        stream,
        remoteStream,
        callUser,
        answerCall,
        signalPeer,
        endCall,
        toggleMic,
        toggleCamera,
        micEnabled,
        cameraEnabled
    } = useVideoCall();

    const showToast = (message) => {
        setToast(message);

        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }

        toastTimerRef.current = setTimeout(() => {
            setToast(null);
            toastTimerRef.current = null;
        }, 2600);
    };

    const clearIncomingCallTimer = () => {
        if (incomingCallTimerRef.current) {
            clearTimeout(incomingCallTimerRef.current);
            incomingCallTimerRef.current = null;
        }
    };

    const messageMentionsCurrentUser = (content) => {
        if (!content || !user) {
            return false;
        }

        const normalized = content.toLowerCase();
        const email = user.email?.toLowerCase();
        const emailName = email?.split('@')[0];
        const fullName = user.fullName?.toLowerCase();

        return [email, emailName, fullName]
            .filter(Boolean)
            .some((value) => normalized.includes(`@${value}`));
    };

    const getUserById = (userId) => {
        if (!userId) {
            return null;
        }

        const id = String(userId);

        if (user?._id && String(user._id) === id) {
            return user;
        }

        if (activeChat?.selectedFriendId && String(activeChat.selectedFriendId) === id) {
            return activeChat.selectedFriend || {
                _id: activeChat.selectedFriendId,
                fullName: activeChat.displayName,
                email: activeChat.email,
                avatar: activeChat.avatar
            };
        }

        const activeMember = [
            ...(Array.isArray(groupMembers) ? groupMembers : []),
            ...(Array.isArray(activeChat?.members) ? activeChat.members : [])
        ].find((member) => String(member._id || member.id) === id);

        if (activeMember) {
            return activeMember;
        }

        for (const friend of friends) {
            const requester = friend.requester;
            const recipient = friend.recipient;
            const requesterId = requester?._id || requester?.id;
            const recipientId = recipient?._id || recipient?.id;

            if (String(requesterId) === id) {
                return requester;
            }

            if (String(recipientId) === id) {
                return recipient;
            }
        }

        return chats
            .flatMap((chat) => chat.members || [])
            .find((member) => String(member._id || member.id) === id) || null;
    };

    const getUserDisplayName = (userId) => {
        if (!userId) {
            return '';
        }

        const matchedUser = getUserById(userId);

        return matchedUser?.fullName || matchedUser?.email || String(userId);
    };

    const handleCall = (audioOnly) => {
        if (!activeChat?.selectedFriendId) {
            return;
        }

        const friendId = activeChat.selectedFriendId;

        callActiveRef.current = true;
        setCallState({
            active: true,
            ringing: false,
            peerId: friendId,
            audioOnly,
            incoming: null
        });
        callUser(friendId, audioOnly);
    };

    const handleEndInlineCall = (emit = true) => {
        const peerId = callState.peerId || callState.incoming?.caller;

        callActiveRef.current = false;
        stopSound('incoming');
        playSound('disconnect');
        setCallState({
            active: false,
            ringing: false,
            peerId: null,
            audioOnly: false,
            incoming: null
        });
        endCall(peerId, emit);
    };

    const handleUnfriend = async () => {
        if (!activeChat?.selectedFriendId) {
            return;
        }

        const token = getToken();

        if (!token) {
            return;
        }

        await removeFriend(activeChat.selectedFriendId, token);
        setConfirmUnfriend(false);
        setActiveChat(null);
        setMessages([]);
    };


    useEffect(() => {

        const handleReceiveMessage =
            (message) => {

                const roomId = activeChat?._id || activeChat?.id;
                if (!roomId) return;

                const incomingChatId =
                    message?.chatId?._id ||
                    message?.chatId ||
                    null;

                if (incomingChatId && String(incomingChatId) !== String(roomId)) {
                    return;
                }

                addMessage(message);

                const isOutgoing =
                    String(message.senderId) === String(user?._id);

                if (isOutgoing) {
                    showToast('Message sent');
                } else if (messageMentionsCurrentUser(message.content)) {
                    showToast('You were mentioned');
                    playSound('ping');
                } else {
                    showToast('New message received');
                    playSound('ping');
                }

            };

        socket.on(
            'receiveMessage',
            handleReceiveMessage
        );

        return () => {

            socket.off(
                'receiveMessage',
                handleReceiveMessage
            );

        };

    }, [addMessage, activeChat?._id, user]);

    useEffect(() => {
        const roomId = activeChat?._id || activeChat?.id;

        if (!roomId) {
            if (currentRoomRef.current) {
                socket.emit('leaveRoom', currentRoomRef.current);
                currentRoomRef.current = null;
            }
            return;
        }

        if (currentRoomRef.current && currentRoomRef.current !== roomId) {
            socket.emit('leaveRoom', currentRoomRef.current);
        }

        socket.emit('joinRoom', roomId);
        currentRoomRef.current = roomId;

        return () => {
            if (currentRoomRef.current) {
                socket.emit('leaveRoom', currentRoomRef.current);
                currentRoomRef.current = null;
            }
        };
    }, [activeChat]);

    useEffect(() => {
        const handleIncomingCall = ({ from, caller, signalData, audioOnly }) => {
            const samePeer =
                String(from) === String(callState.peerId);

            if (samePeer && callActiveRef.current) {
                stopSound('incoming');
                answerCall(from, signalData, Boolean(audioOnly));
                setCallState((prev) => ({
                    ...prev,
                    active: true,
                    ringing: false,
                    incoming: null,
                    peerId: from,
                    audioOnly: Boolean(audioOnly)
                }));
                return;
            }

            setCallState({
                active: false,
                ringing: true,
                peerId: from,
                audioOnly: Boolean(audioOnly),
                incoming: {
                    caller: from,
                    callerName: caller?.fullName || caller?.email || getUserDisplayName(from),
                    signalData,
                    audioOnly: Boolean(audioOnly)
                }
            });
            playSound('incoming');
            clearIncomingCallTimer();
            incomingCallTimerRef.current = setTimeout(() => {
                stopSound('incoming');
                socket.emit('endCall', {
                    to: from
                });
                setCallState({
                    active: false,
                    ringing: false,
                    peerId: null,
                    audioOnly: false,
                    incoming: null
                });
                showToast('Missed call');
                incomingCallTimerRef.current = null;
            }, 3 * 60 * 1000);
        };

        const handleCallAccepted = (signal) => {
            signalPeer(signal);
        };

        const handleCallEnded = () => {
            callActiveRef.current = false;
            clearIncomingCallTimer();
            stopSound('incoming');
            playSound('disconnect');
            setCallState({
                active: false,
                ringing: false,
                peerId: null,
                audioOnly: false,
                incoming: null
            });
            endCall(null, false);
        };

        socket.on('incomingCall', handleIncomingCall);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callEnded', handleCallEnded);

        return () => {
            socket.off('incomingCall', handleIncomingCall);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
        };
    }, [answerCall, callState.peerId, endCall, signalPeer]);

    const acceptIncomingCall = () => {
        const incoming = callState.incoming;

        if (!incoming) {
            return;
        }

        callActiveRef.current = true;
        clearIncomingCallTimer();
        stopSound('incoming');
        setCallState({
            active: true,
            ringing: false,
            peerId: incoming.caller,
            audioOnly: incoming.audioOnly,
            incoming: null
        });
        answerCall(incoming.caller, incoming.signalData, incoming.audioOnly);
    };

    const rejectIncomingCall = () => {
        const caller = callState.incoming?.caller;

        clearIncomingCallTimer();
        stopSound('incoming');
        playSound('disconnect');
        setCallState({
            active: false,
            ringing: false,
            peerId: null,
            audioOnly: false,
            incoming: null
        });

        if (caller) {
            socket.emit('endCall', {
                to: caller
            });
        }
    };

    useEffect(() => {
        const loadHistory = async () => {
            const token = getToken();
            const chatId = activeChat?._id || activeChat?.id;
            if (!token || !chatId) return;

            const data = await getMessages(chatId, token);
            setMessages(data);
        };

        if (activeChat) {
            loadHistory().catch(console.error);
        } else {
            setMessages([]);
        }
    }, [activeChat, setMessages]);

    useEffect(() => {
        const loadGroupMembers = async () => {
            if (!activeChat?.type || activeChat.type !== 'group') {
                setGroupMembers([]);
                setSelectedInvitees([]);
                return;
            }

            const token = getToken();
            const chatId = activeChat._id || activeChat.id;
            if (!token || !chatId) return;

            const members = await getChatMembers(chatId, token);
            setGroupMembers(members);
            setGroupNameDraft(activeChat.groupName || '');
            setGroupAvatarDraft(activeChat.groupAvatar || '');
            setActiveChat((prev) => prev ? {
                ...prev,
                members,
                memberCount: members.length
            } : prev);
        };

        loadGroupMembers().catch(console.error);
    }, [activeChat?._id, activeChat?.id, activeChat?.type, setActiveChat]);

    useEffect(() => {
        const handleProfileUpdated = ({ user: updatedUser }) => {
            if (!updatedUser?._id) {
                return;
            }

            setGroupMembers((members) => members.map((member) => (
                String(member._id || member.id) === String(updatedUser._id)
                    ? {
                        ...member,
                        ...updatedUser
                    }
                    : member
            )));

            setActiveChat((prev) => {
                if (!prev) {
                    return prev;
                }

                const selectedFriendId = prev.selectedFriendId;
                const selectedFriendMatches =
                    selectedFriendId && String(selectedFriendId) === String(updatedUser._id);

                return {
                    ...prev,
                    selectedFriend: selectedFriendMatches
                        ? {
                            ...(prev.selectedFriend || {}),
                            ...updatedUser
                        }
                        : prev.selectedFriend,
                    displayName: selectedFriendMatches
                        ? updatedUser.fullName || updatedUser.email || prev.displayName
                        : prev.displayName,
                    members: Array.isArray(prev.members)
                        ? prev.members.map((member) => (
                            String(member._id || member.id) === String(updatedUser._id)
                                ? {
                                    ...member,
                                    ...updatedUser
                                }
                                : member
                        ))
                        : prev.members
                };
            });
        };

        socket.on('profileUpdated', handleProfileUpdated);

        return () => {
            socket.off('profileUpdated', handleProfileUpdated);
        };
    }, [setActiveChat]);

    const handleToggleInvitee = (memberId) => {
        setSelectedInvitees((prev) =>
            prev.includes(memberId)
                ? prev.filter((id) => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleAddGroupMembers = async () => {
        setMemberActionError('');

        const chatId = activeChat?._id || activeChat?.id;
        if (!chatId) {
            setMemberActionError('No active group selected.');
            return;
        }

        if (selectedInvitees.length === 0) {
            setMemberActionError('Select at least one member to add.');
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                setMemberActionError('Unauthorized');
                return;
            }

            const members = await addChatMembers(chatId, selectedInvitees, token);
            setGroupMembers(members);
            setActiveChat((prev) => prev ? {
                ...prev,
                members,
                memberCount: members.length
            } : prev);
            setChats((prevChats) => {
                if (!Array.isArray(prevChats)) return prevChats;
                return prevChats.map((chat) => {
                    if (String(chat._id || chat.id) !== String(chatId)) return chat;
                    return {
                        ...chat,
                        members,
                        memberCount: members.length
                    };
                });
            });
            setSelectedInvitees([]);
            setMemberModalOpen(false);
        } catch (err) {
            setMemberActionError(err?.response?.data?.message || err?.message || 'Unable to add members');
        }
    };

    const handleRemoveGroupMember = async (memberId) => {
        setMemberActionError('');

        const chatId = activeChat?._id || activeChat?.id;
        if (!chatId) {
            setMemberActionError('No active group selected.');
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                setMemberActionError('Unauthorized');
                return;
            }

            const members = await removeChatMember(chatId, memberId, token);
            if (String(memberId) === String(user?._id)) {
                setGroupMembers([]);
                setActiveChat(null);
                setMessages([]);
                setMemberModalOpen(false);
            } else {
                setGroupMembers(members);
                setActiveChat((prev) => prev ? {
                    ...prev,
                    members,
                    memberCount: members.length
                } : prev);
            }
            setChats((prevChats) => {
                if (!Array.isArray(prevChats)) return prevChats;
                return prevChats.map((chat) => {
                    if (String(chat._id || chat.id) !== String(chatId)) return chat;
                    return {
                        ...chat,
                        members,
                        memberCount: members.length
                    };
                });
            });
        } catch (err) {
            setMemberActionError(err?.response?.data?.message || err?.message || 'Unable to remove member');
        }
    };

    const handleDissolveGroup = async () => {
        setMemberActionError('');

        const chatId = activeChat?._id || activeChat?.id;
        if (!chatId) {
            setMemberActionError('No active group selected.');
            return;
        }

        if (!isActiveOwner) {
            setMemberActionError('Only the group owner can dissolve this group.');
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                setMemberActionError('Unauthorized');
                return;
            }

            await dissolveGroup(chatId, token);

            setGroupMembers([]);
            setMessages([]);
            setActiveChat(null);
            setMemberModalOpen(false);
            setChats((prevChats) => {
                if (!Array.isArray(prevChats)) return prevChats;
                return prevChats.filter(
                    (chat) => String(chat._id || chat.id) !== String(chatId)
                );
            });
        } catch (err) {
            setMemberActionError(err?.response?.data?.message || err?.message || 'Unable to dissolve group');
        }
    };

    const handleGroupAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setMemberActionError('');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploaded = await uploadFile(formData);
            setGroupAvatarDraft(uploaded.fileUrl || uploaded.url || '');
        } catch (err) {
            setMemberActionError(err?.response?.data?.message || err?.message || 'Unable to upload group avatar');
        }
    };

    const handleUpdateGroup = async () => {
        setMemberActionError('');

        const chatId = activeChat?._id || activeChat?.id;
        const token = getToken();
        const nextName = groupNameDraft.trim();

        if (!chatId || !token) {
            setMemberActionError('Unauthorized');
            return;
        }

        if (!isActiveOwner) {
            setMemberActionError('Only the group owner can update this group.');
            return;
        }

        if (!nextName) {
            setMemberActionError('Group name cannot be empty.');
            return;
        }

        try {
            setGroupSaving(true);
            const updatedGroup = await updateGroup(
                chatId,
                {
                    groupName: nextName,
                    groupAvatar: groupAvatarDraft
                },
                token
            );

            setActiveChat((prev) => prev ? {
                ...prev,
                ...updatedGroup
            } : prev);
            setChats((prevChats) => {
                if (!Array.isArray(prevChats)) return prevChats;
                return prevChats.map((chat) => (
                    String(chat._id || chat.id) === String(chatId)
                        ? {
                            ...chat,
                            ...updatedGroup
                        }
                        : chat
                ));
            });
            showToast('Group updated');
        } catch (err) {
            setMemberActionError(err?.response?.data?.message || err?.message || 'Unable to update group');
        } finally {
            setGroupSaving(false);
        }
    };

    const groupMemberIds = new Set(groupMembers.map((member) => String(member._id || member.id)));

    const inviteOptions = friends
        .map((friend) => {
            const receiver = friend.requester?._id === user?._id ? friend.recipient : friend.requester;
            const receiverId = receiver?._id || receiver?.id;
            return receiver ? {
                id: receiverId,
                name: receiver.fullName || receiver.email || 'Friend'
            } : null;
        })
        .filter(Boolean)
        .filter((friend) => !groupMemberIds.has(String(friend.id)));

    const isActiveOwner = Boolean(activeChat?.owner && user?._id && String(activeChat.owner) === String(user._id));

    useEffect(() => {

        const handleMessageSeen = ({ messageId, userId }) => {
            if (!activeChat) return;
            // Update local state: mark message as seen-by current user if it matches.
            setMessages(
                messages.map((m) => {
                    if (String(m._id || m.id) !== String(messageId)) return m;
                    const seenBy = Array.isArray(m.seenBy) ? m.seenBy : [];
                    if (!userId) return { ...m };
                    if (seenBy.some((id) => String(id) === String(userId))) return m;
                    return { ...m, seenBy: [...seenBy, userId] };
                })
            );
        };

        const handleTyping = ({ userId }) => {
            if (!activeChat) return;
            if (!user?._id || String(userId) === String(user._id)) return;

            const typingName =
                activeChat.type === 'group'
                    ? 'Someone'
                    : activeChat.displayName || 'Friend';

            setTypingUser(typingName);
        };

        const handleStopTyping = ({ userId }) => {
            if (!activeChat) return;
            if (!user?._id || String(userId) === String(user._id)) return;
            setTypingUser(null);
        };

        socket.on('messageSeen', handleMessageSeen);
        socket.on('userTyping', handleTyping);
        socket.on('userStopTyping', handleStopTyping);

        return () => {
            socket.off('messageSeen', handleMessageSeen);
            socket.off('userTyping', handleTyping);
            socket.off('userStopTyping', handleStopTyping);
        };

    }, [activeChat, messages, setMessages, user?._id]);

    useEffect(() => {
        if (!activeChat || !user?._id) return;

        const chatId = activeChat._id || activeChat.id;
        const roomMessages = messages;

        const incomingUnread = roomMessages.filter((m) => {
            const isOutgoing = String(m.senderId) === String(user._id);
            if (isOutgoing) return false;
            const seenBy = Array.isArray(m.seenBy) ? m.seenBy : [];
            return !seenBy.some((id) => String(id) === String(user._id));
        });

        if (incomingUnread.length === 0) return;

        incomingUnread.forEach((m) => {
            socket.emit('seenMessage', {
                messageId: m._id || m.id,
                chatId
            });
        });
    }, [activeChat, messages, user?._id]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
            clearIncomingCallTimer();
            stopSound('incoming');
        };
    }, []);

    const conversationAvatarUrl =
        activeChat?.type === 'group'
            ? resolveFileUrl(activeChat.groupAvatar)
            : resolveFileUrl(activeChat?.selectedFriend?.avatar || getUserById(activeChat?.selectedFriendId)?.avatar);
    const conversationInitials =
        (activeChat?.displayName || activeChat?.groupName || 'Chat')
            .split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase();
    const groupAvatarPreview =
        resolveFileUrl(groupAvatarDraft);

    return (


        <main className="conversation-panel">

            {activeChat ? (
                <>
                    <div className="conversation-header">
                        <div className="conversation-title">
                            <div className="avatar avatar--sm">
                                {conversationAvatarUrl ? (
                                    <img
                                        src={conversationAvatarUrl}
                                        alt={activeChat.displayName || activeChat.groupName || 'Conversation avatar'}
                                        className="avatar-image"
                                    />
                                ) : (
                                    conversationInitials
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="eyebrow">Conversation</div>
                                <div className="conversation-name truncate-text">
                                    {activeChat.displayName || activeChat.groupName || 'Private chat'}
                                </div>
                                <div className="conversation-meta">
                                    {activeChat.type === 'group' ? 'Group chat' : 'Direct message'}
                                    {activeChat.type === 'group' ? (
                                        <span className="ml-2">• {groupMembers.length || activeChat.memberCount || 0} members</span>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                            <div className="conversation-actions">
                                <div className="hidden text-sm text-slate-400 sm:block">
                                    {messages.length} messages
                                </div>
                                <div className="conversation-actions">
                                    <button
                                        type="button"
                                        onClick={() => handleCall(true)}
                                        className="icon-button"
                                        title="Audio call"
                                    >
                                        <FiPhone />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleCall(false)}
                                        className="icon-button"
                                        title="Video call"
                                    >
                                        <FiVideo />
                                    </button>
                                    {activeChat.type !== 'group' && activeChat.selectedFriendId && (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmUnfriend(true)}
                                            className="icon-button"
                                            title="Remove friend"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    )}
                                </div>
                            </div>
                    </div>
                    {toast && (
                        <div className="chat-toast">
                            {toast}
                        </div>
                    )}
                    {activeChat.type === 'group' && (
                        <div className="member-strip">
                            <div className="pill-row">
                                    {groupMembers.slice(0, 5).map((member) => (
                                        <span
                                            key={member._id || member.id}
                                            className="pill truncate-text"
                                        >
                                            {member.fullName || member.email}
                                        </span>
                                    ))}
                                    {groupMembers.length > 5 && (
                                        <span className="pill">
                                            +{groupMembers.length - 5} more
                                        </span>
                                    )}
                                </div>
                                    <button
                                        type="button"
                                        onClick={() => setMemberModalOpen(true)}
                                        className="secondary-button px-3"
                                    >
                                        {isActiveOwner ? <FiSettings /> : <FiUsers />}
                                        {isActiveOwner ? 'Group settings' : 'Manage members'}
                                    </button>
                        </div>
                    )}

                    <div className="message-list chat-scrollbar">

                        {messages.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-state__icon"><FiMessageCircle /></div>
                                <h2>
                                    No messages yet
                                </h2>
                                <p>
                                    Start the conversation with a message, image, or file attachment.
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <ChatBubble
                                        key={msg._id || msg.id}
                                        message={msg}
                                        sender={getUserById(msg.senderId)}
                                    />
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}

                    </div>

                    <TypingIndicator typingUser={typingUser} />
                    <MessageInput />

                    {(callState.active || callState.ringing) && (
                        <div className="chat-call-overlay">
                            {callState.active ? (
                                <VideoCall
                                    stream={stream}
                                    remoteStream={remoteStream}
                                    audioOnly={callState.audioOnly}
                                    micEnabled={micEnabled}
                                    cameraEnabled={cameraEnabled}
                                    onToggleMic={toggleMic}
                                    onToggleCamera={toggleCamera}
                                    onEnd={() => handleEndInlineCall(true)}
                                />
                            ) : (
                                <IncomingCallModal
                                    caller={callState.incoming?.caller || callState.peerId}
                                    callerName={callState.incoming?.callerName || getUserDisplayName(callState.peerId)}
                                    onAccept={acceptIncomingCall}
                                    onReject={rejectIncomingCall}
                                />
                            )}
                        </div>
                    )}

                    {confirmUnfriend && (
                        <div className="modal-backdrop">
                            <div className="modal-panel max-w-md">
                                <div className="mb-2 text-lg font-bold text-white">Remove friend?</div>
                                <div className="text-sm text-slate-400">
                                    This will remove the friend relation. You can send a new request later.
                                </div>
                                <div className="mt-5 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        className="secondary-button px-4"
                                        onClick={() => setConfirmUnfriend(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="danger-button px-4"
                                        onClick={handleUnfriend}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {memberModalOpen && activeChat?.type === 'group' && (
                        <div className="modal-backdrop">
                            <div className="modal-panel">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-white">
                                            {isActiveOwner ? 'Group settings' : 'Group member management'}
                                        </h2>
                                        <p className="text-sm text-slate-400">
                                            {isActiveOwner
                                                ? 'Update group details, invite friends, or remove members.'
                                                : 'Review members or leave this group.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMemberModalOpen(false);
                                            setMemberActionError('');
                                            setSelectedInvitees([]);
                                        }}
                                        className="icon-button"
                                        title="Close"
                                    >
                                        <FiX />
                                    </button>
                                </div>

                                <div className="grid gap-4">
                                    {isActiveOwner && (
                                        <div className="panel-block">
                                            <div className="mb-3 flex items-center justify-between gap-2">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-100">Group settings</div>
                                                    <div className="text-xs text-slate-400">Update the group name and avatar.</div>
                                                </div>
                                            </div>
                                            <div className="group-settings-row">
                                                <div className="avatar avatar--lg">
                                                    {groupAvatarPreview ? (
                                                        <img
                                                            src={groupAvatarPreview}
                                                            alt={groupNameDraft || 'Group avatar'}
                                                            className="avatar-image"
                                                        />
                                                    ) : (
                                                        <FiUsers />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <label className="block text-sm font-semibold text-slate-100">
                                                        Group name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={groupNameDraft}
                                                        onChange={(event) => setGroupNameDraft(event.target.value)}
                                                        className="mt-2 w-full"
                                                        maxLength={80}
                                                    />
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <label className="secondary-button px-3">
                                                            <FiUpload />
                                                            Change avatar
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleGroupAvatarChange}
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={handleUpdateGroup}
                                                            disabled={groupSaving}
                                                            className="primary-button px-4"
                                                        >
                                                            {groupSaving ? 'Saving...' : 'Save changes'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isActiveOwner && (
                                        <div className="panel-block danger-block">
                                            <div className="mb-2 text-sm font-semibold text-red-100">Danger zone</div>
                                            <div className="mb-3 text-sm text-red-200/80">
                                                Dissolving the group removes all group memberships and messages.
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleDissolveGroup}
                                                className="danger-button px-4"
                                            >
                                                <FiTrash2 />
                                                Dissolve group
                                            </button>
                                        </div>
                                    )}

                                    <div className="panel-block">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <div className="text-sm font-semibold text-slate-100">Current members</div>
                                            <div className="text-xs text-slate-400">{groupMembers.length} members</div>
                                        </div>
                                        <div className="list-stack">
                                            {groupMembers.length === 0 ? (
                                                <div className="text-sm text-slate-400">This group has no members yet.</div>
                                            ) : (
                                                groupMembers.map((member) => {
                                                    const memberId = member._id || member.id;
                                                    const canRemove = isActiveOwner
                                                        ? String(memberId) !== String(user?._id)
                                                        : String(memberId) === String(user?._id);

                                                    return (
                                                        <div
                                                            key={memberId}
                                                            className="list-item"
                                                        >
                                                            <div>
                                                                <div className="text-sm text-slate-200">{member.fullName || member.email}</div>
                                                                <div className="text-xs text-slate-500">{member.email}</div>
                                                            </div>
                                                            {canRemove ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveGroupMember(memberId)}
                                                                    className="danger-button px-3"
                                                                >
                                                                    {String(memberId) === String(user?._id) ? 'Leave' : 'Remove'}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <div className="panel-block">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <div className="text-sm font-semibold text-slate-100">Invite friends</div>
                                            <div className="text-xs text-slate-400">Select friends not already in the group</div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto list-stack">
                                            {inviteOptions.length === 0 ? (
                                                <div className="text-sm text-slate-400">No available friends to invite.</div>
                                            ) : (
                                                inviteOptions.map((friend) => {
                                                    const selected = selectedInvitees.includes(friend.id);
                                                    return (
                                                        <button
                                                            key={friend.id}
                                                            type="button"
                                                            onClick={() => handleToggleInvitee(friend.id)}
                                                            className={`list-item ${selected ? 'is-active' : ''}`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span>{friend.name}</span>
                                                                {selected && <span className="text-xs text-blue-300">Selected</span>}
                                                            </div>
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {memberActionError && (
                                        <div className="text-sm text-red-400">{memberActionError}</div>
                                    )}

                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMemberModalOpen(false);
                                                setMemberActionError('');
                                                setSelectedInvitees([]);
                                            }}
                                            className="secondary-button px-4"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAddGroupMembers}
                                            disabled={selectedInvitees.length === 0}
                                            className="primary-button px-4"
                                        >
                                            <FiUserPlus />
                                            Add to group
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-state__icon"><FiFileText /></div>
                    <h2>Select a conversation</h2>
                    <p>Open a direct message or group from the left sidebar to start chatting.</p>
                    <div className="text-3xl font-semibold text-white mb-4">Select a conversation</div>
                    <div className="max-w-md text-sm leading-6">
                        Open a direct message or group from the left sidebar to start chatting.
                    </div>
                </div>
            )}

        </main>

    );

};

export default ChatWindow;

import { useEffect, useMemo, useState } from 'react';
import { FiCheck, FiPlus, FiSearch, FiUsers, FiX } from 'react-icons/fi';

import { sendRequest, acceptRequest } from '../../api/friendRequestApi';
import { getPendingRequests, searchUsers } from '../../api/friendApi';
import { createGroup } from '../../api/chatApi';
import { getToken, getUser } from '../../services/authService';
import socket from '../../services/socket';
import useFriendStore from '../../store/friendStore';
import useChatStore from '../../store/chatStore';

const FriendActions = ({ onAfterAction }) => {

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searched, setSearched] = useState(false);
    const [searchedQuery, setSearchedQuery] = useState('');
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [error, setError] = useState('');

    const { friends } = useFriendStore();
    const { setActiveChat, setMessages } = useChatStore();
    const currentUser = getUser();

    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [groupError, setGroupError] = useState('');
    const [creatingGroup, setCreatingGroup] = useState(false);

    const friendIds = useMemo(() => {
        return new Set(
            friends.flatMap((friend) => [
                friend.requester?._id || friend.requester?.id,
                friend.recipient?._id || friend.recipient?.id
            ]).filter(Boolean)
        );
    }, [friends]);

    const loadRequests = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const result = await getPendingRequests(token);
            setIncomingRequests(result.incoming || []);
            setOutgoingRequests(result.outgoing || []);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Unable to load requests');
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    useEffect(() => {
        const handleFriendRequestUpdated = async () => {
            await loadRequests();
            onAfterAction?.();
        };

        socket.on('friendRequestUpdated', handleFriendRequestUpdated);

        return () => {
            socket.off('friendRequestUpdated', handleFriendRequestUpdated);
        };
    }, [onAfterAction]);

    const handleSearch = async () => {

        if (!searchQuery.trim()) {
            setSearchResults([]);
            setSearched(false);
            setSearchedQuery('');
            return;
        }

        try {
            setError('');
            setLoadingSearch(true);

            const token = getToken();
            if (!token) {
                setError('Unauthorized');
                return;
            }

            const results = await searchUsers(searchQuery.trim(), token);
            setSearchResults(results || []);
            setSearched(true);
            setSearchedQuery(searchQuery.trim());
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Search failed');
        } finally {
            setLoadingSearch(false);
        }

    };

    const handleSend = async (recipientId) => {

        try {
            setError('');
            setLoadingAction(true);

            const token = getToken();
            if (!token) return;

            await sendRequest(recipientId, token);
            setSearchQuery('');
            setSearchResults([]);
            setSearched(false);
            setSearchedQuery('');
            await loadRequests();
            onAfterAction?.();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Failed');
        } finally {
            setLoadingAction(false);
        }

    };

    const handleAccept = async (requestId) => {

        try {
            setError('');
            setLoadingAction(true);

            const token = getToken();
            if (!token) return;

            await acceptRequest(requestId, token);
            await loadRequests();
            onAfterAction?.();
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || 'Failed');
        } finally {
            setLoadingAction(false);
        }

    };

    const toggleMember = (userId) => {
        setSelectedMembers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreateGroup = async () => {
        setGroupError('');

        const trimmedName = groupName.trim();

        if (!trimmedName) {
            setGroupError('Group name is required.');
            return;
        }

        if (selectedMembers.length === 0) {
            setGroupError('Select at least one friend to invite.');
            return;
        }

        try {
            setCreatingGroup(true);

            const token = getToken();
            if (!token) {
                setGroupError('Unauthorized');
                return;
            }

            const result = await createGroup(
                {
                    groupName: trimmedName,
                    members: selectedMembers
                },
                token
            );

            const groupChat = result.group || result;
            const members = result.members || selectedMembers;

            setActiveChat({
                ...groupChat,
                type: 'group',
                members,
                groupName: groupChat.groupName
            });
            setMessages([]);
            setShowGroupModal(false);
            setGroupName('');
            setSelectedMembers([]);
            onAfterAction?.();
        } catch (e) {
            setGroupError(e?.response?.data?.message || e?.message || 'Unable to create group');
        } finally {
            setCreatingGroup(false);
        }
    };

    return (

        <div className="section">

            <div className="section-title">
                <span>People</span>
                <button
                    type="button"
                    onClick={() => setShowGroupModal(true)}
                    className="icon-button"
                    title="Create group"
                >
                    <FiUsers />
                </button>
            </div>

            <div className="search-row mb-3">
                <input
                    placeholder="Search users by email or name"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSearchResults([]);
                        setSearched(false);
                        setSearchedQuery('');
                    }}
                />
                <button
                    disabled={loadingSearch || !searchQuery.trim()}
                    onClick={handleSearch}
                    className="icon-button"
                    title="Search"
                >
                    <FiSearch />
                </button>
            </div>

            {(searchResults.length > 0 || searched) && (
                <div className="mb-3 list-stack">
                    {searchResults.length === 0 ? (
                        <div className="panel-block text-sm text-slate-400">
                            No users found for "{searchedQuery}".
                        </div>
                    ) : (
                        searchResults.map((user) => {
                            const userId = user._id || user.id;
                            const isCurrentUser = currentUser?._id === userId;
                            const isFriend = friendIds.has(userId);
                            const hasOutgoing = outgoingRequests.some((request) => (request.recipient?._id || request.recipient?.id) === userId);
                            const hasIncoming = incomingRequests.some((request) => (request.requester?._id || request.requester?.id) === userId);
                            const buttonLabel = isCurrentUser
                                ? 'You'
                                : isFriend
                                    ? 'Friend'
                                    : hasOutgoing
                                        ? 'Requested'
                                        : hasIncoming
                                            ? 'Respond'
                                            : 'Send';

                            return (
                                <div
                                    key={user._id}
                                    className="list-item"
                                >
                                    <div className="avatar avatar--sm">
                                        {(user.fullName || user.email || 'U').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate-text text-sm font-medium text-slate-100">{user.fullName || user.email}</div>
                                        <div className="truncate-text text-xs text-slate-400">{user.email}</div>
                                    </div>
                                    <button
                                        disabled={loadingAction || isCurrentUser || isFriend || hasOutgoing || hasIncoming}
                                        onClick={() => handleSend(user._id)}
                                        className={isFriend || hasOutgoing || hasIncoming ? 'secondary-button px-3' : 'primary-button px-3'}
                                    >
                                        {buttonLabel}
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <div className="mb-3">
                <div className="section-title mb-2"><span>Incoming</span></div>
                {incomingRequests.length === 0 ? (
                    <div className="text-xs text-slate-400">No pending requests.</div>
                ) : (
                    incomingRequests.map((request) => (
                        <div
                            key={request._id}
                            className="mb-2 list-item"
                        >
                            <div className="avatar avatar--sm">
                                {(request.requester?.fullName || request.requester?.email || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate-text text-sm font-medium text-slate-100">
                                    {request.requester?.fullName || request.requester?.email}
                                </div>
                                <div className="truncate-text text-xs text-slate-400">{request.requester?.email}</div>
                            </div>
                            <button
                                disabled={loadingAction}
                                onClick={() => handleAccept(request._id)}
                                className="icon-button"
                                title="Accept"
                            >
                                <FiCheck />
                            </button>
                        </div>
                    ))
                )}
            </div>

            <div>
                <div className="section-title mb-2"><span>Outgoing</span></div>
                {outgoingRequests.length === 0 ? (
                    <div className="text-xs text-slate-400">No outgoing requests.</div>
                ) : (
                    outgoingRequests.map((request) => (
                        <div
                            key={request._id}
                            className="mb-2 list-item"
                        >
                            <div className="min-w-0">
                            <div className="truncate-text text-sm font-medium text-slate-100">
                                {request.recipient?.fullName || request.recipient?.email}
                            </div>
                            <div className="truncate-text text-xs text-slate-400">Pending approval</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showGroupModal && (
                <div className="modal-backdrop">
                    <div className="modal-panel max-w-lg">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <div className="text-lg font-semibold text-white">Create group chat</div>
                                <div className="text-sm text-slate-400">Pick a name and invite friends.</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowGroupModal(false);
                                    setGroupError('');
                                }}
                                className="icon-button"
                                title="Close"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-slate-300 mb-1">Group name</label>
                                <input
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-sm text-slate-100"
                                    placeholder="My friends chat"
                                />
                            </div>
                            <div>
                                <div className="mb-2 text-sm text-slate-300">Invite friends</div>
                                <div className="list-stack max-h-48 overflow-y-auto">
                                    {friends.length === 0 ? (
                                        <div className="panel-block text-sm text-slate-500">Add friends first to create a group.</div>
                                    ) : (
                                        friends.map((friend) => {
                                            const receiver =
                                                friend.requester?._id === currentUser?._id
                                                    ? friend.recipient
                                                    : friend.requester;
                                            const receiverId = receiver?._id || receiver?.id;
                                            const name = receiver?.fullName || receiver?.email || 'Friend';
                                            const selected = selectedMembers.includes(receiverId);

                                            return (
                                                <button
                                                    key={receiverId}
                                                    type="button"
                                                    onClick={() => toggleMember(receiverId)}
                                                    className={`list-item ${selected ? 'is-active' : ''}`}
                                                >
                                                    <span>{name}</span>
                                                    {selected && <FiCheck className="text-blue-300" />}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            {groupError && (
                                <div className="text-sm text-red-400">{groupError}</div>
                            )}
                            <div className="flex items-center justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowGroupModal(false);
                                        setGroupError('');
                                    }}
                                    className="secondary-button px-4"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateGroup}
                                    disabled={creatingGroup}
                                    className="primary-button px-4"
                                >
                                    {creatingGroup ? 'Creating...' : <><FiPlus /> Create group</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-3 text-xs text-red-400">{error}</div>
            )}

        </div>

    );

};

export default FriendActions;


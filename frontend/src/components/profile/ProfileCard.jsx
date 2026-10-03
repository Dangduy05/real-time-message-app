import useAuthStore from '../../store/authStore';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';
import { getPendingRequests } from '../../api/friendApi';
import { getToken } from '../../services/authService';
import socket from '../../services/socket';
import { resolveFileUrl } from '../../utils/fileUrl';

const getInitials = (name, email) => (
    (name || email || 'U')
        .split(' ')
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
);

const ProfileCard = ({ compact = false }) => {

    const { user } = useAuthStore();
    const [pendingCount, setPendingCount] = useState(0);
    const [open, setOpen] = useState(false);
    const avatarUrl = resolveFileUrl(user?.avatar);

    const loadPendingCount =
        async () => {

            const token = getToken();

            if (!token) {
                setPendingCount(0);
                return;
            }

            try {
                const result = await getPendingRequests(token);
                setPendingCount((result.incoming || []).length);
            } catch {
                setPendingCount(0);
            }

        };

    useEffect(() => {
        if (!compact) {
            return undefined;
        }

        loadPendingCount();

        const handleUpdate = () => {
            loadPendingCount();
        };

        socket.on('friendRequestUpdated', handleUpdate);

        return () => {
            socket.off('friendRequestUpdated', handleUpdate);
        };
    }, [compact]);

    return (

        <div className={compact ? 'profile-strip' : 'panel-block'}>

            <div className={compact ? 'avatar avatar--sm' : 'avatar avatar--lg'}>
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={user?.fullName || user?.email || 'User avatar'}
                        className="avatar-image"
                    />
                ) : (
                    getInitials(user?.fullName || user?.name, user?.email)
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="truncate-text text-sm font-bold text-white">{user?.fullName || user?.name || 'User'}</div>

                <div className="truncate-text text-xs text-slate-400">{user?.email}</div>
            </div>

            {compact && (
                <div className="relative">
                    <button
                        type="button"
                        className="icon-button"
                        title="Notifications"
                        onClick={() => setOpen((prev) => !prev)}
                    >
                        <FiBell />
                        {pendingCount > 0 && (
                            <span className="notification-badge">{pendingCount}</span>
                        )}
                    </button>
                    {open && (
                        <div className="notification-popover">
                            <div className="text-sm font-bold text-white">Notifications</div>
                            <div className="mt-2 text-sm text-slate-400">
                                {pendingCount > 0
                                    ? `${pendingCount} pending friend request${pendingCount > 1 ? 's' : ''}`
                                    : 'No pending notifications'}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!compact && (
                <div className="mt-5 flex gap-3">

                <Link
                    to="/settings"
                    className="primary-button px-4 py-2"
                >
                    Settings
                </Link>

                <Link
                    to="/chat"
                    className="secondary-button px-4 py-2"
                >
                    Back to chat
                </Link>

                </div>
            )}

        </div>

    );

};

export default ProfileCard;


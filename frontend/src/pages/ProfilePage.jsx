import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCamera, FiSave } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useFriendStore from '../store/friendStore';
import { updateProfileApi } from '../api/authApi';
import { getToken } from '../services/authService';
import { uploadFile } from '../api/uploadApi';
import { resolveFileUrl } from '../utils/fileUrl';

const getInitials =
    (name, email) => (
        (name || email || 'U')
            .split(' ')
            .map((part) => part.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase()
    );

const ProfilePage =
    () => {

        const { user, updateUser } = useAuthStore();
        const { friends } = useFriendStore();
        const [fullName, setFullName] = useState(user?.fullName || '');
        const [bio, setBio] = useState(user?.bio || '');
        const [avatar, setAvatar] = useState(user?.avatar || '');
        const [saving, setSaving] = useState(false);
        const [uploading, setUploading] = useState(false);
        const [message, setMessage] = useState('');
        const [error, setError] = useState('');

        useEffect(() => {
            setFullName(user?.fullName || '');
            setBio(user?.bio || '');
            setAvatar(user?.avatar || '');
        }, [user]);

        const handleAvatarChange =
            async (file) => {

                if (!file) {
                    return;
                }

                try {
                    setError('');
                    setUploading(true);

                    const formData = new FormData();
                    formData.append('file', file);

                    const result = await uploadFile(formData);
                    setAvatar(result.fileUrl);
                } catch (err) {
                    setError(err?.response?.data?.message || err?.message || 'Unable to upload avatar');
                } finally {
                    setUploading(false);
                }

            };

        const handleSave =
            async () => {

                try {
                    setSaving(true);
                    setError('');
                    setMessage('');

                    const token = getToken();
                    const updatedUser =
                        await updateProfileApi(
                            {
                                fullName,
                                bio,
                                avatar
                            },
                            token
                        );

                    updateUser(updatedUser);
                    setMessage('Profile updated.');
                } catch (err) {
                    setError(err?.response?.data?.message || err?.message || 'Unable to update profile');
                } finally {
                    setSaving(false);
                }

            };

        const avatarUrl =
            avatar ? resolveFileUrl(avatar) : '';

        return (

            <div className="settings-shell">

                <div className="w-full max-w-3xl space-y-6">

                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <Link
                                to="/chat"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white"
                            >
                                <span className="text-xl">&lt;</span>
                                <span>Profile</span>
                            </Link>
                            <p className="text-sm text-slate-400">Manage your public name, avatar, and bio.</p>
                        </div>
                    </div>

                    <div className="settings-card">
                        <div className="flex flex-col gap-5 md:flex-row md:items-start">
                            <div className="relative">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar"
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <div className="avatar avatar--lg">
                                        {getInitials(fullName, user?.email)}
                                    </div>
                                )}
                                <label
                                    className="profile-avatar-action"
                                    title="Change avatar"
                                >
                                    <FiCamera />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploading}
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            handleAvatarChange(file);
                                            event.target.value = '';
                                        }}
                                    />
                                </label>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="text-xl font-semibold text-white">{user?.fullName || 'User'}</div>
                                <div className="text-sm text-slate-400">{user?.email || 'No email'}</div>
                                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                                    <span className="rounded-full bg-slate-800 px-3 py-1">Friends: {friends.length}</span>
                                    <span className="rounded-full bg-slate-800 px-3 py-1">Status: {user?.status || 'offline'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4">
                            <div className="panel-block">
                                <label className="block text-sm font-semibold text-white">Display name</label>
                                <input
                                    className="mt-2 w-full"
                                    value={fullName}
                                    onChange={(event) => setFullName(event.target.value)}
                                    placeholder="Display name"
                                />
                            </div>

                            <div className="panel-block">
                                <label className="block text-sm font-semibold text-white">Bio</label>
                                <textarea
                                    className="mt-2 w-full min-h-[110px] resize-y rounded-lg border px-3 py-2"
                                    value={bio}
                                    maxLength={280}
                                    onChange={(event) => setBio(event.target.value)}
                                    placeholder="Write a short bio"
                                />
                                <div className="mt-2 text-xs text-slate-400">{bio.length}/280</div>
                            </div>
                        </div>

                        {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
                        {message && <div className="mt-4 text-sm text-emerald-400">{message}</div>}

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving || uploading || !fullName.trim()}
                                className="primary-button px-4"
                            >
                                <FiSave />
                                {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save profile'}
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        );

    };

export default ProfilePage;

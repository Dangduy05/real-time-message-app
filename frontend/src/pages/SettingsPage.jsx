import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { logout as clearAuth } from '../services/authService';
import { disconnectSocket } from '../services/socket';
import { applyTheme, getTheme } from '../services/themeService';
import { changePasswordApi } from '../api/authApi';

const SettingsPage =
    () => {

        const navigate = useNavigate();
        const { user, token, logout } = useAuthStore();
        const [notifications, setNotifications] = useState(true);
        const [theme, setTheme] = useState(getTheme());
        const [currentPassword, setCurrentPassword] = useState('');
        const [newPassword, setNewPassword] = useState('');
        const [passwordMessage, setPasswordMessage] = useState('');
        const [passwordError, setPasswordError] = useState('');

        const handleLogout =
            () => {

                disconnectSocket();
                logout?.();
                clearAuth();
                navigate('/');

            };

        const handleToggleTheme =
            () => {

                const nextTheme =
                    applyTheme(theme === 'dark' ? 'light' : 'dark');

                setTheme(nextTheme);

            };

        const handleChangePassword =
            async () => {

                try {
                    setPasswordError('');
                    setPasswordMessage('');

                    await changePasswordApi(
                        {
                            currentPassword,
                            newPassword
                        },
                        token
                    );

                    setPasswordMessage('Password changed successfully.');
                    setCurrentPassword('');
                    setNewPassword('');
                } catch (err) {
                    setPasswordError(err?.response?.data?.message || err?.message || 'Unable to change password');
                }

            };

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
                                <span>Settings</span>
                            </Link>
                            <p className="mt-1 text-sm text-slate-400">Account, session, theme, and security settings.</p>
                        </div>
                    </div>

                    <div className="settings-card">
                        <div className="mb-4 text-sm uppercase tracking-[0.22em] text-slate-500">Account</div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="panel-block">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Profile</div>
                                <div className="mt-3 text-sm text-slate-200">{user?.fullName || 'User'}</div>
                                <div className="mt-1 text-sm text-slate-400">{user?.email || 'No email'}</div>
                            </div>
                            <div className="panel-block">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Session</div>
                                <div className="mt-3 text-sm text-slate-200">Token: {token ? `${token.slice(0, 10)}...` : 'N/A'}</div>
                                <div className="mt-1 text-sm text-slate-400">{token ? 'Signed in' : 'Signed out'}</div>
                            </div>
                        </div>

                        <div className="panel-block mt-6">
                            <div className="text-sm font-semibold text-white">Appearance</div>
                            <div className="mt-3 flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-300">Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                                <button
                                    onClick={handleToggleTheme}
                                    className="secondary-button px-4"
                                >
                                    Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                                </button>
                            </div>
                        </div>

                        <div className="panel-block mt-6">
                            <div className="text-sm font-semibold text-white">Notifications</div>
                            <div className="mt-3 flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-300">Enable chat notifications</span>
                                <button
                                    onClick={() => setNotifications((prev) => !prev)}
                                    className={notifications ? 'primary-button px-4' : 'secondary-button px-4'}
                                >
                                    {notifications ? 'On' : 'Off'}
                                </button>
                            </div>
                        </div>

                        <div className="panel-block mt-6">
                            <div className="text-sm font-semibold text-white">Change password</div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <input
                                    type="password"
                                    placeholder="Current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            {passwordError && <div className="mt-3 text-sm text-red-400">{passwordError}</div>}
                            {passwordMessage && <div className="mt-3 text-sm text-emerald-400">{passwordMessage}</div>}
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={handleChangePassword}
                                    disabled={!currentPassword || !newPassword}
                                    className="primary-button px-4"
                                >
                                    Update password
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-slate-400">Sign out to switch to another account.</div>
                            <button
                                onClick={handleLogout}
                                className="danger-button px-5"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                </div>

            </div>

        );

    };

export default SettingsPage;

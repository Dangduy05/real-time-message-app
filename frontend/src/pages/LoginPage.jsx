import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { loginApi } from '../api/authApi';

import { connectSocket } from '../services/socket';

import { getToken, saveToken, saveUser } from '../services/authService';


import useAuthStore from '../store/authStore';

const LoginPage = () => {

    const navigate = useNavigate();

    const { setAuth, user } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {

        const token = getToken();

        if (token) {
            connectSocket(token);
            navigate('/chat');
        }

    }, [navigate]);


    const handleLogin = async () => {

        try {

            setError('');

            const data = await loginApi({
                email,
                password
            });

            saveToken(data.token);
            saveUser({ ...data.user, status: 'online' });

            setAuth({ ...data.user, status: 'online' }, data.token);
            connectSocket(data.token);

            navigate('/chat');

        } catch (err) {

            setError(
                err.response?.data?.message
                || 'Login failed'
            );

        }

    };

    // Kiểm tra nếu đã có user, nếu có thì chuyển hướng đến trang chat
    useEffect(() => {
        if (user) {
            navigate('/chat');
        }
    }, [user, navigate]);

    return (

        <div className="auth-shell">

            <div className="auth-card">

                <div
                    className="mb-2 text-3xl font-black text-white"
                >
                    RealTime Messenger
                </div>
                <div className="mb-6 text-sm text-slate-400">
                    Secure team chat, file sharing, and video calls.
                </div>

                <div
                    className="
          flex
          flex-col
          gap-4
        "
                >

                    <input
                        placeholder="Email"
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                    />

                    <button
                        onClick={handleLogin}
                        className="primary-button w-full px-4"
                    >
                        Login
                    </button>

                    <button
                        onClick={() => {
                            navigate('/register');
                        }}
                        className="secondary-button w-full px-4"
                    >
                        Register
                    </button>

                    {error && (
                        <p className="text-red-400">{error}</p>
                    )}

                </div>

            </div>

        </div>

    );

};

export default LoginPage;

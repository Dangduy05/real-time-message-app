import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { registerApi } from '../api/authApi';
import { connectSocket } from '../services/socket';

import useAuthStore from '../store/authStore';

const RegisterPage = () => {

    const navigate = useNavigate();

    const { setAuth } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRegister = async () => {

        try {

            setError('');

            const data = await registerApi({
                fullName,
                email,
                password
            });

            if (data?.token && data?.user) {
                setAuth({ ...data.user, status: 'online' }, data.token);
                connectSocket(data.token);
                navigate('/chat');
                return;
            }

            setError('Registration succeeded but no token was received');

        } catch (err) {
            setError(err.response?.data?.message || 'Register failed');
        }

    };

    // Nếu đã có token thì chuyển hướng đến trang chat
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/chat');
        }
    }, [navigate]);


    return (

        <div className="auth-shell">

            <div className="auth-card">

                <div
                    className="mb-2 text-3xl font-black text-white"
                >
                    Create account
                </div>
                <div className="mb-6 text-sm text-slate-400">
                    Join your workspace and start messaging in real time.
                </div>

                <div
                    className="
          flex
          flex-col
          gap-4
        "
                >

                    <input
                        placeholder="Full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />

                    <input
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        onClick={handleRegister}
                        className="primary-button w-full px-4"
                    >
                        Create account
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        className="secondary-button w-full px-4"
                    >
                        Back to login
                    </button>

                    {error && <p className="text-red-400">{error}</p>}

                </div>

            </div>

        </div>

    );

};

export default RegisterPage;


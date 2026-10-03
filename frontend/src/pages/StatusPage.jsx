import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiActivity, FiCheckCircle, FiClock, FiDatabase, FiLogIn, FiRefreshCw, FiServer, FiWifi, FiXCircle } from 'react-icons/fi';

import { getToken, getUser } from '../services/authService';
import socket, { connectSocket } from '../services/socket';

const API =
    import.meta.env.VITE_API_URL || '';

const formatUptime =
    (seconds = 0) => {

        const total = Math.floor(seconds);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const secs = total % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }

        if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        }

        return `${secs}s`;

    };

const StatusPill =
    ({ ok, label }) => (

        <span className={`status-pill ${ok ? 'status-pill--ok' : 'status-pill--bad'}`}>
            {ok ? <FiCheckCircle /> : <FiXCircle />}
            {label}
        </span>

    );

const StatusCard =
    ({
        icon,
        title,
        description,
        ok,
        children
    }) => (

        <div className="status-card">
            <div className="status-card__header">
                <div className="status-card__icon">
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="status-card__title">{title}</div>
                    <div className="status-card__description">{description}</div>
                </div>
                <StatusPill
                    ok={ok}
                    label={ok ? 'OK' : 'Issue'}
                />
            </div>
            {children && (
                <div className="status-card__body">
                    {children}
                </div>
            )}
        </div>

    );

const StatusPage =
    () => {

        const [status, setStatus] = useState(null);
        const [metricsOk, setMetricsOk] = useState(false);
        const [socketConnected, setSocketConnected] = useState(socket.connected);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');
        const [lastChecked, setLastChecked] = useState(null);

        const token = getToken();
        const user = getUser();

        const routes = useMemo(() => [
            {
                path: '/',
                label: 'Login'
            },
            {
                path: '/register',
                label: 'Register'
            },
            {
                path: '/chat',
                label: 'Chat'
            },
            {
                path: '/profile',
                label: 'Profile'
            },
            {
                path: '/settings',
                label: 'Settings'
            },
            {
                path: '/status',
                label: 'Status'
            }
        ], []);

        const checkStatus =
            async () => {

                setLoading(true);
                setError('');

                try {
                    const [statusResponse, metricsResponse] =
                        await Promise.allSettled([
                            axios.get(`${API}/api/status`, {
                                timeout: 5000
                            }),
                            axios.get(`${API}/metrics`, {
                                timeout: 5000,
                                responseType: 'text'
                            })
                        ]);

                    if (statusResponse.status === 'fulfilled') {
                        setStatus(statusResponse.value.data);
                    } else {
                        setStatus(null);
                        setError(statusResponse.reason?.message || 'Unable to reach backend status endpoint');
                    }

                    setMetricsOk(metricsResponse.status === 'fulfilled');

                    if (token && !socket.connected) {
                        connectSocket(token);
                    }

                    setLastChecked(new Date());
                } finally {
                    setLoading(false);
                }

            };

        useEffect(() => {
            checkStatus();

            const handleConnect = () => setSocketConnected(true);
            const handleDisconnect = () => setSocketConnected(false);

            socket.on('connect', handleConnect);
            socket.on('disconnect', handleDisconnect);

            return () => {
                socket.off('connect', handleConnect);
                socket.off('disconnect', handleDisconnect);
            };
        }, []);

        const apiOk =
            Boolean(status?.ok);
        const mongoOk =
            Boolean(status?.dependencies?.mongodb?.ok);
        const redisOk =
            Boolean(status?.dependencies?.redis?.ok);
        const socketOk =
            token ? socketConnected : true;

        const checks = [
            apiOk,
            mongoOk,
            redisOk,
            metricsOk,
            socketOk
        ];
        const healthyCount =
            checks.filter(Boolean).length;

        return (

            <main className="status-shell">
                <section className="status-hero">
                    <div>
                        <div className="eyebrow">System status</div>
                        <h1>Application health dashboard</h1>
                        <p>
                            Quick checks for the frontend, backend API, MongoDB, Redis, Socket.IO, metrics, auth session, and main routes.
                        </p>
                    </div>

                    <div className="status-summary">
                        <div className="status-summary__value">
                            {healthyCount}/{checks.length}
                        </div>
                        <div className="status-summary__label">
                            checks healthy
                        </div>
                        <button
                            type="button"
                            onClick={checkStatus}
                            disabled={loading}
                            className="primary-button px-4"
                        >
                            <FiRefreshCw />
                            {loading ? 'Checking...' : 'Refresh'}
                        </button>
                    </div>
                </section>

                {error && (
                    <div className="status-alert">
                        {error}
                    </div>
                )}

                <section className="status-grid">
                    <StatusCard
                        icon={<FiActivity />}
                        title="Frontend"
                        description="React application loaded successfully"
                        ok
                    >
                        <div className="status-kv">
                            <span>Current URL</span>
                            <strong>{window.location.pathname}</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiServer />}
                        title="Backend API"
                        description="Express API status endpoint"
                        ok={apiOk}
                    >
                        <div className="status-kv">
                            <span>Instance</span>
                            <strong>{status?.instance || 'Unavailable'}</strong>
                        </div>
                        <div className="status-kv">
                            <span>Uptime</span>
                            <strong>{status ? formatUptime(status.uptime) : 'Unavailable'}</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiDatabase />}
                        title="MongoDB"
                        description="Primary database connection"
                        ok={mongoOk}
                    >
                        <div className="status-kv">
                            <span>State</span>
                            <strong>{status?.dependencies?.mongodb?.state || 'Unavailable'}</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiDatabase />}
                        title="Redis"
                        description="Cache and Socket.IO Pub/Sub"
                        ok={redisOk}
                    >
                        <div className="status-kv">
                            <span>State</span>
                            <strong>{status?.dependencies?.redis?.state || 'Unavailable'}</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiWifi />}
                        title="Socket.IO"
                        description={token ? 'Authenticated websocket connection' : 'Login required for websocket auth'}
                        ok={socketOk}
                    >
                        <div className="status-kv">
                            <span>Client state</span>
                            <strong>{socketConnected ? 'connected' : token ? 'disconnected' : 'not connected'}</strong>
                        </div>
                        <div className="status-kv">
                            <span>Adapter</span>
                            <strong>{status?.dependencies?.socket?.adapter || 'redis'}</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiActivity />}
                        title="Metrics"
                        description="Prometheus /metrics endpoint"
                        ok={metricsOk}
                    >
                        <div className="status-kv">
                            <span>Endpoint</span>
                            <strong>/metrics</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiLogIn />}
                        title="Auth Session"
                        description="Local JWT and cached user profile"
                        ok={Boolean(token && user)}
                    >
                        <div className="status-kv">
                            <span>User</span>
                            <strong>{user?.email || 'Not logged in'}</strong>
                        </div>
                        <div className="status-kv">
                            <span>Token</span>
                            <strong>{token ? 'present' : 'missing'}</strong>
                        </div>
                    </StatusCard>

                    <StatusCard
                        icon={<FiClock />}
                        title="Last check"
                        description="Most recent refresh time"
                        ok={Boolean(lastChecked)}
                    >
                        <div className="status-kv">
                            <span>Timestamp</span>
                            <strong>{lastChecked ? lastChecked.toLocaleString() : 'Not checked'}</strong>
                        </div>
                    </StatusCard>
                </section>

                <section className="status-routes">
                    <div className="status-section-title">Main pages</div>
                    <div className="status-route-grid">
                        {routes.map((route) => (
                            <Link
                                key={route.path}
                                to={route.path}
                                className="status-route"
                            >
                                <span>{route.label}</span>
                                <code>{route.path}</code>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>

        );

    };

export default StatusPage;

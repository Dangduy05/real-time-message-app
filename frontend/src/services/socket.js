import { io }
    from 'socket.io-client';
import { getToken, handleUnauthorized } from './authService';

const SOCKET_URL =
    import.meta.env.VITE_SOCKET_URL || undefined;

const socket = io(

    SOCKET_URL,

    {
        transports: ['websocket'],
        autoConnect: false,
        auth: {
            token: getToken()
        }
    }

);

export const connectSocket =
    (token = getToken()) => {

        socket.auth = {
            token
        };

        socket.off('connect');
        socket.on('connect', () => {
            socket.emit('userOnline');
        });

        socket.off('connect_error');
        socket.on('connect_error', (err) => {
            if (err?.message === 'Unauthorized' || err?.message === 'jwt malformed' || err?.message === 'invalid token') {
                handleUnauthorized();
            }
        });

        if (socket.connected) {
            socket.emit('userOnline');
            return;
        }

        socket.connect();

    };

export const disconnectSocket =
    () => {

        if (socket.connected) {
            socket.disconnect();
        }

    };

export default socket;

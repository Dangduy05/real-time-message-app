jest.mock('../../backend/src/models/Friend', () => ({
    exists: jest.fn()
}));

const Friend = require('../../backend/src/models/Friend');
const webrtcSocket = require('../../backend/src/socket/webrtcSocket');

const createSocket = (user = { id: 'user-1' }) => {
    const handlers = {};

    return {
        socket: {
            user,
            on: jest.fn((event, handler) => {
                handlers[event] = handler;
            })
        },
        handlers
    };
};

const createIo = () => {
    const emit = jest.fn();

    return {
        emit,
        to: jest.fn(() => ({
            emit
        }))
    };
};

describe('webrtcSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('forwards incoming call only between accepted friends', async () => {
        Friend.exists.mockResolvedValue({
            _id: 'friend-1'
        });

        const io = createIo();
        const { socket, handlers } = createSocket();

        webrtcSocket(io, socket);

        await handlers.callUser({
            to: 'user-2',
            signalData: {
                type: 'offer'
            },
            audioOnly: true
        });

        expect(Friend.exists).toHaveBeenCalledWith({
            status: 'accepted',
            $or: [
                {
                    requester: 'user-1',
                    recipient: 'user-2'
                },
                {
                    requester: 'user-2',
                    recipient: 'user-1'
                }
            ]
        });
        expect(io.to).toHaveBeenCalledWith('user:user-2');
        expect(io.to().emit).toHaveBeenCalledWith(
            'incomingCall',
            {
                from: 'user-1',
                caller: null,
                signalData: {
                    type: 'offer'
                },
                audioOnly: true
            }
        );
    });

    test('does not forward call when users are not friends', async () => {
        Friend.exists.mockResolvedValue(null);

        const io = createIo();
        const { socket, handlers } = createSocket();

        webrtcSocket(io, socket);

        await handlers.callUser({
            to: 'user-2',
            signalData: {
                type: 'offer'
            }
        });

        expect(io.to).not.toHaveBeenCalled();
    });

    test('forwards callAccepted to receiver socket', async () => {
        Friend.exists.mockResolvedValue({
            _id: 'friend-1'
        });

        const io = createIo();
        const { socket, handlers } = createSocket();

        webrtcSocket(io, socket);

        await handlers.answerCall({
            to: 'user-2',
            signal: {
                type: 'answer'
            }
        });

        expect(io.to).toHaveBeenCalledWith('user:user-2');
        expect(io.to().emit).toHaveBeenCalledWith(
            'callAccepted',
            {
                type: 'answer'
            }
        );
    });

    test('forwards endCall to receiver socket', async () => {
        Friend.exists.mockResolvedValue({
            _id: 'friend-1'
        });

        const io = createIo();
        const { socket, handlers } = createSocket();

        webrtcSocket(io, socket);

        await handlers.endCall({
            to: 'user-2'
        });

        expect(io.to().emit).toHaveBeenCalledWith('callEnded');
    });
});

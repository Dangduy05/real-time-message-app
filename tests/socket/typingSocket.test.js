jest.mock('../../backend/src/models/ChatMember', () => ({
    exists: jest.fn()
}));

const ChatMember = require('../../backend/src/models/ChatMember');
const typingSocket = require('../../backend/src/socket/typingSocket');

const createSocket = (user = { id: 'user-1' }) => {
    const handlers = {};
    const emit = jest.fn();
    const to = jest.fn(() => ({
        emit
    }));

    return {
        socket: {
            user,
            on: jest.fn((event, handler) => {
                handlers[event] = handler;
            }),
            to
        },
        handlers,
        emit,
        to
    };
};

describe('typingSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('emits typing event with authenticated user id for chat members', async () => {
        ChatMember.exists.mockResolvedValue({
            _id: 'member-1'
        });

        const { socket, handlers, emit, to } = createSocket();

        typingSocket({}, socket);

        await handlers.typing({
            chatId: 'chat-1',
            userId: 'spoofed-user'
        });

        expect(ChatMember.exists).toHaveBeenCalledWith({
            chatId: 'chat-1',
            userId: 'user-1'
        });
        expect(to).toHaveBeenCalledWith('chat-1');
        expect(emit).toHaveBeenCalledWith(
            'userTyping',
            {
                userId: 'user-1'
            }
        );
    });

    test('does not emit typing when user is not a chat member', async () => {
        ChatMember.exists.mockResolvedValue(null);

        const { socket, handlers, emit } = createSocket();

        typingSocket({}, socket);

        await handlers.typing({
            chatId: 'chat-1'
        });

        expect(emit).not.toHaveBeenCalled();
    });

    test('emits stop typing event for chat members', async () => {
        ChatMember.exists.mockResolvedValue({
            _id: 'member-1'
        });

        const { socket, handlers, emit } = createSocket();

        typingSocket({}, socket);

        await handlers.stopTyping({
            chatId: 'chat-1'
        });

        expect(emit).toHaveBeenCalledWith(
            'userStopTyping',
            {
                userId: 'user-1'
            }
        );
    });
});

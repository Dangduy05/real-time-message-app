jest.mock('../../backend/src/models/Message', () => ({
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn()
}));

jest.mock('../../backend/src/models/ChatMember', () => ({
    exists: jest.fn(),
    find: jest.fn()
}));

const Message = require('../../backend/src/models/Message');
const ChatMember = require('../../backend/src/models/ChatMember');
const chatSocket = require('../../backend/src/socket/chatSocket');

const createSocket = (user = { id: 'user-1' }) => {
    const handlers = {};
    const emit = jest.fn();

    return {
        socket: {
            user,
            on: jest.fn((event, handler) => {
                handlers[event] = handler;
            }),
            join: jest.fn(),
            leave: jest.fn(),
            emit: jest.fn(),
            to: jest.fn(() => ({
                emit
            }))
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

describe('chatSocket', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('allows joining a room only when socket user is a chat member', async () => {
        ChatMember.exists.mockResolvedValue({
            _id: 'member-1'
        });

        const io = createIo();
        const { socket, handlers } = createSocket();

        chatSocket(io, socket);

        await handlers.joinRoom('chat-1');

        expect(ChatMember.exists).toHaveBeenCalledWith({
            chatId: 'chat-1',
            userId: 'user-1'
        });
        expect(socket.join).toHaveBeenCalledWith('chat-1');
    });

    test('does not join a room when socket user is not a chat member', async () => {
        ChatMember.exists.mockResolvedValue(null);

        const io = createIo();
        const { socket, handlers } = createSocket();

        chatSocket(io, socket);

        await handlers.joinRoom('chat-1');

        expect(socket.join).not.toHaveBeenCalled();
    });

    test('creates and broadcasts message only for chat members', async () => {
        const message = {
            _id: 'message-1',
            chatId: 'chat-1',
            senderId: 'user-1',
            content: 'Hello'
        };

        ChatMember.exists.mockResolvedValue({
            _id: 'member-1'
        });
        ChatMember.find.mockResolvedValue([
            {
                userId: 'user-1'
            },
            {
                userId: 'user-2'
            }
        ]);
        Message.create.mockResolvedValue(message);

        const io = createIo();
        const { socket, handlers } = createSocket();

        chatSocket(io, socket);

        await handlers.sendMessage({
            chatId: 'chat-1',
            content: 'Hello'
        });

        expect(Message.create).toHaveBeenCalledWith({
            chatId: 'chat-1',
            senderId: 'user-1',
            type: 'text',
            content: 'Hello'
        });
        expect(socket.emit).toHaveBeenCalledWith(
            'receiveMessage',
            message
        );
        expect(socket.to).toHaveBeenCalledWith('chat-1');
        expect(socket.to().emit).toHaveBeenCalledWith(
            'receiveMessage',
            message
        );
        expect(io.to).toHaveBeenCalledWith('user:user-2');
        expect(io.to().emit).toHaveBeenCalledWith(
            'messageNotification',
            {
                chatId: 'chat-1',
                message
            }
        );
    });

    test('does not mark message seen when user is not a chat member', async () => {
        Message.findById.mockResolvedValue({
            _id: 'message-1',
            chatId: 'chat-1'
        });
        ChatMember.exists.mockResolvedValue(null);

        const io = createIo();
        const { socket, handlers } = createSocket();

        chatSocket(io, socket);

        await handlers.seenMessage({
            messageId: 'message-1'
        });

        expect(Message.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(io.to).not.toHaveBeenCalled();
    });

    test('marks message seen and emits to chat room for members', async () => {
        Message.findById.mockResolvedValue({
            _id: 'message-1',
            chatId: 'chat-1'
        });
        ChatMember.exists.mockResolvedValue({
            _id: 'member-1'
        });

        const io = createIo();
        const { socket, handlers } = createSocket();

        chatSocket(io, socket);

        await handlers.seenMessage({
            messageId: 'message-1'
        });

        expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
            'message-1',
            {
                $addToSet: {
                    seenBy: 'user-1'
                }
            },
            {
                new: true
            }
        );
        expect(io.to).toHaveBeenCalledWith('chat-1');
        expect(io.to().emit).toHaveBeenCalledWith(
            'messageSeen',
            {
                messageId: 'message-1',
                userId: 'user-1',
                chatId: 'chat-1'
            }
        );
    });
});

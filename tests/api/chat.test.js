jest.mock('../../backend/src/models/Chat', () => ({
    create: jest.fn(),
    findById: jest.fn(),
    deleteOne: jest.fn()
}));

jest.mock('../../backend/src/models/Message', () => ({
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    deleteMany: jest.fn()
}));

jest.mock('../../backend/src/models/ChatMember', () => ({
    exists: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn()
}));

const Chat = require('../../backend/src/models/Chat');
const Message = require('../../backend/src/models/Message');
const ChatMember = require('../../backend/src/models/ChatMember');
const chatController = require('../../backend/src/controllers/chatController');

const createResponse = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    return res;
};

describe('chatController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        test('returns 403 when user is not a chat member', async () => {
            ChatMember.exists.mockResolvedValue(null);

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                user: {
                    id: 'user-1'
                },
                body: {
                    content: 'Hello'
                }
            };
            const res = createResponse();

            await chatController.sendMessage(req, res);

            expect(ChatMember.exists).toHaveBeenCalledWith({
                chatId: 'chat-1',
                userId: 'user-1'
            });
            expect(res.status).toHaveBeenCalledWith(403);
            expect(Message.create).not.toHaveBeenCalled();
        });

        test('returns 400 when content is missing', async () => {
            ChatMember.exists.mockResolvedValue({
                _id: 'member-1'
            });

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                user: {
                    id: 'user-1'
                },
                body: {}
            };
            const res = createResponse();

            await chatController.sendMessage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'content is required'
            });
            expect(Message.create).not.toHaveBeenCalled();
        });

        test('creates message for a valid chat member', async () => {
            const message = {
                _id: 'message-1',
                chatId: 'chat-1',
                senderId: 'user-1',
                type: 'text',
                content: 'Hello'
            };

            ChatMember.exists.mockResolvedValue({
                _id: 'member-1'
            });
            Message.create.mockResolvedValue(message);

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                user: {
                    id: 'user-1'
                },
                body: {
                    content: 'Hello'
                }
            };
            const res = createResponse();

            await chatController.sendMessage(req, res);

            expect(Message.create).toHaveBeenCalledWith({
                chatId: 'chat-1',
                senderId: 'user-1',
                type: undefined,
                content: 'Hello'
            });
            expect(res.json).toHaveBeenCalledWith(message);
        });
    });

    describe('getMessages', () => {
        test('returns 403 when user is not a chat member', async () => {
            ChatMember.exists.mockResolvedValue(null);

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                query: {},
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.getMessages(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(Message.find).not.toHaveBeenCalled();
        });

        test('returns messages in chronological order for member', async () => {
            const latestFirst = [
                {
                    _id: 'message-2',
                    content: 'Second'
                },
                {
                    _id: 'message-1',
                    content: 'First'
                }
            ];

            const limit = jest.fn().mockResolvedValue(latestFirst);
            const skip = jest.fn().mockReturnValue({
                limit
            });
            const sort = jest.fn().mockReturnValue({
                skip
            });

            ChatMember.exists.mockResolvedValue({
                _id: 'member-1'
            });
            Message.find.mockReturnValue({
                sort
            });

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                query: {
                    page: '1'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.getMessages(req, res);

            expect(Message.find).toHaveBeenCalledWith({
                chatId: 'chat-1'
            });
            expect(sort).toHaveBeenCalledWith({
                createdAt: -1
            });
            expect(skip).toHaveBeenCalledWith(0);
            expect(limit).toHaveBeenCalledWith(50);
            expect(res.json).toHaveBeenCalledWith([
                {
                    _id: 'message-1',
                    content: 'First'
                },
                {
                    _id: 'message-2',
                    content: 'Second'
                }
            ]);
        });
    });

    describe('createPrivateChat', () => {
        test('returns 400 when receiverId is missing', async () => {
            const req = {
                body: {},
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.createPrivateChat(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(Chat.create).not.toHaveBeenCalled();
        });

        test('creates private chat and memberships', async () => {
            const chat = {
                _id: 'chat-1',
                type: 'private'
            };

            ChatMember.find.mockResolvedValue([]);
            ChatMember.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });
            Chat.create.mockResolvedValue(chat);

            const req = {
                body: {
                    receiverId: 'user-2'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.createPrivateChat(req, res);

            expect(Chat.create).toHaveBeenCalledWith({
                type: 'private'
            });
            expect(ChatMember.create).toHaveBeenCalledWith({
                chatId: 'chat-1',
                userId: 'user-1'
            });
            expect(ChatMember.create).toHaveBeenCalledWith({
                chatId: 'chat-1',
                userId: 'user-2'
            });
            expect(res.json).toHaveBeenCalledWith(chat);
        });
    });

    describe('addChatMembers', () => {
        test('returns 403 when requester is not group owner', async () => {
            Chat.findById.mockResolvedValue({
                _id: 'chat-1',
                type: 'group',
                owner: 'owner-1'
            });

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                body: {
                    members: ['user-2']
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.addChatMembers(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only group owner can add members'
            });
            expect(ChatMember.create).not.toHaveBeenCalled();
        });
    });

    describe('dissolveGroup', () => {
        test('returns 403 when requester is not group owner', async () => {
            Chat.findById.mockResolvedValue({
                _id: 'chat-1',
                type: 'group',
                owner: 'owner-1'
            });

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.dissolveGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(Chat.deleteOne).not.toHaveBeenCalled();
        });

        test('deletes group, memberships, and messages for owner', async () => {
            Chat.findById.mockResolvedValue({
                _id: 'chat-1',
                type: 'group',
                owner: 'owner-1'
            });

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                user: {
                    id: 'owner-1'
                }
            };
            const res = createResponse();

            await chatController.dissolveGroup(req, res);

            expect(ChatMember.deleteMany).toHaveBeenCalledWith({
                chatId: 'chat-1'
            });
            expect(Message.deleteMany).toHaveBeenCalledWith({
                chatId: 'chat-1'
            });
            expect(Chat.deleteOne).toHaveBeenCalledWith({
                _id: 'chat-1'
            });
            expect(res.json).toHaveBeenCalledWith({
                message: 'Group dissolved'
            });
        });
    });

    describe('updateGroup', () => {
        test('returns 403 when requester is not group owner', async () => {
            Chat.findById.mockResolvedValue({
                _id: 'chat-1',
                type: 'group',
                owner: 'owner-1'
            });

            const req = {
                params: {
                    chatId: 'chat-1'
                },
                body: {
                    groupName: 'New name'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await chatController.updateGroup(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Only group owner can update group settings'
            });
        });

        test('updates group name and avatar for owner', async () => {
            const chat = {
                _id: 'chat-1',
                type: 'group',
                owner: 'owner-1',
                groupName: 'Old name',
                groupAvatar: '',
                save: jest.fn()
            };

            Chat.findById.mockResolvedValue(chat);
            chat.save.mockResolvedValue(chat);
            ChatMember.find.mockResolvedValue([
                {
                    userId: 'owner-1'
                },
                {
                    userId: 'user-2'
                }
            ]);

            const emit = jest.fn();
            const to = jest.fn().mockReturnValue({
                emit
            });
            const req = {
                app: {
                    get: jest.fn().mockReturnValue({
                        to
                    })
                },
                params: {
                    chatId: 'chat-1'
                },
                body: {
                    groupName: 'New name',
                    groupAvatar: '/uploads/files/group.png'
                },
                user: {
                    id: 'owner-1'
                }
            };
            const res = createResponse();

            await chatController.updateGroup(req, res);

            expect(chat.groupName).toBe('New name');
            expect(chat.groupAvatar).toBe('/uploads/files/group.png');
            expect(chat.save).toHaveBeenCalled();
            expect(to).toHaveBeenCalledWith('user:owner-1');
            expect(to).toHaveBeenCalledWith('user:user-2');
            expect(res.json).toHaveBeenCalledWith(chat);
        });
    });
});

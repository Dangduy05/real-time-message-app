jest.mock('../../backend/src/models/Friend', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn()
}));

jest.mock('../../backend/src/services/cacheService', () => ({
    cacheFriends: jest.fn(),
    getCachedFriends: jest.fn(),
    invalidateFriends: jest.fn()
}));

const Friend = require('../../backend/src/models/Friend');
const cacheService = require('../../backend/src/services/cacheService');
const friendController = require('../../backend/src/controllers/friendController');

const createResponse = () => {
    const res = {
        status: jest.fn(),
        json: jest.fn()
    };

    res.status.mockReturnValue(res);

    return res;
};

describe('friendController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendRequest', () => {
        test('returns 400 when recipientId is missing', async () => {
            const req = {
                body: {},
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.sendRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(Friend.create).not.toHaveBeenCalled();
        });

        test('returns 400 for self request', async () => {
            const req = {
                body: {
                    recipientId: 'user-1'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.sendRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Cannot send friend request to yourself'
            });
        });

        test('returns 409 when request already exists', async () => {
            Friend.findOne.mockResolvedValue({
                _id: 'friend-1'
            });

            const req = {
                body: {
                    recipientId: 'user-2'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.sendRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(Friend.create).not.toHaveBeenCalled();
        });

        test('creates request when valid', async () => {
            const request = {
                _id: 'friend-1',
                requester: 'user-1',
                recipient: 'user-2',
                status: 'pending'
            };

            Friend.findOne.mockResolvedValue(null);
            Friend.create.mockResolvedValue(request);

            const req = {
                body: {
                    recipientId: 'user-2'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.sendRequest(req, res);

            expect(Friend.create).toHaveBeenCalledWith({
                requester: 'user-1',
                recipient: 'user-2'
            });
            expect(cacheService.invalidateFriends).toHaveBeenCalledWith(
                'user-1',
                'user-2'
            );
            expect(res.json).toHaveBeenCalledWith(request);
        });
    });

    describe('acceptRequest', () => {
        test('returns 404 when request is not pending for user', async () => {
            Friend.findOneAndUpdate.mockResolvedValue(null);

            const req = {
                params: {
                    id: 'friend-1'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.acceptRequest(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Friend request not found'
            });
        });

        test('invalidates both users friend cache when request is accepted', async () => {
            Friend.findOneAndUpdate.mockResolvedValue({
                _id: 'friend-1',
                requester: 'user-2',
                recipient: 'user-1',
                status: 'accepted'
            });

            const req = {
                params: {
                    id: 'friend-1'
                },
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.acceptRequest(req, res);

            expect(cacheService.invalidateFriends).toHaveBeenCalledWith(
                'user-2',
                'user-1'
            );
        });
    });

    describe('getFriends', () => {
        test('returns cached friends when present', async () => {
            const cachedFriends = [
                {
                    _id: 'friend-1'
                }
            ];

            cacheService.getCachedFriends.mockResolvedValue(cachedFriends);

            const req = {
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.getFriends(req, res);

            expect(res.json).toHaveBeenCalledWith(cachedFriends);
            expect(Friend.find).not.toHaveBeenCalled();
        });

        test('queries and caches friends on cache miss', async () => {
            const friends = [
                {
                    _id: 'friend-1'
                }
            ];

            cacheService.getCachedFriends.mockResolvedValue(null);
            Friend.find.mockReturnValue({
                populate: jest.fn().mockResolvedValue(friends)
            });

            const req = {
                user: {
                    id: 'user-1'
                }
            };
            const res = createResponse();

            await friendController.getFriends(req, res);

            expect(cacheService.cacheFriends).toHaveBeenCalledWith(
                'user-1',
                friends
            );
            expect(res.json).toHaveBeenCalledWith(friends);
        });
    });
});

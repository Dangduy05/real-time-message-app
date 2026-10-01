const Friend = require('../models/Friend');
const User = require('../models/User');
const cacheService = require('../services/cacheService');

const emitFriendEvent = async (req, userIds, event, payload) => {
    const io = req.app?.get?.('io');

    if (!io) {
        return;
    }

    userIds
        .filter(Boolean)
        .forEach((userId) => {
            io.to(`user:${userId}`)
                .emit(event, payload);
        });
};

const populateFriendRequest = async (request) => {
    if (request && typeof request.populate === 'function') {
        return request.populate('requester recipient');
    }

    return request;
};

exports.sendRequest =
    async (req, res) => {

        try {

            const {
                recipientId
            } = req.body;

            if (!recipientId) {

                return res.status(400).json({
                    message: 'recipientId is required'
                });

            }

            if (recipientId === req.user.id) {

                return res.status(400).json({
                    message: 'Cannot send friend request to yourself'
                });

            }

            const existingRequest =
                await Friend.findOne({
                    $or: [
                        {
                            requester: req.user.id,
                            recipient: recipientId
                        },
                        {
                            requester: recipientId,
                            recipient: req.user.id
                        }
                    ]
                });

            if (existingRequest) {

                return res.status(409).json({
                    message: 'Friend request already exists'
                });

            }

            const request =
                await Friend.create({
                    requester: req.user.id,
                    recipient: recipientId
                });

            await cacheService.invalidateFriends(
                req.user.id,
                recipientId
            );

            const requesterId = String(request.requester);
            const recipientIdForEvent = String(request.recipient);

            const populatedRequest =
                await populateFriendRequest(request);

            await emitFriendEvent(
                req,
                [requesterId, recipientIdForEvent],
                'friendRequestUpdated',
                {
                    action: 'created',
                    request: populatedRequest
                }
            );

            res.json(populatedRequest);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.getRequests =
    async (req, res) => {

        try {

            const incoming =
                await Friend.find({
                    recipient: req.user.id,
                    status: 'pending'
                })
                    .populate('requester recipient');

            const outgoing =
                await Friend.find({
                    requester: req.user.id,
                    status: 'pending'
                })
                    .populate('requester recipient');

            res.json({
                incoming,
                outgoing
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.searchUsers =
    async (req, res) => {

        try {

            const { q } = req.query;

            if (!q) {
                return res.status(400).json({
                    message: 'Search query is required'
                });
            }

            const users =
                await User.find({
                    _id: { $ne: req.user.id },
                    $or: [
                        {
                            email: {
                                $regex: q,
                                $options: 'i'
                            }
                        },
                        {
                            fullName: {
                                $regex: q,
                                $options: 'i'
                            }
                        }
                    ]
                })
                    .select('_id fullName email avatar status');

            res.json(users);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.acceptRequest =
    async (req, res) => {

        try {

            const request =
                await Friend.findOneAndUpdate(

                    {
                        _id: req.params.id,
                        recipient: req.user.id,
                        status: 'pending'
                    },

                    {
                        status: 'accepted'
                    },

                    {
                        new: true
                    }

                );

            if (!request) {

                return res.status(404).json({
                    message: 'Friend request not found'
                });

            }

            await cacheService.invalidateFriends(
                request.requester,
                request.recipient
            );

            const requesterId = String(request.requester);
            const recipientId = String(request.recipient);

            const populatedRequest =
                await populateFriendRequest(request);

            await emitFriendEvent(
                req,
                [requesterId, recipientId],
                'friendRequestUpdated',
                {
                    action: 'accepted',
                    request: populatedRequest
                }
            );

            res.json(populatedRequest);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.removeFriend =
    async (req, res) => {

        try {

            const otherUserId = req.params.userId;

            if (!otherUserId) {
                return res.status(400).json({
                    message: 'userId is required'
                });
            }

            const removed =
                await Friend.findOneAndDelete({
                    status: 'accepted',
                    $or: [
                        {
                            requester: req.user.id,
                            recipient: otherUserId
                        },
                        {
                            requester: otherUserId,
                            recipient: req.user.id
                        }
                    ]
                });

            if (!removed) {
                return res.status(404).json({
                    message: 'Friend relation not found'
                });
            }

            await cacheService.invalidateFriends(
                req.user.id,
                otherUserId
            );

            await emitFriendEvent(
                req,
                [req.user.id, otherUserId],
                'friendRequestUpdated',
                {
                    action: 'removed',
                    request: removed
                }
            );

            res.json({
                message: 'Friend removed'
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.getFriends =
    async (req, res) => {

        try {

            const cachedFriends =
                await cacheService.getCachedFriends(req.user.id);

            if (cachedFriends) {
                return res.json(cachedFriends);
            }

            const friends =
                await Friend.find({
                    status: 'accepted',
                    $or: [
                        {
                            requester:
                                req.user.id
                        },
                        {
                            recipient:
                                req.user.id
                        }
                    ]
                })
                    .populate(
                        'requester recipient'
                    );

            await cacheService.cacheFriends(
                req.user.id,
                friends
            );

            res.json(friends);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

const Chat =
    require('../models/Chat');

const Message =
    require('../models/Message');

const ChatMember =
    require('../models/ChatMember');

const isChatMember =
    async (chatId, userId) => {

        return ChatMember.exists({
            chatId,
            userId
        });

    };

const getChatMembers =
    async (chatIds) => {

        return ChatMember.find({
            chatId: {
                $in: chatIds
            }
        })
            .populate(
                'userId',
                'fullName email avatar status'
            );

    };

const buildChatResponse =
    (chat, members, currentUserId) => {

        const normalizedMembers = members.map((member) => ({
            _id: member.userId._id,
            fullName: member.userId.fullName,
            email: member.userId.email,
            avatar: member.userId.avatar,
            status: member.userId.status
        }));

        const response = {
            ...chat,
            members: normalizedMembers,
            memberCount: normalizedMembers.length
        };

        if (chat.type === 'private') {
            const otherUser = normalizedMembers.find(
                (member) => String(member._id) !== String(currentUserId)
            );

            if (otherUser) {
                response.displayName =
                    otherUser.fullName || otherUser.email;
                response.selectedFriendId = otherUser._id;
            }
        }

        return response;

    };

const emitChatListUpdated =
    (req, userIds, payload = {}) => {

        const io = req.app?.get?.('io');

        if (!io) {
            return;
        }

        userIds
            .filter(Boolean)
            .forEach((userId) => {
                io.to(`user:${userId}`)
                    .emit('chatListUpdated', payload);
            });

    };

exports.createPrivateChat =
    async (req, res) => {

        try {

            if (!req.body.receiverId) {

                return res.status(400).json({
                    message: 'receiverId is required'
                });

            }

            const existingMemberships =
                await ChatMember.find({
                    userId: req.user.id
                });

            const existingChatIds =
                existingMemberships.map(
                    (member) => member.chatId
                );

            const receiverMembership =
                await ChatMember.findOne({
                    userId: req.body.receiverId,
                    chatId: {
                        $in: existingChatIds
                    }
                }).populate('chatId');

            if (
                receiverMembership
                && receiverMembership.chatId?.type === 'private'
            ) {

                return res.json(receiverMembership.chatId);

            }

            const chat =
                await Chat.create({

                    type: 'private'

                });

            await ChatMember.create({

                chatId: chat._id,

                userId: req.user.id

            });

            await ChatMember.create({

                chatId: chat._id,

                userId:
                    req.body.receiverId

            });

            res.json(chat);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.createGroup =
    async (req, res) => {

        try {

            if (!req.body.groupName || !Array.isArray(req.body.members)) {

                return res.status(400).json({
                    message: 'groupName and members are required'
                });

            }

            const uniqueMembers = Array.from(
                new Set([
                    ...req.body.members,
                    req.user.id
                ].filter(Boolean))
            );

            const group =
                await Chat.create({

                    type: 'group',

                    groupName:
                        req.body.groupName,

                    owner: req.user.id

                });

            const createdMembers = [];

            for (const memberId of uniqueMembers) {

                const membership =
                    await ChatMember.create({

                        chatId: group._id,

                        userId: memberId

                    });

                createdMembers.push(membership.userId);

            }

            const response = {
                group,
                members: createdMembers
            };

            emitChatListUpdated(
                req,
                uniqueMembers,
                {
                    action: 'groupCreated',
                    chatId: group._id
                }
            );

            res.json(response);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.getChats =
    async (req, res) => {

        try {

            const memberships =
                await ChatMember.find({
                    userId: req.user.id
                }).populate('chatId');

            const chatIds =
                memberships
                    .map((membership) => membership.chatId?._id)
                    .filter(Boolean);

            const allMembers =
                await getChatMembers(chatIds);

            const groupedMembers =
                allMembers.reduce((acc, member) => {
                    const key = String(member.chatId);
                    acc[key] = acc[key] || [];
                    acc[key].push(member);
                    return acc;
                }, {});

            const chats =
                memberships
                    .map((membership) => {
                        const chat = membership.chatId;
                        if (!chat) return null;
                        const members =
                            groupedMembers[String(chat._id)] || [];
                        return buildChatResponse(
                            chat.toObject(),
                            members,
                            req.user.id
                        );
                    })
                    .filter(Boolean);

            res.json(chats);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.getChatMembers =
    async (req, res) => {

        try {

            const member =
                await isChatMember(
                    req.params.chatId,
                    req.user.id
                );

            if (!member) {
                return res.status(403).json({
                    message: 'Forbidden'
                });
            }

            const members =
                await ChatMember.find({
                    chatId: req.params.chatId
                }).populate(
                    'userId',
                    'fullName email avatar status'
                );

            const normalizedMembers =
                members.map((m) => ({
                    _id: m.userId._id,
                    fullName: m.userId.fullName,
                    email: m.userId.email,
                    avatar: m.userId.avatar,
                    status: m.userId.status
                }));

            res.json(normalizedMembers);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.addChatMembers =
    async (req, res) => {

        try {

            if (!Array.isArray(req.body.members)) {
                return res.status(400).json({
                    message: 'members array is required'
                });
            }

            const chat =
                await Chat.findById(req.params.chatId);

            if (!chat || chat.type !== 'group') {
                return res.status(400).json({
                    message: 'Group chat not found'
                });
            }

            if (String(chat.owner) !== String(req.user.id)) {
                return res.status(403).json({
                    message: 'Only group owner can add members'
                });
            }

            const uniqueMembers = Array.from(
                new Set(req.body.members.filter(Boolean))
            );

            const existing =
                await ChatMember.find({
                    chatId: req.params.chatId,
                    userId: {
                        $in: uniqueMembers
                    }
                });

            const existingIds =
                existing.map((item) => String(item.userId));

            const toAdd =
                uniqueMembers.filter(
                    (id) => !existingIds.includes(String(id))
                );

            for (const newMemberId of toAdd) {
                await ChatMember.create({
                    chatId: req.params.chatId,
                    userId: newMemberId
                });
            }

            const members =
                await ChatMember.find({
                    chatId: req.params.chatId
                }).populate(
                    'userId',
                    'fullName email avatar status'
                );

            const normalizedMembers =
                members.map((m) => ({
                    _id: m.userId._id,
                    fullName: m.userId.fullName,
                    email: m.userId.email,
                    avatar: m.userId.avatar,
                    status: m.userId.status
                }));

            emitChatListUpdated(
                req,
                members.map((m) => m.userId?._id || m.userId),
                {
                    action: 'membersAdded',
                    chatId: req.params.chatId
                }
            );

            res.json(normalizedMembers);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.dissolveGroup =
    async (req, res) => {

        try {

            const chat =
                await Chat.findById(req.params.chatId);

            if (!chat || chat.type !== 'group') {
                return res.status(400).json({
                    message: 'Group chat not found'
                });
            }

            if (String(chat.owner) !== String(req.user.id)) {
                return res.status(403).json({
                    message: 'Only group owner can dissolve group'
                });
            }

            const memberships =
                await ChatMember.find({
                    chatId: req.params.chatId
                });

            const affectedUserIds =
                memberships.map((member) => member.userId);

            await ChatMember.deleteMany({
                chatId: req.params.chatId
            });

            await Message.deleteMany({
                chatId: req.params.chatId
            });

            await Chat.deleteOne({
                _id: req.params.chatId
            });

            res.json({
                message: 'Group dissolved'
            });

            emitChatListUpdated(
                req,
                affectedUserIds,
                {
                    action: 'groupDissolved',
                    chatId: req.params.chatId
                }
            );

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.updateGroup =
    async (req, res) => {

        try {

            const chat =
                await Chat.findById(req.params.chatId);

            if (!chat || chat.type !== 'group') {
                return res.status(400).json({
                    message: 'Group chat not found'
                });
            }

            if (String(chat.owner) !== String(req.user.id)) {
                return res.status(403).json({
                    message: 'Only group owner can update group settings'
                });
            }

            const groupName =
                typeof req.body.groupName === 'string'
                    ? req.body.groupName.trim()
                    : undefined;

            const groupAvatar =
                typeof req.body.groupAvatar === 'string'
                    ? req.body.groupAvatar.trim()
                    : undefined;

            if (groupName !== undefined) {
                if (!groupName) {
                    return res.status(400).json({
                        message: 'groupName cannot be empty'
                    });
                }

                chat.groupName = groupName;
            }

            if (groupAvatar !== undefined) {
                chat.groupAvatar = groupAvatar;
            }

            await chat.save();

            const members =
                await ChatMember.find({
                    chatId: req.params.chatId
                });

            emitChatListUpdated(
                req,
                members.map((member) => member.userId),
                {
                    action: 'groupUpdated',
                    chatId: req.params.chatId
                }
            );

            res.json(chat);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.removeChatMember =
    async (req, res) => {

        try {

            const chat =
                await Chat.findById(req.params.chatId);

            if (!chat || chat.type !== 'group') {
                return res.status(400).json({
                    message: 'Group chat not found'
                });
            }

            const currentMember =
                await isChatMember(
                    req.params.chatId,
                    req.user.id
                );

            if (!currentMember) {
                return res.status(403).json({
                    message: 'Forbidden'
                });
            }

            const memberId = req.params.memberId;

            if (String(memberId) !== String(req.user.id) && String(chat.owner) !== String(req.user.id)) {
                return res.status(403).json({
                    message: 'Only group owner can remove other members'
                });
            }

            if (String(memberId) === String(req.user.id) && String(chat.owner) === String(req.user.id)) {
                return res.status(400).json({
                    message: 'Group owner cannot leave without transferring ownership'
                });
            }

            await ChatMember.deleteOne({
                chatId: req.params.chatId,
                userId: memberId
            });

            const members =
                await ChatMember.find({
                    chatId: req.params.chatId
                }).populate(
                    'userId',
                    'fullName email avatar status'
                );

            const normalizedMembers =
                members.map((m) => ({
                    _id: m.userId._id,
                    fullName: m.userId.fullName,
                    email: m.userId.email,
                    avatar: m.userId.avatar,
                    status: m.userId.status
                }));

            emitChatListUpdated(
                req,
                [
                    memberId,
                    ...members.map((m) => m.userId?._id || m.userId)
                ],
                {
                    action: 'memberRemoved',
                    chatId: req.params.chatId
                }
            );

            res.json(normalizedMembers);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.sendMessage =
    async (req, res) => {

        try {

            const member =
                await isChatMember(
                    req.params.chatId,
                    req.user.id
                );

            if (!member) {

                return res.status(403).json({
                    message: 'Forbidden'
                });

            }

            if (!req.body.content) {

                return res.status(400).json({
                    message: 'content is required'
                });

            }

            const message =
                await Message.create({

                    chatId:
                        req.params.chatId,

                    senderId:
                        req.user.id,

                    type:
                        req.body.type,

                    content:
                        req.body.content

                });

            res.json(message);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };
exports.getMessages =
    async (req, res) => {

        try {

            const member =
                await isChatMember(
                    req.params.chatId,
                    req.user.id
                );

            if (!member) {

                return res.status(403).json({
                    message: 'Forbidden'
                });

            }

            const page =
                Number(req.query.page)
                || 1;

            const limit = 50;

            const messages =
                await Message.find({

                    chatId:
                        req.params.chatId

                })
                    .sort({
                        createdAt: -1
                    })
                    .skip((page - 1) * limit)
                    .limit(limit);

            res.json(
                messages.reverse()
            );

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

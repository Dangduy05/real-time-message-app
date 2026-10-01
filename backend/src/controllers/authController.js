const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User =
    require('../models/User');
const Friend =
    require('../models/Friend');
const ChatMember =
    require('../models/ChatMember');
const cacheService =
    require('../services/cacheService');

const isValidEmail =
    (email) => {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    };

exports.register =
    async (req, res) => {

        try {

            const {
                fullName,
                email: rawEmail,
                password
            } = req.body;
            const email = rawEmail?.trim().toLowerCase();

            if (!fullName || !email || !password) {

                return res.status(400).json({
                    message: 'fullName, email and password are required'
                });

            }

            if (!isValidEmail(email)) {

                return res.status(400).json({
                    message: 'Invalid email'
                });

            }

            if (password.length < 6) {

                return res.status(400).json({
                    message: 'Password must be at least 6 characters'
                });

            }

            const existingUser =
                await User.findOne({ email });

            if (existingUser) {

                return res.status(400)
                    .json({
                        message:
                            'Email already exists'
                    });

            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user =
                await User.create({

                    fullName,

                    email,

                    password:
                        hashedPassword

                });

            const token = jwt.sign(
                {
                    id: user._id
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '1d'
                }
            );

            const safeUser = user.toObject();
            delete safeUser.password;

            res.status(201)
                .json({
                    token,
                    user: safeUser
                });



        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.login =
    async (req, res) => {

        try {

            const {
                email: rawEmail,
                password
            } = req.body;
            const email = rawEmail?.trim().toLowerCase();

            if (!email || !password) {

                return res.status(400).json({
                    message: 'email and password are required'
                });

            }

            if (!isValidEmail(email)) {

                return res.status(400).json({
                    message: 'Invalid email'
                });

            }

            const user =
                await User.findOne({ email });

            if (!user) {

                return res.status(404)
                    .json({
                        message:
                            'User not found'
                    });

            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {

                return res.status(401)
                    .json({
                        message:
                            'Invalid credentials'
                    });

            }

            const token =
                jwt.sign(
                    {
                        id: user._id
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: '1d'
                    }
                );

            const safeUser = user.toObject();
            delete safeUser.password;

            res.json({
                token,
                user: safeUser
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.changePassword =
    async (req, res) => {

        try {

            const {
                currentPassword,
                newPassword
            } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    message: 'currentPassword and newPassword are required'
                });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({
                    message: 'Password must be at least 6 characters'
                });
            }

            const user =
                await User.findById(req.user.id);

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            const isMatch =
                await bcrypt.compare(currentPassword, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    message: 'Current password is incorrect'
                });
            }

            user.password =
                await bcrypt.hash(newPassword, 10);

            await user.save();

            res.json({
                message: 'Password changed'
            });

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

exports.updateProfile =
    async (req, res) => {

        try {

            const {
                fullName,
                avatar,
                bio
            } = req.body;

            const updates = {};

            if (typeof fullName === 'string') {
                const trimmedName = fullName.trim();

                if (!trimmedName) {
                    return res.status(400).json({
                        message: 'fullName cannot be empty'
                    });
                }

                updates.fullName = trimmedName;
            }

            if (typeof avatar === 'string') {
                updates.avatar = avatar.trim();
            }

            if (typeof bio === 'string') {
                if (bio.length > 280) {
                    return res.status(400).json({
                        message: 'Bio must be 280 characters or fewer'
                    });
                }

                updates.bio = bio.trim();
            }

            const user =
                await User.findByIdAndUpdate(
                    req.user.id,
                    updates,
                    {
                        new: true,
                        runValidators: true
                    }
                ).select('-password');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            const friendRelations =
                await Friend.find({
                    status: 'accepted',
                    $or: [
                        {
                            requester: req.user.id
                        },
                        {
                            recipient: req.user.id
                        }
                    ]
                });

            const chatMemberships =
                await ChatMember.find({
                    userId: req.user.id
                });

            const relatedChatMembers =
                await ChatMember.find({
                    chatId: {
                        $in: chatMemberships.map((member) => member.chatId)
                    }
                });

            const relatedUserIds =
                Array.from(new Set([
                    req.user.id,
                    ...friendRelations.flatMap((relation) => [
                        relation.requester,
                        relation.recipient
                    ]),
                    ...relatedChatMembers.map((member) => member.userId)
                ].filter(Boolean).map(String)));

            await cacheService.invalidateFriends(...relatedUserIds);
            await cacheService.cacheUser(user);

            const io = req.app?.get?.('io');
            if (io) {
                relatedUserIds.forEach((userId) => {
                    io.to(`user:${userId}`)
                        .emit('profileUpdated', {
                            user
                        });
                });
            }

            res.json(user);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };

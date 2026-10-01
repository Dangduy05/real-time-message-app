const jwt = require('jsonwebtoken');

const User =
    require('../models/User');

module.exports =
    async (req, res, next) => {

        try {

            const token =
                req.headers.authorization
                    ?.split(' ')[1];

            if (!token) {

                return res.status(401)
                    .json({
                        message:
                            'Unauthorized'
                    });

            }

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            req.user = decoded;

            const userId = decoded.id || decoded._id;

            if (!userId) {
                return res.status(401).json({
                    message: 'Invalid Token'
                });
            }

            const exists =
                await User.exists({
                    _id: userId
                });

            if (!exists) {
                return res.status(401).json({
                    message: 'Invalid Token'
                });
            }

            next();

        } catch (err) {

            res.status(401).json({
                message: 'Invalid Token'
            });

        }

    };

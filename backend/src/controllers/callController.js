const Call = require('../models/Call');

exports.saveCall =
    async (req, res) => {

        try {

            const call =
                await Call.create({

                    caller:
                        req.user.id,

                    receiver:
                        req.body.receiverId,

                    type:
                        req.body.type,

                    status:
                        req.body.status

                });

            res.json(call);

        } catch (err) {

            res.status(500).json({
                error: err.message
            });

        }

    };
    
const Friend =
    require('../models/Friend');

const User =
    require('../models/User');

const canContact =
    async (from, to) => {

        return Friend.exists({
            status: 'accepted',
            $or: [
                {
                    requester: from,
                    recipient: to
                },
                {
                    requester: to,
                    recipient: from
                }
            ]
        });

    };

const getCaller =
    async (userId) => {

        try {
            return await User.findById(userId)
                .select('_id fullName email');
        } catch {
            return null;
        }

    };

module.exports =
    (io, socket) => {

        socket.on(
            'callUser',
            async ({
                to,
                signalData,
                audioOnly
            }) => {

                if (!socket.user || !socket.user.id) {
                    return;
                }

                const from = socket.user.id;

                if (!await canContact(from, to)) {
                    return;
                }

                const caller =
                    await getCaller(from);

                io.to(`user:${to}`)
                    .emit(
                        'incomingCall',
                        {
                            from,
                            caller: caller ? {
                                _id: caller._id,
                                fullName: caller.fullName,
                                email: caller.email
                            } : null,
                            signalData,
                            audioOnly: Boolean(audioOnly)
                        }
                    );

            }
        );

        socket.on(
            'answerCall',
            async ({
                to,
                signal
            }) => {

                if (!socket.user || !socket.user.id) {
                    return;
                }

                if (!await canContact(socket.user.id, to)) {
                    return;
                }

                io.to(`user:${to}`)
                    .emit(
                        'callAccepted',
                        signal
                    );

            }
        );

        socket.on(
            'iceCandidate',
            async ({
                to,
                candidate
            }) => {

                if (!socket.user || !socket.user.id) {
                    return;
                }

                if (!await canContact(socket.user.id, to)) {
                    return;
                }

                io.to(`user:${to}`)
                    .emit(
                        'iceCandidate',
                        candidate
                    );

            }
        );

        socket.on(
            'endCall',
            async ({ to }) => {

                if (!socket.user || !socket.user.id) {
                    return;
                }

                if (!await canContact(socket.user.id, to)) {
                    return;
                }

                io.to(`user:${to}`)
                    .emit(
                        'callEnded'
                    );

            }
        );

    };

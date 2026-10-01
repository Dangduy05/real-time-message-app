const Friend =
    require('../models/Friend');

const canNotify =
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

module.exports =
    (io, socket) => {

        socket.on(
            'sendNotification',
            async ({
                receiverId,
                notification
            }) => {

                if (!socket.user || !socket.user.id) {
                    return;
                }

                if (!await canNotify(socket.user.id, receiverId)) {
                    return;
                }

                io.to(`user:${receiverId}`)
                    .emit(
                        'receiveNotification',
                        {
                            ...notification,
                            from: socket.user.id
                        }
                    );

            }
        );

    };

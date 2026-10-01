const User =
    require('../models/User');

const socketMap =
    require('../utils/socketMap');

module.exports =
    (io, socket) => {

        socket.on(
            'userOnline',
            async () => {

                if (!socket.user || !socket.user.id) {
                    return;
                }

                const userId = socket.user.id;

                socket.join(`user:${userId}`);

                socketMap.set(
                    userId,
                    socket.id
                );

                await User.findByIdAndUpdate(

                    userId,

                    {
                        status: 'online'
                    }

                );

                io.emit(
                    'onlineUsers',
                    Array.from(
                        socketMap.keys()
                    )
                );

            }
        );

        socket.on(
            'disconnect',
            async () => {

                for (
                    const [userId, socketId]
                    of socketMap.entries()
                ) {

                    if (
                        socketId === socket.id
                    ) {

                        socketMap.delete(userId);

                        await User.findByIdAndUpdate(

                            userId,

                            {
                                status: 'offline'
                            }

                        );

                        io.emit(
                            'onlineUsers',
                            Array.from(
                                socketMap.keys()
                            )
                        );

                    }

                }

            }
        );

    };

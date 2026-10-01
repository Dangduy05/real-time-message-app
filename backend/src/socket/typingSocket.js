const ChatMember =
    require('../models/ChatMember');

const isChatMember =
    async (chatId, userId) => {

        return ChatMember.exists({
            chatId,
            userId
        });

    };

module.exports =
    (io, socket) => {

        socket.on(
            'typing',
            async ({ chatId }) => {

                if (!socket.user || !socket.user.id || !chatId) {
                    return;
                }

                const member =
                    await isChatMember(
                        chatId,
                        socket.user.id
                    );

                if (!member) {
                    return;
                }

                socket.to(chatId)
                    .emit(
                        'userTyping',
                        {
                            userId: socket.user.id
                        }
                    );

            }
        );

        socket.on(
            'stopTyping',
            async ({ chatId }) => {

                if (!socket.user || !socket.user.id || !chatId) {
                    return;
                }

                const member =
                    await isChatMember(
                        chatId,
                        socket.user.id
                    );

                if (!member) {
                    return;
                }

                socket.to(chatId)
                    .emit(
                        'userStopTyping',
                        {
                            userId: socket.user.id
                        }
                    );

            }
        );

    };

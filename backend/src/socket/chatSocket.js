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

module.exports =
    (io, socket) => {

        socket.on(
            'joinRoom',
            async (roomId) => {

                if (!socket.user || !socket.user.id || !roomId) {
                    return;
                }

                const member =
                    await isChatMember(
                        roomId,
                        socket.user.id
                    );

                if (!member) {
                    return;
                }

                socket.join(roomId);

            }
        );

        socket.on(
            'leaveRoom',
            (roomId) => {

                socket.leave(roomId);

            }
        );

        socket.on(
            'sendMessage',
            async (data) => {

                try {

                    if (!socket.user || !socket.user.id) {
                        return;
                    }

                    if (!data || !data.chatId || !data.content) {
                        return;
                    }

                    // verify user is member of the chat
                    const member =
                        await isChatMember(
                            data.chatId,
                            socket.user.id
                        );

                    if (!member) return;

                    const message = await Message.create({
                        chatId: data.chatId,
                        senderId: socket.user.id,
                        type: data.type || 'text',
                        content: data.content
                    });

                    socket.emit('receiveMessage', message);
                    socket.to(data.chatId).emit('receiveMessage', message);

                    const members =
                        await ChatMember.find({
                            chatId: data.chatId
                        });

                    members
                        .filter((chatMember) => String(chatMember.userId) !== String(socket.user.id))
                        .forEach((chatMember) => {
                            io.to(`user:${chatMember.userId}`)
                                .emit('messageNotification', {
                                    chatId: data.chatId,
                                    message
                                });
                        });

                } catch (err) {

                    console.error(err);

                }

            }
        );

        socket.on(
            'seenMessage',
            async ({
                messageId
            }) => {

                try {

                    if (!socket.user || !socket.user.id) {
                        return;
                    }

                    const userId = socket.user.id;

                    const message =
                        await Message.findById(messageId);

                    if (!message) {
                        return;
                    }

                    const chatRoomId =
                        message.chatId?._id || message.chatId;

                    const member =
                        await isChatMember(
                            chatRoomId,
                            userId
                        );

                    if (!member) {
                        return;
                    }

                    await Message.findByIdAndUpdate(
                        messageId,
                        {
                            $addToSet: {
                                seenBy: userId
                            }
                        },
                        {
                            new: true
                        }
                    );

                    if (chatRoomId) {
                        io.to(String(chatRoomId)).emit(
                            'messageSeen',
                            {
                                messageId,
                                userId,
                                chatId: chatRoomId
                            }
                        );
                    }

                } catch (err) {

                    console.error(err);

                }

            }
        );

    };

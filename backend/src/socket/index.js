const chatSocket =
    require('./chatSocket');

const presenceSocket =
    require('./presenceSocket');

const typingSocket =
    require('./typingSocket');

const notificationSocket =
    require('./notificationSocket');

const webrtcSocket =
    require('./webrtcSocket');

module.exports = (io) => {

    io.on('connection', (socket) => {

        console.log(
            'Socket Connected:',
            socket.id
        );

        chatSocket(io, socket);

        presenceSocket(io, socket);

        typingSocket(io, socket);

        notificationSocket(io, socket);

        webrtcSocket(io, socket);

        socket.on('disconnect', () => {

            console.log(
                'Socket Disconnected:',
                socket.id
            );

        });

    });

};
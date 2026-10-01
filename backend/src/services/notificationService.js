exports.buildNotification =
    ({
        senderName,
        message
    }) => {

        return {

            title:
                'New Message',

            body:
                `${senderName}: ${message}`,

            createdAt:
                new Date()

        };

    };
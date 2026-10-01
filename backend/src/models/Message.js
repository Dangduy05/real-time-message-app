const mongoose = require('mongoose');

const messageSchema =
    new mongoose.Schema({

        chatId: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        },

        senderId: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        type: {
            type: String,
            enum: [
                'text',
                'image',
                'file'
            ],
            default: 'text'
        },

        content: String,

        seenBy: [{
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]

    }, {
        timestamps: true
    });

module.exports =
    mongoose.model(
        'Message',
        messageSchema
    );
const mongoose = require('mongoose');

const memberSchema =
    new mongoose.Schema({

        chatId: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'Chat'
        },

        userId: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.model(
        'ChatMember',
        memberSchema
    );
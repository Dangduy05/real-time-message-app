const mongoose = require('mongoose');

const chatSchema =
    new mongoose.Schema({

        type: {
            type: String,
            enum: [
                'private',
                'group'
            ]
        },

        groupName: String,

        groupAvatar: String,

        owner: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.model(
        'Chat',
        chatSchema
    );
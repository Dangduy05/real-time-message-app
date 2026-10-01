const mongoose = require('mongoose');

const callSchema =
    new mongoose.Schema({

        caller: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        receiver: {
            type:
                mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        type: {
            type: String,
            enum: [
                'audio',
                'video'
            ]
        },

        status: {
            type: String,
            enum: [
                'missed',
                'accepted',
                'rejected'
            ]
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.model(
        'Call',
        callSchema
    );
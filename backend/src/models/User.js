const mongoose = require('mongoose');

const userSchema =
    new mongoose.Schema({

        fullName: {
            type: String,
            required: true
        },

        email: {
            type: String,
            unique: true,
            required: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Invalid email'
            ]
        },

        password: {
            type: String
        },

        avatar: {
            type: String,
            default: ''
        },

        bio: {
            type: String,
            default: '',
            maxlength: 280
        },

        status: {
            type: String,
            enum: [
                'online',
                'offline'
            ],
            default: 'offline'
        }

    }, {
        timestamps: true
    });

module.exports =
    mongoose.model(
        'User',
        userSchema
    );

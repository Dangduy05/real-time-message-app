const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const os = require('os');
const mongoose = require('mongoose');
const promClient = require('prom-client');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const connectRedis = require('./config/redis');
const redisClient = require('./config/redis').client;
const socketHandler = require('./socket');
const errorMiddleware =
    require('./middlewares/errorMiddleware');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

dotenv.config();

promClient.collectDefaultMetrics();

const pubClient =
    createClient({
        url: process.env.REDIS_URL
    });

const subClient =
    pubClient.duplicate();

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost', 'http://localhost:5173'];

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
    }
});

app.set('io', io);

// create uploads folders if missing
const uploadsRoot = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(uploadsRoot, { recursive: true });
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    }
}));

app.use(express.json());

app.use(helmet());

app.use('/uploads',
    express.static(path.join(__dirname, '..', 'uploads'))
);

app.use('/uploads',
    express.static(path.join(__dirname, 'uploads'))
);

app.use('/api/auth',
    require('./routes/auth')
);

app.use('/api/chat',
    require('./routes/chat')
);

app.use('/api/friend',
    require('./routes/friend')
);

app.use('/api/upload',
    require('./routes/upload')
);

app.use('/api/call',
    require('./routes/call')
);

app.get('/api/status',
    (req, res) => {

        const mongoStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        const mongoState =
            mongoStates[mongoose.connection.readyState] || 'unknown';
        const redisReady =
            Boolean(redisClient?.isReady);
        const apiReady =
            mongoState === 'connected' && redisReady;

        res.json({
            ok: apiReady,
            service: 'real-time-messenger-backend',
            instance: os.hostname(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            dependencies: {
                mongodb: {
                    ok: mongoState === 'connected',
                    state: mongoState
                },
                redis: {
                    ok: redisReady,
                    state: redisReady ? 'connected' : 'disconnected'
                },
                socket: {
                    ok: true,
                    adapter: 'redis'
                }
            }
        });

    }
);

app.get('/metrics',
    async (req, res, next) => {

        try {
            res.set(
                'Content-Type',
                promClient.register.contentType
            );
            res.end(
                await promClient.register.metrics()
            );
        } catch (err) {
            next(err);
        }

    }
);

// socket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake?.auth?.token || socket.handshake?.query?.token;
        if (!token) {
            return next(new Error('Unauthorized'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Hard invalidation after DB reset: ensure the user still exists.
        // Note: token payload fields vary; support both decoded.id and decoded._id.
        const userId = decoded.id || decoded._id;
        if (!userId) {
            return next(new Error('Unauthorized'));
        }

        const User = require('./models/User');
        const exists = await User.exists({ _id: userId });
        if (!exists) {
            return next(new Error('Unauthorized'));
        }

        socket.user = decoded;
        next();
    } catch (err) {
        next(err);
    }
});

socketHandler(io);


app.use(errorMiddleware);

const startServer =
    async () => {

        await connectDB();

        await connectRedis();

        await Promise.all([
            pubClient.connect(),
            subClient.connect()
        ]);

        io.adapter(
            createAdapter(
                pubClient,
                subClient
            )
        );

        server.listen(
            process.env.PORT || 3000,
            () => {
                console.log('Server started');
            }
        );

    };

startServer()
    .catch((err) => {

        console.error('Failed to start server', err);
        process.exit(1);

    });

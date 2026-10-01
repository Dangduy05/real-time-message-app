const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL
});

module.exports = async () => {

    client.on('error', (err) => {
        console.error(err);
    });

    await client.connect();

    console.log('Redis Connected');
};

module.exports.client = client;
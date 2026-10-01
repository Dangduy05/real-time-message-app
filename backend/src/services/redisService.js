const {
    client
} = require('../config/redis');

exports.setCache =
    async (
        key,
        value,
        ttl = 3600
    ) => {

        await client.setEx(

            key,

            ttl,

            JSON.stringify(value)

        );

    };

exports.getCache =
    async (key) => {

        const data =
            await client.get(key);

        return data
            ? JSON.parse(data)
            : null;

    };

exports.deleteCache =
    async (key) => {

        await client.del(key);

    };
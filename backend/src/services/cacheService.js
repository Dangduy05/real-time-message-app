const redisService =
    require('./redisService');

exports.cacheUser =
    async (user) => {

        await redisService.setCache(

            `user:${user._id}`,

            user

        );

    };

exports.getCachedUser =
    async (userId) => {

        return await redisService.getCache(
            `user:${userId}`
        );

    };

exports.cacheFriends =
    async (userId, friends) => {

        await redisService.setCache(
            `friends:${userId}`,
            friends,
            300
        );

    };

exports.getCachedFriends =
    async (userId) => {

        return await redisService.getCache(
            `friends:${userId}`
        );

    };

exports.invalidateFriends =
    async (...userIds) => {

        await Promise.all(
            userIds
                .filter(Boolean)
                .map((userId) => redisService.deleteCache(
                    `friends:${userId}`
                ))
        );

    };

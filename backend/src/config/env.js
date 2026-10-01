module.exports = {

    PORT:
        process.env.PORT || 3000,

    JWT_SECRET:
        process.env.JWT_SECRET,

    MONGO_URI:
        process.env.MONGO_URI,

    REDIS_URL:
        process.env.REDIS_URL

};
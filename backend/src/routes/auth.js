const express =
    require('express');

const router =
    express.Router();

const rateLimit =
    require('../middlewares/ratelimitMiddleware');

const controller =
    require('../controllers/authController');

const auth =
    require('../middlewares/authMiddleware');

router.post(
    '/register',
    rateLimit,
    controller.register
);

router.post(
    '/login',
    rateLimit,
    controller.login
);

router.put(
    '/password',
    auth,
    controller.changePassword
);

router.put(
    '/profile',
    auth,
    controller.updateProfile
);

module.exports = router;

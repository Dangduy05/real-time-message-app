const express =
    require('express');

const router =
    express.Router();

const auth =
    require('../middlewares/authMiddleware');

const controller =
    require('../controllers/friendController');

router.post(
    '/request',
    auth,
    controller.sendRequest
);

router.put(
    '/accept/:id',
    auth,
    controller.acceptRequest
);

router.get(
    '/requests',
    auth,
    controller.getRequests
);

router.get(
    '/search',
    auth,
    controller.searchUsers
);

router.get(
    '/',
    auth,
    controller.getFriends
);

router.delete(
    '/:userId',
    auth,
    controller.removeFriend
);

module.exports = router;

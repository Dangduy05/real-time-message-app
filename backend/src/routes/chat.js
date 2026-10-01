const express =
    require('express');

const router =
    express.Router();

const auth =
    require('../middlewares/authMiddleware');

const controller =
    require('../controllers/chatController');

router.post(
    '/private',
    auth,
    controller.createPrivateChat
);

router.post(
    '/group',
    auth,
    controller.createGroup
);

router.get(
    '/',
    auth,
    controller.getChats
);

router.get(
    '/:chatId/members',
    auth,
    controller.getChatMembers
);

router.post(
    '/:chatId/members',
    auth,
    controller.addChatMembers
);

router.delete(
    '/:chatId/members/:memberId',
    auth,
    controller.removeChatMember
);

router.delete(
    '/:chatId',
    auth,
    controller.dissolveGroup
);

router.put(
    '/:chatId',
    auth,
    controller.updateGroup
);

router.post(
    '/:chatId/message',
    auth,
    controller.sendMessage
);

router.get(
    '/:chatId/messages',
    auth,
    controller.getMessages
);

module.exports = router;

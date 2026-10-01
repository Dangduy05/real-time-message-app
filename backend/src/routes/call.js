const express =
    require('express');

const router =
    express.Router();

const auth =
    require('../middlewares/authMiddleware');

const controller =
    require('../controllers/callController');

router.post(
    '/',
    auth,
    controller.saveCall
);

module.exports = router;
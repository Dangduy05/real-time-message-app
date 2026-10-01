const express =
    require('express');

const router =
    express.Router();

const upload =
    require('../middlewares/uploadMiddleware');

const auth =
    require('../middlewares/authMiddleware');

const controller =
    require('../controllers/uploadController');

router.post(
    '/',
    auth,
    upload.single('file'),
    controller.uploadFile
);

module.exports = router;
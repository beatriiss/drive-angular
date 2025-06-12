const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { upload } = require('../config/multer');

router.get('/', fileController.listFiles);

router.post('/', upload.single('file'), fileController.createFile);

router.get('/:id', fileController.getFile);

router.put('/:id', fileController.updateFile);

router.put('/:id/toggle-star', fileController.toggleStar);

router.delete('/:id', fileController.deleteFile);

module.exports = router;
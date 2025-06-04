const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { upload } = require('../config/multer');

// GET /api/files - Listar arquivos
router.get('/', fileController.listFiles);

// POST /api/files - Criar arquivo/pasta
router.post('/', upload.single('file'), fileController.createFile);

module.exports = router;
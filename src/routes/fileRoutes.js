const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { upload } = require('../config/multer');

// Listar arquivos com filtros (starred, trashed, recent, search)
router.get('/', fileController.listFiles);

// Criar novo arquivo/pasta ou fazer upload
router.post('/', upload.single('file'), fileController.createFile);

// Buscar arquivo específico por ID
router.get('/:id', fileController.getFile);

// Atualizar arquivo
router.put('/:id', fileController.updateFile);

// Favoritar/desfavoritar arquivo
router.put('/:id/toggle-star', fileController.toggleStar);

// Mover arquivo para lixeira (soft delete)
router.delete('/:id', fileController.deleteFile);

// Restaurar arquivo da lixeira
router.put('/:id/restore', fileController.restoreFile);

// Excluir arquivo permanentemente
router.delete('/:id/permanent', fileController.permanentDeleteFile);

module.exports = router;
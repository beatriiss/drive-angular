const fileService = require('../services/fileService');
const { getFileType } = require('../utils/fileHelpers');
const fs = require('fs').promises;

class FileController {
  
  async listFiles(req, res) {
    try {
      const { parent_id } = req.query;
      
      let parentId = null;
      if (parent_id && parent_id !== 'null') {
        parentId = parseInt(parent_id);
      }
      
      const files = await fileService.getFilesByParent(parentId);
      
      res.json({
        success: true,
        data: files
      });
    } catch (error) {
      console.error('Erro no controller - listFiles:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao listar arquivos',
        error: error.message
      });
    }
  }
  
  async createFile(req, res) {
    try {
      const { name, type, parent_id } = req.body;
      const uploadedFile = req.file;
      
      // Validações
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Nome e tipo são obrigatórios'
        });
      }
      
      if (type !== 'folder' && !uploadedFile) {
        return res.status(400).json({
          success: false,
          message: 'Arquivo é obrigatório para tipos diferentes de pasta'
        });
      }
      
      // Preparar dados
      const fileData = {
        name,
        type: uploadedFile ? getFileType(uploadedFile.mimetype) : type,
        parentId: parent_id || null
      };
      
      if (uploadedFile) {
        fileData.size = uploadedFile.size;
        fileData.mimeType = uploadedFile.mimetype;
        fileData.filePath = uploadedFile.path;
      }
      
      // Criar no banco
      const createdFile = await fileService.createFile(fileData);
      
      res.status(201).json({
        success: true,
        message: type === 'folder' ? 'Pasta criada com sucesso' : 'Arquivo enviado com sucesso',
        data: createdFile
      });
      
    } catch (error) {
      console.error('Erro no controller - createFile:', error);
      
      // Limpar arquivo se deu erro
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('Erro ao remover arquivo:', unlinkError);
        }
      }
      
      res.status(500).json({
        success: false,
        message: 'Erro ao criar arquivo',
        error: error.message
      });
    }
  }
}

module.exports = new FileController();
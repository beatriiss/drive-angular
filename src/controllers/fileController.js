const fileService = require('../services/fileService');
const { getFileType } = require('../utils/fileHelpers');
const fs = require('fs').promises;

// Funções auxiliares
const getDefaultSize = (type) => {
  switch (type) {
    case 'folder':
      return 0;
    case 'document':
      return 1024; // 1KB
    case 'spreadsheet':
      return 2048; // 2KB
    case 'presentation':
      return 4096; // 4KB
    default:
      return 0;
  }
};

const getDefaultMimeType = (type) => {
  switch (type) {
    case 'folder':
      return null;
    case 'document':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'spreadsheet':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'presentation':
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    case 'pdf':
      return 'application/pdf';
    case 'image':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
};

const getTypeName = (type) => {
  switch (type) {
    case 'document':
      return 'Documento';
    case 'spreadsheet':
      return 'Planilha';
    case 'presentation':
      return 'Apresentação';
    case 'pdf':
      return 'PDF';
    case 'image':
      return 'Imagem';
    default:
      return 'Arquivo';
  }
};

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
      
      console.log('📄 Criando arquivo:', { name, type, parent_id, hasFile: !!uploadedFile });
      
      // Validações
      if (!name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Nome e tipo são obrigatórios'
        });
      }
      
      // Preparar dados
      const fileData = {
        name,
        type: uploadedFile ? getFileType(uploadedFile.mimetype) : type,
        parentId: parent_id || null
      };
      
      // Se tem arquivo físico, usar dados reais
      if (uploadedFile) {
        fileData.size = uploadedFile.size;
        fileData.mimeType = uploadedFile.mimetype;
        fileData.filePath = uploadedFile.path;
        console.log('✅ Arquivo físico:', uploadedFile.originalname);
      } else {
        // Para documentos virtuais (pastas, documentos Google, etc.)
        fileData.size = getDefaultSize(type);
        fileData.mimeType = getDefaultMimeType(type);
        fileData.filePath = null;
        console.log('✅ Documento virtual:', type);
      }
      
      console.log('📋 Dados para salvar:', fileData);
      
      // Criar no banco
      const createdFile = await fileService.createFile(fileData);
      
      let message = 'Item criado com sucesso';
      if (type === 'folder') {
        message = 'Pasta criada com sucesso';
      } else if (uploadedFile) {
        message = 'Arquivo enviado com sucesso';
      } else {
        message = `${getTypeName(type)} criado com sucesso`;
      }
      
      console.log('✅ Sucesso:', message);
      
      res.status(201).json({
        success: true,
        message: message,
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

  async toggleStar(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const updatedFile = await fileService.toggleStar(parseInt(id));
      
      res.json({
        success: true,
        message: updatedFile.starred ? 'Arquivo favoritado' : 'Arquivo desfavoritado',
        data: updatedFile
      });
      
    } catch (error) {
      console.error('Erro no controller - toggleStar:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar favorito',
        error: error.message
      });
    }
  }

  async updateFile(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const updatedFile = await fileService.updateFile(parseInt(id), updateData);
      
      res.json({
        success: true,
        message: 'Arquivo atualizado com sucesso',
        data: updatedFile
      });
      
    } catch (error) {
      console.error('Erro no controller - updateFile:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao atualizar arquivo',
        error: error.message
      });
    }
  }

  async deleteFile(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const result = await fileService.deleteFile(parseInt(id));
      
      res.json({
        success: true,
        message: result.message
      });
      
    } catch (error) {
      console.error('Erro no controller - deleteFile:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao excluir arquivo',
        error: error.message
      });
    }
  }

  async getFile(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }
      
      const file = await fileService.getFileById(parseInt(id));
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'Arquivo não encontrado'
        });
      }
      
      res.json({
        success: true,
        data: file
      });
      
    } catch (error) {
      console.error('Erro no controller - getFile:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao buscar arquivo',
        error: error.message
      });
    }
  }
}

module.exports = new FileController();
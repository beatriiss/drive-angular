const { pool } = require('../config/database');
const { formatFileResponse } = require('../utils/fileHelpers');

class FileService {
  
  async getFilesByParent(parentId = null) {
    try {
      let query = `
        SELECT *
        FROM files 
        WHERE trashed = FALSE
      `;
      
      let params = [];
      
      if (parentId === null) {
        query += ' AND parent_id IS NULL';
      } else {
        query += ' AND parent_id = ?';
        params.push(parentId);
      }
      
      query += ' ORDER BY type DESC, name ASC';
      
      const [rows] = await pool.execute(query, params);
      
      return rows.map(formatFileResponse);
    } catch (error) {
      throw new Error(`Erro ao buscar arquivos: ${error.message}`);
    }
  }
  
  async createFile(fileData) {
    try {
      const query = `
        INSERT INTO files 
        (name, type, size, mime_type, file_path, parent_id, starred, shared, shared_emails, trashed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        fileData.name,
        fileData.type,
        fileData.size || 0,
        fileData.mimeType || null,
        fileData.filePath || null,
        fileData.parentId || null,
        false, // starred
        false, // shared
        null,  // shared_emails
        false  // trashed
      ];
      
      const [result] = await pool.execute(query, params);
      
      // Buscar arquivo criado
      const [rows] = await pool.execute(
        'SELECT * FROM files WHERE id = ?',
        [result.insertId]
      );
      
      return formatFileResponse(rows[0]);
    } catch (error) {
      throw new Error(`Erro ao criar arquivo: ${error.message}`);
    }
  }
  
  async getFileById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM files WHERE id = ?',
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return formatFileResponse(rows[0]);
    } catch (error) {
      throw new Error(`Erro ao buscar arquivo: ${error.message}`);
    }
  }

  async toggleStar(id) {
    try {
      // Primeiro, buscar o arquivo atual
      const file = await this.getFileById(id);
      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      // Inverter o status de starred
      const newStarredStatus = !file.starred;

      // Atualizar no banco
      const query = `
        UPDATE files 
        SET starred = ?, modified_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      await pool.execute(query, [newStarredStatus, id]);
      
      // Buscar arquivo atualizado
      const updatedFile = await this.getFileById(id);
      
      return updatedFile;
    } catch (error) {
      throw new Error(`Erro ao alterar favorito: ${error.message}`);
    }
  }

  async updateFile(id, updateData) {
    try {
      const allowedFields = ['name', 'starred', 'shared', 'shared_emails', 'trashed'];
      const updates = [];
      const params = [];

      // Construir query dinamicamente baseado nos campos permitidos
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('Nenhum campo válido para atualizar');
      }

      // Adicionar modified_at
      updates.push('modified_at = CURRENT_TIMESTAMP');
      params.push(id);

      const query = `
        UPDATE files 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Arquivo não encontrado');
      }

      // Retornar arquivo atualizado
      return await this.getFileById(id);
    } catch (error) {
      throw new Error(`Erro ao atualizar arquivo: ${error.message}`);
    }
  }

  async deleteFile(id) {
    try {
      // Primeiro verificar se o arquivo existe
      const file = await this.getFileById(id);
      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      // Marcar como excluído (soft delete)
      const query = `
        UPDATE files 
        SET trashed = TRUE, modified_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Erro ao excluir arquivo');
      }

      return { message: 'Arquivo excluído com sucesso' };
    } catch (error) {
      throw new Error(`Erro ao excluir arquivo: ${error.message}`);
    }
  }
}

module.exports = new FileService();
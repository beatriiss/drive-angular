const { pool } = require('../config/database');
const { formatFileResponse } = require('../utils/fileHelpers');

class FileService {
  
  async getFilesByParent(parentId = null, filters = {}) {
    try {
      let query = 'SELECT * FROM files WHERE 1=1';
      let params = [];
      
      // Filtros específicos baseados nos parâmetros
      if (filters.starred) {
        // Buscar apenas arquivos favoritados (não deletados)
        query += ' AND starred = TRUE AND trashed = FALSE';
      } else if (filters.trashed) {
        // Buscar apenas arquivos deletados
        query += ' AND trashed = TRUE';
      } else if (filters.recent && filters.since) {
        // Buscar arquivos modificados recentemente (não deletados)
        query += ' AND trashed = FALSE AND modified_at >= ?';
        params.push(filters.since);
      } else {
        // Busca normal por pasta (não deletados)
        query += ' AND trashed = FALSE';
        
        if (parentId === null) {
          query += ' AND parent_id IS NULL';
        } else {
          query += ' AND parent_id = ?';
          params.push(parentId);
        }
      }
      
      // Ordenação: pastas primeiro, depois por nome
      query += ' ORDER BY type DESC, name ASC';
      
      console.log('🗃️ SQL Query:', query);
      console.log('🗃️ Params:', params);
      
      const [rows] = await pool.execute(query, params);
      
      console.log('📊 Resultados encontrados:', rows.length);
      
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

      return { message: 'Arquivo movido para lixeira com sucesso' };
    } catch (error) {
      throw new Error(`Erro ao excluir arquivo: ${error.message}`);
    }
  }

  /**
   * Restaurar arquivo da lixeira
   */
  async restoreFile(id) {
    try {
      // Primeiro verificar se o arquivo existe e está na lixeira
      const file = await this.getFileById(id);
      if (!file) {
        throw new Error('Arquivo não encontrado');
      }
      
      if (!file.trashed) {
        throw new Error('Arquivo não está na lixeira');
      }

      // Restaurar arquivo (marcar como não deletado)
      const query = `
        UPDATE files 
        SET trashed = FALSE, modified_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Erro ao restaurar arquivo');
      }

      return { message: 'Arquivo restaurado com sucesso' };
    } catch (error) {
      throw new Error(`Erro ao restaurar arquivo: ${error.message}`);
    }
  }

  /**
   * Excluir arquivo permanentemente
   */
  async permanentDeleteFile(id) {
    try {
      // Primeiro verificar se o arquivo existe
      const file = await this.getFileById(id);
      if (!file) {
        throw new Error('Arquivo não encontrado');
      }

      // Excluir permanentemente do banco
      const query = 'DELETE FROM files WHERE id = ?';
      
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Erro ao excluir arquivo permanentemente');
      }

      return { message: 'Arquivo excluído permanentemente' };
    } catch (error) {
      throw new Error(`Erro ao excluir arquivo permanentemente: ${error.message}`);
    }
  }

  /**
   * Buscar arquivos por texto
   */
  async searchFiles(searchTerm, filters = {}) {
    try {
      let query = 'SELECT * FROM files WHERE name LIKE ?';
      let params = [`%${searchTerm}%`];
      
      // Aplicar filtros adicionais
      if (filters.starred) {
        query += ' AND starred = TRUE';
      }
      
      if (filters.trashed !== undefined) {
        query += ' AND trashed = ?';
        params.push(filters.trashed);
      } else {
        // Por padrão, não incluir arquivos deletados na busca
        query += ' AND trashed = FALSE';
      }
      
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }
      
      // Ordenação: relevância por nome, depois por tipo
      query += ' ORDER BY name ASC, type DESC';
      
      console.log('🔍 Search Query:', query);
      console.log('🔍 Search Params:', params);
      
      const [rows] = await pool.execute(query, params);
      
      console.log('📊 Search Results:', rows.length);
      
      return rows.map(formatFileResponse);
    } catch (error) {
      throw new Error(`Erro na busca: ${error.message}`);
    }
  }
}

module.exports = new FileService();
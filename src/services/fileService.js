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
}

module.exports = new FileService();
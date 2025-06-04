const fs = require('fs').promises;

const createDirectories = async () => {
  const dirs = [
    'uploads/documents',
    'uploads/images', 
    'uploads/spreadsheets',
    'uploads/presentations',
    'uploads/others'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      console.log(`Diretório ${dir} já existe`);
    }
  }
};

const getFileType = (mimeType) => {
  if (!mimeType) return 'other';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  
  return 'other';
};

const formatFileResponse = (file) => {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    size: file.size,
    mimeType: file.mime_type,
    filePath: file.file_path,
    parentId: file.parent_id,
    starred: Boolean(file.starred),
    shared: Boolean(file.shared),
    sharedEmails: file.shared_emails,
    trashed: Boolean(file.trashed),
    createdAt: file.created_at,
    modifiedAt: file.modified_at
  };
};

module.exports = {
  createDirectories,
  getFileType,
  formatFileResponse
};
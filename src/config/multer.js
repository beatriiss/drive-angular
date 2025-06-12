const multer = require('multer');
const path = require('path');
const { getFileType } = require('../utils/fileHelpers');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/others';
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'uploads/images';
    } else if (file.mimetype.includes('pdf')) {
      folder = 'uploads/documents';
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      folder = 'uploads/spreadsheets';
    } else if (file.mimetype.includes('presentation') || file.mimetype.includes('powerpoint')) {
      folder = 'uploads/presentations';
    } else if (file.mimetype.includes('document') || file.mimetype.includes('word')) {
      folder = 'uploads/documents';
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  }
});

module.exports = { upload };

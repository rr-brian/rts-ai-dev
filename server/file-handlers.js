/**
 * File handling module for document uploads
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    const safeFilename = `${uniqueId}${fileExt}`;
    
    cb(null, safeFilename);
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedFileTypes = [
    // PDF
    'application/pdf',
    // Word
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Excel
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // CSV
    'text/csv',
    'application/csv',
    'text/plain'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload PDF, Word, Excel, or CSV files.'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB file size limit
  }
});

// Setup file upload routes
function setupFileRoutes(app) {
  // Single file upload endpoint
  app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Return file metadata
      res.status(200).json({
        message: 'File uploaded successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'File upload failed', message: error.message });
    }
  });
  
  // Multiple file upload endpoint
  app.post('/api/upload/multiple', upload.array('files', 5), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      // Return files metadata
      res.status(200).json({
        message: `${req.files.length} files uploaded successfully`,
        files: req.files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path
        }))
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'File upload failed', message: error.message });
    }
  });
}

module.exports = { setupFileRoutes };

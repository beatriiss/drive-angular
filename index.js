require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createDirectories } = require('./src/utils/fileHelpers');
const { testDatabaseConnection } = require('./src/config/database');

// Routes
const fileRoutes = require('./src/routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 3333;

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/files', fileRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Inicialização
const startServer = async () => {
  try {
    await testDatabaseConnection();
    
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
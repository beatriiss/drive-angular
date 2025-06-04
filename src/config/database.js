const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'sua_senha',
  database: process.env.DB_NAME || 'file_manager',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const testDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado ao banco de dados MySQL');
    connection.release();
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error);
    throw error;
  }
};

module.exports = { pool, testDatabaseConnection };
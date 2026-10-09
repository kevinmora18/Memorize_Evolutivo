const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Conexión exitosa a PostgreSQL!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 Versión de PostgreSQL:', result.rows[0].version);
    
    // Verificar si la base de datos existe
    const dbCheck = await client.query(`
      SELECT datname FROM pg_database WHERE datname = 'memorize'
    `);
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ La base de datos "memorize" existe');
    } else {
      console.log('❌ La base de datos "memorize" NO existe');
      console.log('💡 Créala con: CREATE DATABASE memorize;');
    }
    
    await client.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔍 Verifica:');
    console.log('1. PostgreSQL está corriendo');
    console.log('2. Usuario: postgres');
    console.log('3. Contraseña: la de tu backend/.env local');
    console.log('4. Puerto: 5432');
    console.log('5. La base de datos "memorize" existe');
  }
}

testConnection();

const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('✅ PostgreSQL connected successfully!');
        const result = await client.query('SELECT NOW()');
        console.log('📊 Database time:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Execute database query
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('⚡ Query executed:', { 
            text, 
            duration: `${duration}ms`, 
            rows: result.rowCount || result.rows.length 
        });
        return result;
    } catch (error) {
        console.error('❌ Query error:', error.message);
        throw error;
    }
};

// Get database client for transactions
const getClient = async () => {
    return await pool.connect();
};

module.exports = {
    pool,
    query,
    getClient,
    testConnection
};
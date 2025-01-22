const sql = require('mssql');

const config = {
    server: '84.237.212.153',
    database: 'Campus_Vehicle_Management_System',
    user: '2024_YadukrishnanShaji',
    password: 'RT@1234',
    options: {
        encrypt: false,
        trustServerCertificate: true,
        port: 1433
    }
};

async function connectDB() {
    try {
        console.log('Attempting database connection...');
        const pool = await sql.connect(config);
        console.log('Database connected successfully');
        return pool;
    } catch (error) {
        console.error('Database connection error:', error);
        throw error;
    }
}

async function closePool() {
    try {
        await sql.close();
        console.log('All database connections closed');
    } catch (err) {
        console.error('Error closing database connections:', err);
        throw err;
    }
}

module.exports = {
    connectDB,
    closePool,
    sql,
    config
}; 
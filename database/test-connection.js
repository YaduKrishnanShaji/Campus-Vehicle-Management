const { connectDB, closePool } = require('../config/database');

async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        // Try to connect
        const pool = await connectDB();
        
        // Test a simple query
        const result = await pool.request().query('SELECT DB_NAME() as dbName');
        console.log('Connected to database:', result.recordset[0].dbName);
        
        // Close the connection
        await closePool();
        console.log('Test completed successfully');
        
    } catch (error) {
        console.error('Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testConnection(); 
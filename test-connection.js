const { connectDB, sql } = require('./config/database');

async function testConnection() {
    let pool;
    try {
        console.log('Starting connection test...');
        pool = await connectDB();
        console.log('Database connection test successful!');
        
        // Test a simple query
        console.log('Testing query execution...');
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Server Version:', result.recordset[0].version);
        
    } catch (error) {
        console.error('\nConnection test failed with details:');
        console.error('Error Type:', error.name);
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        
        if (error.originalError) {
            console.error('\nOriginal Error Details:');
            console.error('Message:', error.originalError.message);
            console.error('Code:', error.originalError.code);
            console.error('Server Name:', error.originalError.server);
        }
        
    } finally {
        if (pool) {
            try {
                await pool.close();
                console.log('Connection closed successfully');
            } catch (err) {
                console.error('Error closing connection:', err.message);
            }
        }
    }
}

console.log('Testing connection with configuration:');
console.log('Server:', '84.237.212.153');
console.log('Database:', 'Campus_Vehicle_Mnangement_System');
console.log('User:', '2024_YadukrishnanShaji');
console.log('\nStarting test...\n');

testConnection(); 
const sql = require('mssql');
const { connectDB } = require('../config/database');

async function verifyDatabaseSetup() {
    try {
        console.log('Starting database verification...');
        
        // Connect to database
        const pool = await connectDB();
        console.log('Successfully connected to database');

        // Test basic query
        console.log('\nTesting basic query...');
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Server Version:', result.recordset[0].version);

        // Verify tables exist
        console.log('\nVerifying tables...');
        const tables = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);
        
        console.log('Found tables:');
        tables.recordset.forEach(table => {
            console.log(`- ${table.TABLE_NAME}`);
        });

        // Verify views exist
        console.log('\nVerifying views...');
        const views = await pool.request().query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.VIEWS
        `);
        
        console.log('Found views:');
        views.recordset.forEach(view => {
            console.log(`- ${view.TABLE_NAME}`);
        });

        // Test Users table structure
        console.log('\nVerifying Users table structure...');
        const userColumns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Users'
        `);
        
        console.log('Users table columns:');
        userColumns.recordset.forEach(column => {
            console.log(`- ${column.COLUMN_NAME}: ${column.DATA_TYPE} (Nullable: ${column.IS_NULLABLE})`);
        });

        // Verify foreign key constraints
        console.log('\nVerifying foreign key constraints...');
        const foreignKeys = await pool.request().query(`
            SELECT 
                OBJECT_NAME(f.parent_object_id) AS TableName,
                COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
                OBJECT_NAME (f.referenced_object_id) AS ReferenceTableName,
                COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferenceColumnName
            FROM sys.foreign_keys AS f
            INNER JOIN sys.foreign_key_columns AS fc
                ON f.object_id = fc.constraint_object_id
        `);
        
        console.log('Foreign key relationships:');
        foreignKeys.recordset.forEach(fk => {
            console.log(`- ${fk.TableName}.${fk.ColumnName} -> ${fk.ReferenceTableName}.${fk.ReferenceColumnName}`);
        });

        // Verify indexes
        console.log('\nVerifying indexes...');
        const indexes = await pool.request().query(`
            SELECT 
                t.name AS TableName,
                i.name AS IndexName,
                i.type_desc AS IndexType
            FROM sys.indexes i
            JOIN sys.tables t ON i.object_id = t.object_id
            WHERE i.name IS NOT NULL
        `);
        
        console.log('Found indexes:');
        indexes.recordset.forEach(index => {
            console.log(`- ${index.TableName}: ${index.IndexName} (${index.IndexType})`);
        });

        console.log('\nDatabase verification completed successfully!');
        
    } catch (error) {
        console.error('\nDatabase verification failed!');
        console.error('Error details:', error);
        throw error;
    }
}

// Run the verification
console.log('Starting database verification process...');
verifyDatabaseSetup()
    .then(() => {
        console.log('Verification completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Verification failed:', error);
        process.exit(1);
    }); 
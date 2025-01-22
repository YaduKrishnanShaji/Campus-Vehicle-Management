const { connectDB, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

async function testDatabaseOperations() {
    let pool;
    try {
        console.log('Starting database operations test...');
        
        // Connect to database
        pool = await connectDB();
        console.log('Connected to database successfully');

        // Create a test user
        const hashedPassword = await bcrypt.hash('Test@123', 10);
        const testUser = {
            FirstName: 'Test',
            LastName: 'User',
            Email: 'test@example.com',
            Password: hashedPassword,
            Department: 'IT',
            PhoneNumber: '+1234567890',
            UserRole: 'user'
        };

        // Insert test user
        console.log('Attempting to insert test user...');
        const result = await pool.request()
            .input('FirstName', sql.NVarChar, testUser.FirstName)
            .input('LastName', sql.NVarChar, testUser.LastName)
            .input('Email', sql.NVarChar, testUser.Email)
            .input('Password', sql.NVarChar, testUser.Password)
            .input('Department', sql.NVarChar, testUser.Department)
            .input('PhoneNumber', sql.NVarChar, testUser.PhoneNumber)
            .input('UserRole', sql.NVarChar, testUser.UserRole)
            .query(`
                INSERT INTO Users (FirstName, LastName, Email, Password, Department, PhoneNumber, UserRole)
                OUTPUT INSERTED.UserID, INSERTED.Email
                VALUES (@FirstName, @LastName, @Email, @Password, @Department, @PhoneNumber, @UserRole)
            `);

        console.log('Test user created successfully:', result.recordset[0]);

        // Verify user was created
        console.log('\nVerifying user creation...');
        const verifyResult = await pool.request()
            .input('Email', sql.NVarChar, testUser.Email)
            .query('SELECT UserID, FirstName, LastName, Email, Department FROM Users WHERE Email = @Email');

        console.log('Retrieved user:', verifyResult.recordset[0]);

        // Clean up test data
        console.log('\nCleaning up test data...');
        await pool.request()
            .input('Email', sql.NVarChar, testUser.Email)
            .query('DELETE FROM Users WHERE Email = @Email');

        console.log('Test data cleaned up successfully');
        console.log('\nAll database operations completed successfully!');

    } catch (error) {
        console.error('Database operations test failed:', error);
        throw error;
    } finally {
        if (pool) {
            await pool.close();
            console.log('Database connection closed');
        }
    }
}

// Run the test
console.log('Starting database operations test...');
testDatabaseOperations()
    .then(() => {
        console.log('Test completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Test failed:', error);
        process.exit(1);
    }); 
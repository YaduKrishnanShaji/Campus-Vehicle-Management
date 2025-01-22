const { connectDB, sql } = require('../config/database');

async function listUsers() {
    try {
        console.log('Connecting to database...');
        const pool = await connectDB();
        
        console.log('Fetching users...');
        const result = await pool.request()
            .query(`
                SELECT 
                    UserID,
                    FirstName,
                    LastName,
                    Email,
                    Department,
                    UserRole,
                    IsEmailVerified,
                    CreatedAt,
                    LastLogin,
                    IsActive
                FROM Users
                ORDER BY UserID;
            `);
        
        if (result.recordset.length === 0) {
            console.log('No users found in the database.');
            return;
        }

        console.log('\nList of Users:');
        console.log('-------------');
        result.recordset.forEach(user => {
            console.log(`
UserID: ${user.UserID}
Name: ${user.FirstName} ${user.LastName}
Email: ${user.Email}
Department: ${user.Department}
Role: ${user.UserRole}
Status: ${user.IsActive ? 'Active' : 'Inactive'}
Created: ${user.CreatedAt}
Last Login: ${user.LastLogin || 'Never'}
-------------`);
        });

        await pool.close();
        console.log('\nDatabase connection closed.');
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// Execute the function
listUsers(); 
const DatabaseUtils = require('../utils/dbUtils');
const { sql } = require('../config/database');

class UserModel {
    static async createUser(userData) {
        const query = `
            INSERT INTO Users (Email, Password, FirstName, LastName, StudentID, PhoneNumber, UserRole, Department)
            VALUES (@email, @password, @firstName, @lastName, @studentId, @phoneNumber, @userRole, @department);
            SELECT SCOPE_IDENTITY() as userId;
        `;

        try {
            const pool = await connectDB();
            const result = await pool.request()
                .input('email', sql.NVarChar, userData.email)
                .input('password', sql.NVarChar, userData.password)
                .input('firstName', sql.NVarChar, userData.firstName)
                .input('lastName', sql.NVarChar, userData.lastName)
                .input('studentId', sql.NVarChar, userData.studentId)
                .input('phoneNumber', sql.NVarChar, userData.phoneNumber)
                .input('userRole', sql.NVarChar, userData.userRole || 'User')
                .input('department', sql.NVarChar, userData.department)
                .query(query);

            return result.recordset[0].userId;
        } catch (error) {
            console.error('Create user failed:', error);
            throw error;
        }
    }

    static async getUserByEmail(email) {
        const query = `
            SELECT * FROM Users 
            WHERE Email = @email
        `;

        try {
            const pool = await connectDB();
            const result = await pool.request()
                .input('email', sql.NVarChar, email)
                .query(query);

            return result.recordset[0];
        } catch (error) {
            console.error('Get user by email failed:', error);
            throw error;
        }
    }

    static async updateUser(userId, userData) {
        const query = `
            UPDATE Users 
            SET FirstName = @firstName,
                LastName = @lastName,
                PhoneNumber = @phoneNumber,
                Department = @department
            WHERE UserID = @userId
        `;

        try {
            const pool = await connectDB();
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('firstName', sql.NVarChar, userData.firstName)
                .input('lastName', sql.NVarChar, userData.lastName)
                .input('phoneNumber', sql.NVarChar, userData.phoneNumber)
                .input('department', sql.NVarChar, userData.department)
                .query(query);

            return true;
        } catch (error) {
            console.error('Update user failed:', error);
            throw error;
        }
    }

    static async verifyEmail(userId) {
        const query = `
            UPDATE Users 
            SET IsEmailVerified = 1 
            WHERE UserID = @userId
        `;

        try {
            const pool = await connectDB();
            await pool.request()
                .input('userId', sql.Int, userId)
                .query(query);

            return true;
        } catch (error) {
            console.error('Email verification failed:', error);
            throw error;
        }
    }

    static async updateLastLogin(userId) {
        const query = `
            UPDATE Users 
            SET LastLogin = GETDATE() 
            WHERE UserID = @userId
        `;

        try {
            const pool = await connectDB();
            await pool.request()
                .input('userId', sql.Int, userId)
                .query(query);

            return true;
        } catch (error) {
            console.error('Update last login failed:', error);
            throw error;
        }
    }

    static async getUserById(userId) {
        const query = `
            SELECT UserID, Email, FirstName, LastName, StudentID, 
                   PhoneNumber, UserRole, Department, CreatedAt, 
                   LastLogin, IsEmailVerified 
            FROM Users 
            WHERE UserID = @userId
        `;

        try {
            const pool = await connectDB();
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(query);

            return result.recordset[0];
        } catch (error) {
            console.error('Get user by ID failed:', error);
            throw error;
        }
    }
}

module.exports = UserModel; 
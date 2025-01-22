const sql = require('mssql');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/database');

class User {
    static async createUser({ name, email, password, role = 'user', department, phone_number, profile_picture }) {
        const pool = await connectDB();
        
        try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Check if user already exists
            const checkResult = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT email FROM Users WHERE email = @email');
                
            if (checkResult.recordset.length > 0) {
                throw new Error('User already exists with this email');
            }
            
            // Insert new user
            const result = await pool.request()
                .input('name', sql.VarChar, name)
                .input('email', sql.VarChar, email)
                .input('password', sql.VarChar, hashedPassword)
                .input('role', sql.VarChar, role)
                .input('department', sql.VarChar, department)
                .input('phone_number', sql.VarChar, phone_number)
                .input('profile_picture', sql.VarChar, profile_picture)
                .input('created_at', sql.DateTime, new Date())
                .query(`
                    INSERT INTO Users (
                        name, email, password, role, department, 
                        phone_number, profile_picture, created_at
                    )
                    OUTPUT INSERTED.id
                    VALUES (
                        @name, @email, @password, @role, @department,
                        @phone_number, @profile_picture, @created_at
                    )
                `);
            
            return result.recordset[0].id;
        } catch (error) {
            console.error('Error in createUser:', error);
            throw error;
        }
    }

    static async findByEmail(email) {
        const pool = await connectDB();
        
        try {
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query(`
                    SELECT id, name, email, password, role, department,
                           phone_number, profile_picture, created_at, last_login
                    FROM Users 
                    WHERE email = @email AND is_active = 1
                `);
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }

    static async validatePassword(providedPassword, storedPassword) {
        return await bcrypt.compare(providedPassword, storedPassword);
    }

    static async updateLastLogin(userId) {
        const pool = await connectDB();
        
        try {
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('lastLogin', sql.DateTime, new Date())
                .query(`
                    UPDATE Users 
                    SET last_login = @lastLogin
                    WHERE id = @userId
                `);
        } catch (error) {
            console.error('Error in updateLastLogin:', error);
            throw error;
        }
    }

    static async getUserById(userId) {
        const pool = await connectDB();
        
        try {
            const result = await pool.request()
                .input('userId', sql.Int, userId)
                .query(`
                    SELECT id, name, email, role, department,
                           phone_number, profile_picture, created_at, last_login
                    FROM Users 
                    WHERE id = @userId AND is_active = 1
                `);
            
            return result.recordset[0];
        } catch (error) {
            console.error('Error in getUserById:', error);
            throw error;
        }
    }
}

module.exports = User; 
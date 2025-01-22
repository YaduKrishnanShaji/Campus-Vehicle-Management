const { sql, connectDB } = require('../config/database');

class DatabaseUtils {
    static async executeQuery(query, params = {}) {
        try {
            const pool = await connectDB();
            const request = pool.request();

            // Add parameters to the request with proper SQL types
            Object.entries(params).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    request.input(key, sql.NVarChar, value);
                } else if (typeof value === 'number') {
                    if (Number.isInteger(value)) {
                        request.input(key, sql.Int, value);
                    } else {
                        request.input(key, sql.Float, value);
                    }
                } else if (value instanceof Date) {
                    request.input(key, sql.DateTime, value);
                } else if (typeof value === 'boolean') {
                    request.input(key, sql.Bit, value);
                } else {
                    request.input(key, value);
                }
            });

            const result = await request.query(query);
            return result;
        } catch (error) {
            console.error('Query execution failed:', error);
            throw error;
        }
    }

    static async executeStoredProcedure(procedureName, params = {}) {
        try {
            const pool = await connectDB();
            const request = pool.request();
            
            // Add parameters to the request
            Object.keys(params).forEach(key => {
                request.input(key, params[key]);
            });

            const result = await request.execute(procedureName);
            return result;
        } catch (error) {
            console.error('Stored procedure execution failed:', error);
            throw error;
        }
    }

    static async beginTransaction() {
        try {
            const pool = await connectDB();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            return transaction;
        } catch (error) {
            console.error('Transaction start failed:', error);
            throw error;
        }
    }

    static async commitTransaction(transaction) {
        try {
            await transaction.commit();
        } catch (error) {
            console.error('Transaction commit failed:', error);
            throw error;
        }
    }

    static async rollbackTransaction(transaction) {
        try {
            await transaction.rollback();
        } catch (error) {
            console.error('Transaction rollback failed:', error);
            throw error;
        }
    }
}

module.exports = DatabaseUtils; 
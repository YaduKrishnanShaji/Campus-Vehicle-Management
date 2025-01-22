const sql = require('mssql');

class DatabaseUtils {
    static async executeQuery(query, params = {}) {
        try {
            const pool = await sql.connect();
            const request = pool.request();

            // Add parameters to the request
            for (const [key, value] of Object.entries(params)) {
                request.input(key, value);
            }

            // Execute the query
            const result = await request.query(query);
            return result;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    static async executeStoredProcedure(procedureName, params = {}) {
        try {
            const pool = await sql.connect();
            const request = pool.request();

            // Add parameters to the request
            for (const [key, value] of Object.entries(params)) {
                request.input(key, value);
            }

            // Execute the stored procedure
            const result = await request.execute(procedureName);
            return result;
        } catch (error) {
            console.error('Stored procedure error:', error);
            throw error;
        }
    }

    static async beginTransaction() {
        try {
            const pool = await sql.connect();
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            return transaction;
        } catch (error) {
            console.error('Transaction start error:', error);
            throw error;
        }
    }

    static async commitTransaction(transaction) {
        try {
            await transaction.commit();
        } catch (error) {
            console.error('Transaction commit error:', error);
            throw error;
        }
    }

    static async rollbackTransaction(transaction) {
        try {
            await transaction.rollback();
        } catch (error) {
            console.error('Transaction rollback error:', error);
            throw error;
        }
    }
}

module.exports = DatabaseUtils; 
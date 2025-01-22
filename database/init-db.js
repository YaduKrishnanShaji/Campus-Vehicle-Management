const sql = require('mssql');
const { connectDB } = require('../config/database');

async function dropAllTables(pool) {
    try {
        // Drop foreign key constraints first
        const result = await pool.request().query(`
            DECLARE @sql NVARCHAR(MAX) = N'';
            SELECT @sql += N'
                ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
                + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
            FROM sys.foreign_keys;
            EXEC sp_executesql @sql;
        `);

        // Now drop all tables
        await pool.request().query(`
            IF OBJECT_ID('CarpoolParticipants', 'U') IS NOT NULL DROP TABLE CarpoolParticipants;
            IF OBJECT_ID('Notifications', 'U') IS NOT NULL DROP TABLE Notifications;
            IF OBJECT_ID('Carpools', 'U') IS NOT NULL DROP TABLE Carpools;
            IF OBJECT_ID('Vehicles', 'U') IS NOT NULL DROP TABLE Vehicles;
            IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
        `);
        console.log('All tables dropped successfully');
    } catch (error) {
        console.error('Error dropping tables:', error);
        throw error;
    }
}

async function cleanDatabase() {
    try {
        console.log('Attempting to connect to SQL Server...');
        console.log('Connection details:', {
            server: '84.237.212.153',
            database: 'Campus_Vehicle_Management_System',
            user: '2024_YadukrishnanShaji',
            options: { encrypt: false, trustServerCertificate: true, port: 1433 }
        });

        const pool = await connectDB();
        console.log('Successfully connected to SQL Server');

        // Drop all existing tables
        await dropAllTables(pool);
        console.log('Database cleanup completed successfully');
    } catch (error) {
        console.error('Error cleaning database:', error);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        const pool = await connectDB();
        console.log('Connected to SQL Server');

        // Create Vehicles table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vehicles' and xtype='U')
            CREATE TABLE Vehicles (
                VehicleID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL,
                Make NVARCHAR(50) NOT NULL,
                Model NVARCHAR(50) NOT NULL,
                Year INT NOT NULL,
                LicensePlate NVARCHAR(20) NOT NULL UNIQUE,
                Color NVARCHAR(30) NOT NULL,
                Status NVARCHAR(20) DEFAULT 'Pending',
                CreatedAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (UserID) REFERENCES Users(UserID)
            )
        `);
        console.log('Vehicles table created');

        // Create Carpools table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Carpools' and xtype='U')
            CREATE TABLE Carpools (
                CarpoolID INT IDENTITY(1,1) PRIMARY KEY,
                UserID INT NOT NULL,
                VehicleID INT NOT NULL,
                FromLocation NVARCHAR(100) NOT NULL,
                ToLocation NVARCHAR(100) NOT NULL,
                TripDate DATE NOT NULL,
                TripTime TIME NOT NULL,
                AvailableSeats INT NOT NULL,
                Status NVARCHAR(20) DEFAULT 'Active',
                CreatedAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (UserID) REFERENCES Users(UserID),
                FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
            )
        `);
        console.log('Carpools table created');

        // Create CarpoolParticipants table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CarpoolParticipants' and xtype='U')
            CREATE TABLE CarpoolParticipants (
                ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
                CarpoolID INT NOT NULL,
                UserID INT NOT NULL,
                Status NVARCHAR(20) DEFAULT 'Joined',
                JoinedAt DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (CarpoolID) REFERENCES Carpools(CarpoolID),
                FOREIGN KEY (UserID) REFERENCES Users(UserID)
            )
        `);
        console.log('CarpoolParticipants table created');

        console.log('Database initialization completed successfully');
    } catch (err) {
        console.error('Error during database initialization:', err);
        throw err;
    }
}

// Run the initialization
initializeDatabase()
    .then(() => {
        console.log('Database setup completed');
        process.exit(0);
    })
    .catch(error => {
        console.error('Database setup failed:', error);
        process.exit(1);
    }); 
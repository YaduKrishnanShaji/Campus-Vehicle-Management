const { connectDB, sql } = require('../config/database');

async function createTables() {
    try {
        console.log('Starting table creation...');
        const pool = await connectDB();
        
        // Create Users table with enhanced fields
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
            BEGIN
                CREATE TABLE Users (
                    UserID INT IDENTITY(1,1) PRIMARY KEY,
                    FirstName NVARCHAR(50) NOT NULL,
                    LastName NVARCHAR(50) NOT NULL,
                    Email NVARCHAR(100) NOT NULL UNIQUE,
                    Password NVARCHAR(255) NOT NULL,
                    Department NVARCHAR(100) NOT NULL,
                    PhoneNumber NVARCHAR(20) NOT NULL,
                    StudentID NVARCHAR(20) NULL,
                    UserRole NVARCHAR(20) DEFAULT 'user',
                    IsEmailVerified BIT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    LastLogin DATETIME NULL,
                    IsActive BIT DEFAULT 1,
                    ProfilePicture NVARCHAR(255) NULL,
                    Gender NVARCHAR(10) NULL,
                    DateOfBirth DATE NULL,
                    Address NVARCHAR(255) NULL,
                    EmergencyContact NVARCHAR(20) NULL,
                    EmergencyContactName NVARCHAR(100) NULL,
                    EmergencyContactRelation NVARCHAR(50) NULL,
                    PreferredLanguage NVARCHAR(50) DEFAULT 'English',
                    RegistrationStatus NVARCHAR(20) DEFAULT 'Pending',
                    LastUpdated DATETIME DEFAULT GETDATE(),
                    Notes NVARCHAR(MAX) NULL
                )

                CREATE INDEX IX_Users_Email ON Users(Email);
                CREATE INDEX IX_Users_Role ON Users(UserRole);
                CREATE INDEX IX_Users_Department ON Users(Department);
                CREATE INDEX IX_Users_StudentID ON Users(StudentID);
                CREATE INDEX IX_Users_RegistrationStatus ON Users(RegistrationStatus);

                PRINT 'Users table created successfully'
            END
            ELSE
            BEGIN
                -- Add any missing columns to existing table
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'StudentID')
                    ALTER TABLE Users ADD StudentID NVARCHAR(20) NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Gender')
                    ALTER TABLE Users ADD Gender NVARCHAR(10) NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DateOfBirth')
                    ALTER TABLE Users ADD DateOfBirth DATE NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Address')
                    ALTER TABLE Users ADD Address NVARCHAR(255) NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'EmergencyContact')
                    ALTER TABLE Users ADD EmergencyContact NVARCHAR(20) NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'EmergencyContactName')
                    ALTER TABLE Users ADD EmergencyContactName NVARCHAR(100) NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'EmergencyContactRelation')
                    ALTER TABLE Users ADD EmergencyContactRelation NVARCHAR(50) NULL
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'PreferredLanguage')
                    ALTER TABLE Users ADD PreferredLanguage NVARCHAR(50) DEFAULT 'English'
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'RegistrationStatus')
                    ALTER TABLE Users ADD RegistrationStatus NVARCHAR(20) DEFAULT 'Pending'
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'LastUpdated')
                    ALTER TABLE Users ADD LastUpdated DATETIME DEFAULT GETDATE()
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'Notes')
                    ALTER TABLE Users ADD Notes NVARCHAR(MAX) NULL

                PRINT 'Users table updated with new columns'
            END
        `);

        console.log('Database setup completed');
        
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

// Run the table creation
createTables().catch(console.error); 
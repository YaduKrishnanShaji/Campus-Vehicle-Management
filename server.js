const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { connectDB, sql, config } = require('./config/database');
const DatabaseUtils = require('./utils/dbUtils');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, 'public')));

// Add CSP headers
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self';"
    );
    next();
});

// Basic route for testing
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Authentication routes
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Protected routes (now unprotected for direct access)
app.get('/dashboard', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    } catch (error) {
        console.error('Error serving dashboard:', error);
        res.status(500).send('Error loading dashboard');
    }
});

// Landing page route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Public stats endpoint
app.get('/api/public/stats', async (req, res) => {
    try {
        console.log('Fetching public stats...');
        const pool = await connectDB();

        // Check if tables exist
        const tablesExist = await pool.request().query(`
            SELECT COUNT(*) as count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME IN ('Users', 'Vehicles', 'Carpools', 'CarpoolParticipants')
        `);

        if (tablesExist.recordset[0].count < 4) {
            // Return default stats if tables don't exist
            return res.json({
                stats: {
                    activeUsers: 0,
                    activeVehicles: 0,
                    activeCarpools: 0,
                    activeParticipants: 0
                },
                recentCarpools: []
            });
        }

        // Get total counts with error handling
        const stats = await pool.request().query(`
            SELECT
                (SELECT COUNT(*) FROM Users WHERE IsActive = 1) as activeUsers,
                (SELECT COUNT(*) FROM Vehicles WHERE IsActive = 1) as activeVehicles,
                (SELECT COUNT(*) FROM Carpools WHERE Status = 'Active') as activeCarpools,
                (SELECT COUNT(*) FROM CarpoolParticipants WHERE Status = 'Active') as activeParticipants
        `).catch(err => {
            console.warn('Error fetching counts:', err);
            return { recordset: [{ activeUsers: 0, activeVehicles: 0, activeCarpools: 0, activeParticipants: 0 }] };
        });

        // Get recent carpools with error handling
        const recentCarpools = await pool.request().query(`
            IF OBJECT_ID('Carpools', 'U') IS NOT NULL
            AND OBJECT_ID('Users', 'U') IS NOT NULL
            BEGIN
                SELECT TOP 5
                    c.FromLocation,
                    c.ToLocation,
                    c.DepartureTime,
                    c.AvailableSeats,
                    u.FirstName + ' ' + u.LastName as DriverName
                FROM Carpools c
                JOIN Users u ON c.DriverID = u.UserID
                WHERE c.Status = 'Active'
                ORDER BY c.DepartureTime DESC
            END
        `).catch(err => {
            console.warn('Error fetching recent carpools:', err);
            return { recordset: [] };
        });

        res.json({
            stats: stats.recordset[0],
            recentCarpools: recentCarpools.recordset || []
        });

    } catch (error) {
        console.error('Error fetching public stats:', error);
        // Return empty stats instead of error
        res.json({ 
            stats: {
                activeUsers: 0,
                activeVehicles: 0,
                activeCarpools: 0,
                activeParticipants: 0
            },
            recentCarpools: []
        });
    }
});

// Secret key for JWT
const JWT_SECRET = 'your-secret-key';

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
}

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Registration attempt received:', req.body);
        const { firstName, lastName, email, department, password } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !department || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const pool = await connectDB();
        console.log('Database connected');

        // Check if user already exists
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed');

        // Insert user with proper SQL types
        const result = await pool.request()
            .input('firstName', sql.NVarChar, firstName)
            .input('lastName', sql.NVarChar, lastName)
            .input('email', sql.NVarChar, email)
            .input('department', sql.NVarChar, department)
            .input('password', sql.NVarChar, hashedPassword)
            .query(`
                INSERT INTO Users (FirstName, LastName, Email, Department, Password)
                OUTPUT INSERTED.UserID
                VALUES (@firstName, @lastName, @email, @department, @password)
            `);

        const userId = result.recordset[0].UserID;
        console.log('User created with ID:', userId);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: userId,
                firstName,
                lastName,
                email,
                department
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Registration failed',
            details: error.message 
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login attempt received:', { email: req.body.email });
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            console.log('Missing credentials:', { email: !!email, password: !!password });
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const pool = await connectDB();
        console.log('Database connected for login');

        // Find user with proper SQL type
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Users WHERE Email = @email');

        console.log('User query completed');

        const user = result.recordset[0];
        if (!user) {
            console.log('No user found with email:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('User found, comparing passwords');
        const validPassword = await bcrypt.compare(password, user.Password);
        
        if (!validPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        console.log('Password valid, generating token');
        const token = jwt.sign(
            { userId: user.UserID },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', email);
        res.json({
            token,
            user: {
                id: user.UserID,
                firstName: user.FirstName,
                lastName: user.LastName,
                email: user.Email,
                department: user.Department
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Login failed',
            details: error.message 
        });
    }
});

// Test registration endpoint
app.post('/api/auth/test-register', async (req, res) => {
    try {
        console.log('Test registration attempt received');
        
        // Connect to database
        const pool = await connectDB();
        
        // Test user data
        const testUser = {
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            password: await bcrypt.hash('password123', 10),
            department: 'computer_science',
            userRole: 'user',
            isEmailVerified: 0,
            isActive: 1
        };

        // Insert test user
        const result = await pool.request()
            .input('firstName', sql.NVarChar, testUser.firstName)
            .input('lastName', sql.NVarChar, testUser.lastName)
            .input('email', sql.NVarChar, testUser.email)
            .input('password', sql.NVarChar, testUser.password)
            .input('department', sql.NVarChar, testUser.department)
            .input('userRole', sql.NVarChar, testUser.userRole)
            .input('isEmailVerified', sql.Bit, testUser.isEmailVerified)
            .input('isActive', sql.Bit, testUser.isActive)
            .query(`
                INSERT INTO Users (
                    FirstName, LastName, Email, Password, 
                    Department, UserRole,
                    IsEmailVerified, CreatedAt, IsActive
                )
                VALUES (
                    @firstName, @lastName, @email, @password,
                    @department, @userRole,
                    @isEmailVerified, GETDATE(), @isActive
                );
                SELECT SCOPE_IDENTITY() as UserID;
            `);

        const userId = result.recordset[0].UserID;
        console.log('Test user created with ID:', userId);

        res.json({ 
            success: true, 
            message: 'Test user created successfully',
            userId: userId
        });
    } catch (error) {
        console.error('Test registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Test registration failed',
            error: error.message
        });
    }
});

// Add this before the catch-all route
app.get('/api/check-users', async (req, res) => {
    try {
        const pool = await connectDB();
        console.log('Database connected for user check');

        const result = await pool.request()
            .query('SELECT UserID, FirstName, LastName, Email, Department FROM Users');

        console.log('Users in database:', result.recordset);
        res.json({ 
            success: true,
            users: result.recordset 
        });
    } catch (error) {
        console.error('Error checking users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to check users',
            details: error.message 
        });
    }
});

// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required' });
        }

        const pool = await connectDB();
        console.log('Database connected for password reset');

        // Check if user exists
        const userCheck = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT UserID FROM Users WHERE Email = @email');

        if (userCheck.recordset.length === 0) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('password', sql.NVarChar, hashedPassword)
            .query('UPDATE Users SET Password = @password WHERE Email = @email');

        console.log('Password reset successful for email:', email);
        res.json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ 
            message: 'Password reset failed',
            details: error.message 
        });
    }
});

// Vehicle routes
app.post('/api/vehicles', authenticateToken, async (req, res) => {
    try {
        const { make, model, year, licensePlate, color, registrationFee, paymentMethod } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!make || !model || !year || !licensePlate || !color || !registrationFee || !paymentMethod) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const pool = await connectDB();

        // Start transaction
        const transaction = new sql.Transaction(pool);
        try {
            await transaction.begin();

            // Insert vehicle
            const vehicleResult = await transaction.request()
                .input('userId', sql.Int, userId)
                .input('make', sql.NVarChar, make)
                .input('model', sql.NVarChar, model)
                .input('year', sql.Int, year)
                .input('licensePlate', sql.NVarChar, licensePlate)
                .input('color', sql.NVarChar, color)
                .input('status', sql.NVarChar, 'Pending')
                .query(`
                    INSERT INTO Vehicles (UserID, Make, Model, Year, LicensePlate, Color, Status, CreatedAt)
                    OUTPUT INSERTED.VehicleID
                    VALUES (@userId, @make, @model, @year, @licensePlate, @color, @status, GETDATE());
                `);

            const vehicleId = vehicleResult.recordset[0].VehicleID;

            // Record payment
            await transaction.request()
                .input('vehicleId', sql.Int, vehicleId)
                .input('userId', sql.Int, userId)
                .input('amount', sql.Decimal(10,2), registrationFee)
                .input('paymentMethod', sql.NVarChar, paymentMethod)
                .input('status', sql.NVarChar, 'Completed')
                .query(`
                    INSERT INTO Payments (VehicleID, UserID, Amount, PaymentMethod, Status, PaymentDate)
                    VALUES (@vehicleId, @userId, @amount, @paymentMethod, @status, GETDATE());
                `);

            // Create notification
            await transaction.request()
                .input('userId', sql.Int, userId)
                .input('title', sql.NVarChar, 'Vehicle Registration Payment')
                .input('message', sql.NVarChar, `Payment of €${registrationFee} received for ${make} ${model} registration`)
                .input('type', sql.NVarChar, 'payment')
                .query(`
                    INSERT INTO Notifications (UserID, Title, Message, Type, CreatedAt, IsRead)
                    VALUES (@userId, @title, @message, @type, GETDATE(), 0);
                `);

            await transaction.commit();

            res.json({ 
                message: 'Vehicle registered successfully',
                vehicleId: vehicleId
            });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error registering vehicle:', error);
        res.status(500).json({ message: 'Error registering vehicle' });
    }
});

app.get('/api/vehicles', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await connectDB();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT v.*, p.Amount as RegistrationFee, p.PaymentMethod, p.PaymentDate
                FROM Vehicles v
                LEFT JOIN Payments p ON v.VehicleID = p.VehicleID
                WHERE v.UserID = @userId
                ORDER BY v.CreatedAt DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ message: 'Error fetching vehicles' });
    }
});

// Delete vehicle
app.delete('/api/vehicles/:id', authenticateToken, async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.userId;
        const pool = await connectDB();

        // Verify vehicle belongs to user
        const result = await pool.request()
            .input('vehicleId', sql.Int, vehicleId)
            .input('userId', sql.Int, userId)
            .query(`
                DELETE FROM Vehicles 
                WHERE VehicleID = @vehicleId AND UserID = @userId;
                
                DELETE FROM Payments
                WHERE VehicleID = @vehicleId;
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'Vehicle not found or unauthorized' });
        }

        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Error deleting vehicle' });
    }
});

// Carpool routes
app.post('/api/carpools', authenticateToken, async (req, res) => {
    try {
        const { vehicleId, fromLocation, toLocation, tripDate, tripTime, availableSeats } = req.body;
        const userId = req.user.userId;

        // Validate input
        if (!vehicleId || !fromLocation || !toLocation || !tripDate || !tripTime || !availableSeats) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const pool = await connectDB();
        
        // Verify vehicle belongs to user
        const vehicleCheck = await pool.request()
            .input('vehicleId', sql.Int, vehicleId)
            .input('userId', sql.Int, userId)
            .query('SELECT VehicleID FROM Vehicles WHERE VehicleID = @vehicleId AND UserID = @userId');

        if (vehicleCheck.recordset.length === 0) {
            return res.status(403).json({ message: 'Vehicle not found or unauthorized' });
        }

        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .input('vehicleId', sql.Int, vehicleId)
            .input('fromLocation', sql.NVarChar, fromLocation)
            .input('toLocation', sql.NVarChar, toLocation)
            .input('tripDate', sql.Date, new Date(tripDate))
            .input('tripTime', sql.Time, tripTime)
            .input('availableSeats', sql.Int, availableSeats)
            .input('status', sql.NVarChar, 'Active')
            .query(`
                INSERT INTO Carpools (UserID, VehicleID, FromLocation, ToLocation, TripDate, TripTime, AvailableSeats, Status, CreatedAt)
                VALUES (@userId, @vehicleId, @fromLocation, @toLocation, @tripDate, @tripTime, @availableSeats, @status, GETDATE());
                SELECT SCOPE_IDENTITY() as CarpoolID;
            `);

        res.json({ 
            message: 'Carpool created successfully',
            carpoolId: result.recordset[0].CarpoolID
        });
    } catch (error) {
        console.error('Error creating carpool:', error);
        res.status(500).json({ message: 'Error creating carpool' });
    }
});

app.get('/api/carpools', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const pool = await connectDB();
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT c.*, v.Make, v.Model, v.LicensePlate,
                       u.FirstName + ' ' + u.LastName as DriverName
                FROM Carpools c
                JOIN Vehicles v ON c.VehicleID = v.VehicleID
                JOIN Users u ON c.UserID = u.UserID
                WHERE c.Status = 'Active'
                ORDER BY c.TripDate, c.TripTime
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching carpools:', error);
        res.status(500).json({ message: 'Error fetching carpools' });
    }
});

// Catch-all route - must be last
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 
-- Create the database
CREATE DATABASE Campus_Vehicle_Management_System;
GO

-- Use the database
USE Campus_Vehicle_Management_System;
GO

-- Create Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FirstName NVARCHAR(50) NOT NULL,
    LastName NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    Department NVARCHAR(100) NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    UserRole NVARCHAR(20) DEFAULT 'user',
    IsEmailVerified BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastLogin DATETIME,
    IsActive BIT DEFAULT 1,
    ProfilePicture NVARCHAR(255)
);

-- Create Vehicles table
CREATE TABLE Vehicles (
    VehicleID INT IDENTITY(1,1) PRIMARY KEY,
    OwnerID INT NOT NULL,
    LicensePlate NVARCHAR(20) NOT NULL UNIQUE,
    VehicleType NVARCHAR(20) NOT NULL,
    Make NVARCHAR(50),
    Model NVARCHAR(50),
    Year INT,
    Color NVARCHAR(30),
    Status NVARCHAR(20) DEFAULT 'pending',
    RegistrationDate DATETIME DEFAULT GETDATE(),
    LastUpdated DATETIME DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
);

-- Create Carpools table
CREATE TABLE Carpools (
    CarpoolID INT IDENTITY(1,1) PRIMARY KEY,
    CreatorID INT NOT NULL,
    VehicleID INT NOT NULL,
    StartLocation NVARCHAR(255) NOT NULL,
    EndLocation NVARCHAR(255) NOT NULL,
    DepartureTime DATETIME NOT NULL,
    AvailableSeats INT NOT NULL,
    CostPerPerson DECIMAL(10,2) NOT NULL,
    Status NVARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT GETDATE(),
    LastUpdated DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CreatorID) REFERENCES Users(UserID),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID)
);

-- Create CarpoolParticipants table for managing carpool bookings
CREATE TABLE CarpoolParticipants (
    ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
    CarpoolID INT NOT NULL,
    UserID INT NOT NULL,
    Status NVARCHAR(20) DEFAULT 'pending',
    JoinedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (CarpoolID) REFERENCES Carpools(CarpoolID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Create VehicleApprovals table for tracking vehicle registration approvals
CREATE TABLE VehicleApprovals (
    ApprovalID INT IDENTITY(1,1) PRIMARY KEY,
    VehicleID INT NOT NULL,
    ApproverID INT NOT NULL,
    Status NVARCHAR(20) NOT NULL,
    Comments NVARCHAR(500),
    ApprovalDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (VehicleID) REFERENCES Vehicles(VehicleID),
    FOREIGN KEY (ApproverID) REFERENCES Users(UserID)
);

-- Create Notifications table
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Message NVARCHAR(500) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    IsRead BIT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Create indexes for better performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_Role ON Users(UserRole);
CREATE INDEX IX_Vehicles_Owner ON Vehicles(OwnerID);
CREATE INDEX IX_Vehicles_Status ON Vehicles(Status);
CREATE INDEX IX_Carpools_Creator ON Carpools(CreatorID);
CREATE INDEX IX_Carpools_Status ON Carpools(Status);
CREATE INDEX IX_CarpoolParticipants_User ON CarpoolParticipants(UserID);
CREATE INDEX IX_Notifications_User ON Notifications(UserID, IsRead);

-- Create a view for active carpools with available seats
CREATE VIEW vw_ActiveCarpools AS
SELECT 
    c.CarpoolID,
    c.StartLocation,
    c.EndLocation,
    c.DepartureTime,
    c.AvailableSeats,
    c.CostPerPerson,
    u.FirstName + ' ' + u.LastName AS DriverName,
    v.Make,
    v.Model,
    v.Year,
    v.Color
FROM Carpools c
JOIN Users u ON c.CreatorID = u.UserID
JOIN Vehicles v ON c.VehicleID = v.VehicleID
WHERE c.Status = 'active' 
AND c.DepartureTime > GETDATE()
AND c.AvailableSeats > 0;

-- Create a view for user statistics
CREATE VIEW vw_UserStatistics AS
SELECT 
    u.UserID,
    u.FirstName + ' ' + u.LastName AS FullName,
    COUNT(DISTINCT v.VehicleID) AS VehiclesRegistered,
    COUNT(DISTINCT c.CarpoolID) AS CarpoolsCreated,
    COUNT(DISTINCT cp.CarpoolID) AS CarpoolsJoined
FROM Users u
LEFT JOIN Vehicles v ON u.UserID = v.OwnerID AND v.IsActive = 1
LEFT JOIN Carpools c ON u.UserID = c.CreatorID
LEFT JOIN CarpoolParticipants cp ON u.UserID = cp.UserID
GROUP BY u.UserID, u.FirstName, u.LastName; 
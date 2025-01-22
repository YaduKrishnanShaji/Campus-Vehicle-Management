-- Switch to the Campus Vehicle Management System database
USE Campus_Vehicle_Management_System;
GO

-- Test query to verify database connection and show all tables
SELECT 
    t.name AS TableName,
    s.name AS SchemaName,
    t.create_date AS CreatedDate,
    t.modify_date AS LastModified
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
ORDER BY t.name;

-- Verify views
SELECT 
    v.name AS ViewName,
    s.name AS SchemaName,
    v.create_date AS CreatedDate,
    v.modify_date AS LastModified
FROM sys.views v
JOIN sys.schemas s ON v.schema_id = s.schema_id
ORDER BY v.name;

-- Verify indexes
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    i.is_primary_key AS IsPrimaryKey
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name IS NOT NULL
ORDER BY t.name, i.name;

-- Test Users table structure
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length,
    c.is_nullable,
    c.is_identity,
    CASE WHEN pk.column_id IS NOT NULL THEN 'YES' ELSE 'NO' END AS IsPrimaryKey
FROM sys.columns c
JOIN sys.types t ON c.user_type_id = t.user_type_id
LEFT JOIN (
    SELECT i.object_id, ic.column_id
    FROM sys.index_columns ic
    JOIN sys.indexes i ON ic.object_id = i.object_id 
        AND ic.index_id = i.index_id
    WHERE i.is_primary_key = 1
) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
WHERE c.object_id = OBJECT_ID('Users')
ORDER BY c.column_id;

-- Test foreign key constraints
SELECT 
    fk.name AS FKName,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTableName,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumnName
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY TableName, ColumnName;

-- Verify database collation and properties
SELECT 
    name AS DatabaseName,
    collation_name AS CollationName,
    is_auto_close_on AS AutoClose,
    is_auto_shrink_on AS AutoShrink,
    recovery_model_desc AS RecoveryModel
FROM sys.databases
WHERE name = 'Campus_Vehicle_Management_System';

-- Count rows in each table (should be 0 for fresh database)
SELECT 
    t.name AS TableName,
    p.rows AS RowCount
FROM sys.tables t
JOIN sys.partitions p ON t.object_id = p.object_id
WHERE p.index_id IN (0,1)
ORDER BY t.name; 
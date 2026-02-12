-- ========================================
-- CONNECTIONS TABLE OPTIMIZATION
-- ========================================
-- Production-level indexing for 10k+ records scalability
-- Run these SQL commands on your MySQL database

-- 1. Primary Index (should already exist)
-- ALTER TABLE connections ADD PRIMARY KEY (id);

-- 2. Company-based filtering index (most important for multi-tenant SaaS)
CREATE INDEX idx_connections_company_id ON connections(company_id);

-- 3. Customer relationship index (for joining with customers table)
CREATE INDEX idx_connections_customer_id ON connections(customer_id);

-- 4. Status filtering index (for status-based queries)
CREATE INDEX idx_connections_status ON connections(status);

-- 5. Composite index for company + customer queries (most common pattern)
CREATE INDEX idx_connections_company_customer ON connections(company_id, customer_id);

-- 6. Composite index for company + status filtering
CREATE INDEX idx_connections_company_status ON connections(company_id, status);

-- 7. Composite index for pagination with sorting
CREATE INDEX idx_connections_company_created ON connections(company_id, created_at DESC);

-- 8. Composite index for customer + status (for customer-specific status queries)
CREATE INDEX idx_connections_customer_status ON connections(customer_id, status);

-- 9. Connection type filtering index
CREATE INDEX idx_connections_type ON connections(connection_type);

-- 10. Full composite index for the most common query pattern
-- This covers: WHERE company_id = ? ORDER BY created_at DESC LIMIT ?
CREATE INDEX idx_connections_company_pagination ON connections(company_id, created_at DESC, id);

-- ========================================
-- CUSTOMERS TABLE OPTIMIZATION
-- ========================================

-- 1. Company-based filtering index
CREATE INDEX idx_customers_company_id ON customers(company_id);

-- 2. Status filtering index
CREATE INDEX idx_customers_status ON customers(status);

-- 3. Area filtering index
CREATE INDEX idx_customers_area_id ON customers(area_id);

-- 4. Search optimization indexes
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- 5. Composite index for company + status
CREATE INDEX idx_customers_company_status ON customers(company_id, status);

-- 6. Composite index for pagination
CREATE INDEX idx_customers_company_created ON customers(company_id, created_at DESC);

-- ========================================
-- PERFORMANCE ANALYSIS QUERIES
-- ========================================

-- Check if indexes are being used
EXPLAIN SELECT * FROM connections 
WHERE company_id = 'your-company-id' 
ORDER BY created_at DESC 
LIMIT 50;

-- Check table size and row count
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
    table_rows AS 'Rows'
FROM information_schema.tables 
WHERE table_schema = 'your_database_name' 
AND table_name IN ('connections', 'customers');

-- Analyze slow queries (if slow query log is enabled)
SELECT * FROM mysql.slow_log 
WHERE sql_text LIKE '%connections%' 
ORDER BY start_time DESC 
LIMIT 10;

-- ========================================
-- MAINTENANCE COMMANDS
-- ========================================

-- Update table statistics for better query planning
ANALYZE TABLE connections;
ANALYZE TABLE customers;

-- Optimize table (run during maintenance window)
OPTIMIZE TABLE connections;
OPTIMIZE TABLE customers;

-- ========================================
-- MONITORING QUERIES
-- ========================================

-- Monitor index usage
SELECT 
    object_schema,
    object_name,
    index_name,
    count_read,
    count_fetch,
    sum_timer_wait / 1000000000 AS seconds_waited
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE object_schema = 'your_database_name'
AND object_name IN ('connections', 'customers')
ORDER BY count_read DESC;

-- Check for missing indexes
SELECT 
    table_schema,
    table_name,
    column_name,
    cardinality
FROM information_schema.statistics
WHERE table_schema = 'your_database_name'
AND table_name IN ('connections', 'customers')
ORDER BY table_name, cardinality DESC;

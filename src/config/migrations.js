const { query } = require('./database');

// Create all database tables
const createTables = async () => {
    try {
        console.log('🔧 Creating database tables...');

        // 1. Products table
        await query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Products table created');

        // 2. Daily stock table
        await query(`
            CREATE TABLE IF NOT EXISTS daily_stock (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id),
                date DATE NOT NULL,
                time_period_start TIME NOT NULL,
                time_period_end TIME NOT NULL,
                max_quantity INTEGER NOT NULL,
                available_quantity INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Daily stock table created');

        // 3. Orders table
        await query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_code VARCHAR(10) UNIQUE NOT NULL,
                pickup_date DATE NOT NULL,
                pickup_time_start TIME NOT NULL,
                pickup_time_end TIME NOT NULL,
                total_amount INTEGER NOT NULL,
                convenience_fee INTEGER NOT NULL,
                status VARCHAR(20) DEFAULT 'waiting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Orders table created');

        // 4. Order items table
        await query(`
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id),
                product_id INTEGER REFERENCES products(id),
                quantity INTEGER NOT NULL,
                unit_price INTEGER NOT NULL,
                total_price INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Order items table created');

        // 5. Opening hours table
        await query(`
            CREATE TABLE IF NOT EXISTS opening_hours (
                id SERIAL PRIMARY KEY,
                date DATE NOT NULL,
                day_of_week INTEGER NOT NULL,
                period_start TIME NOT NULL,
                period_end TIME NOT NULL,
                status VARCHAR(20) DEFAULT 'open',
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Opening hours table created');

        // 6. Settings table
        await query(`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(100) UNIQUE NOT NULL,
                value TEXT NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Settings table created');

        console.log('🎉 All tables created successfully!');
        return true;
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
};

// Insert default data
const insertDefaultData = async () => {
    try {
        console.log('📊 Inserting default data...');

        // Default products
        await query(`
            INSERT INTO products (name, price) VALUES
            ('1kg Toronyi kenyér egész', 860),
            ('1kg Toronyi kenyér szeletelt', 860),
            ('2kg Toronyi kenyér egész', 1720),
            ('2kg Toronyi kenyér szeletelt', 1720),
            ('Buci', 370)
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ Default products inserted');

        // Default settings
        await query(`
            INSERT INTO settings (key, value, description) VALUES
            ('convenience_fee', '50', 'Kényelmi díj forintban'),
            ('order_periods_ahead', '11', 'Hány időszakra lehet előre rendelni'),
            ('notification_before_opening', '15', 'Értesítés nyitás előtt (perc)'),
            ('notification_after_opening_1', '15', 'Első értesítés nyitás után (perc)'),
            ('notification_after_opening_2', '30', 'Második értesítés nyitás után (perc)')
            ON CONFLICT (key) DO NOTHING
        `);
        console.log('✅ Default settings inserted');

        console.log('🎉 Default data inserted successfully!');
        return true;
    } catch (error) {
        console.error('❌ Default data insertion failed:', error.message);
        throw error;
    }
};

// Run all migrations
const runMigrations = async () => {
    try {
        await createTables();
        await insertDefaultData();
        console.log('✅ Database migrations completed successfully!');
        return true;
    } catch (error) {
        console.error('❌ Migration process failed:', error.message);
        throw error;
    }
};

module.exports = {
    createTables,
    insertDefaultData,
    runMigrations
};
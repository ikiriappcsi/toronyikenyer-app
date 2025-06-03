const { pool, query } = require('../config/database');

class Product {
    // Összes termék lekérése
    static async findAll() {
        try {
            const result = await query(
                'SELECT * FROM products WHERE is_active = true ORDER BY id'
            );
            return result.rows;
        } catch (error) {
            console.error('Product.findAll hiba:', error);
            throw error;
        }
    }

    // Termék keresése ID alapján
    static async findById(id) {
        try {
            const result = await query(
                'SELECT * FROM products WHERE id = $1 AND is_active = true',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Product.findById hiba:', error);
            throw error;
        }
    }

    // Termék ár frissítése (admin funkció)
    static async updatePrice(id, newPrice) {
        try {
            const result = await query(
                'UPDATE products SET price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [newPrice, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Product.updatePrice hiba:', error);
            throw error;
        }
    }

    // Termék aktiválása/deaktiválása
    static async toggleActive(id, isActive) {
        try {
            const result = await query(
                'UPDATE products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
                [isActive, id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Product.toggleActive hiba:', error);
            throw error;
        }
    }
}

module.exports = Product;
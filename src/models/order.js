const pool = require('../config/database');

class Order {
  // Új rendelés létrehozása
  static async create(orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Rendelés létrehozása
      const orderResult = await client.query(
        `INSERT INTO orders (order_code, pickup_date, pickup_time_start, pickup_time_end, 
         total_amount, convenience_fee, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          orderData.order_code,
          orderData.pickup_date,
          orderData.pickup_time_start,
          orderData.pickup_time_end,
          orderData.total_amount,
          orderData.convenience_fee,
          'waiting'
        ]
      );

      const order = orderResult.rows[0];

      // Rendelési tételek hozzáadása
      for (const item of orderData.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.product_id, item.quantity, item.unit_price, item.total_price]
        );
      }

      await client.query('COMMIT');
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Order.create hiba:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Rendelés keresése order_code alapján
  static async findByOrderCode(orderCode) {
    try {
      const result = await pool.query(
        `SELECT o.*, 
         json_agg(
           json_build_object(
             'id', oi.id,
             'product_id', oi.product_id,
             'product_name', p.name,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price
           )
         ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.order_code = $1
         GROUP BY o.id`,
        [orderCode]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Order.findByOrderCode hiba:', error);
      throw error;
    }
  }

  // Mai rendelések lekérése
  static async findTodayOrders() {
    try {
      const result = await pool.query(
        `SELECT o.*, 
         json_agg(
           json_build_object(
             'product_name', p.name,
             'quantity', oi.quantity,
             'total_price', oi.total_price
           )
         ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.pickup_date = CURRENT_DATE
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('Order.findTodayOrders hiba:', error);
      throw error;
    }
  }

  // Rendelés státusz frissítése
  static async updateStatus(id, status) {
    try {
      const result = await pool.query(
        'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [status, id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Order.updateStatus hiba:', error);
      throw error;
    }
  }

  // Rendelések keresése dátum alapján
  static async findByDate(date) {
    try {
      const result = await pool.query(
        `SELECT o.*, 
         json_agg(
           json_build_object(
             'product_name', p.name,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price
           )
         ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.pickup_date = $1
         GROUP BY o.id
         ORDER BY o.pickup_time_start`,
        [date]
      );
      return result.rows;
    } catch (error) {
      console.error('Order.findByDate hiba:', error);
      throw error;
    }
  }

  // Egyedi order_code generálás
  static generateOrderCode(date) {
    const chars = 'ABCDEFGHJKLMNPRTUVWXY'; // I,O,Q,S,Z kihagyva
    const numbers = '0123456789';
    
    // Dátum formázás: MMDD
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateCode = month + day;
    
    // Véletlenszerű betűk és számok
    const letter1 = chars.charAt(Math.floor(Math.random() * chars.length));
    const letter2 = chars.charAt(Math.floor(Math.random() * chars.length));
    const num1 = numbers.charAt(Math.floor(Math.random() * 10));
    const num2 = numbers.charAt(Math.floor(Math.random() * 10));
    
    return `${dateCode}-${letter1}${letter2}/${num1}${num2}`;
  }
}

module.exports = Order;
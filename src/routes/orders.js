const express = require('express');
const router = express.Router();
const Order = require('./models/order');

// POST /api/v1/orders - Új rendelés létrehozása
router.post('/', async (req, res) => {
  try {
    const { pickup_date, pickup_time_start, pickup_time_end, items, convenience_fee } = req.body;
    
    console.log('🛒 Új rendelés létrehozása:', req.body);
    
    // Validáció
    if (!pickup_date || !pickup_time_start || !pickup_time_end || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Hiányos rendelési adatok'
      });
    }

    // Összeg számítása
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.total_price;
    }
    total_amount += convenience_fee || 50; // Alapértelmezett kényelmi díj

    // Order code generálás
    const order_code = Order.generateOrderCode(new Date(pickup_date));
    
    const orderData = {
      order_code,
      pickup_date,
      pickup_time_start,
      pickup_time_end,
      total_amount,
      convenience_fee: convenience_fee || 50,
      items
    };

    const newOrder = await Order.create(orderData);

    res.status(201).json({
      success: true,
      data: {
        order_id: newOrder.id,
        order_code: newOrder.order_code,
        total_amount: newOrder.total_amount,
        pickup_date: newOrder.pickup_date,
        pickup_time_start: newOrder.pickup_time_start,
        pickup_time_end: newOrder.pickup_time_end,
        status: newOrder.status
      },
      message: 'Rendelés sikeresen létrehozva',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a rendelés létrehozásánál:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a rendelés létrehozásánál',
      error: error.message
    });
  }
});

// GET /api/v1/orders/today - Mai rendelések (dolgozói felület)
// FONTOS: Ez ELŐBB kell lennie, mint a /:orderCode route!
router.get('/today', async (req, res) => {
  try {
    console.log('📅 Mai rendelések lekérése...');
    const orders = await Order.findTodayOrders();
    
    res.json({
      success: true,
      data: orders,
      count: orders.length,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a mai rendelések lekérésénél:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a mai rendelések lekérésénél',
      error: error.message
    });
  }
});

// GET /api/v1/orders/date/:date - Rendelések adott dátumra
// FONTOS: Ez is ELŐBB kell lennie, mint a /:orderCode route!
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`📅 Rendelések lekérése dátumra: ${date}`);
    
    const orders = await Order.findByDate(date);
    
    res.json({
      success: true,
      data: orders,
      count: orders.length,
      date: date,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a rendelések lekérésénél:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a rendelések lekérésénél',
      error: error.message
    });
  }
});

// PUT /api/v1/orders/:id/status - Rendelés státusz frissítése (dolgozói felület)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`🔄 Státusz frissítés - Rendelés ID: ${id}, Új státusz: ${status}`);
    
    // Validáció
    const validStatuses = ['waiting', 'delivered', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Érvénytelen státusz. Lehetséges értékek: waiting, delivered, expired'
      });
    }

    const updatedOrder = await Order.updateStatus(id, status);
    
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Rendelés nem található'
      });
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: `Rendelés státusza frissítve: ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a státusz frissítésénél:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a státusz frissítésénél',
      error: error.message
    });
  }
});

// GET /api/v1/orders/:orderCode - Rendelés lekérése order_code alapján
// FONTOS: Ez UTOLSÓ kell legyen, mert minden mást elkaphat!
router.get('/:orderCode', async (req, res) => {
  try {
    const { orderCode } = req.params;
    console.log(`🔍 Rendelés keresése: ${orderCode}`);
    
    const order = await Order.findByOrderCode(orderCode);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Rendelés nem található'
      });
    }

    res.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a rendelés lekérésénél:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a rendelés lekérésénél',
      error: error.message
    });
  }
});

module.exports = router;

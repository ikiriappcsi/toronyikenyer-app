const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// GET /api/v1/products - Összes termék lekérése
router.get('/', async (req, res) => {
  try {
    console.log('📦 Termékek lekérése...');
    const products = await Product.findAll();
    
    res.json({
      success: true,
      data: products,
      count: products.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a termékek lekérésénél:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a termékek lekérésénél',
      error: error.message
    });
  }
});

// GET /api/v1/products/:id - Egy termék lekérése ID alapján
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 Termék lekérése ID: ${id}`);
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Termék nem található'
      });
    }

    res.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a termék lekérésénél:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a termék lekérésénél',
      error: error.message
    });
  }
});

// PUT /api/v1/products/:id/price - Termék ár módosítása (admin)
router.put('/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    
    console.log(`💰 Ár módosítás - Termék ID: ${id}, Új ár: ${price}`);
    
    // Validáció
    if (!price || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Érvényes ár szükséges'
      });
    }

    const updatedProduct = await Product.updatePrice(id, price);
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Termék nem található'
      });
    }

    res.json({
      success: true,
      data: updatedProduct,
      message: 'Ár sikeresen frissítve',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba az ár módosításánál:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba az ár módosításánál',
      error: error.message
    });
  }
});

// PUT /api/v1/products/:id/status - Termék aktiválás/deaktiválás (admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    console.log(`🔄 Státusz módosítás - Termék ID: ${id}, Aktív: ${is_active}`);
    
    const updatedProduct = await Product.toggleActive(id, is_active);
    
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Termék nem található'
      });
    }

    res.json({
      success: true,
      data: updatedProduct,
      message: `Termék ${is_active ? 'aktiválva' : 'deaktiválva'}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Hiba a státusz módosításánál:', error);
    res.status(500).json({
      success: false,
      message: 'Hiba a státusz módosításánál',
      error: error.message
    });
  }
});

module.exports = router;
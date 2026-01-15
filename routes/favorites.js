const express = require('express');
const router = express.Router();
const { Favorite, Product } = require('../models');

/**
 * GET /api/favorites/:deviceId
 * Get all favorites for a device
 */
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    const favorites = await Favorite.find({ deviceId })
      .populate('productId')
      .sort({ savedAt: -1 })
      .lean();

    // Filter out null products (deleted products) and Upside Down products
    const validFavorites = favorites
      .filter(fav => fav.productId !== null && !fav.productId.isUpsideDown)
      .map(fav => ({
        ...fav,
        product: fav.productId,
        productId: fav.productId._id,
      }));

    console.log(`[Favorites] Device ${deviceId} has ${validFavorites.length} favorites`);
    res.json({ success: true, data: validFavorites, count: validFavorites.length });
  } catch (error) {
    console.error('[Favorites] Fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch favorites' });
  }
});

/**
 * POST /api/favorites
 * Add a product to favorites
 */
router.post('/', async (req, res) => {
  try {
    const { deviceId, productId } = req.body;

    if (!deviceId || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: deviceId, productId' 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ deviceId, productId });
    if (existingFavorite) {
      return res.json({ 
        success: true, 
        data: existingFavorite, 
        message: 'Already in favorites' 
      });
    }

    // Create favorite
    const favorite = new Favorite({ deviceId, productId });
    await favorite.save();

    // Populate product data
    await favorite.populate('productId');

    console.log(`[Favorites] Added product ${productId} for device ${deviceId}`);
    res.status(201).json({ success: true, data: favorite });
  } catch (error) {
    console.error('[Favorites] Add error:', error);
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

/**
 * DELETE /api/favorites
 * Remove a product from favorites
 */
router.delete('/', async (req, res) => {
  try {
    const { deviceId, productId } = req.body;

    if (!deviceId || !productId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: deviceId, productId' 
      });
    }

    const result = await Favorite.findOneAndDelete({ deviceId, productId });

    if (!result) {
      return res.status(404).json({ success: false, error: 'Favorite not found' });
    }

    console.log(`[Favorites] Removed product ${productId} for device ${deviceId}`);
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (error) {
    console.error('[Favorites] Remove error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

/**
 * GET /api/favorites/check/:deviceId/:productId
 * Check if a product is favorited
 */
router.get('/check/:deviceId/:productId', async (req, res) => {
  try {
    const { deviceId, productId } = req.params;

    const favorite = await Favorite.findOne({ deviceId, productId });

    res.json({ success: true, isFavorite: !!favorite });
  } catch (error) {
    console.error('[Favorites] Check error:', error);
    res.status(500).json({ success: false, error: 'Failed to check favorite' });
  }
});

module.exports = router;

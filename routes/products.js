const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { uploadMultipleImages, deleteMultipleImages } = require('../config/cloudinary');

/**
 * GET /api/products
 * Get all active products (for home screen / reels)
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50, skip = 0, upsideDown } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    // Fetch either Upside Down products OR normal products (never both)
    if (upsideDown === 'true' || upsideDown === true) {
      query.isUpsideDown = true;
    } else {
      // Explicitly exclude Upside Down products from normal feed
      query.isUpsideDown = { $ne: true };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    console.log(`[Products] Fetched ${products.length} products (upsideDown=${upsideDown || 'false'})`);
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('[Products] Fetch error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/products/my/:deviceId
 * Get products listed by a specific device (My Listings)
 */
router.get('/my/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { upsideDown } = req.query;
    
    const query = { deviceId, isActive: true };
    // Filter by upsideDown flag - default to normal products only
    if (upsideDown === 'true' || upsideDown === true) {
      query.isUpsideDown = true;
    } else {
      query.isUpsideDown = { $ne: true };
    }
    
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .lean();

    console.log(`[Products] Device ${deviceId} has ${products.length} listings`);
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('[Products] My listings error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch your listings' });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('[Products] Get by ID error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

/**
 * POST /api/products
 * Create a new product listing
 */
router.post('/', async (req, res) => {
  try {
    const { title, price, description, category, images, deviceId, seller, isUpsideDown } = req.body;

    // Validate required fields
    if (!title || !price || !description || !category || !deviceId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: title, price, description, category, deviceId' 
      });
    }

    // Upload images to Cloudinary
    let uploadedImages = [];
    if (images && images.length > 0) {
      console.log(`[Products] Uploading ${images.length} images to Cloudinary...`);
      uploadedImages = await uploadMultipleImages(images);
      console.log(`[Products] Uploaded ${uploadedImages.length} images successfully`);
    }

    // Create product
    const product = new Product({
      title,
      price: parseFloat(price),
      description,
      category,
      images: uploadedImages,
      imageUrl: uploadedImages[0]?.url || '', // Primary image
      deviceId,
      seller: seller || {
        id: deviceId,
        name: 'Riftory Seller',
        type: 'artisan',
      },
      isUpsideDown: !!isUpsideDown,
    });

    await product.save();
    console.log(`[Products] Created new product: ${product.title} (${product._id})`);

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('[Products] Create error:', error.message || error);
    res.status(500).json({ success: false, error: `Failed to create product: ${error.message}` });
  }
});

/**
 * PUT /api/products/:id
 * Update a product (only by owner device)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId, ...updateData } = req.body;

    // Find product and verify ownership
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (product.deviceId !== deviceId) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this product' });
    }

    // Handle new images if provided
    if (updateData.images && updateData.images.length > 0) {
      // Delete old images from Cloudinary
      const oldPublicIds = product.images.map(img => img.publicId).filter(Boolean);
      if (oldPublicIds.length > 0) {
        await deleteMultipleImages(oldPublicIds);
      }

      // Upload new images
      const uploadedImages = await uploadMultipleImages(updateData.images);
      updateData.images = uploadedImages;
      updateData.imageUrl = uploadedImages[0]?.url || '';
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    console.log(`[Products] Updated product: ${updatedProduct.title}`);
    res.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('[Products] Update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

/**
 * DELETE /api/products/:id
 * Delete a product (only by owner device)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (product.deviceId !== deviceId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this product' });
    }

    // Delete images from Cloudinary
    const publicIds = product.images.map(img => img.publicId).filter(Boolean);
    if (publicIds.length > 0) {
      await deleteMultipleImages(publicIds);
    }

    await Product.findByIdAndDelete(id);
    console.log(`[Products] Deleted product: ${product.title}`);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('[Products] Delete error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique favorites per device
favoriteSchema.index({ deviceId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
